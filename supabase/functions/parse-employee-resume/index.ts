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
  "openai/gpt-oss-120b",
]).map((value) => value.trim()).filter(Boolean);
const GROQ_API_URL = Deno.env.get("GROQ_API_URL")?.trim() || "https://api.groq.com/openai/v1";

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

const fromBase64 = (value: string) => {
  const normalized = value.replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const splitTextIntoChunks = (text: string, maxChars = 3500) => {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = "";
  };

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxChars) {
      pushCurrent();
      for (let i = 0; i < trimmed.length; i += maxChars) {
        const slice = trimmed.slice(i, i + maxChars).trim();
        if (slice) chunks.push(slice);
      }
      continue;
    }

    const next = current ? `${current}\n\n${trimmed}` : trimmed;
    if (next.length > maxChars) {
      pushCurrent();
      current = trimmed;
    } else {
      current = next;
    }
  }

  pushCurrent();
  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChars)];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const compactText = (text: string) => text.replace(/\s+/g, " ").trim();

const pickEvenlySpacedChunks = (chunks: string[], maxChunks: number) => {
  if (chunks.length <= maxChunks) return chunks;
  if (maxChunks <= 1) return [chunks[0]];

  const picked: string[] = [];
  for (let i = 0; i < maxChunks; i++) {
    const index = Math.round((i * (chunks.length - 1)) / (maxChunks - 1));
    const chunk = chunks[index];
    if (chunk && picked[picked.length - 1] !== chunk) {
      picked.push(chunk);
    }
  }

  return picked.length > 0 ? picked : [chunks[0]];
};

const dedupeByKey = <T,>(items: T[], keyFn: (item: T) => string) => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const mergeChunkResults = (chunks: any[]) => {
  const skills = dedupeByKey(
    chunks.flatMap((chunk) => Array.isArray(chunk?.skills) ? chunk.skills : []),
    (skill) => `${skill?.name ?? ""}|${skill?.category ?? ""}`,
  ).map((skill: any) => ({
    name: String(skill.name ?? "").trim(),
    category: ["technical", "soft", "domain"].includes(skill.category) ? skill.category : "technical",
    proficiency: ["beginner", "intermediate", "advanced", "expert"].includes(skill.proficiency)
      ? skill.proficiency
      : "intermediate",
  })).filter((skill) => skill.name);

  const experiences = dedupeByKey(
    chunks.flatMap((chunk) => Array.isArray(chunk?.work_experiences) ? chunk.work_experiences : []),
    (exp) => `${exp?.company ?? ""}|${exp?.role ?? ""}|${exp?.start_date ?? ""}|${exp?.end_date ?? ""}`,
  ).map((exp: any) => ({
    company: String(exp.company ?? "").trim(),
    role: String(exp.role ?? "").trim(),
    start_date: exp.start_date ?? null,
    end_date: exp.end_date ?? null,
    description: exp.description ?? null,
  })).filter((exp) => exp.company || exp.role);

  const projects = dedupeByKey(
    chunks.flatMap((chunk) => Array.isArray(chunk?.projects) ? chunk.projects : []),
    (project) => `${project?.name ?? ""}|${project?.url ?? ""}`,
  ).map((project: any) => ({
    name: String(project.name ?? "").trim(),
    description: project.description ?? null,
    technologies: Array.isArray(project.technologies)
      ? project.technologies.map((tech: any) => String(tech).trim()).filter(Boolean)
      : [],
    url: project.url ?? null,
  })).filter((project) => project.name);

  const currentJobTitle = chunks.map((chunk) => chunk?.current_job_title).find((value) => typeof value === "string" && value.trim()) ?? null;
  const education = chunks.map((chunk) => chunk?.education).find((value) => typeof value === "string" && value.trim()) ?? null;
  const summary = chunks.map((chunk) => chunk?.summary).find((value) => typeof value === "string" && value.trim()) ?? null;
  const experienceYears = chunks
    .map((chunk) => Number(chunk?.total_experience_years))
    .filter((value) => Number.isFinite(value) && value >= 0);

  return {
    current_job_title: currentJobTitle,
    total_experience_years: experienceYears.length > 0 ? Math.max(...experienceYears) : 0,
    summary,
    education,
    skills,
    work_experiences: experiences,
    projects,
  };
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return atob(padded);
};

