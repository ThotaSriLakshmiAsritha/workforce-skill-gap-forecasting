# SkillSync AI

SkillSync AI is a workforce skill-gap intelligence platform for HR leaders, L&D teams, and C-suite stakeholders.

The application provides:
- Workforce health and risk dashboards
- Employee-level skill-gap analysis
- AI-guided learning recommendations
- Market demand and technology trend intelligence
- Forward-looking skill-gap forecasting controls
- Admin monitoring with organization-wide risk visibility

## Stack

- React 19
- Vite
- Tailwind CSS
- Recharts
- Lucide React

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up Supabase Edge Functions:

The skill gap analysis feature requires a Gemini API key. Add it to your Supabase project:

```bash
# Get API key from https://aistudio.google.com/app/apikey
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Deploy edge functions
supabase functions deploy analyze-skill-gap
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed setup instructions.

4. Start the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

6. Preview the production build:

```bash
npm run preview
```

## Notes

- The project runs in dark mode by default.
- Data is currently static and sourced from local JSON files in the src/data folder.
- Visual design follows an enterprise dashboard system optimized for dense analytical workflows.
