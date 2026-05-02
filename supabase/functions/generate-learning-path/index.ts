import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")?.trim() || Deno.env.get("groq")?.trim() || "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL")?.trim() || "llama-3.3-70b-versatile";
const GROQ_MODEL_FALLBACKS = (Deno.env.get("GROQ_MODEL_FALLBACKS")?.split(",") ?? [
  "openai/gpt-oss-120b",
]).map((value) => value.trim()).filter(Boolean);
const GROQ_API_URL = Deno.env.get("GROQ_API_URL")?.trim() || "https://api.groq.com/openai/v1";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const callGroq = async (prompt: string) => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY (or groq) is not configured");

  const models = [GROQ_MODEL, ...GROQ_MODEL_FALLBACKS].filter((value, index, self) => self.indexOf(value) === index);
  let lastErrorText = "";

  for (const modelName of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const url = `${GROQ_API_URL}/chat/completions`;
      const body = {
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 4096,
        temperature: 0.0,
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await resp.text();
      if (!resp.ok) {
        lastErrorText = `Groq API error: ${resp.status} ${text}`;
        const lowered = `${resp.status} ${text}`.toLowerCase();
        const retryable =
          resp.status === 413 ||
          resp.status === 429 ||
          lowered.includes("rate_limit_exceeded") ||
          lowered.includes("tokens per minute") ||
          lowered.includes("temporarily unavailable") ||
          lowered.includes("service unavailable");

        if (retryable && attempt < 2) {
          const waitMs = resp.status === 429 ? 7000 : 3000 * (attempt + 1);
          await sleep(waitMs);
          continue;
        }

        if (retryable && modelName !== models[models.length - 1]) {
          break;
        }

        throw new Error(lastErrorText);
      }

      try {
        const j = JSON.parse(text);
        if (Array.isArray(j.choices) && j.choices[0]?.message?.content) {
          return j.choices[0].message.content;
        }
        return text;
      } catch {
        return text;
      }
    }
  }

  throw new Error(lastErrorText || "Groq API error");
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

    // ── 3. Build plan via Groq ───────────────────────────────────────────────
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

    const rawText = await callGroq(prompt);
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
        model_used: GROQ_MODEL,
        created_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,role_id" },
    );

    return new Response(
      JSON.stringify({
        ...plan,
        _cached: false,
        _generated_at: new Date().toISOString(),
        _model: GROQ_MODEL,
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
