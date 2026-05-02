import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY =
  Deno.env.get("GROQ_API_KEY")?.trim() ||
  Deno.env.get("groq")?.trim() ||
  "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL")?.trim() || "llama-3.3-70b-versatile";
const GROQ_MODEL_FALLBACKS = (Deno.env.get("GROQ_MODEL_FALLBACKS")?.split(",") ?? [
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
]).map((value) => value.trim()).filter(Boolean);
const GROQ_API_URL = Deno.env.get("GROQ_API_URL")?.trim() || "https://api.groq.com/openai/v1";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
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
      force_refresh = false,  // set true to bypass cache and re-call AI
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
        .from("skill_gap_analyses")
        .select("result, created_at, model_used")
        .eq("employee_id", employee_id)
        .eq("role_id", role_id)
        .maybeSingle();

      if (cached?.result) {
        return new Response(
          JSON.stringify({
            ...cached.result,
            _cached: true,
            _analysed_at: cached.created_at,
            _model: cached.model_used,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }

    // ── 2. Fetch employee skills ─────────────────────────────────────────────
    const { data: employeeSkillRows } = await supabase
      .from("employee_skills")
      .select("proficiency, skills(name, category)")
      .eq("employee_id", employee_id);

    const employeeSkills = (employeeSkillRows || []).map((row: any) => ({
      name: row.skills?.name || "",
      category: row.skills?.category || "technical",
      proficiency: row.proficiency || "beginner",
    })).filter((s: any) => s.name);

    if (employeeSkills.length === 0) {
      return new Response(
        JSON.stringify({ error: "No skills found. Please upload and analyse your resume first." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // ── 3. Call Groq AI ──────────────────────────────────────────────────────
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const prompt = `You are a senior talent analytics AI. Perform an in-depth, expert-level skill gap analysis for an employee targeting the role of "${role_title}".

Employee's current skills (with proficiency levels):
${JSON.stringify(employeeSkills, null, 2)}

Target role: ${role_title} (id: ${role_id})

Analyse this employee's readiness for the "${role_title}" role. You MUST return ONLY a valid JSON object with NO markdown fences, in exactly this structure:

{
  "readiness_score": <integer 0-100>,
  "readiness_label": <"Not Ready" | "Developing" | "Almost Ready" | "Job Ready">,
  "matched_required_skills": [
    { "skill": "string", "proficiency": "string", "relevance": "string" }
  ],
  "missing_required_skills": [
    { "skill": "string", "importance": "critical | high | medium", "why": "string" }
  ],
  "matched_bonus_skills": [
    { "skill": "string", "value": "string" }
  ],
  "missing_bonus_skills": [
    { "skill": "string" }
  ],
  "ai_insights": "A 3-5 sentence expert assessment discussing overall readiness, key strengths, most critical gaps, and a motivating personalised recommendation.",
  "top_learning_priorities": [
    { "skill": "string", "reason": "string", "urgency": "immediate | short-term | long-term" }
  ]
}

Rules:
- Base the required and bonus skills on industry-standard expectations for the "${role_title}" role (not just a fixed list).
- Proficiency levels: beginner, intermediate, advanced, expert.
- readiness_score: weight required skills at 75%, bonus/nice-to-have at 25%.
- readiness_label: Not Ready (<30), Developing (30-59), Almost Ready (60-84), Job Ready (>=85).
- top_learning_priorities: list 3-5 most impactful gaps to close, ordered by urgency.
- Keep ai_insights concise, specific to this employee, encouraging but honest.`;

    // Call Groq with retry and fallback logic
    const models = [GROQ_MODEL, ...GROQ_MODEL_FALLBACKS].filter((value, index, self) => self.indexOf(value) === index);
    let lastErrorText = "";
    let rawText = "";

    for (const modelName of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const url = `${GROQ_API_URL}/chat/completions`;
          const body = {
            model: modelName,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_completion_tokens: 2048,
            temperature: 0.2,
          };

          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
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
              console.warn(`[analyze-skill-gap] Groq model ${modelName} attempt ${attempt + 1} failed, retrying in ${waitMs}ms`);
              await sleep(waitMs);
              continue;
            }

            if (retryable && modelName !== models[models.length - 1]) {
              console.warn(`[analyze-skill-gap] Groq model ${modelName} failed, trying fallback model`);
              break;
            }

            throw new Error(lastErrorText);
          }

          // Parse response
          const j = JSON.parse(text);
          if (Array.isArray(j.choices) && j.choices[0]?.message?.content) {
            rawText = j.choices[0].message.content;
          } else if (typeof j.output_text === 'string') {
            rawText = j.output_text;
          } else if (typeof j.text === 'string') {
            rawText = j.text;
          } else {
            rawText = text;
          }

          break; // Success, exit retry loop
        } catch (error: any) {
          lastErrorText = error.message || "Groq API error";
          if (attempt === 2 && modelName === models[models.length - 1]) {
            throw new Error(lastErrorText);
          }
        }
      }

      if (rawText) break; // Success, exit model fallback loop
    }

    if (!rawText) {
      throw new Error(lastErrorText || "Failed to get response from Groq API");
    }

    const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = tryParseJson(cleanText);

    // ── 4. Persist result to DB (upsert — one row per employee+role) ─────────
    await supabase
      .from("skill_gap_analyses")
      .upsert(
        {
          employee_id,
          role_id,
          role_title,
          result: analysis,
          readiness_score: analysis.readiness_score ?? null,
          readiness_label: analysis.readiness_label ?? null,
          model_used: GROQ_MODEL,
          created_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,role_id" },
      );

    return new Response(
      JSON.stringify({ ...analysis, _cached: false, _analysed_at: new Date().toISOString(), _model: GROQ_MODEL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
