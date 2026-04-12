import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-1.5-pro-latest";

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

const getExtension = (path: string) => {
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

type ParseRequestBody = {
  storage_path?: string;
  parse_id?: string | null;
};

const responseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), { headers: responseHeaders, status });

const errorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const parseRequestBody = async (req: Request): Promise<ParseRequestBody> => {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    return {
      storage_path: String(formData.get("storage_path") ?? "").trim() || undefined,
      parse_id: String(formData.get("parse_id") ?? "").trim() || null,
    };
  }

  const rawBody = await req.text();
  if (!rawBody.trim()) {
    throw new Error("Request body is required");
  }

  try {
    return JSON.parse(rawBody) as ParseRequestBody;
  } catch (parseError) {
    throw new Error(`Invalid JSON request body: ${errorMessage(parseError)}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";

    const { storage_path, parse_id } = await parseRequestBody(req);

    if (!storage_path) {
      throw new Error("storage_path is required");
    }

    // Service-role client for DB writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let employeeId: string | null = null;

    if (authHeader) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { authorization: authHeader } } }
      );
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (!userError && user) {
        employeeId = user.id;
      }
    }

    if (!employeeId && parse_id) {
      const { data: parseRow } = await supabase
        .from("employee_resume_parses")
        .select("employee_id, storage_path")
        .eq("id", parse_id)
        .maybeSingle();

      if (parseRow && parseRow.storage_path === storage_path) {
        employeeId = parseRow.employee_id;
      }
    }

    if (!employeeId) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    // Mark as processing
    if (parse_id) {
      await supabase
        .from("employee_resume_parses")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", parse_id)
        .eq("employee_id", employeeId);
    }

    // Download resume from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from("resumes")
      .download(storage_path);

    if (fileError || !fileData) {
      throw new Error(`Failed to download resume file from storage: ${errorMessage(fileError) || "Unknown storage error"}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const ext = getExtension(storage_path);

    const mimeType =
      ext === "pdf" ? "application/pdf" :
      ext === "txt" ? "text/plain" :
      ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
      "application/octet-stream";

    // Use Gemini to parse the resume
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are an expert resume parser. Extract ALL structured data from the provided resume document. Return ONLY valid JSON with no markdown fences or extra text:
{
  "current_job_title": "string or null",
  "total_experience_years": 0,
  "summary": "string or null",
  "education": "string or null",
  "skills": [
    {
      "name": "string",
      "category": "technical or soft or domain",
      "proficiency": "beginner or intermediate or advanced or expert"
    }
  ],
  "work_experiences": [
    {
      "company": "string",
      "role": "string",
      "start_date": "string e.g. Jan 2020",
      "end_date": "string e.g. Dec 2022 or Present",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null"
    }
  ]
}

Guidelines:
- For skills, infer proficiency from context (years used, job level, certifications)
- Classify skills: technical = programming, tools, frameworks; soft = communication, leadership; domain = finance, healthcare, etc.
- Extract ALL projects mentioned (both work projects and personal/side projects)
- Be thorough — extract every skill mentioned anywhere in the document
- If a field is unknown, use null or empty array`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: toBase64(bytes) } },
    ]);

    let outputText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = tryParseJson(outputText);
    } catch {
      const fixPrompt = `Fix this into valid JSON ONLY, no markdown:\n${outputText}`;
      const retry = await model.generateContent(fixPrompt);
      outputText = retry.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = tryParseJson(outputText);
    }

    const skills: any[] = parsed.skills || [];
    const experiences: any[] = parsed.work_experiences || [];
    const projects: any[] = parsed.projects || [];

    // --- Upsert skills into employee_skills ---
    for (const skill of skills) {
      if (!skill.name) continue;
      const skillName = skill.name.trim();
      const category = ["technical", "soft", "domain"].includes(skill.category) ? skill.category : "technical";
      const proficiency = ["beginner", "intermediate", "advanced", "expert"].includes(skill.proficiency)
        ? skill.proficiency
        : "intermediate";

      // Find or create skill in master list
      let { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", skillName)
        .maybeSingle();

      if (!existingSkill) {
        const { data: newSkill } = await supabase
          .from("skills")
          .insert({ name: skillName, category })
          .select("id")
          .single();
        existingSkill = newSkill;
      }

      if (existingSkill?.id) {
        await supabase
          .from("employee_skills")
          .upsert(
            {
              employee_id: employeeId,
              skill_id: existingSkill.id,
              proficiency,
              self_rated: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "employee_id,skill_id" }
          );
      }
    }

    // --- Replace work experiences ---
    await supabase.from("employee_experiences").delete().eq("employee_id", employeeId);
    if (experiences.length > 0) {
      await supabase.from("employee_experiences").insert(
        experiences
          .filter((e: any) => e.company || e.role)
          .map((e: any) => ({
            employee_id: employeeId,
            company: e.company || "Unknown",
            role: e.role || "Unknown",
            start_date: e.start_date || null,
            end_date: e.end_date || null,
            description: e.description || null,
          }))
      );
    }

    // --- Replace projects ---
    await supabase.from("employee_projects").delete().eq("employee_id", employeeId);
    if (projects.length > 0) {
      await supabase.from("employee_projects").insert(
        projects
          .filter((p: any) => p.name)
          .map((p: any) => ({
            employee_id: employeeId,
            name: p.name,
            description: p.description || null,
            technologies: p.technologies || [],
            url: p.url || null,
          }))
      );
    }

    // --- Update profile fields ---
    const profileUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.total_experience_years) {
      profileUpdate.years_of_experience = parsed.total_experience_years;
    }
    if (parsed.current_job_title) {
      profileUpdate.job_title = parsed.current_job_title;
    }
    await supabase.from("profiles").update(profileUpdate).eq("id", employeeId);

    // --- Mark parse as completed ---
    if (parse_id) {
      await supabase
        .from("employee_resume_parses")
        .update({
          extracted_skills: skills,
          extracted_experiences: experiences,
          extracted_projects: projects,
          extracted_job_title: parsed.current_job_title || null,
          extracted_experience_years: parsed.total_experience_years || null,
          extracted_education: parsed.education || null,
          extracted_summary: parsed.summary || null,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", parse_id);
    }

    return jsonResponse(200, {
      success: true,
      skills: skills.length,
      experiences: experiences.length,
      projects: projects.length,
      job_title: parsed.current_job_title,
      experience_years: parsed.total_experience_years,
      education: parsed.education,
      summary: parsed.summary,
    });
  } catch (error: any) {
    const message = errorMessage(error);
    console.error("[parse-employee-resume] error:", message, error);

    // Try to mark the parse record as error if we have the info
    try {
      const body = await parseRequestBody(req.clone()).catch(() => ({} as ParseRequestBody));
      const { parse_id } = body || {};
      if (parse_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        await supabase
          .from("employee_resume_parses")
          .update({
            status: "error",
            error_message: message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parse_id);
      }
    } catch {
      // ignore
    }

    const status = message === "Unauthorized"
      ? 401
      : message.includes("required") || message.startsWith("Invalid JSON request body")
      ? 400
      : 500;

    return jsonResponse(status, { error: message });
  }
});
