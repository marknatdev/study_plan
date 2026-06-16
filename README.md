# StudyForge — AI-Powered Study Planner

A premium web application that generates personalized study plans for competitions and exams using AI. Built with Next.js, Supabase, and OpenRouter.

## Features

- 🤖 **AI Study Plan Generation** — Describe your competition or upload a PDF syllabus, and AI creates a day-by-day study roadmap
- 📅 **Interactive Calendar** — View your plan mapped to a calendar with color-coded task categories
- ✅ **Progress Tracking** — Mark tasks as complete and track your overall progress
- 🔐 **Authentication** — Email/Password and Google OAuth via Supabase
- 🌙 **Premium Dark UI** — Glassmorphism design with smooth animations

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Auth & Database**: Supabase
- **AI Model**: `google/gemma-4-31b-it:free` via OpenRouter
- **Styling**: Vanilla CSS (custom design system)
- **Icons**: Lucide React
- **Hosting**: Vercel

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd study_plan
npm install
```

### 2. Configure Environment

Copy `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Set Up Supabase Database

1. Go to your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase_schema.sql`

### 4. Enable Google OAuth (optional)

1. Go to Supabase → **Auth → Providers → Google**
2. Enable it and add your Google OAuth Client ID & Secret
3. Set the redirect URL to: `https://your-domain.com/auth/callback`

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts    # AI generation endpoint
│   ├── auth/
│   │   ├── page.tsx             # Login / Register
│   │   └── callback/route.ts    # OAuth callback
│   ├── dashboard/
│   │   ├── layout.tsx           # Sidebar layout
│   │   ├── page.tsx             # Plans list
│   │   ├── create/page.tsx      # New plan form
│   │   └── plan/[id]/page.tsx   # Plan viewer (calendar + list)
│   ├── globals.css              # Design system
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/supabase/                # Supabase client setup
└── middleware.ts                # Auth middleware
```
