# Troubleshooting Guide

## Skill Gap Analysis - "Edge Function returned a non-2xx status code"

If you see this error when clicking "Analyse with AI", follow these steps:

### 1. Check Browser Console

Open DevTools (F12) and look at the Console tab for detailed error messages. The improved error logging will show:
- Edge function errors
- API error responses
- Skill gap analysis errors

### 2. Verify Gemini API Key

The `analyze-skill-gap` edge function requires a Google Gemini API key.

**Steps to fix:**

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Add it to your Supabase project:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Edge Functions** → **Secrets** (or Settings → Edge Functions)
   - Add secret: `GEMINI_API_KEY` = `your_key_here`

3. Redeploy the function:
   ```bash
   supabase functions deploy analyze-skill-gap
   ```

### 3. Check Employee Has Skills

The analysis requires the employee to have skills in their profile. The error message might say:

> "No skills found. Please upload and analyse your resume first."

**Steps to fix:**
1. Go to the Resume Screener page
2. Upload your resume
3. Wait for AI analysis to extract skills
4. Return to Skill Gap page and try again

### 4. Verify Function Deployment

Make sure the edge function is deployed:

```bash
# List all deployed functions
supabase functions list

# Deploy if missing
supabase functions deploy analyze-skill-gap
```

### 5. Check Network Tab

In DevTools → Network tab, filter for `analyze-skill-gap`:
- Look at the request body (should have `employee_id`, `role_id`, `role_title`)
- Look at the response (should show the actual error message)
- Check the status code (400 = bad request, 500 = server error)

### 6. Test Locally

Run the edge function locally to debug:

```bash
# Set environment variable
export GEMINI_API_KEY=your_key_here

# Serve the function
supabase functions serve analyze-skill-gap --no-verify-jwt

# In another terminal, test it
curl -X POST 'http://localhost:54321/functions/v1/analyze-skill-gap' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "employee_id": "your-user-id",
    "role_id": "cloud-architect",
    "role_title": "Cloud Architect"
  }'
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "GEMINI_API_KEY is not configured" | Missing API key | Add `GEMINI_API_KEY` to Supabase secrets |
| "No skills found. Please upload and analyse your resume first." | No skills in profile | Upload resume and extract skills first |
| "employee_id, role_id, and role_title are required" | Missing parameters | This is a frontend bug - report to developer |
| "Invalid JSON from AI response" | Gemini returned malformed data | Try again or check Gemini API status |

## Still Having Issues?

1. Check Supabase logs in the dashboard
2. Verify your Supabase project is on a paid plan (free tier has limitations)
3. Check Gemini API quota/billing at [Google Cloud Console](https://console.cloud.google.com/)
4. Open a GitHub issue with:
   - Browser console logs
   - Network request/response
   - Your Supabase project region
