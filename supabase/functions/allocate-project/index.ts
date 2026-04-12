import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

type EmployeeSkill = { name: string; proficiency: string };
type Candidate = {
  id: string;
  name: string;
  job_title?: string;
  years_of_experience?: number;
  skills: EmployeeSkill[];
};

type ParsedRequirements = {
  project_name: string;
  description: string;
  required_skills: string[];
  team_size: number;
  timeline_weeks: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-flash-latest";

const WEIGHTS = {
  skill_fit: 0.55,
  availability_fit: 0.25,
  proficiency_fit: 0.10,
  experience_fit: 0.10,
};

const proficiencyScore = (value: string | null | undefined): number => {
  switch ((value || "").toLowerCase()) {
    case "expert":
      return 1;
    case "advanced":
      return 0.8;
    case "intermediate":
      return 0.6;
    case "beginner":
      return 0.35;
    default:
      return 0;
  }
};

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

const toJsonString = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const firstObj = text.indexOf("{");
    const lastObj = text.lastIndexOf("}");
    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
      return JSON.parse(text.slice(firstObj, lastObj + 1));
    }
    throw new Error("Invalid JSON");
  }
};

const normalizeSkill = (s: string) => s.trim().toLowerCase();

const parseSkillsInput = (input: unknown): string[] => {
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean);
  if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const extractRequirementsWithGemini = async (
  model: any,
  fallback: ParsedRequirements,
  chatMessage: string,
): Promise<ParsedRequirements> => {
  const prompt = `Extract structured project requirements from this message and return only JSON.
Message: "${chatMessage}"
Fallback defaults: ${toJsonString(fallback)}
JSON schema:
{
  "project_name": "string",
  "description": "string",
  "required_skills": ["string"],
  "team_size": number,
  "timeline_weeks": number
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json/g, "").replace(/```/g, "");
  const parsed = tryParseJson(text);

  return {
    project_name: parsed.project_name || fallback.project_name,
    description: parsed.description || fallback.description,
    required_skills: parseSkillsInput(parsed.required_skills).length > 0
      ? parseSkillsInput(parsed.required_skills)
      : fallback.required_skills,
    team_size: Number(parsed.team_size || fallback.team_size || 1),
    timeline_weeks: Number(parsed.timeline_weeks || fallback.timeline_weeks || 4),
  };
};

const scoreCandidate = (
  candidate: Candidate,
  requiredSkills: string[],
): {
  score: number;
  matchedSkills: string[];
  gapSkills: string[];
  components: { skillFit: number; proficiencyFit: number; experienceFit: number; availabilityFit: number };
} => {
  const normalizedRequired = requiredSkills.map(normalizeSkill);
  const skillMap = new Map(candidate.skills.map((s) => [normalizeSkill(s.name), s]));

  const matched: string[] = [];
  const gaps: string[] = [];
  const profScores: number[] = [];

  for (const rs of normalizedRequired) {
    const found = skillMap.get(rs);
    if (found) {
      matched.push(found.name);
      profScores.push(proficiencyScore(found.proficiency));
    } else {
      gaps.push(rs);
      profScores.push(0);
    }
  }

  const skillFit = normalizedRequired.length > 0 ? matched.length / normalizedRequired.length : 0;
  const proficiencyFit = normalizedRequired.length > 0
    ? profScores.reduce((a, b) => a + b, 0) / normalizedRequired.length
    : 0;
  const experienceFit = clamp((candidate.years_of_experience || 0) / 10);
  const availabilityFit = 1; // strict filter: only available candidates are considered

  const weighted =
    WEIGHTS.skill_fit * skillFit +
    WEIGHTS.availability_fit * availabilityFit +
    WEIGHTS.proficiency_fit * proficiencyFit +
    WEIGHTS.experience_fit * experienceFit;

  return {
    score: Math.round(clamp(weighted) * 100),
    matchedSkills: matched,
    gapSkills: gaps,
    components: { skillFit, proficiencyFit, experienceFit, availabilityFit },
  };
};

