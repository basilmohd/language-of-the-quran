# Plan: Quranic Arabic Learning Platform — "The Language of the Quran"

## Context
Solo developer. Duolingo-style gamified web app (MVP1) + Android (MVP2). Target: English-speaking non-native Arabic speakers who can recite Quran but don't understand meaning. Goal: reading comprehension of Classical/Quranic Arabic. Grammar-first pedagogy (Bayyinah Dream + Madinah Book mix). English is the only UI language — no i18n needed. Directory is currently empty.

---

## Architecture Overview

### Monorepo Structure (NX + npm)
```
the-language-of-the-quran/
├── apps/
│   ├── web/              # React + Vite (MVP1 webapp)         [@nx/react]
│   ├── mobile/           # React Native + Expo (MVP2)         [@nx/expo]
│   └── api/              # Node.js + Express + TypeScript      [@nx/node]
│       ├── src/
│       │   ├── routes/v1/    # all routes versioned from day 1
│       │   ├── middleware/   # auth, rate-limit, error handler
│       │   └── services/     # business logic (badges, XP, SRS)
│       └── prisma/
│           └── schema.prisma
├── libs/
│   ├── api-types/        # Shared TS types for ALL API request/response shapes
│   ├── db/               # Prisma client export + generated types
│   ├── srs/              # SM-2 algorithm (pure TS, no deps — shared mobile+api)
│   ├── quran-data/       # JSON seed files (corpus source of truth)
│   └── content/          # Curriculum lesson JSON files (version-controlled)
├── nx.json
└── package.json          # npm workspaces config
```

**Why NX:** `nx generate` scaffolds apps/libs without boilerplate; `nx affected` only rebuilds what changed across 3 apps; official `@nx/react`, `@nx/expo`, `@nx/node` plugins; NX Console VSCode extension.

### Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Web | React + Vite + TypeScript | Lightweight SPA, fast HMR |
| Mobile (MVP2) | React Native + Expo | Shares `libs/` logic with web |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, accessible |
| Backend | Node.js + Express + TypeScript | Simple, solo-dev friendly |
| ORM | Prisma | Type-safe, great migration tooling |
| Database | PostgreSQL | Relational integrity for root→word→verse |
| State Machine | XState v5 | Lesson flow; lives in `libs/srs/` shared package |
| Auth | Clerk | Handles JWT, refresh tokens, OAuth, Expo SDK |
| Cache | Redis (Upstash) | Review queue, rate limiting, streak data |
| Monorepo | NX + npm | Code gen, affected builds, dependency graph |

---

## Content Storage Strategy (Dual-Layer)

Two types of content have completely different update profiles. Treating them the same is the most common edtech architecture mistake.

### Layer 1 — Quranic Corpus → PostgreSQL (write-once, never changes)
- Arabic text, morphology, verse translations — seeded once from `libs/quran-data/` JSON files
- These JSON files in git are the **canonical source of truth** (human-readable, version-controlled)
- Must be in Postgres because exercises do relational queries: *"all verses containing root ك-ت-ب"*
- Data sources: **Tanzil.net** (Uthmani text), **Quranic Arabic Corpus** (morphology CSV), **quran.com v4 API** (audio URLs)

### Layer 2 — Curriculum (Lesson JSON) → Git + CDN (updated frequently)
- Lesson/exercise JSON lives in `libs/content/curriculum/level-{n}/unit-{n}/lesson-{n}.json`
- A build step (`nx run content:publish`) bundles and uploads to **Cloudflare R2** (zero egress fee, S3-compatible) on deploy
- Postgres stores only a lightweight `content_versions` manifest: `{ version_hash, cdn_url, published_at, is_active }`
- Clients fetch the manifest on app launch, compare hashes, download only changed bundles — no full re-deploy needed for content fixes
- **Future**: When a non-developer content editor is needed, a simple admin UI commits to git and triggers the publish pipeline. No CMS vendor lock-in yet.

### Audio
- Reference audio by abstract URI in content JSON: `audio://quran/{reciter}/{surah}/{ayah}` — never raw URLs
- API proxy endpoint resolves URIs to actual CDN URLs: `GET /api/v1/audio/:reciter/:surah/:ayah`
- For MVP1: proxy to **quran.com/api/alquran.cloud** (free, no key)
- For future: swap to self-hosted Cloudflare R2 audio by changing only the proxy endpoint

