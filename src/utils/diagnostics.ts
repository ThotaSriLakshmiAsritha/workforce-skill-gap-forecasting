import { supabase } from '../lib/supabase';

export interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

/**
 * Run diagnostics to help troubleshoot common setup issues
 */
export async function runDiagnostics(userId?: string): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Check Supabase connection
  try {
    const { error } = await supabase.from('employees').select('id').limit(1);
    if (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Failed to connect to Supabase',
        details: error.message,
      });
    } else {
      results.push({
        name: 'Supabase Connection',
        status: 'pass',
        message: 'Successfully connected to Supabase',
      });
    }
  } catch (err: any) {
    results.push({
      name: 'Supabase Connection',
      status: 'fail',
      message: 'Error testing Supabase connection',
      details: err.message,
    });
  }

  // Check if user has skills
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('employee_skills')
        .select('id')
        .eq('employee_id', userId);

      if (error) {
        results.push({
          name: 'Employee Skills',
          status: 'warning',
          message: 'Could not fetch employee skills',
          details: error.message,
        });
      } else if (!data || data.length === 0) {
        results.push({
          name: 'Employee Skills',
          status: 'warning',
          message: 'No skills found in profile',
          details: 'Upload and analyze your resume to extract skills',
        });
      } else {
        results.push({
          name: 'Employee Skills',
          status: 'pass',
          message: `Found ${data.length} skill(s) in profile`,
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Employee Skills',
        status: 'fail',
        message: 'Error checking employee skills',
        details: err.message,
      });
    }
  }

  // Test edge function
  try {
    const { data, error } = await supabase.functions.invoke('analyze-skill-gap', {
      body: { employee_id: 'test', role_id: 'test', role_title: 'Test' },
    });

    if (error) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('GEMINI_API_KEY')) {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'fail',
          message: 'GEMINI_API_KEY not configured',
          details: 'Add GEMINI_API_KEY to Supabase Edge Function secrets',
        });
      } else if (errorMsg.includes('No skills found')) {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'pass',
          message: 'Edge function is deployed and responding',
          details: 'Test request returned expected validation error',
        });
      } else {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'warning',
          message: 'Edge function returned an error',
          details: errorMsg,
        });
      }
    } else if (data?.error) {
      const errorMsg = data.error;
      if (errorMsg.includes('GEMINI_API_KEY')) {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'fail',
          message: 'GEMINI_API_KEY not configured',
          details: 'Add GEMINI_API_KEY to Supabase Edge Function secrets',
        });
      } else if (errorMsg.includes('No skills found')) {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'pass',
          message: 'Edge function is deployed and responding',
          details: 'Test request returned expected validation error',
        });
      } else {
        results.push({
          name: 'Edge Function (analyze-skill-gap)',
          status: 'warning',
          message: 'Edge function returned an error',
          details: errorMsg,
        });
      }
    } else {
      results.push({
        name: 'Edge Function (analyze-skill-gap)',
        status: 'pass',
        message: 'Edge function is working correctly',
      });
    }
  } catch (err: any) {
    results.push({
      name: 'Edge Function (analyze-skill-gap)',
      status: 'fail',
      message: 'Error invoking edge function',
      details: err.message,
    });
  }

  return results;
}
