# MarketMetrics

A stock research and behavioral analytics platform built to demonstrate
data engineering, telemetry pipelines, and AI integration skills.

## Live Demo

[link — add after Vercel deploy]

## Features

- Stock discovery powered by Financial Modeling Prep (FMP) API
- Dow Jones default view with most active stocks fallback
- Anonymous session tracking — no login required
- Search and view telemetry logged to Supabase Postgres
- Portfolio tracker with Watching / Researching / Invested statuses
- Analytics dashboard with real usage data (Recharts)
- AI stock recommendations powered by Cohere
- Watchlist by sector breakdown (GICS sectors)
- Keep-alive cron to maintain Supabase free tier

## Tech Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres)
- Recharts
- Financial Modeling Prep (FMP) API
- Cohere AI API
- Vercel

## Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in values
3. Run the SQL in `lib/supabase.ts` in your Supabase SQL editor
4. `npm install`
5. **Run locally**

```bash
npm run dev
```

## Environment Variables

```
FMP_API_KEY=your_fmp_api_key
COHERE_API_KEY=your_cohere_trial_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_legacy_jwt_anon_key
```

## Keep-Alive Cron

Supabase free tier pauses after 1 week of inactivity. A Vercel cron
job pings `/api/ping` every 3 days to keep the database active:

```json
{
  "crons": [
    {
      "path": "/api/ping",
      "schedule": "0 12 */3 * *"
    }
  ]
}
```

## Attribution

Market data provided by [Financial Modeling Prep](https://financialmodelingprep.com)

## Author

Fabio C.