---

## Database Schema (Prisma)

> **Conventions throughout:** `uuid` PKs everywhere, `timestamptz` (never `timestamp` — avoids timezone bugs for global users), `deleted_at` soft-delete on all user-data tables, `created_at` + `updated_at` on every table with auto-trigger on `updated_at`.

### Corpus Tables (seeded once from `libs/quran-data/`)
```prisma
model QuranSurah {
  id          String      @id @default(uuid())
  number      Int         @unique
  nameArabic  String
  nameEnglish String
  verses      QuranVerse[]
}

model QuranVerse {
  id            String       @id @default(uuid())
  surah         QuranSurah   @relation(fields: [surahId], references: [id])
  surahId       String
  ayahNumber    Int
  arabicText    String       // Uthmani script
  translation   String       // English (Sahih International default)
  verseWords    VerseWord[]
  @@unique([surahId, ayahNumber])
}

model Root {
  id              String   @id @default(uuid())
  arabic          String   @unique   // "ر ح م"
  transliteration String
  primaryMeaning  String
  words           Word[]
}

model Word {
  id              String       @id @default(uuid())
  root            Root?        @relation(fields: [rootId], references: [id])
  rootId          String?
  arabic          String
  transliteration String
  meaning         String
  wordType        WordType     // ISM | FIL | HARF
  gender          Gender?      // MASCULINE | FEMININE
  number          WordNumber?  // SINGULAR | DUAL | PLURAL
  grammaticalCase GramCase?    // MARFU | MANSOOB | MAJROOR
  frequencyRank   Int?
  verseWords      VerseWord[]
  reviews         UserWordReview[]
  deletedAt       DateTime?
}

model VerseWord {
  id              String     @id @default(uuid())
  verse           QuranVerse @relation(fields: [verseId], references: [id])
  verseId         String
  word            Word       @relation(fields: [wordId], references: [id])
  wordId          String
  position        Int
  grammaticalRole String
}
```

### Curriculum Tables
```prisma
model ContentVersion {
  id          String   @id @default(uuid())
  versionHash String   @unique
  cdnUrl      String
  publishedAt DateTime @default(now())
  isActive    Boolean  @default(false)
}

model Level {
  id          String  @id @default(uuid())
  number      Int     @unique
  title       String  // "The Building Blocks (Ism)"
  description String
  units       Unit[]
}

model Unit {
  id       String   @id @default(uuid())
  level    Level    @relation(fields: [levelId], references: [id])
  levelId  String
  number   Int
  title    String
  lessons  Lesson[]
}

model Lesson {
  id            String              @id @default(uuid())
  unit          Unit                @relation(fields: [unitId], references: [id])
  unitId        String
  number        Int
  title         String
  xpReward      Int                 @default(10)
  contentHash   String              // links to CDN bundle version
  exercises     Json                // exercise definitions array
  version       Int                 @default(1)  // bump on breaking content changes
  isPublished   Boolean             @default(false)
  progress      UserLessonProgress[]
  deletedAt     DateTime?
}
```

### User Tables
```prisma
// app_users mirrors Clerk — clerk_id is the foreign key anchor for all user data
model AppUser {
  id                     String               @id @default(uuid())
  clerkId                String               @unique  // "user_2abc..."
  timezone               String               @default("UTC")  // for streak date calc
  onboardingCompletedAt  DateTime?
  lastActiveAt           DateTime?
  createdAt              DateTime             @default(now())
  updatedAt              DateTime             @updatedAt
  deletedAt              DateTime?
  streak                 UserStreak?
  lessonProgress         UserLessonProgress[]
  badges                 UserBadge[]
  wordReviews            UserWordReview[]
  reviewSessions         ReviewSession[]
  pushTokens             UserPushToken[]
}
```

