import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const proficiencyWeight = (value: string) => {
  switch (value) {
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    case "expert":
      return 4;
    default:
      return 0;
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: departments } = await supabaseClient
      .from("profiles")
      .select("department")
      .eq("role", "employee");

    const uniqueDepartments = Array.from(
      new Set((departments || []).map((d) => d.department).filter(Boolean)),
    ) as string[];

    const { data: skills } = await supabaseClient
      .from("skills")
      .select("id");

    const rows: any[] = [];

    for (const department of uniqueDepartments) {
      const { count: totalEmployees } = await supabaseClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "employee")
        .eq("department", department);

      if (!totalEmployees || totalEmployees === 0) continue;

      for (const skill of skills || []) {
        const { data: skillHolders } = await supabaseClient
          .from("employee_skills")
          .select("employee_id, proficiency, profiles!inner(department)")
          .eq("skill_id", skill.id)
          .eq("profiles.department", department);

        const qualified = (skillHolders || []).filter((s: any) => proficiencyWeight(s.proficiency) >= 2);
        const coverage = Math.round((qualified.length / totalEmployees) * 100);

        let severity = "low";
        if (coverage < 40) severity = "critical";
        else if (coverage < 70) severity = "moderate";

        rows.push({
          department,
          skill_id: skill.id,
          coverage_percentage: coverage,
          gap_severity: severity,
        });
      }
    }

    if (rows.length > 0) {
      await supabaseClient
        .from("skill_gap_snapshots")
        .upsert(rows, {
          onConflict: "snapshot_date,department,skill_id",
          ignoreDuplicates: false,
        });
    }

    return new Response(JSON.stringify({ inserted: rows.length }), {
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
