# Tomorrow's People — How to Use These Files

## What you have

This folder contains the complete source code for **Tomorrow's People**,
a full-stack AI-powered habit coaching application built with:
- **Next.js 14** (frontend + backend)
- **PostgreSQL + Prisma** (database)
- **NextAuth.js v5** (authentication)
- **Claude AI** (coaching intelligence)
- **Tailwind CSS** (styling)

## Quick overview of the folder structure

```
tomorrows-people/
├── app/                    ← All pages and API routes
│   ├── (auth)/login/       ← Login page
│   ├── (dashboard)/        ← Main app pages
│   │   ├── today/          ← Daily habit check-in
│   │   ├── habits/         ← Habit management
│   │   ├── progress/       ← Streaks & scores
│   │   └── coach/          ← AI coach chat
│   └── api/                ← Backend API endpoints
├── lib/                    ← Backend logic
│   ├── services/           ← Database operations
│   ├── middleware/         ← Auth & rate limiting
│   └── prompts/            ← AI prompt templates
├── components/             ← Reusable UI components
├── hooks/                  ← React data hooks
├── prisma/                 ← Database schema & migrations
└── config/                 ← Environment validation
```

See DEPLOYMENT_GUIDE.md for the full step-by-step deployment instructions.