### Gamification Tables
```prisma
model UserStreak {
  id                String   @id @default(uuid())
  user              AppUser  @relation(fields: [userId], references: [id])
  userId            String   @unique
  currentStreak     Int      @default(0)
  longestStreak     Int      @default(0)
  totalXp           Int      @default(0)
  lastActivityDate  DateTime?  // DATE in user's timezone — not timestamptz
  updatedAt         DateTime @updatedAt
}

model UserLessonProgress {
  id                String    @id @default(uuid())
  user              AppUser   @relation(fields: [userId], references: [id])
  userId            String
  lesson            Lesson    @relation(fields: [lessonId], references: [id])
  lessonId          String
  status            ProgressStatus  // NOT_STARTED | IN_PROGRESS | COMPLETED
  xpEarned          Int       @default(0)
  attemptsTotal     Int       @default(0)   // total answer attempts
  firstAttemptScore Int?                    // % correct on first try (analytics)
  timeSpentMs       BigInt    @default(0)   // cumulative time — NEVER skip this field
  lessonVersion     Int       @default(1)   // which content version was completed
  firstStartedAt    DateTime?
  lastAttemptedAt   DateTime?
  completedAt       DateTime?
  deletedAt         DateTime?
  @@unique([userId, lessonId])
}

model Badge {
  id          String      @id @default(uuid())
  name        String      @unique
  description String
  iconSlug    String
  condition   Json        // { type: "streak", threshold: 7 }
  userBadges  UserBadge[]
}

model UserBadge {
  user      AppUser  @relation(fields: [userId], references: [id])
  userId    String
  badge     Badge    @relation(fields: [badgeId], references: [id])
  badgeId   String
  earnedAt  DateTime @default(now())
  @@id([userId, badgeId])
}
```

### SRS Tables (SM-2 — designed in full from day one)
```prisma
// One row per user per item being learned (word, root, verse fragment)
model UserWordReview {
  id               String    @id @default(uuid())
  user             AppUser   @relation(fields: [userId], references: [id])
  userId           String
  word             Word      @relation(fields: [wordId], references: [id])
  wordId           String
  itemType         String    // "word" | "root" | "verse_fragment"
  easinessFactor   Decimal   @default(2.5) // SM-2 EF, floor 1.3
  intervalDays     Int       @default(1)
  repetitions      Int       @default(0)
  nextReviewAt     DateTime
  lastReviewedAt   DateTime?
  lastQuality      Int?      // 0-5
  totalReviews     Int       @default(0)
  totalCorrect     Int       @default(0)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  reviewLogs       ReviewLog[]
  @@unique([userId, wordId])
}

// Every individual review event — NEVER delete, this is your analytics gold
model ReviewLog {
  id              String         @id @default(uuid())
  review          UserWordReview @relation(fields: [reviewId], references: [id])
  reviewId        String
  userId          String
  quality         Int            // 0-5
  responseTimeMs  Int?           // how long user took — feeds future FSRS upgrade
  intervalBefore  Int
  intervalAfter   Int
  efBefore        Decimal
  efAfter         Decimal
  lessonId        String?        // which lesson triggered this
  sessionId       String?
  reviewedAt      DateTime       @default(now())
}

model ReviewSession {
  id              String    @id @default(uuid())
  user            AppUser   @relation(fields: [userId], references: [id])
  userId          String
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  itemsReviewed   Int       @default(0)
  itemsCorrect    Int       @default(0)
}
```

### Infrastructure Tables
```prisma
model FeatureFlag {
  key         String   @id
  value       Json
  description String
  enabledFor  String[] // user IDs for targeted rollout
  rolloutPct  Int      @default(100)
  createdAt   DateTime @default(now())
}

model UserPushToken {
  id          String   @id @default(uuid())
  user        AppUser  @relation(fields: [userId], references: [id])
  userId      String
  token       String   @unique  // Expo push token
  platform    String   // "ios" | "android" | "web"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?
}

model ContentFeedback {
  id           String   @id @default(uuid())
  userId       String?
  itemType     String   // "exercise" | "translation" | "word"
  itemId       String
  feedbackType String   // "error" | "confusing" | "suggestion"
  body         String
  status       String   @default("open")
  createdAt    DateTime @default(now())
}
```

---

## Exercise Engine (State Machine)

Driven by **XState v5** in `libs/srs/src/lessonMachine.ts` — shared between web and mobile.

