# Updated Curriculum Plan — World-Based Design (Best of Both)

## Context

Two parallel curriculum designs existed and were merged:
- **`Content/` folder** (world-1.json, world-2.json, lesson-*.json): Narrative-driven design with hooks, detective framing, unlock chains, badges, taglines, and full rich lesson content.
- **`libs/quran-data/src/data/curriculum.json`**: Granular, technically complete syllabus with fine-grained topic coverage, contentHash pointers for CDN delivery, and deeper per-topic lesson counts.

Neither was complete alone. This plan documents the merged "best of both" design that was implemented.

---

## Key Design Decisions

1. **"Worlds" wins over "Levels"** — internal DB/API key stays `levels` (no schema migration needed), but display terminology is "World N". Content/ folder uses `levelId` pointer.
2. **World 1 is the new first world** — a meta-orientation (Ism/Fi'l/Harf + root system + detective mindset) before any grammar. This was in Content/ but missing from curriculum.json.
3. **Grammatical Case moved into World 2** — it's foundational for reading Quranic nouns; the old plan deferred it to Level 5 (Nahw) which created a comprehension gap.
4. **Pronouns kept in World 2** — detached and attached pronouns are Ism-adjacent; Content was right to group them here.
5. **Relative pronouns moved from Nahw to World 2** — they are high-frequency in Al-Fatiha and short surahs; delay creates a comprehension gap.
6. **Deep coverage wins** — 2–3 lessons per topic (curriculum approach) over 1 lesson per topic (Content approach), while keeping Content's narrative richness in each lesson.
7. **ContentHash pattern preserved** — all lessons keep contentHash for CDN delivery via Cloudflare R2.
8. **`isPublished` tied to content map** — only lessons with actual content files in `libs/content/` are published; replaces the fragile `startsWith('l1-')` prefix hack.

---

## What Was Missing From Each Design

### In Content/ but MISSING from curriculum.json (before merge):
- World 1 meta-orientation (Ism/Fi'l/Harf overview, root system, detective mindset)
- `estimatedMinutes` on lessons
- Detached & attached pronouns as Ism sub-topics
- Relative pronouns (الذي/التي) under Ism
- Named badge/milestone rewards
- `xpLevels` progression titles

### In curriculum.json but MISSING from Content/ (before merge):
- Grammatical Case (I'rab — 3 case endings) — 3 dedicated lessons (critical!)
- Connector letters (و، ف، ثم، أو) as a unit
- Sarf — morphological verb patterns (World 5)
- Full Nahw — sentence anatomy, i'rab labeling, conditional sentences (World 6)
- ContentHash pointer for CDN delivery
- Emphasis particles & level review lessons
- Deeper per-topic coverage (2–3 lessons instead of 1)

---

## Lesson ID Scheme

| Old ID (pre-merge) | New ID | Reason |
|---|---|---|
| `l1-u1-l1` … `l1-u8-l3` | `l2-u1-l1` … `l2-u14-l1` | Old Level 1 (Ism) → now World 2 |
| `l2-u1-l1` … `l2-u4-l2` | `l3-u1-l1` … `l3-u4-l2` | Old Level 2 (Harf) → World 3 |
| `l3-u1-l1` … `l3-u6-l2` | `l4-u1-l1` … `l4-u6-l2` | Old Level 3 (Fi'l) → World 4 |
| `l5-u1-l1` … `l5-u4-l3` | `l6-u1-l1` … `l6-u4-l3` | Old Level 5 (Nahw) → World 6 |
| *(new)* `l1-u1-l1` … `l1-u1-l3` | — | World 1 Three Families (new) |

Content files at `libs/content/src/curriculum/level-1/` are **unchanged** — seed.ts now maps new `l2-u*` IDs to those same files.

---

## World Architecture

### World 1 — The Three Families (NEW)
**1 unit · 3 lessons · `level-1`**

| Unit | Lessons | Lesson IDs |
|------|---------|------------|
| The Map of Arabic | 3 | `l1-u1-l1` to `l1-u1-l3` |

Milestone: **"The Detective"** 🔍

### World 2 — The World of Ism (EXPANDED)
**14 units · 27 lessons · `level-2`**

| # | Unit | Lessons | Source |
|---|------|---------|--------|
| 1 | What is an Ism? | 3 | curriculum unit-1-1 |
| 2 | Definite & Indefinite | 3 | curriculum unit-1-3 |
| 3 | Masculine & Feminine | 2 | curriculum unit-1-2 (split) |
| 4 | Singular, Dual & Plural | 2 | curriculum unit-1-2 (split) |
| 5 | Grammatical Case ⬅ critical add | 3 | curriculum unit-1-4 |
| 6 | Idaafa — The Possessive Construction | 2 | curriculum unit-1-5 |
| 7 | Na't — Adjective-Noun Agreement | 2 | curriculum unit-1-6 + new |
| 8 | Mubtada & Khabar — The Verbless Sentence | 2 | curriculum unit-1-8 |
| 9 | Connector Letters | 2 | curriculum unit-1-7 |
| 10 | Pronouns — Detached ⬅ new to this world | 1 | Content unit-2-8 |
| 11 | Pronouns — Attached ⬅ new to this world | 1 | Content unit-2-9 |
| 12 | Ism Ishara — Demonstratives | 2 | curriculum unit-1-6 (split) |
| 13 | Ism Mawsool — Relative Pronouns ⬅ moved earlier | 1 | Content unit-2-11 |
| 14 | World 2 Review | 1 | curriculum unit-1-8-l3 |

Milestone: **"The Fatiha Key"** 🗝️ — can parse every word of Al-Fatiha

### World 3 — The Connectors (Harf)
**4 units · 11 lessons · `level-3`** (was level-2)

Prepositions, Negation, Accusative Particles, Emphasis & Review.

### World 4 — The Engine (Fi'l)
**6 units · 16 lessons · `level-4`** (was level-3)

Past Tense, Present Tense, Commands & Prohibition, Passive Voice, كان & Sisters, Verbal Sentences Review.

### World 5 — The Root System (Sarf)
**0 units · 0 lessons · `level-5`** (placeholder — to be designed)

### World 6 — Sentence Anatomy (Nahw)
**4 units · 12 lessons · `level-6`** (was level-5; old level-6 merged in)

Abnormal Structures, Full I'rab, Compound اسم, Complex Sentences + Review.

---

## Total Lessons

| World | Units | Lessons | Status |
|-------|-------|---------|--------|
| 1 — Three Families | 1 | 3 | Authored in Content/ (unpublished pending step format) |
| 2 — Ism | 14 | 27 | 14 published (content files exist), 13 unpublished |
| 3 — Harf | 4 | 11 | Unpublished |
| 4 — Fi'l | 6 | 16 | Unpublished |
| 5 — Sarf | 0 | 0 | To be designed |
| 6 — Nahw | 4 | 12 | Unpublished |
| **Total** | **29** | **69** | |

---

## Files Changed

| File | Change |
|------|--------|
| `libs/quran-data/src/data/curriculum.json` | Full restructure — 6 worlds, metadata fields, renumbered IDs |
| `apps/api/src/scripts/seed.ts` | Updated interfaces + content map to new IDs; fixed `unit-5/lesson-3.json` bug; `isPublished` now uses content map key presence |
| `Content/world-1.json` | Added `levelId` pointer, aligned `lessonId` fields |
| `Content/world-2.json` | Expanded 11 → 14 units, all lesson IDs aligned to `l2-u*` scheme |

---

## Schema Fields Added to curriculum.json

New fields added (all optional, not yet in Prisma schema — forward-looking):

**Level:**
```json
"tagline": "...", "icon": "🌱",
"milestone": { "badge": "...", "badgeIcon": "...", "message": "...", "unlocksLevel": "level-N" }
```

**Unit:**
```json
"tagline": "...", "xpBonus": 25, "badge": { "title": "...", "icon": "..." }, "unlockedBy": "unit-X"
```

**Lesson:**
```json
"type": "concept|grammar|application|vocabulary|review",
"estimatedMinutes": 12,
"unlockedBy": "l2-u1-l1"
```

---

## Verification

1. Run `node -e "const c = JSON.parse(require('fs').readFileSync('libs/quran-data/src/data/curriculum.json','utf-8')); let t=0; c.levels.forEach(l => { let n=0; l.units.forEach(u => n+=u.lessons.length); t+=n; console.log('Level',l.number,l.title,':',l.units.length,'units,',n,'lessons'); }); console.log('TOTAL:',t);"` — should show 69 total lessons
2. Confirm all 14 `lessonContentMap` entries in `seed.ts` point to existing files
3. Run `npm run seed` against a fresh local DB — all l2-u1 through l2-u6 lessons should be marked `isPublished: true`
4. Run `nx serve web` and confirm course map shows 6 worlds with correct unit counts
5. Run `nx test quran-data` — no regressions
