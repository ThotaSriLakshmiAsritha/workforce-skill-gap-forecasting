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
    const { brief } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch available employees and their skills
    const { data: employees } = await supabaseClient
      .from('profiles')
      .select('id, full_name, role, employee_skills(proficiency_level, skills(name))')
      .eq('role', 'employee');

    const formattedEmployees = employees?.map(emp => ({
      id: emp.id,
      name: emp.full_name,
      skills: emp.employee_skills.map((s: any) => s.skills.name)
    }));

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `You are a workforce allocation agent. 
Given a project brief: "${brief}"
And a list of available employees with their skills: ${JSON.stringify(formattedEmployees)}

Find the best-fit team. Employees don't need all skills — match on most. For skill gaps, generate a learning path. 
Return ONLY JSON without markdown format:
{
  "matched_employees": [
    { "id": "uuid", "name": "string", "match_score": number 0-100, "matched_skills": ["string"], "gap_skills": ["string"] }
  ],
  "workforce_shortage": boolean,
  "shortage_count": number,
  "message": "A summary of the allocation."
}`;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    // Safely strip markdown if present
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
