import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-flash-latest";

type GapSkill = { skill: string; priority: "required" | "nice-to-have" };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildFallbackPlan = (roleTitle: string, roleId: string, gapSkills: GapSkill[]) => {
  const required = gapSkills.filter((s) => s.priority === "required");
  const bonus = gapSkills.filter((s) => s.priority === "nice-to-have");

  const selectedRequired = required.slice(0, 8);
  const selectedBonus = bonus.slice(0, 4);

  let weekCursor = 1;
  const mkSkill = (skill: string, isRequired: boolean, difficulty: "Beginner" | "Intermediate" | "Advanced") => {
    const estimatedHours = difficulty === "Beginner" ? 18 : difficulty === "Intermediate" ? 32 : 48;
    const durationWeeks = Math.max(1, Math.ceil(estimatedHours / 12));
    const weekStart = weekCursor;
    const weekEnd = weekCursor + durationWeeks - 1;
    weekCursor = weekEnd + 1;

    return {
      skill,
      isRequired,
      isPrerequisite: false,
      estimatedHours,
      weekStart,
      weekEnd,
      difficulty,
      resources: [
        {
          title: `${skill} roadmap`,
          type: "Documentation",
          provider: "roadmap.sh",
          url: `https://roadmap.sh/${slugify(skill)}`,
          free: true,
          durationHours: null,
        },
        {
          title: `${skill} curated videos`,
          type: "Course",
          provider: "YouTube",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} tutorial`)}`,
          free: true,
          durationHours: null,
        },
      ],
      milestones: [
        `Build one portfolio artifact that demonstrates ${skill}`,
        `Explain ${skill} trade-offs in a short technical write-up`,
      ],
      projectIdea: `Create a small project for ${skill} aligned to ${roleTitle} responsibilities.`,
    };
  };

  const foundationSkills = selectedRequired.slice(0, Math.max(1, Math.ceil(selectedRequired.length / 3)));
  const coreSkills = selectedRequired.slice(foundationSkills.length);
  const specializationSkills = selectedBonus;

  const phases = [
    {
      name: "Foundation",
      skills: foundationSkills.map((s) => mkSkill(s.skill, true, "Beginner" as const)),
    },
    {
      name: "Core",
      skills: coreSkills.map((s) => mkSkill(s.skill, true, "Intermediate" as const)),
    },
    {
      name: "Specialization",
      skills: specializationSkills.map((s) => mkSkill(s.skill, false, "Advanced" as const)),
    },
  ]
    .filter((phase) => phase.skills.length > 0)
    .map((phase) => ({
      ...phase,
      weekStart: phase.skills[0].weekStart,
      weekEnd: phase.skills[phase.skills.length - 1].weekEnd,
    }));

  if (phases.length === 0) {
    const starter = mkSkill("Role-specific interview readiness", false, "Beginner");
    phases.push({
      name: "Foundation",
      weekStart: starter.weekStart,
      weekEnd: starter.weekEnd,
      skills: [starter],
    });
  }

  const totalEstimatedHours = phases.reduce(
    (phaseTotal, phase) => phaseTotal + phase.skills.reduce((skillTotal, skill) => skillTotal + skill.estimatedHours, 0),
    0,
  );

  return {
    targetRole: roleTitle,
    targetRoleId: roleId,
    totalEstimatedWeeks: phases[phases.length - 1].weekEnd,
    totalEstimatedHours,
    prioritySkillsCount: required.length,
    bonusSkillsCount: bonus.length,
    phases,
  };
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting the first { ... } or [ ... ] block
    const objFirst = text.indexOf("{");
    const objLast = text.lastIndexOf("}");
    if (objFirst !== -1 && objLast !== -1 && objLast > objFirst) {
      try { return JSON.parse(text.slice(objFirst, objLast + 1)); } catch { /* fall through */ }
    }
    const arrFirst = text.indexOf("[");
    const arrLast = text.lastIndexOf("]");
    if (arrFirst !== -1 && arrLast !== -1 && arrLast > arrFirst) {
      return JSON.parse(text.slice(arrFirst, arrLast + 1));
    }
    throw new Error("Invalid JSON from AI response");
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      employee_id,
      role_id,
      role_title,
      missing_required = [],    // string[] from the cached skill gap analysis
      missing_nice_to_have = [], // string[]
      force_refresh = false,
    } = body || {};

    if (!employee_id || !role_id || !role_title) {
      throw new Error("employee_id, role_id, and role_title are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── 1. Return cached result unless force_refresh requested ───────────────
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("learning_path_plans")
        .select("result, created_at, model_used")
        .eq("employee_id", employee_id)
        .eq("role_id", role_id)
        .maybeSingle();

      if (cached?.result) {
        return new Response(
          JSON.stringify({
            ...cached.result,
            _cached: true,
            _generated_at: cached.created_at,
            _model: cached.model_used,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }

    // ── 2. Fetch the employee's current skills ───────────────────────────────
    const { data: skillRows } = await supabase
      .from("employee_skills")
      .select("proficiency, skills(name, category)")
      .eq("employee_id", employee_id);

    const currentSkills = (skillRows || [])
      .map((row: any) => ({
        name: row.skills?.name || "",
        category: row.skills?.category || "technical",
        proficiency: row.proficiency || "beginner",
      }))
      .filter((s: any) => s.name);

    // ── 3. Build plan (AI first; deterministic fallback on API/model errors) ─
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const allGapSkills = [
      ...missing_required.map((s: string) => ({ skill: s, priority: "required" })),
      ...missing_nice_to_have.map((s: string) => ({ skill: s, priority: "nice-to-have" })),
    ];

    const prompt = `You are an expert career learning path AI. Generate a structured, personalised learning roadmap for an employee targeting the "${role_title}" role.

Employee's current skills (with proficiency):
${JSON.stringify(currentSkills, null, 2)}

Skills the employee still needs to learn (gap skills):
${JSON.stringify(allGapSkills, null, 2)}

Target role: ${role_title} (id: ${role_id})

Create a phased learning plan. You MUST return ONLY a valid JSON object with NO markdown fences, in exactly this structure:

{
  "targetRole": "${role_title}",
  "targetRoleId": "${role_id}",
  "totalEstimatedWeeks": <integer>,
  "totalEstimatedHours": <integer>,
  "prioritySkillsCount": <integer — count of required gap skills covered>,
  "bonusSkillsCount": <integer — count of nice-to-have gap skills covered>,
  "phases": [
    {
      "name": "Foundation" | "Core" | "Specialization",
      "weekStart": <integer>,
      "weekEnd": <integer>,
      "skills": [
        {
          "skill": "string — canonical skill name",
          "isRequired": <boolean — true if this is a required gap skill>,
          "isPrerequisite": <boolean — true if added as a prerequisite, not directly listed as a gap>,
          "estimatedHours": <integer>,
          "weekStart": <integer>,
          "weekEnd": <integer>,
          "difficulty": "Beginner" | "Intermediate" | "Advanced",
          "resources": [
            {
              "title": "string",
              "type": "Course" | "Documentation" | "Practice" | "Book" | "Project",
              "provider": "string — domain or platform name",
              "url": "string — real, working URL",
              "free": <boolean>,
              "durationHours": <integer or null>
            }
          ],
          "milestones": ["string — concrete, measurable checkpoint"],
          "projectIdea": "string — a small practical project to cement the skill"
        }
      ]
    }
  ]
}

Rules:
- Include ONLY the gap skills provided above (required ones first), plus any critical prerequisites the employee is missing.
- Organise skills across 3 phases: Foundation (basics/prerequisites), Core (main required skills), Specialization (advanced/nice-to-have).
- Each skill must have 2-3 real, reputable learning resources with correct URLs (prefer free resources).
- Estimate realistic hours: beginner skills 10-30 hrs, intermediate 30-60 hrs, advanced 60-100 hrs.
- Sequence skills so weekStart/weekEnd are consecutive across the full plan.
- totalEstimatedWeeks = last weekEnd value; totalEstimatedHours = sum of all skill estimatedHours.
- Keep milestones concrete and action-oriented (e.g. "Build a CRUD REST API with 5 endpoints").
- Return ONLY the JSON object — no explanation, no markdown.`;

    let plan: any = null;
    let modelUsed = GEMINI_MODEL;

    if (!geminiApiKey) {
      console.warn("generate-learning-path: GEMINI_API_KEY missing, using fallback plan");
    } else {
      try {
        const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(prompt);
        const rawText = result.response.text() || "";
        const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        plan = tryParseJson(cleanText);
      } catch (geminiError: any) {
        console.error("generate-learning-path: AI generation failed, using fallback", geminiError?.message || geminiError);
      }
    }

    if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
      plan = buildFallbackPlan(role_title, role_id, allGapSkills);
      modelUsed = "rules-fallback";
    }

    // ── 4. Persist to DB (upsert — one row per employee + role) ─────────────
    await supabase
      .from("learning_path_plans")
      .upsert(
        {
          employee_id,
          role_id,
          role_title,
          result: plan,
          model_used: modelUsed,
          created_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,role_id" },
      );

    return new Response(
      JSON.stringify({ ...plan, _cached: false, _generated_at: new Date().toISOString(), _model: modelUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
