# Analyze Skill Gap Edge Function

This edge function performs AI-powered skill gap analysis for employees against target roles.

## Environment Variables Required

Set these in your Supabase project dashboard under **Edge Functions** → **Secrets**:

```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile  # Optional, defaults to llama-3.3-70b-versatile
GROQ_MODEL_FALLBACKS=llama-3.1-70b-versatile,mixtral-8x7b-32768  # Optional fallback models
```

### Getting a Groq API Key

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to your Supabase project secrets

## Deployment

```bash
# Deploy this function to Supabase
supabase functions deploy analyze-skill-gap

# Set the environment variable
supabase secrets set GROQ_API_KEY=your_key_here
```

## Testing Locally

```bash
# Start Supabase locally with environment variable
GROQ_API_KEY=your_key_here supabase functions serve analyze-skill-gap

# Or create a .env file in supabase/functions/analyze-skill-gap/
echo "GROQ_API_KEY=your_key_here" > supabase/functions/analyze-skill-gap/.env
```

## Function Behavior

1. **Checks cache first**: Returns cached analysis unless `force_refresh: true` is passed
2. **Fetches employee skills**: Retrieves all skills from `employee_skills` table
3. **Calls Groq AI**: Sends prompt for skill gap analysis with automatic retry and fallback
4. **Persists result**: Saves to `skill_gap_analyses` table
5. **Returns JSON**: Analysis with readiness score, matched/missing skills, and priorities

## Error Handling

- **400**: Missing parameters, no skills found, or invalid response
- **200**: Success with analysis data

## Response Format

```json
{
  "readiness_score": 75,
  "readiness_label": "Almost Ready",
  "matched_required_skills": [...],
  "missing_required_skills": [...],
  "matched_bonus_skills": [...],
  "missing_bonus_skills": [...],
  "ai_insights": "...",
  "top_learning_priorities": [...],
  "_cached": false,
  "_analysed_at": "2026-05-02T...",
  "_model": "llama-3.3-70b-versatile"
}
```
