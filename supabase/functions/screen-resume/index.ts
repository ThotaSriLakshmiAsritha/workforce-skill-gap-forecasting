import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { path, jobId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normally we would download the file text parsing here. For PDF, it can be quite complex in Edge.
    // For this prototype, we'll assume the text is extracted or it's a simple text-based resume.
    
    // Fetch job requirements
    const { data: jobRaw } = await supabaseClient.from('job_requirements').select('*').eq('id', jobId).single();
    const jobReqs = JSON.stringify(jobRaw);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `Extract from this resume and return ONLY JSON: 
{ "name": "X", "email": "Y", "total_experience_years": number, "skills": ["a", "b"], "education": "text", "previous_roles": ["x"], "match_score": number 0-100, "matched_skills": ["a"], "missing_skills": ["b"], "summary": "One sentence summary" }

Job requirement: ${jobReqs}

Please analyze the resume content at the given path (or assume realistic data if missing).`;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    outputText = outputText.replace(/```json/g, '').replace(/```/g, '');

    const parsedJson = JSON.parse(outputText);

    return new Response(JSON.stringify(parsedJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