### 5 Exercise Types (defined in `libs/api-types/`)
```ts
type ExerciseDefinition =
  | WordTranslationExercise   // Show Arabic word → pick correct meaning (4 choices)
  | GrammarRoleExercise       // Identify: is this ism/fi'l/harf? What case?
  | FillBlankExercise         // Ayah with one word blanked → pick correct word
  | RootRecognitionExercise   // Given a word → identify its 3-letter root
  | WordReorderExercise       // @dnd-kit: drag Arabic words into correct order
```

### Machine States (No Failure — Unlimited Tries)
```
idle → loading → presenting_exercise →
  answered_correct → record_review(quality=5) → show_feedback(correct) → next | complete
  answered_wrong   → record_review(quality=1) → show_feedback(wrong + explanation) → retry
→ completed → award_xp → check_badges → update_streak
```

- Wrong answer: soft amber card, correct answer shown + 1-line grammar explanation, "Got it →" button
- XP: first-attempt correct = 10 XP; retry correct = 5 XP. Never 0. Always positive.
- Every answer (right or wrong) feeds the SRS `ReviewLog` — even MVP1 exercise answers

### Shared Answer Validation (`libs/srs/src/validate.ts`)
```ts
validateAnswer(exercise: ExerciseDefinition, answer: unknown): ValidationResult
// Used identically on web, mobile, and API (server-side verification)
```

---

## Design System & Theme

**Philosophy:** Calm, clean, approachable — a modern Islamic study companion, not an exam.

### Color Palette
| Role | Tailwind |
|---|---|
| Page background | `bg-white` |
| Card / panel | `bg-stone-50` / `bg-slate-50` |
| Nav / sidebar | `bg-stone-100` |
| Primary accent | `bg-teal-600` / `text-teal-700` |
| Secondary accent | `bg-amber-400` / `text-amber-600` |
| Correct feedback | `bg-green-50 border-green-300` |
| Wrong feedback | `bg-amber-50 border-amber-300` (never red) |
| Arabic text | `text-slate-800` (large, `text-2xl+`) |
| Body text | `text-slate-600` |
| Borders | `border-slate-200` |

### Typography
- **Arabic:** Amiri or Noto Naskh Arabic (Google Fonts), always `dir="rtl"`, large sizing
- **English UI:** Inter — clean and readable
- Arabic text blocks always wrapped in `<span dir="rtl" lang="ar">` — never mixed with LTR text

---

## API Design

### Versioning (from day one — non-negotiable)
- All routes prefixed `/api/v1/` — adding v2 is trivial; removing v1 while mobile users are on old app versions is painful
- Mobile app sends `X-App-Version` header on every request — logged server-side to know when it's safe to retire v1
- Consistent response envelope on every endpoint:
  ```ts
  { data: T, meta: { version: "1.0", requestId: string }, error: null }
  { data: null, meta: {...}, error: { code: string, message: string } }
  ```
- All list endpoints support pagination from day one: `?limit=20&cursor=<uuid>` — adding pagination later is a breaking change

### Routes
```
// Auth (Clerk webhooks handle user creation)
POST /api/v1/auth/webhook          → Clerk user.created → insert AppUser

// Curriculum
GET  /api/v1/levels                → All levels + units + lock status
GET  /api/v1/units/:id/lessons     → Lessons in unit (paginated)
GET  /api/v1/lessons/:id           → Full lesson with exercises JSON
POST /api/v1/lessons/:id/complete  → Award XP, update streak, check badges

// Quran corpus
GET  /api/v1/words/:id             → Word detail + root siblings (for Drawer)
GET  /api/v1/roots/:id             → Root + full word family tree
GET  /api/v1/verses/:surah/:ayah   → Verse with word-by-word breakdown

// Audio proxy (abstracts audio source — swap CDN without touching clients)
GET  /api/v1/audio/:reciter/:surah/:ayah → redirect to CDN URL

// User
GET  /api/v1/users/me/stats        → XP, streak, badge count
GET  /api/v1/users/me/progress     → Completed lessons map
GET  /api/v1/users/me/badges       → Earned badges
GET  /api/v1/users/me/word-bank    → Learned words (paginated, sortable)

// SRS Reviews
GET  /api/v1/reviews/queue         → Today's due review items (cached in Redis)
POST /api/v1/reviews/submit        → Submit batch review results

// Mobile sync (MVP2)
POST /api/v1/sync/reviews          → Idempotent batch upload (offline mobile)
GET  /api/v1/sync/state?since=<ts> → Delta sync for mobile catch-up

// Feedback
POST /api/v1/feedback              → Content error report
```

