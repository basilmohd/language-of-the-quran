# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Development has started. The NX monorepo is initialized in the `language-of-the-quran/` folder. No apps or libs have been scaffolded yet — next step is creating the `web` app and landing page. `ARCHITECTURE.md` (full technical design) and `WORKFLOW.md` (UX + curriculum) exist as design references.

## Tech Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Monorepo      | NX + npm workspaces                                  |
| Web           | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Mobile (MVP2) | React Native + Expo                                  |
| API           | Node.js + Express + TypeScript                       |
| ORM           | Prisma                                               |
| Database      | PostgreSQL (Neon)                                    |
| Cache         | Redis via Upstash                                    |
| CDN           | Cloudflare R2 (curriculum bundles + audio proxy)     |
| Auth          | Clerk (JWT, Expo SDK support)                        |
| State machine | XState v5 (lesson flow, shared between web + mobile) |
| Drag-and-drop | @dnd-kit/sortable                                    |

## Commands

All commands run from the `language-of-the-quran/` monorepo root:

```bash
# Install dependencies
npm install

# Run web + API together
nx run-many --target=serve --projects=web,api
# web: http://localhost:5173, api: http://localhost:3001

# Run individual app
nx serve web
nx serve api

# Build
nx build web
nx build api

# Run tests
nx test web
nx test api
nx test srs          # pure TS, zero deps — run this frequently

# Lint
nx lint web
nx lint api

# Database
npm run prisma:migrate    # apply migrations
npm run prisma:studio     # GUI
npm run prisma:generate   # regenerate client after schema changes
npm run seed              # seed corpus data (quran-data) + initial content

# Publish curriculum bundles to Cloudflare R2
nx run content:publish
```

## Planned Repository Structure

```
apps/
  web/          # React + Vite SPA
  api/          # Express API (routes/v1/, middleware/, services/)
    prisma/     # schema.prisma + migrations/
  mobile/       # React Native + Expo (MVP2)
libs/
  api-types/    # Shared TypeScript types (request/response, exercise types)
  db/           # Prisma client + generated types
  srs/          # SM-2 spaced repetition algorithm (pure TS, zero deps)
  quran-data/   # Corpus JSON seed files — source of truth for Quranic text
  content/      # Lesson JSON files (curriculum/level-N/unit-N/lesson-N.json)
```

## Architecture Patterns

### Content: Two Separate Layers

- **Corpus** (Quranic text, morphology, translations): Write-once, seeded into PostgreSQL from `libs/quran-data/`. Enables relational queries like "all verses with root ك-ت-ب".
- **Curriculum** (lesson/exercise JSON): Lives in `libs/content/`, version-controlled in git, published to Cloudflare R2. PostgreSQL stores only a `ContentVersion` manifest (hash, CDN URL). Clients compare hashes and download only deltas.

### Shared Libraries

`libs/srs/` (SM-2 algorithm) and `libs/api-types/` (exercise types) are zero-dependency TypeScript — they run identically on web, mobile (offline), and API. Don't add external dependencies to these libs.

### Lesson State Machine

XState v5 machine lives in `libs/srs/src/lessonMachine.ts`. Manages: `idle → loading → presenting_exercise → answered → show_feedback → [next|retry] → completed → award_xp → check_badges → update_streak`.

### API Conventions

- All routes: `/api/v1/`
- Uniform response envelope: `{ data: T | null, meta: { version, requestId }, error: { code, message } | null }`
- All list endpoints: cursor pagination
- Mobile clients send `X-App-Version` header (logged for deprecation planning)

### Audio

Content JSON references audio as `audio://quran/{reciter}/{surah}/{ayah}`. The API proxy at `GET /api/v1/audio/:reciter/:surah/:ayah` resolves these to CDN URLs. MVP1 proxies to quran.com/alquran.cloud. Changing the proxy endpoint is the only change needed to swap audio providers.

### Database Conventions

- UUID PKs everywhere
- `timestamptz` (never bare `timestamp`) on all datetime columns
- `deleted_at` soft-delete on all user-data tables
- Streak dates stored as `DATE` (not timestamptz) in user's local timezone to prevent midnight-crossing bugs

### Gamification Rules (no exceptions)

- **No lives/hearts**: unlimited attempts per exercise
- **Wrong answer**: amber feedback + correct answer + explanation → retry (never block progress)
- **XP**: 10 on first-attempt correct, 5 on retry correct — never 0
- **Streaks**: one calendar day of activity in user's timezone counts

## Curriculum Scope

~350 high-frequency words across 6 levels:

1. Nouns (Ism) — 4 properties, definiteness, gender, number, Idhafah
2. Verbs (Fi'l) — conjugation, pronouns
3. Particles (Harf) — prepositions, negation
4. Root System (Sarf) — morphological patterns
5. Sentence Structure (Nahw) — sentence anatomy, i'rab
6. Contextual Reading — full passages

Target: 80–85% reading comprehension of the Quran.

## Key Design Documents

- `language-of-the-quran/ARCHITECTURE.md` — Full technical reference: schema, API specs, frontend component tree, infrastructure, decision log
- `language-of-the-quran/WORKFLOW.md` — UX flows, lesson 1 content plan, exercise sequences, curriculum structure

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## IMPORTANT: Docs-First Rule

Before generating any code, **always check the `/docs` directory first** for relevant documentation. If a docs file exists for the technology or feature you're working with, read it before writing any code. The `/docs` directory contains authoritative guidance that takes precedence over general knowledge:

- /docs/ui.md
