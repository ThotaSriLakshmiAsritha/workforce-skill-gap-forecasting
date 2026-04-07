import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("[");
    const last = text.lastIndexOf("]");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Invalid JSON");
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      employee_id,
      target_role,
      gap_skills = [],
      project_id,
      timeline_weeks = 6,
    } = body || {};

    if (!employee_id) {
      throw new Error("employee_id is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: employeeSkills } = await supabaseClient
      .from("employee_skills")
      .select("skills(name), proficiency")
      .eq("employee_id", employee_id);

    let targetSkills: string[] = [];
    if (target_role) {
      const { data: jobReq } = await supabaseClient
        .from("job_requirements")
        .select("required_skills")
        .eq("title", target_role)
        .maybeSingle();
      if (jobReq?.required_skills) {
        targetSkills = jobReq.required_skills as string[];
      }
    }

    const skillsToLearn = Array.from(new Set([
      ...(gap_skills as string[]),
      ...targetSkills,
    ])).filter(Boolean);

    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `You are a career upskilling AI.\n\nEmployee current skills: ${JSON.stringify(employeeSkills || [])}\nTarget role: ${target_role || ""}\nGap skills: ${JSON.stringify(skillsToLearn)}\nTimeline weeks: ${timeline_weeks}\n\nReturn ONLY JSON array:\n[\n  { "skill": "string", "course_name": "string", "platform": "string", "estimated_hours": 0, "url": "string", "priority": "high|medium|low", "deadline": "YYYY-MM-DD" }\n]`;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text().replace(/```json/g, "").replace(/```/g, "");

    let parsedJson;
    try {
      parsedJson = tryParseJson(outputText);
    } catch {
      const fixPrompt = `Fix this into valid JSON ONLY.\n${outputText}`;
      const retry = await model.generateContent(fixPrompt);
      outputText = retry.response.text().replace(/```json/g, "").replace(/```/g, "");
      parsedJson = tryParseJson(outputText);
    }

    const { data: allSkills } = await supabaseClient
      .from("skills")
      .select("id, name");

    const skillMap = new Map(
      (allSkills || []).map((s: any) => [s.name.toLowerCase(), s.id]),
    );

    const inserts = [] as any[];

    for (const item of parsedJson as any[]) {
      if (!item?.skill) continue;
      const skillId = skillMap.get(String(item.skill).toLowerCase());
      if (!skillId) continue;

      const { data: existing } = await supabaseClient
        .from("learning_paths")
        .select("id")
        .eq("employee_id", employee_id)
        .eq("skill_id", skillId)
        .in("status", ["recommended", "in_progress"])
        .maybeSingle();

      if (existing?.id) continue;

      inserts.push({
        employee_id,
        skill_id: skillId,
        project_id: project_id || null,
        course_name: item.course_name || "Recommended Course",
        platform: item.platform || "Unknown",
        url: item.url || null,
        estimated_hours: item.estimated_hours || null,
        priority: item.priority || "medium",
        status: "recommended",
        deadline: item.deadline || null,
        ai_generated: true,
      });
    }

    if (inserts.length > 0) {
      await supabaseClient.from("learning_paths").insert(inserts);
    }

    return new Response(JSON.stringify(parsedJson), {
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