### Redis Caching (Upstash — serverless, free tier)
| Key | TTL | Purpose |
|---|---|---|
| `user:{id}:review_queue` | 1hr | SRS due items — expensive query cached |
| `rate_limit:{id}:{endpoint}` | 1min | Sliding window rate limiter |
| `user:{id}:streak` | 24hr | Streak data for header display |
| `feature_flags` | 5min | Feature flag values |

---

## Frontend Structure

```
apps/web/src/
├── pages/
│   ├── Home.tsx          # Landing + sign-in (Clerk)
│   ├── Dashboard.tsx     # Level map, XP bar, streak
│   ├── Lesson.tsx        # Exercise runner (XState)
│   ├── Review.tsx        # Daily SRS review session
│   └── WordBank.tsx      # All learned words + root trees
├── components/
│   ├── LevelMap/         # Duolingo-style node path
│   ├── ExerciseCard/
│   │   ├── WordTranslation.tsx
│   │   ├── GrammarRole.tsx
│   │   ├── FillBlank.tsx
│   │   ├── RootRecognition.tsx
│   │   └── WordReorder.tsx     # @dnd-kit/sortable
│   ├── FeedbackBanner.tsx      # Correct (green) / Wrong (amber) overlay
│   ├── WordDrawer.tsx          # Slide-up root tree deep-dive
│   ├── ProgressBar.tsx         # Lesson progress (top of lesson page)
│   ├── XpBar.tsx               # Global XP progress in header
│   ├── StreakBadge.tsx          # Flame icon + count
│   └── BadgeCard.tsx           # Achievement display
├── hooks/
│   ├── useLessonMachine.ts     # XState wrapper (from libs/srs)
│   ├── useReviewQueue.ts
│   └── useUserStats.ts
└── lib/
    └── api.ts                  # Typed fetch wrappers (uses libs/api-types)
```

---

## NX Libs Detail

| Library | Contents | Used by |
|---|---|---|
| `libs/api-types` | TS interfaces for every API req/res; exercise type definitions; response envelope type | web, mobile, api |
| `libs/db` | Prisma client export; generated Prisma types | api only |
| `libs/srs` | SM-2 algorithm (`calculateNextReview`), `validateAnswer`, XState lesson machine | web, mobile, api |
| `libs/quran-data` | JSON seed files: surahs, verses, words, roots, morphology | api (seed scripts only) |
| `libs/content` | Curriculum lesson JSON files, organized by level/unit/lesson | api (seed + publish pipeline) |

**Key insight:** `libs/srs` has zero dependencies and is pure TypeScript. This means the mobile app can run SRS calculations fully offline without hitting the API — just sync the results when connectivity returns.

---