const buildLearningPaths = (
  matchedEmployees: Array<{ id: string; gap_skills: string[] }>,
  timelineWeeks: number,
) => {
  const out: Record<string, Array<{ skill: string; course_name: string; platform: string; estimated_hours: number; url: string; deadline: string }>> = {};
  const days = Math.max(7, timelineWeeks * 7);
  const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const employee of matchedEmployees) {
    out[employee.id] = employee.gap_skills.slice(0, 3).map((skill) => ({
      skill,
      course_name: `${skill} Foundations`,
      platform: "Coursera",
      estimated_hours: 12,
      url: "https://www.coursera.org",
      deadline,
    }));
  }

  return out;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const fallbackRequirements: ParsedRequirements = {
      project_name: String(body?.project_name || "New Project"),
      description: String(body?.description || body?.message || ""),
      required_skills: parseSkillsInput(body?.required_skills),
      team_size: Number(body?.team_size || 1),
      timeline_weeks: Number(body?.timeline_weeks || 4),
    };

    const session_id = body?.session_id ? String(body.session_id) : null;
    const chatMessage = String(body?.message || body?.brief || "").trim();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const hasGemini = geminiApiKey.trim().length > 0;
    const model = hasGemini
      ? new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: GEMINI_MODEL })
      : null;

    let requirements = fallbackRequirements;
    if (chatMessage.length > 0 && model) {
      try {
        requirements = await extractRequirementsWithGemini(model, fallbackRequirements, chatMessage);
      } catch {
        requirements = fallbackRequirements;
      }
    }

    const clarificationQuestions: string[] = [];
    if (!requirements.required_skills || requirements.required_skills.length === 0) {
      clarificationQuestions.push("Which exact skills are mandatory for this project?");
    }
    if (!requirements.team_size || requirements.team_size < 1) {
      clarificationQuestions.push("How many people do you need on the team?");
    }

    if (clarificationQuestions.length > 0) {
      return new Response(JSON.stringify({
        matched_employees: [],
        learning_paths: {},
        workforce_shortage: false,
        shortage_count: 0,
        allocation_reasoning: "I need a bit more information before allocating the team.",
        clarification_needed: true,
        clarification_questions: clarificationQuestions,
        parsed_requirements: requirements,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Strict availability rule (Option A): only status='available'.
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, job_title, years_of_experience")
      .eq("role", "employee");
    if (profilesError) throw profilesError;

    const { data: availability, error: availabilityError } = await supabaseClient
      .from("employee_availability")
      .select("employee_id, status")
      .eq("status", "available");
    if (availabilityError) throw availabilityError;

    const availableIds = new Set((availability || []).map((a: any) => a.employee_id));

    const { data: employeeSkills, error: skillsError } = await supabaseClient
      .from("employee_skills")
      .select("employee_id, proficiency, skills(name)");
    if (skillsError) throw skillsError;

    const skillsByEmployee = new Map<string, EmployeeSkill[]>();
    for (const row of employeeSkills || []) {
      const employeeId = (row as any).employee_id as string;
      const skillName = (row as any).skills?.name as string | undefined;
      if (!employeeId || !skillName) continue;
      if (!skillsByEmployee.has(employeeId)) skillsByEmployee.set(employeeId, []);
      skillsByEmployee.get(employeeId)!.push({
        name: skillName,
        proficiency: (row as any).proficiency,
      });
    }

    const candidates: Candidate[] = (profiles || [])
      .filter((p: any) => availableIds.has(p.id))
      .map((p: any) => ({
        id: p.id,
        name: p.full_name,
        job_title: p.job_title,
        years_of_experience: p.years_of_experience,
        skills: skillsByEmployee.get(p.id) || [],
      }));

    const scored = candidates.map((candidate) => {
      const s = scoreCandidate(candidate, requirements.required_skills);
      return {
        id: candidate.id,
        name: candidate.name,
        job_title: candidate.job_title,
        match_score: s.score,
        matched_skills: s.matchedSkills,
        gap_skills: s.gapSkills,
        _components: s.components,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    const teamSize = Math.max(1, requirements.team_size || 1);
    const matchedEmployees = scored.slice(0, teamSize).map(({ _components, ...rest }) => rest);
    const shortageCount = Math.max(0, teamSize - matchedEmployees.length);
    const workforceShortage = shortageCount > 0;
    const learningPaths = buildLearningPaths(matchedEmployees, requirements.timeline_weeks || 4);

    let allocationReasoning = "Allocated based on skill fit, proficiency, experience, and strict current availability.";
    try {
      if (model) {
        const reasoningPrompt = `Write a concise staffing rationale in 3-4 sentences.
Requirements: ${toJsonString(requirements)}
Weights: ${toJsonString(WEIGHTS)}
Matched employees: ${toJsonString(matchedEmployees)}
Explain why this team was chosen and mention any shortage risk.`;
        const reasoningResult = await model.generateContent(reasoningPrompt);
        allocationReasoning = reasoningResult.response.text().trim() || allocationReasoning;
      }
    } catch {
      // Keep deterministic fallback explanation.
    }

    const responsePayload = {
      matched_employees: matchedEmployees,
      learning_paths: learningPaths,
      workforce_shortage: workforceShortage,
      shortage_count: shortageCount,
      allocation_reasoning: allocationReasoning,
      clarification_needed: false,
      clarification_questions: [],
      parsed_requirements: requirements,
      scoring_weights: WEIGHTS,
    };

    if (session_id) {
      const { data: existingSession } = await supabaseClient
        .from("chat_sessions")
        .select("id, messages")
        .eq("id", session_id)
        .maybeSingle();

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: chatMessage || requirements.description || requirements.project_name,
        timestamp: new Date().toISOString(),
      };
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: allocationReasoning,
        timestamp: new Date().toISOString(),
        allocation_result: responsePayload,
      };

      if (existingSession?.id) {
        const messages = Array.isArray((existingSession as any).messages)
          ? [...(existingSession as any).messages, userMessage, assistantMessage]
          : [userMessage, assistantMessage];

        await supabaseClient
          .from("chat_sessions")
          .update({ messages, last_allocation_result: responsePayload, updated_at: new Date().toISOString() })
          .eq("id", session_id);
      } else {
        await supabaseClient.from("chat_sessions").insert({
          id: session_id,
          title: requirements.project_name || "New Allocation",
          messages: [userMessage, assistantMessage],
          last_allocation_result: responsePayload,
        });
      }
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