const getAuthClaims = (authHeader: string) => {
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const userId = typeof payload.sub === "string" && payload.sub.trim() ? payload.sub.trim() : null;
    if (!userId) return null;

    const email = typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : "";
    const fullName =
      typeof payload.user_metadata?.full_name === "string" && payload.user_metadata.full_name.trim()
        ? payload.user_metadata.full_name.trim()
        : email
        ? email.split("@")[0]
        : "New User";
    const role = typeof payload.user_metadata?.role === "string" && payload.user_metadata.role.trim()
      ? payload.user_metadata.role.trim()
      : "employee";

    return { userId, email, fullName, role };
  } catch {
    return null;
  }
};

type ParseRequestBody = {
  storage_path?: string;
  parse_id?: string | null;
  preview?: boolean;
  file_base64?: string;
  file_name?: string;
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
      preview: String(formData.get("preview") ?? "").trim() === "1" || String(formData.get("preview") ?? "").toLowerCase() === "true",
      file_base64: String(formData.get("file_base64") ?? "").trim() || undefined,
      file_name: String(formData.get("file_name") ?? "").trim() || undefined,
    };
  }

  const rawBody = await req.text();
  if (!rawBody.trim()) {
    throw new Error("Request body is required");
  }

  try {
    const parsed = JSON.parse(rawBody) as Record<string, any>;
    return {
      storage_path: parsed.storage_path,
      parse_id: parsed.parse_id ?? null,
      preview: parsed.preview === true || String(parsed.preview ?? "").toLowerCase() === "true",
      file_base64: typeof parsed.file_base64 === "string" ? parsed.file_base64 : undefined,
      file_name: typeof parsed.file_name === "string" ? parsed.file_name : undefined,
    } as ParseRequestBody;
  } catch (parseError) {
    throw new Error(`Invalid JSON request body: ${errorMessage(parseError)}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let requestBody: ParseRequestBody | null = null;

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const authClaims = authHeader ? getAuthClaims(authHeader) : null;

    requestBody = await parseRequestBody(req);
    const { storage_path, parse_id, preview, file_base64, file_name } = requestBody;
    const directFileMode = Boolean(file_base64);

    if (!storage_path && !directFileMode) {
      throw new Error("storage_path is required");
    }

    // Service-role client for DB writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let employeeId: string | null = null;

    if (authClaims) {
      employeeId = authClaims.userId;
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

    if (!employeeId && !directFileMode) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!directFileMode) {
      // Ensure a profiles row exists for this employee to avoid FK violations
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', employeeId)
          .maybeSingle();

        const profileRole = existingProfile?.role || authClaims?.role || 'employee';
        const profileEmail = authClaims?.email || '';
        const profileFullName = authClaims?.fullName || profileEmail.split('@')[0] || 'New User';

        const { error: profileUpsertError } = await supabase.from('profiles').upsert([
          {
            id: employeeId,
            email: profileEmail,
            full_name: profileFullName,
            role: profileRole,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'id' });

        if (profileUpsertError) {
          throw profileUpsertError;
        }
      } catch (upsertErr) {
        console.warn('[parse-employee-resume] Failed to upsert profile:', upsertErr);
      }
    }

    // Mark as processing
    if (parse_id) {
      await supabase
        .from("employee_resume_parses")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", parse_id)
        .eq("employee_id", employeeId);
    }

    let bytes: Uint8Array;
    let ext: string;
    const resolvedStoragePath = storage_path || file_name || "resume.pdf";

    if (directFileMode) {
      bytes = fromBase64(file_base64!);
      ext = getExtension(file_name || "resume.pdf") || "pdf";
    } else {
      // Download resume from storage
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from("resumes")
        .download(storage_path!);

      if (fileError || !fileData) {
        throw new Error(`Failed to download resume file from storage: ${errorMessage(fileError) || "Unknown storage error"}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
      ext = getExtension(storage_path!);
    }

    let resumeText = "";
    if (ext === "txt") {
      resumeText = new TextDecoder("utf-8").decode(bytes);
    } else if (ext === "pdf") {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const readable = text.match(/[\x20-\x7E\n\r\t]{3,}/g);
      if (readable && readable.length > 20) {
        resumeText = readable.join(" ");
      } else {
        resumeText = "";
      }
    } else if (ext === "docx") {
      resumeText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } else {
      resumeText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }

    console.log(`[parse-employee-resume] File: ${resolvedStoragePath}, Type: ${ext}, Extracted text length: ${resumeText.length}`);

    if (!directFileMode && ext !== "pdf" && resumeText.length < 50) {
      throw new Error(`Failed to extract text from ${ext} file. Text extraction resulted in ${resumeText.length} characters. Try uploading a .txt file or a simpler PDF.`);
    }

    // If preview requested, return the extracted text for user confirmation
    const previewRequested = Boolean(preview);
    if (previewRequested) {
      return jsonResponse(200, { preview: resumeText });
    }

    const chunkPrompt = (chunkText: string, chunkIndex: number, chunkCount: number) => `You are an expert resume parser. Parse this resume chunk and return ONLY valid JSON with no markdown fences or extra text.

Return this shape:
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
      "start_date": "string or null",
      "end_date": "string or null",
      "description": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string or null",
      "technologies": ["string"],
      "url": "string or null"
    }
  ]
}

Guidelines:
- Extract only what is explicitly present or clearly supported by this chunk.
- Be strict: do not invent skills, roles, dates, or projects.
- Be concise and avoid repeating the same item across different fields.
- Classify skills as technical, soft, or domain.
- If a field is unknown, use null or an empty array.
- If you are unsure, omit the item rather than guessing.

Chunk ${chunkIndex + 1} of ${chunkCount}:
${chunkText}`;

    // Helper to call Groq REST API for a single prompt.
    const callGroq = async (inputPrompt: string) => {
      if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY (or groq) in environment');

    const models = [GROQ_MODEL, ...GROQ_MODEL_FALLBACKS].filter((value, index, self) => self.indexOf(value) === index);
    let lastErrorText = "";

    for (const modelName of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const url = `${GROQ_API_URL}/chat/completions`;
        const body = {
          model: modelName,
          messages: [
            {
              role: 'user',
              content: inputPrompt,
            },
          ],
          max_completion_tokens: 1024,
          temperature: 0.0,
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
            console.warn(`[parse-employee-resume] Groq model ${modelName} attempt ${attempt + 1} failed, retrying in ${waitMs}ms`);
            await sleep(waitMs);
            continue;
          }

          if (retryable && modelName !== models[models.length - 1]) {
            console.warn(`[parse-employee-resume] Groq model ${modelName} failed, trying fallback model`);
            break;
          }

          throw new Error(lastErrorText);
        }
        try {
          const j = JSON.parse(text);
          if (Array.isArray(j.choices) && j.choices[0]?.message?.content) {
            return j.choices[0].message.content;
          }
          if (typeof j.output_text === 'string') return j.output_text;
          if (typeof j.text === 'string') return j.text;
          if (typeof j.output === 'string') return j.output;
          if (Array.isArray(j.outputs) && j.outputs[0]) {
            const first = j.outputs[0];
            if (typeof first.content === 'string') return first.content;
            if (typeof first.text === 'string') return first.text;
          }
          return JSON.stringify(j);
        } catch {
          return text;
        }
      }
    }

      throw new Error(lastErrorText || "Groq API error");
    };

    let parsed: any;

    const modelText = compactText(resumeText);
    const allChunks = splitTextIntoChunks(modelText, 2200);
    const resumeChunks = pickEvenlySpacedChunks(allChunks, allChunks.length > 8 ? 8 : allChunks.length);
    const parsedChunks: any[] = [];

    for (let i = 0; i < resumeChunks.length; i++) {
      const rawOutput = await callGroq(chunkPrompt(resumeChunks[i], i, resumeChunks.length));
      let outputText = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsedChunk: any;
      try {
        parsedChunk = tryParseJson(outputText);
      } catch {
        const fixPrompt = `Fix this into valid JSON ONLY, no markdown:\n${outputText}`;
        const retryText = await callGroq(fixPrompt);
        outputText = retryText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedChunk = tryParseJson(outputText);
      }

      parsedChunks.push(parsedChunk);

    }

    parsed = mergeChunkResults(parsedChunks);
    const skills: any[] = parsed.skills || [];
    const experiences: any[] = parsed.work_experiences || [];
    const projects: any[] = parsed.projects || [];

    if (directFileMode) {
      return jsonResponse(200, {
        success: true,
        skills: skills.length,
        experiences: experiences.length,
        projects: projects.length,
        extracted_skills: skills,
        extracted_experiences: experiences,
        extracted_projects: projects,
        job_title: parsed.current_job_title,
        experience_years: parsed.total_experience_years,
        education: parsed.education,
        summary: parsed.summary,
        direct_test_mode: true,
      });
    }

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
      extracted_skills: skills,
      extracted_experiences: experiences,
      extracted_projects: projects,
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
      const { parse_id } = requestBody || (await parseRequestBody(req.clone()).catch(() => ({} as ParseRequestBody)));
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