## Curriculum — 6 Levels
| Level | Title | Focus |
|---|---|---|
| 1 | The Building Blocks (Ism) | 4 noun properties, definiteness, gender, number, Idhafah |
| 2 | The Engine (Fi'l) | Past/present conjugation, suffix/prefix tables, attached pronouns |
| 3 | The Connectors (Harf) | Prepositions, negation particles, emphasis |
| 4 | The Root System (Sarf) | The 10 verb families (أوزان), morphological pattern recognition |
| 5 | Sentence Anatomy (Nahw) | Nominal vs verbal sentences, word-order rules, I'rab |
| 6 | Contextual Reading | Full passage comprehension, rhetorical beauty (Balagha) |

---

## MVP1 Build Phases

### Phase 1 — NX Monorepo Scaffold ✅ COMPLETED
1. `npx create-nx-workspace` with npm
2. `nx generate @nx/react:app web` + `nx generate @nx/node:app api`
3. `nx generate @nx/js:lib` for `api-types`, `srs`, `db`, `quran-data`, `content`
4. Tailwind + shadcn/ui in `apps/web`
5. Prisma in `apps/api`, Clerk SDK in both web and api
6. Shared `tsconfig.base.json`

> **Implemented:** NX workspace initialized with `apps/web` (React + Vite) and `apps/api` (Node.js + Express). All five libraries scaffolded: `api-types`, `db`, `srs`, `quran-data`, `content`. Tailwind CSS and shadcn/ui wired into `apps/web`. Shared `tsconfig.base.json` in place.

### Phase 2 — Database & Seeding ✅ COMPLETED
1. Write full Prisma schema (all tables above)
2. `prisma migrate dev` against neondb.
3. Seed scripts:
   - `libs/quran-data` → `QuranSurah`, `QuranVerse`, `Root`, `Word`, `VerseWord`
   - `libs/content` level-1 JSON → `Level`, `Unit`, `Lesson`
   - 10 starter `Badge` definitions
4. Author 15–20 Level 1 lesson JSON files
5. `prisma studio` to verify data integrity

> **Implemented:** Full Prisma schema written covering all corpus, curriculum, user, gamification, SRS, and infrastructure tables. Initial migration applied (`20260404084931_init`). Seed script at `apps/api/src/scripts/seed.ts` covering roots, words, and badge definitions. 15 Level 1 lesson JSON files authored across 5 units in `libs/content/src/curriculum/level-1/`. Badge definitions seeded from `libs/quran-data/src/data/badges.json`.

### Phase 3 — Backend API ✅ COMPLETED
1. Clerk webhook handler → `AppUser` creation
2. Auth middleware (Clerk JWT verification)
3. Redis setup (Upstash) + rate limiter middleware
4. All `/api/v1/` routes with typed req/res (using `libs/api-types`)
5. Badge award service (runs post-lesson completion)
6. Streak update service (uses user timezone for date calculation)
7. Audio proxy endpoint

> **Implemented:** Clerk webhook handler in `apps/api/src/routes/v1/auth.ts`. Auth middleware (`requireAuth.ts`) and global error handler (`errorHandler.ts`) in `apps/api/src/middleware/`. Redis client configured in `apps/api/src/lib/redis.ts` (Upstash). All seven route modules live in `apps/api/src/routes/v1/`: `auth`, `curriculum`, `corpus`, `reviews`, `users`, `audio`, `feedback`. Badge award logic in `apps/api/src/services/badgeService.ts`; timezone-aware streak updates in `streakService.ts`.

### Phase 4 — Web UI (Level 1 playable)
1. Clerk sign-in/sign-up on `Home.tsx`
2. `Dashboard.tsx` — level map with lock/unlock/complete node states
3. `Lesson.tsx` — XState machine runner + `FeedbackBanner`
4. All 5 exercise components (including DND-kit `WordReorder`)
5. `WordDrawer.tsx` — root tree visualization
6. `XpBar` + `StreakBadge` in global header
7. `BadgeCard` + lesson complete celebration screen

### Phase 5 — Gamification + Word Bank
1. Streak tracking (timezone-aware, stored as `DATE` not `TIMESTAMP`)
2. XP accumulation with level thresholds
3. Badge award triggers (streak milestones, words learned, lessons complete)
4. `WordBank.tsx` — all learned words, filterable by root/type/mastery
5. Daily review queue page (`Review.tsx`) — wired to SRS, but basic for MVP1

---

## MVP1 Scope Boundaries

**In scope:**
- Full Level 1 (Ism) — all lessons playable end-to-end
- All 5 exercise types
- Auth via Clerk (email/password + Google OAuth)
- Streaks + XP + Badges (positive-only, no failure)
- Word Drawer with root tree
- Daily Review page (SM-2 queue, basic UI)
- Content feedback button on every exercise
- Responsive web (desktop + mobile browser)

**Deferred to MVP2 (Android):**
- React Native app (schema and libs already support it)
- Push notifications (`UserPushToken` table ready)
- Offline mode (WatermelonDB + pre-bundled corpus SQLite)
- Audio pronunciation (proxy endpoint already built, just wire UI)
- Admin content editor UI

---

## Infrastructure & Hosting

**Recommendation: Modern managed platforms — not AWS.** AWS DevOps overhead (ECS, RDS, IAM, VPCs) is a solo developer tax. These platforms match AWS capability with near-zero ops work and migrate cleanly to AWS later.

| Service | Platform | Free Tier Limit | Paid |
|---|---|---|---|
| Frontend (React SPA) | **Vercel** | 100GB bandwidth/mo, unlimited deploys | $20/mo Pro |
| API (Node.js) | **Railway** | 500 hrs/mo free, then auto-sleep | $5/mo Starter |
| PostgreSQL | **Neon** | 0.5GB storage, serverless scale-to-zero | $19/mo Pro (10GB) |
| Redis | **Upstash** | 10k commands/day, 256MB | $10/mo Pay-per-use |
| CDN / Content bundles | **Cloudflare R2** | 10GB storage, **zero egress fees** | $0.015/GB after 10GB |
| Auth | **Clerk** | 10,000 MAU free | $25/mo Pro |
| Android builds | **Expo EAS** | Free for personal | $29/mo Production |
| Domain + DNS + SSL | **Cloudflare** | Free DNS, free SSL | ~$12/year domain |

### Estimated Monthly Cost by Stage
| Stage | MAU | Cost |
|---|---|---|
| Development / testing | 0–50 | **~$0/month** |
| Early launch | 50–500 | **~$5–15/month** (Railway starter) |
| Growth | 500–5k | **~$30–60/month** (Neon Pro + Railway Pro) |
| Scale | 5k–50k | **~$150–300/month** → migrate to AWS/GCP at this point |

**Quran corpus data size:** ~77k words + 6.2k verses + morphology ≈ **~30MB** in PostgreSQL. Well within Neon's free 0.5GB tier for all of MVP1.

**Migrate to AWS when:** 1,000+ MAU + need SLAs, multi-region, or enterprise compliance. Architecture is designed for this — no platform-specific APIs baked in.

---

## Verification Plan
1. `nx run-many --target=serve --projects=web,api` → web :5173, api :3001
2. Clerk sign-in → `AppUser` created via webhook → verify in `prisma studio`
3. Complete Lesson 1 → XP increments, streak sets, `UserLessonProgress` created
4. Wrong answer → amber feedback shown, explanation displayed, retry works
5. Complete all Level 1 lessons → Level 2 unlocks on dashboard
6. Earn first badge → appears on profile
7. Open Word Drawer → root tree loads sibling words
8. DND-kit reorder → drag validates correct/incorrect
9. `GET /api/v1/reviews/queue` → returns SRS items seeded by lesson completions
10. Simulate next-day login → streak increments by 1

---

## Architectural Decisions Log
| Decision | Choice | Reason |
|---|---|---|
| Monorepo | NX | Code gen, affected builds, official plugins for all 3 app types |
| Auth | Clerk | JWT + refresh + OAuth + Expo SDK |
| Content storage | Dual-layer (corpus in PG, curriculum in CDN) | Corpus needs relational queries; curriculum needs fast iteration without deploys |
| SRS algorithm | SM-2 (upgradeable to FSRS) | Proven, pure-TS implementation shared between mobile offline + API |
| API versioning | `/api/v1/` URL prefix + response envelope | Most compatible for web+mobile with different release cycles |
| Caching | Redis (Upstash) | Review queue + rate limiting; avoid re-scanning full SRS table per request |
| No i18n | English + Arabic only | User base is English-speaking; no other language needed |
| No hearts/lives | Unlimited attempts | Goal is learning, not testing; wrong → explanation → retry |
| Theme | Light only (white + stone-50 + teal + amber) | Calm, approachable study companion feel |
| Audio | Abstract URI + API proxy | Swap CDN source without touching any client code |
| Soft deletes | `deleted_at` on all user tables | Never lose user progress; support data restore requests |
| Timezone | Store as `DATE` in user's TZ for streak; `timestamptz` everywhere else | Prevents streak bugs across timezones |
| Infra | Vercel + Railway + Neon + Upstash + Cloudflare R2 | ~$0/month for MVP1; migrate to AWS at 1k+ MAU |


