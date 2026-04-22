import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-flash-latest";

const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientAiError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("503") ||
    normalized.includes("service unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("deadline exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted")
  );
};

const runGeminiWithRetry = async (
  genAI: GoogleGenerativeAI,
  payload: any,
): Promise<string> => {
  const models = [GEMINI_MODEL, ...FALLBACK_MODELS].filter(
    (value, index, self) => Boolean(value) && self.indexOf(value) === index,
  );

  let lastError: any = null;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(payload);
        return result.response.text();
      } catch (error: any) {
        lastError = error;
        const message = String(error?.message || error || "Unknown AI error");
        const retryable = isTransientAiError(message);
        const canRetryAttempt = retryable && attempt < 2;

        if (canRetryAttempt) {
          await sleep(500 * (attempt + 1));
          continue;
        }

        // Try next model for transient outages or model-specific failures.
        if (retryable || message.toLowerCase().includes("model")) {
          break;
        }

        throw error;
      }
    }
  }

  const reason = String(lastError?.message || lastError || "Unknown AI error");
  throw new Error(`AI resume screening is temporarily unavailable. ${reason}`);
};

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

    const mimeType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "txt"
        ? "text/plain"
        : "application/octet-stream";

    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");

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

If the file content is unclear, do your best and keep unknown fields empty or conservative.`;

    const output = await runGeminiWithRetry(genAI, [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: toBase64(bytes),
        },
      },
    ]);

    let outputText = output.replace(/```json/g, "").replace(/```/g, "");

    let parsedJson;
    try {
      parsedJson = tryParseJson(outputText);
    } catch {
      const fixPrompt = `Fix this into valid JSON ONLY.\n${outputText}`;
      const repairedText = await runGeminiWithRetry(genAI, fixPrompt);
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
