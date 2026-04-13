import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// Strip the "groq/" prefix if present (env may have "groq/llama-3.3-70b-versatile" format)
const rawGroqModel = Deno.env.get("GROQ_MODEL")?.trim() || "llama-3.3-70b-versatile";
const GROQ_MODEL = rawGroqModel.startsWith("groq/") ? rawGroqModel.slice(5) : rawGroqModel;

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
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not configured");

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

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a precision skill gap analyst. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API error: ${groqRes.status} ${errText}`);
    }

    const groqData = await groqRes.json();
    const rawText = groqData.choices?.[0]?.message?.content || "";
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
