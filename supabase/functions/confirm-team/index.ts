// Supabase Edge Function: confirm-team
// Creates the project + assignments + availability updates (and optional learning paths)
// Permission: only hr_manager/org_admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ConfirmTeamInput = {
  project_id?: string | null;
  project_name: string;
  description?: string;
  required_skills?: string[];
  team_size?: number;
  timeline_weeks?: number;
  session_id?: string | null;
  matched_employees: Array<{
    id: string; // profiles.id (uuid)
    role_in_project?: string | null;
  }>;
  learning_paths?: Record<
    string,
    Array<{
      skill: string;
      course_name: string;
      platform?: string | null;
      estimated_hours?: number | null;
      url?: string | null;
      deadline?: string | null; // YYYY-MM-DD
      priority?: "high" | "medium" | "low";
    }>
  >;
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

function normalizeSkillName(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return jsonResponse(200, { ok: true });
  if (req.method !== "POST") return jsonResponse(405, { error: "Use POST" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse(500, { error: "Missing Supabase env" });
  }

  // Use the caller's JWT so RLS remains the source of truth.
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Not authenticated" });
  }
  const userId = userData.user.id;

  const payload = (await req.json().catch(() => null)) as ConfirmTeamInput | null;
  if (!payload) return jsonResponse(400, { error: "Invalid JSON body" });

  if (!payload.project_name?.trim()) {
    return jsonResponse(400, { error: "project_name is required" });
  }
  if (!payload.matched_employees?.length) {
    return jsonResponse(400, { error: "matched_employees is required" });
  }

  // Explicit permission check for clearer UX than a generic RLS failure.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) return jsonResponse(500, { error: "Failed to load profile" });
  if (!profile || !["hr_manager", "org_admin"].includes(profile.role)) {
    return jsonResponse(403, { error: "Only HR/Admin can confirm teams" });
  }

  // 1) Create or reuse project
  let projectId = payload.project_id ?? null;
  if (projectId) {
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        name: payload.project_name.trim(),
        description: payload.description ?? null,
        team_size: payload.team_size ?? payload.matched_employees.length,
      })
      .eq("id", projectId);
    if (updateErr) {
      return jsonResponse(500, { error: "Failed to update project", details: updateErr });
    }
  } else {
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .insert({
        name: payload.project_name.trim(),
        description: payload.description ?? null,
        status: "planning",
        team_size: payload.team_size ?? payload.matched_employees.length,
        created_by: userId,
      })
      .select("id")
      .single();
    if (projectErr || !project) {
      return jsonResponse(500, { error: "Failed to create project", details: projectErr });
    }
    projectId = project.id as string;
  }

  // 2) Ensure required skills exist + attach to project
  const requiredSkills = (payload.required_skills ?? [])
    .map(normalizeSkillName)
    .filter(Boolean);

  if (requiredSkills.length) {
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id,name")
      .in("name", requiredSkills);

    const existingByName = new Map<string, string>();
    for (const s of existingSkills ?? []) existingByName.set(s.name, s.id);

    const missing = requiredSkills.filter((n) => !existingByName.has(n));
    if (missing.length) {
      // Best-effort: create missing skills as technical with neutral demand score
      const { data: inserted, error: insertSkillsErr } = await supabase
        .from("skills")
        .insert(
          missing.map((name) => ({
            name,
            category: "technical",
            market_demand_score: 50,
          })),
        )
        .select("id,name");
      if (insertSkillsErr) {
        return jsonResponse(500, { error: "Failed to create skills", details: insertSkillsErr });
      }
      for (const s of inserted ?? []) existingByName.set(s.name, s.id);
    }

    const projectSkillsRows = requiredSkills
      .map((name) => existingByName.get(name))
      .filter(Boolean)
      .map((skillId) => ({
        project_id: projectId,
        skill_id: skillId!,
        importance: "required",
      }));

    if (projectSkillsRows.length) {
      const { error: projectSkillsErr } = await supabase
        .from("project_skills")
        .upsert(projectSkillsRows, {
          onConflict: "project_id,skill_id",
          ignoreDuplicates: true,
        });
      if (projectSkillsErr) {
        return jsonResponse(500, {
          error: "Failed to create project skills",
          details: projectSkillsErr,
        });
      }
    }
  }

  // 3) Create assignments
  const assignmentRows = payload.matched_employees.map((e) => ({
    project_id: projectId,
    employee_id: e.id,
    role_in_project: e.role_in_project ?? "Team Member",
    assigned_by: userId,
    status: "active",
  }));

  const { error: assignmentsErr } = await supabase
    .from("project_assignments")
    .upsert(assignmentRows, {
      onConflict: "project_id,employee_id",
      ignoreDuplicates: true,
    });
  if (assignmentsErr) {
    return jsonResponse(500, { error: "Failed to create assignments", details: assignmentsErr });
  }

  // 4) Update availability
  const employeeIds = payload.matched_employees.map((e) => e.id);
  const { error: availabilityErr } = await supabase
    .from("employee_availability")
    .update({ status: "in_project", available_from: null })
    .in("employee_id", employeeIds);
  if (availabilityErr) {
    return jsonResponse(500, { error: "Failed to update availability", details: availabilityErr });
  }

  // 5) Optional: insert learning paths (best-effort)
  if (payload.learning_paths) {
    // Preload skills referenced in learning paths
    const allGapSkills = new Set<string>();
    for (const items of Object.values(payload.learning_paths)) {
      for (const it of items ?? []) {
        if (it?.skill) allGapSkills.add(normalizeSkillName(it.skill));
      }
    }

    const gapSkillNames = Array.from(allGapSkills);
    const skillNameToId = new Map<string, string>();
    if (gapSkillNames.length) {
      const { data: gapExisting } = await supabase
        .from("skills")
        .select("id,name")
        .in("name", gapSkillNames);
      for (const s of gapExisting ?? []) skillNameToId.set(s.name, s.id);

      const missingGap = gapSkillNames.filter((n) => !skillNameToId.has(n));
      if (missingGap.length) {
        const { data: insertedGap } = await supabase
          .from("skills")
          .insert(
            missingGap.map((name) => ({
              name,
              category: "technical",
              market_demand_score: 50,
            })),
          )
          .select("id,name");
        for (const s of insertedGap ?? []) skillNameToId.set(s.name, s.id);
      }
    }

    const lpRows: Array<Record<string, unknown>> = [];
    for (const [employeeId, items] of Object.entries(payload.learning_paths)) {
      for (const it of items ?? []) {
        const skillName = normalizeSkillName(it.skill ?? "");
        const skillId = skillNameToId.get(skillName);
        if (!skillId) continue;
        if (!it.course_name?.trim()) continue;

        lpRows.push({
          employee_id: employeeId,
          skill_id: skillId,
          project_id: projectId,
          course_name: it.course_name.trim(),
          platform: it.platform ?? null,
          url: it.url ?? null,
          estimated_hours: it.estimated_hours ?? null,
          priority: it.priority ?? "medium",
          status: "recommended",
          deadline: it.deadline ?? null,
          ai_generated: true,
        });
      }
    }

    if (lpRows.length) {
      // Deduplication: if a recommended/in_progress path exists for employee+skill+project, skip it.
      // We do this client-side to avoid needing a unique constraint.
      const { data: existingLp } = await supabase
        .from("learning_paths")
        .select("employee_id,skill_id,project_id,status")
        .eq("project_id", projectId)
        .in("employee_id", employeeIds);

      const existingKey = new Set(
        (existingLp ?? [])
          .filter((r) => ["recommended", "in_progress"].includes(r.status))
          .map((r) => `${r.employee_id}:${r.skill_id}:${r.project_id}`),
      );

      const filtered = lpRows.filter((r) => {
        const key = `${r.employee_id}:${r.skill_id}:${r.project_id}`;
        return !existingKey.has(key);
      });

      if (filtered.length) {
        // Best effort: ignore errors to not block staffing.
        await supabase.from("learning_paths").insert(filtered);
      }
    }
  }

  // 6) Append to chat session (best-effort)
  if (payload.session_id) {
    await supabase
      .from("chat_sessions")
      .update({
        project_id: projectId,
        last_allocation_result: {
          project_id: projectId,
          confirmed_by: userId,
          confirmed_at: new Date().toISOString(),
        },
      })
      .eq("id", payload.session_id);
  }

  return jsonResponse(200, {
    ok: true,
    project_id: projectId,
    assigned_count: assignmentRows.length,
  });
});
