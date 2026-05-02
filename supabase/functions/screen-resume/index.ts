import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Invalid JSON");
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
        max_completion_tokens: 2048,
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
    const { storage_path, job_requirement_id } = body || {};

    if (!storage_path || !job_requirement_id) {
      throw new Error("storage_path and job_requirement_id are required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: jobReq } = await supabaseClient
      .from("job_requirements")
      .select("*")
      .eq("id", job_requirement_id)
      .maybeSingle();

    if (!jobReq) {
      throw new Error("Job requirement not found");
    }

    const { data: fileData, error: fileError } = await supabaseClient
      .storage
      .from("resumes")
      .download(storage_path);

    if (fileError || !fileData) {
      throw new Error("Failed to download resume");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const ext = getExtension(storage_path);

    // Extract text from resume
    let resumeText = "";
    if (ext === "txt") {
      resumeText = new TextDecoder("utf-8").decode(bytes);
    } else if (ext === "pdf") {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const readable = text.match(/[\x20-\x7E\n\r\t]{3,}/g);
      if (readable && readable.length > 20) {
        resumeText = readable.join(" ");
      } else {
        resumeText = "Unable to extract text from PDF. Please use a text-based resume.";
      }
    } else {
      resumeText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }

    const prompt = `You are a senior technical recruiter. Extract structured data from the provided resume and score the candidate against the job requirement. Return ONLY valid JSON with no markdown fences:
{
  "name": "string",
  "email": "string",
  "total_experience_years": 0,
  "skills": ["string"],
  "education": "string",
  "previous_roles": ["string"],
  "match_score": 0,
  "matched_skills": ["string"],
  "missing_skills": ["string"],
  "summary": "string"
}

Job requirement: ${JSON.stringify(jobReq)}

Resume content:
${resumeText.slice(0, 6000)}

If the file content is unclear, do your best and keep unknown fields empty or conservative.`;

    const output = await callGroq(prompt);
    let outputText = output.replace(/```json/g, "").replace(/```/g, "");

    let parsedJson;
    try {
      parsedJson = tryParseJson(outputText);
    } catch {
      const fixPrompt = `Fix this into valid JSON ONLY.\n${outputText}`;
      const repairedText = await callGroq(fixPrompt);
      outputText = repairedText.replace(/```json/g, "").replace(/```/g, "");
      parsedJson = tryParseJson(outputText);
    }

    const fileName = storage_path.split("/").pop() || storage_path;

    const { data: existing } = await supabaseClient
      .from("resume_uploads")
      .select("id")
      .eq("storage_path", storage_path)
      .maybeSingle();

    const payload = {
      file_name: fileName,
      storage_path,
      job_requirement_id,
      candidate_name: parsedJson.name || null,
      candidate_email: parsedJson.email || null,
      extracted_skills: parsedJson.skills || [],
      experience_years: parsedJson.total_experience_years || null,
      education: parsedJson.education || null,
      previous_roles: parsedJson.previous_roles || [],
      match_score: parsedJson.match_score || null,
      matched_skills: parsedJson.matched_skills || [],
      missing_skills: parsedJson.missing_skills || [],
      ai_summary: parsedJson.summary || null,
      status: "screened",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabaseClient.from("resume_uploads").update(payload).eq("id", existing.id);
    } else {
      await supabaseClient.from("resume_uploads").insert({
        ...payload,
        uploaded_by: null,
      });
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
