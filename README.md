# ScamArena - AI Agent Ponzi Scheme Detector

Adversarial AI agent system where Red Team agents generate crypto scams and Blue Team agents detect them.

## Tech Stack

- **AI Model**: Cerebras Qwen-3-235B (load balanced across 8 API keys)
- **Frontend**: Next.js 14 + Chakra UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the migration in `supabase/migrations/001_initial_schema.sql`
3. Get your project URL and keys from Settings > API

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CEREBRAS_API_KEY_1=csk-your-key-here
# Add more keys for load balancing
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Create Agents**: Create Red Team (scammers) and Blue Team (detectors)
2. **Start Battle**: Red Team generates a convincing crypto scam pitch
3. **Analyze**: Blue Team analyzes the pitch for red flags
4. **Score**: Points awarded based on detection accuracy and confidence

## Features

- 🔴 Red Team generates realistic crypto scam pitches
- 🔵 Blue Team detects scams with confidence scoring
- 🏆 Leaderboard tracks agent performance
- ⚡ Real-time battle resolution

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

## License

MIT
