import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL =
  Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-flash-latest";

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting the first { ... } or [ ... ] block
    const objFirst = text.indexOf("{");
    const objLast = text.lastIndexOf("}");
    if (objFirst !== -1 && objLast !== -1 && objLast > objFirst) {
      try {
        return JSON.parse(text.slice(objFirst, objLast + 1));
      } catch {
        /* fall through */
      }
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
      missing_required = [], // string[] from the cached skill gap analysis
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
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
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

    // ── 3. Build plan via Gemini ─────────────────────────────────────────────
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const allGapSkills = [
      ...missing_required.map((s: string) => ({
        skill: s,
        priority: "required",
      })),
      ...missing_nice_to_have.map((s: string) => ({
        skill: s,
        priority: "nice-to-have",
      })),
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

    const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({
      model: GEMINI_MODEL,
    });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text() || "";
    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const plan = tryParseJson(cleanText);

    if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
      throw new Error("Gemini returned an unexpected response shape");
    }

    // ── 4. Persist to DB (upsert — one row per employee + role) ─────────────
    await supabase.from("learning_path_plans").upsert(
      {
        employee_id,
        role_id,
        role_title,
        result: plan,
        model_used: GEMINI_MODEL,
        created_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,role_id" },
    );

    return new Response(
      JSON.stringify({
        ...plan,
        _cached: false,
        _generated_at: new Date().toISOString(),
        _model: GEMINI_MODEL,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
