# The Language of the Quran

A gamified Quranic Arabic learning platform designed to help English-speaking learners understand the Quran word-by-word through structured, grammar-first pedagogy.

## Overview

**The Language of the Quran** is a Duolingo-style web and mobile application that teaches Classical/Quranic Arabic to non-native speakers who can recite the Quran but lack comprehension skills. The platform combines interactive exercises, spaced repetition, gamification, and authentic Quranic text to build reading comprehension and morphological understanding.

### Key Features

- **Grammar-First Curriculum**: 350+ high-frequency words across 6 levels covering nouns, verbs, particles, root systems, sentence structure, and contextual reading
- **Gamified Learning**: Streak tracking, XP rewards, badge system, and progress visualization
- **Authentic Quranic Content**: Every word taught with real Quranic verses showing contextual usage
- **Spaced Repetition**: SM-2 algorithm ensures optimal review intervals for retention
- **Progressive Unlocking**: Lesson-by-lesson progression with clear learning paths
- **Target Outcome**: ~80–85% reading comprehension of the Quran

### Demo & Testing

**[🌐 Live App: https://language-of-the-quran.vercel.app](https://language-of-the-quran.vercel.app)**

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: XState v5 (lesson state machine)
- **Build Tool**: Vite (fast HMR, optimized bundles)
- **Deployment**: **Vercel** (serverless, auto-deploy from git)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma (type-safe database access)
- **Database**: **PostgreSQL** via **Neon** (serverless, free tier)
- **Authentication**: **Clerk** (JWT, OAuth, session management)
- **Cache/Queue**: Redis via **Upstash** (review queues, rate limiting, streaks)
- **Deployment**: **Railway** (containerized Node.js, auto-deploy)

### Mobile (MVP2)
- **Framework**: React Native + Expo
- **Shared Logic**: `libs/srs` (SM-2 algorithm) + `libs/api-types` (zero-dependency TS)

### Content & Infrastructure
- **Monorepo**: NX + npm workspaces (code generation, affected builds, dependency graph)
- **CDN**: **Cloudflare R2** (curriculum bundles, audio proxy, zero egress fee)
- **Audio**: quran.com/alquran.cloud API (MVP1) → self-hosted R2 audio (future)
- **CI/CD**: GitHub Actions (auto-deploy to Vercel & Railway)

## Infrastructure & Deployments

| Component | Service | Status | URL |
|-----------|---------|--------|-----|
| **Web App** | Vercel | ✅ Live | https://language-of-the-quran.vercel.app |
| **API Server** | Railway | ✅ Live | https://api.language-of-the-quran.up.railway.app |
| **Database** | Neon (PostgreSQL) | ✅ Active | Serverless, auto-scaled |
| **Authentication** | Clerk | ✅ Active | OAuth + email/password |
| **Cache/Queue** | Upstash (Redis) | ✅ Active | Rate limiting, streaks, review queues |
| **Asset CDN** | Cloudflare R2 | ✅ Active | Curriculum bundles, audio proxy |

## Project Structure

```
language-of-the-quran/
├── apps/
│   ├── web/              # React + Vite SPA (MVP1 - Live)
│   ├── api/              # Node.js + Express API
│   │   └── prisma/       # Database schema & migrations
│   └── mobile/           # React Native + Expo (MVP2)
│
├── libs/
│   ├── api-types/        # Shared TS types (request/response)
│   ├── db/               # Prisma client + generated types
│   ├── srs/              # SM-2 algorithm (pure TS, zero deps)
│   ├── quran-data/       # Quranic corpus (seed data)
│   └── content/          # Curriculum lessons (version-controlled)
│
├── CLAUDE.md             # Claude Code instructions & conventions
├── ARCHITECTURE.md       # Full technical specification
├── WORKFLOW.md           # UX flows & curriculum design
└── package.json          # npm workspaces config
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL (local) or Neon account (production)
- Redis (local) or Upstash account (production)
- Clerk account for authentication

### Local Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/basilmohd/language-of-the-quran.git
   cd language-of-the-quran
   npm install
   ```

2. **Environment variables** — Create `.env.local`:
   ```
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/quran_db
   
   # Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Redis/Cache
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   
   # Cloudflare R2
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY=...
   R2_SECRET_KEY=...
   R2_BUCKET=...
   ```

3. **Database migrations**:
   ```bash
   npm run prisma:migrate
   npm run seed  # Seed Quranic corpus + initial content
   ```

4. **Run dev servers**:
   ```bash
   # Both web (5173) + API (3001) together
   nx run-many --target=serve --projects=web,api
   
   # Or individually
   nx serve web
   nx serve api
   ```

5. **Open browser**: http://localhost:5173

### Common Commands

```bash
# Build all
nx build web
nx build api

# Run tests
nx test web
nx test api
nx test srs          # Pure TS, always run this first

# Lint
nx lint web
nx lint api

# Database
npm run prisma:studio     # GUI for data inspection
npm run prisma:generate   # Regenerate client after schema changes

# Publish curriculum to CDN
nx run content:publish
```

## Curriculum Scope

### 6 Levels (350+ Words)

1. **Level 1: Nouns (Ism)** — Definiteness, gender, number, Idhafah
2. **Level 2: Verbs (Fi'l)** — Conjugation, pronouns, tense
3. **Level 3: Particles (Harf)** — Prepositions, negation, conjunctions
4. **Level 4: Root System (Sarf)** — Morphological patterns, derivation
5. **Level 5: Sentence Structure (Nahw)** — Sentence anatomy, i'rab (case marking)
6. **Level 6: Contextual Reading** — Full passages, integrated comprehension

Each lesson combines:
- Word introductions with authentic Quranic verses
- Multiple choice exercises
- Fill-in-the-blank exercises
- Translation & comprehension quizzes
- Root system connections (Levels 4+)

## Architecture Highlights

### Dual-Layer Content System

**Corpus Layer** (PostgreSQL, write-once):
- Quranic text, morphology, translations
- Seeded from `libs/quran-data/` JSON files
- Enables relational queries: *"all verses with root ك-ت-ب"*

**Curriculum Layer** (Git + CDN, frequently updated):
- Lesson/exercise JSON in `libs/content/`
- Published to Cloudflare R2 via build step
- Postgres stores lightweight manifest (hash, CDN URL)
- Clients fetch & cache intelligently—no full redeploy needed for content fixes

### Lesson State Machine

XState v5 machine in `libs/srs/src/lessonMachine.ts`:
```
idle → loading → presenting_exercise → answered → show_feedback 
→ [next|retry] → completed → award_xp → check_badges → update_streak
```

Shared between web and mobile (offline-capable on mobile).

### API Conventions

- **Endpoint**: All routes under `/api/v1/`
- **Response Envelope**:
  ```json
  {
    "data": { /* ... */ },
    "meta": { "version": "1.0", "requestId": "..." },
    "error": null
  }
  ```
- **Pagination**: Cursor-based on all list endpoints
- **Headers**: `X-App-Version` logged for mobile deprecation planning

## Gamification Rules

- ✅ **No lives/hearts** — unlimited attempts per exercise
- ✅ **Wrong answer** → amber feedback + correct answer + explanation → retry
- ✅ **XP**: 10 on first-attempt correct, 5 on retry (never 0)
- ✅ **Streaks**: One calendar day of activity counts (timezone-aware)
- ✅ **Badges**: Earned at milestones (10 words, 50 XP, 7-day streak, etc.)

## Key Design Documents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Full technical spec: schema, API endpoints, component tree, infrastructure decisions
- **[WORKFLOW.md](./WORKFLOW.md)** — User journeys, lesson 1 content plan, curriculum structure
- **[CLAUDE.md](./CLAUDE.md)** — Development guidelines for Claude Code integration

## Contributing

This is a solo-developer project. For questions, issues, or collaboration:

- **Issues**: [GitHub Issues](https://github.com/basilmohd/language-of-the-quran/issues)
- **Discussions**: [GitHub Discussions](https://github.com/basilmohd/language-of-the-quran/discussions)

## License

[Add your license here — e.g., MIT]

---

## Roadmap

### MVP1 (Current - Live ✅)
- Web app with Levels 1-6 complete
- Clerk authentication
- Streak + XP + badge system
- Spaced repetition review queue
- Deployed on Vercel + Railway

### MVP2 (Planned)
- React Native + Expo mobile app
- Offline lesson playback
- Native streak notifications
- App Store & Play Store distribution

### MVP3+ (Future)
- Admin panel for content editing
- Teacher mode (classroom management)
- Multi-language support (if needed)
- Advanced analytics dashboard
- Community features (leaderboards, discussions)

---

**Built with ❤️ for Arabic learners. [Start learning →](https://language-of-the-quran.vercel.app)**
