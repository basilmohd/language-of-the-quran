# Curriculum Restructuring Plan

## Context

Based on a comparison with the Bayyinah Dream NAHW curriculum, the current 6-level structure needs four changes:
1. **Swap Levels 2 and 3** — Harf (particles/connectors) before Fi'l (verbs), matching Bayyinah's sequencing where الجار والمجرور is introduced before verbs
2. **Expand Level 1** — add demonstratives, adjective agreement, connector letters, and simple nominal sentence structure
3. **Split Level 5 (Nahw)** — pull simple sentence structures down into Levels 1–3; keep complex Nahw in Level 5
4. **Add missing sub-units** — passive voice and كان & sisters in Level 3; compound اسم in Level 5

The only file being changed is `curriculum.json`. No lesson content JSON files exist yet for Levels 2–6, so there's nothing to migrate. Level 1 lesson files are unchanged.

---

## New Level Architecture

| # | Title | Key Change |
|---|-------|------------|
| 1 | The Building Blocks (Ism) | +3 new units: adjective/demonstratives, connector letters, simple nominal sentences |
| 2 | The Connectors (Harf) | **Was Level 3** — prepositions, negation, accusative particles |
| 3 | The Engine (Fi'l) | **Was Level 2** — verbs + passive voice + كان & sisters (new sub-units) |
| 4 | The Root System (Sarf) | Unchanged |
| 5 | Sentence Anatomy (Nahw) — Complex | Simple concepts removed; only abnormal structures, full I'rab, compound اسم |
| 6 | Contextual Reading | Unchanged |

---

## Level 1 — The Building Blocks (Ism)
**Existing 5 units remain unchanged.**

Add 3 new units:

### Unit 1-6: Describing with Ism (~3 lessons)
- Lesson 1: Adjective-Noun Agreement (الموصوف والصفة) — matching gender, number, definiteness
- Lesson 2: Demonstrative Pronouns (اسم الإشارة) — هذا، هذه، ذلك، تلك، هؤلاء، أولئك
- Lesson 3: Pointing in the Quran — Quranic examples with demonstratives

### Unit 1-7: Connector Letters (حروف العطف) (~2 lessons)
- Lesson 1: و، ف، ثم، أو — meanings and usage
- Lesson 2: Reading Connector Chains in Ayahs

### Unit 1-8: Your First Sentences ← simple Nahw split (~3 lessons)
- Lesson 1: The Nominal Sentence — subject (مبتدأ) + predicate (خبر), invisible "IS"
- Lesson 2: "HE HAS" and "THERE IS" — عند and لـ constructions
- Lesson 3: Level 1 Review (replaces old unit-1-5 lesson-3)

*(Move "Level 1 Review" lesson from unit-1-5 to unit-1-8)*

**Updated Level 1 total: 8 units, ~23 lessons**

---

## Level 2 — The Connectors (Harf)
**Was Level 3. New level number, same content scope, expanded with accusative particles.**

### Unit 2-1: Prepositions (~3 lessons)
- Lesson 1: The Preposition Family — في، على، من، إلى، عن
- Lesson 2: ب، ل، ك — the attached prepositions
- Lesson 3: الجار والمجرور in Quranic Context

### Unit 2-2: Negation (~3 lessons)
- Lesson 1: Negating with لا and ما
- Lesson 2: Negating with لم and لن (past/future)
- Lesson 3: Negation in Al-Fatiha and Short Surahs

### Unit 2-3: Accusative Particles — حرف النصب (~3 lessons)
- Lesson 1: إنَّ and أنَّ — emphasis and embedded clauses
- Lesson 2: كأنَّ، لكنَّ، ليت، لعلَّ — analogy, exception, wish, hope
- Lesson 3: Reading Accusative Particles in Ayahs

### Unit 2-4: Emphasis & Review (~2 lessons)
- Lesson 1: Emphasis Particles — إنَّ at the start of a sentence
- Lesson 2: Level 2 Review

**Level 2 total: 4 units, ~11 lessons**

---

## Level 3 — The Engine (Fi'l)
**Was Level 2. Expanded with passive voice and كان & sisters as new sub-units.**

### Unit 3-1: Past Tense Verb (الفعل الماضي) (~3 lessons)
- Lesson 1: Introducing the Past Tense — root + conjugation table
- Lesson 2: The Doer (الفاعل) — subject of a verb
- Lesson 3: The Object (المفعول به) — transitive verbs

### Unit 3-2: Present Tense Verb (الفعل المضارع) (~3 lessons)
- Lesson 1: Present/Future conjugation table
- Lesson 2: الفعل المضارع with حروف — attached particles (لـ، أن، لن)
- Lesson 3: نون التوكيد — emphatic nun

### Unit 3-3: Commands & Prohibition (~2 lessons)
- Lesson 1: The Command (الأمر) — formation and examples
- Lesson 2: Prohibition (النهي) — لا + مضارع

### Unit 3-4: Passive Voice — الفعل المبني للمجهول (new sub-unit) (~3 lessons)
- Lesson 1: Passive Voice Introduction — what and why
- Lesson 2: Passive Sentence Structure — نائب الفاعل
- Lesson 3: Rhetorical Use of Passive in the Quran

### Unit 3-5: كان and Sisters — الأفعال الناقصة (new sub-unit) (~3 lessons)
- Lesson 1: كان — "was" — sentence structure (اسم كان + خبر كان)
- Lesson 2: Sisters of كان — أصبح، أمسى، صار، ليس
- Lesson 3: Negating and Translating كان Sentences

### Unit 3-6: Verbal Sentences Come Alive ← simple Nahw split (~2 lessons)
- Lesson 1: الجملة الفعلية — full verbal sentence labeling (فعل + فاعل + مفعول)
- Lesson 2: Level 3 Review

**Level 3 total: 6 units, ~16 lessons**

---

## Level 4 — The Root System (Sarf)
**Unchanged.** Morphological patterns (أوزان), root recognition, vocabulary multiplication.

---

## Level 5 — Sentence Anatomy (Nahw) — Complex Only
**Simple sentence intros removed (moved to L1 and L3). This level now handles advanced structure.**

### Unit 5-1: Abnormal Sentence Structures (~3 lessons)
- Lesson 1: Fronted Predicate (خبر مقدم + مبتدأ مؤخر)
- Lesson 2: Fronted Object — verb-first inversions
- Lesson 3: Distinguishing أسماء from أفعال in ambiguous positions

### Unit 5-2: Full I'rab Labeling (~3 lessons)
- Lesson 1: إعراب الجملة الاسمية — labeling nominal sentences end-to-end
- Lesson 2: إعراب الجملة الفعلية — labeling verbal sentences end-to-end
- Lesson 3: Parsing Full Ayahs (i'rab drill on Quranic text)

### Unit 5-3: Compound اسم (new sub-unit) (~3 lessons)
- Lesson 1: أنْ (light) — forms a verbal noun, used after verbs of wanting/hoping
- Lesson 2: أنَّ (heavy) — embedded nominal sentence
- Lesson 3: Other tools creating compound مضاف إليه

### Unit 5-4: Complex Sentences (~3 lessons)
- Lesson 1: Relative Clauses (الجملة الوصفية)
- Lesson 2: Conditional Sentences — إنْ، إذا، لو
- Lesson 3: Level 5 Review

**Level 5 total: 4 units, ~12 lessons**

---

## Level 6 — Contextual Reading
**Unchanged.** Full passage comprehension, short surahs, rhetorical analysis.

---

## Critical File

**File to modify:** `libs/quran-data/src/data/curriculum.json`

Changes:
- Level 1: add units 1-6, 1-7, 1-8; move "Level 1 Review" lesson into unit-1-8
- Level 2: repopulate with Harf units (was empty `"units": []`)
- Level 3: repopulate with Fi'l units including passive + كان sub-units (was empty)
- Level 4: unchanged
- Level 5: repopulate with complex-only Nahw units (was empty)
- Level 6: unchanged
- Update `id`, `number`, `title`, `description` fields for L2 and L3 (swapped)

**No lesson JSON files under `libs/content/` need to change** — only Level 1 lessons exist there, and those units are untouched.

---

## Updated Curriculum Totals

| Level | Units | Approx Lessons | Focus |
|-------|-------|----------------|-------|
| 1 | 8 | ~23 | Nouns + first sentences |
| 2 | 4 | ~11 | Particles + negation |
| 3 | 6 | ~16 | Verbs + passive + كان |
| 4 | 4 | ~12 | Root patterns |
| 5 | 4 | ~12 | Complex sentence anatomy |
| 6 | 4 | ~12 | Full passage reading |
| **Total** | **30** | **~86** | |

---

## Verification

After editing `curriculum.json`:
1. Run `nx serve web` and open the course map — confirm 6 levels display with correct titles and unit counts
2. Confirm Level 1 shows 8 units (existing 5 + 3 new)
3. Confirm Level 2 title is "The Connectors (Harf)" and Level 3 is "The Engine (Fi'l)"
4. Confirm Level 1 lesson files still load (IDs unchanged — `l1-u1-l1` through `l1-u5-l3`)
5. Run `nx test web` and `nx test api` — no test regressions
