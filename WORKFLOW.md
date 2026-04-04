# User Journey & Learning Flow
*Source of truth for learner experience — update as curriculum evolves*

---

## User Journey: Login → First Lesson Complete

### 1. Landing Page (`/`)
**Screen:** Clean hero — app name, tagline ("Understand the Quran word by word"), Sign Up / Sign In buttons.
- Auth via Clerk → Google OAuth or email/password
- On first sign-in: Clerk webhook fires → `AppUser` row created in DB

### 2. Onboarding (first-time only — one-time modal, not a separate page)
**3 quick screens (swipeable):**
1. "We'll teach you Quranic Arabic — not just recitation, actual understanding."
2. "Every word you learn comes straight from the Quran, shown in real ayahs."
3. "No failing. Take your time. Every attempt earns XP."
- CTA: "Start Learning" → `onboardingCompletedAt` stamped on `AppUser`

### 3. Dashboard (`/dashboard`)
**What the learner sees:**
- Top bar: streak flame + XP bar + words learned count
- Level path: Level 1 — "The Building Blocks (Ism)" → Unit 1 → Lesson 1 glowing (unlocked). All else locked.
- Below level map: dual progress display — `47 words` + `~18% of Quran`
- "Continue" button pulses on the next available lesson

### 4. Lesson Intro Screen (`/lesson/:id` — before exercises start)
**One screen, not skippable on first visit:**
- Lesson title: "What is an Ism?"
- "In this lesson you will learn: [4 word chips shown — كِتَاب، رَبّ، نُور، رَحْمَة]"
- "Appears in the Quran [X] times" badge on each chip (builds anticipation)
- "Begin" button → transitions into exercise runner

### 5. Exercise Flow (XState machine drives this)
- Progress bar at top fills as exercises complete
- Each exercise has: question area + answer area + submit/check button
- Feedback banner: correct (green, auto-advances after 1.5s) / wrong (amber, shows correct answer + explanation, "Got it →" to continue)

### 6. Lesson Complete Screen
**Celebration screen (not a modal — full screen, brief):**
- "Lesson Complete! ✓" with animated XP burst: "+10 XP"
- Words learned summary: 4 word chips with their meanings
- If streak starts: "First day! Come back tomorrow to build your streak"
- If badge earned: badge card animates in with name
- "Continue" → back to Dashboard with next lesson now unlocked

---

## Screen-by-Screen Flow

```
/ (Landing)
  → [Sign Up/In via Clerk]
  → /dashboard (new user: onboarding modal first)
    → [Click Lesson 1]
    → /lesson/1 (intro screen: words preview)
      → [Begin]
      → Exercise 1 (introduce كِتَاب + 2 ayah cards)
      → Exercise 2 (introduce رَبّ + Al-Fatiha recognition moment)
      → Exercise 3 (quiz: كِتَاب MCQ)
      → Exercise 4 (introduce نُور + Ayat al-Nur)
      → Exercise 5 (quiz: رَبّ MCQ)
      → Exercise 6 (introduce رَحْمَة + root connection teaser)
      → Exercise 7 (fill-in-blank: نُور in An-Nur 24:35)
      → Exercise 8 (consolidation quiz)
      → Lesson Complete screen (+10 XP, words summary)
    → /dashboard (Lesson 2 now unlocked, streak = Day 1)
```

---

## Lesson 1 Content Plan

**Lesson:** Level 1 → Unit 1 → Lesson 1
**Title:** "What is an Ism?"
**Teaching Goal:** Introduce the concept of Ism (noun) as one of the 3 Arabic word types. Learn 4 high-frequency Quranic nouns.
**XP Reward:** 10 XP
**Words Taught:** 4

---

### Words & Their Quranic References

Each word is shown with 2 Quranic verse references in learn mode. Word Drawer shows up to 5.

#### Word 1: كِتَاب (kitāb) — "book / scripture"
- **Root:** ك-ت-ب (k-t-b) — to write
- **Frequency in Quran:** ~230 times
- **Reference 1:** Al-Baqarah 2:2 — `ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ فِيهِ` — *"That is the Book about which there is no doubt."*
- **Reference 2:** Al-Imran 3:3 — `نَزَّلَ عَلَيْكَ ٱلْكِتَٰبَ بِٱلْحَقِّ` — *"He has sent down upon you the Book in truth."*

#### Word 2: رَبّ (rabb) — "Lord / Sustainer"
- **Root:** ر-ب-ب (r-b-b) — to nurture, raise, sustain
- **Frequency in Quran:** ~900+ times
- **Reference 1:** Al-Fatiha 1:2 — `ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ` — *"All praise is due to Allah, Lord of all worlds."*
- **Reference 2:** Al-Baqarah 2:131 — `إِذْ قَالَ لَهُۥ رَبُّهُۥٓ أَسْلِمْ` — *"When his Lord said to him, 'Submit.'"*
- **Special note:** Show "You've been saying this in every prayer" — Al-Fatiha recognition moment.

#### Word 3: نُور (nūr) — "light"
- **Root:** ن-و-ر (n-w-r) — light, illumination
- **Frequency in Quran:** ~43 times
- **Reference 1:** Al-Baqarah 2:17 — `ذَهَبَ ٱللَّهُ بِنُورِهِمْ` — *"Allah took away their light."*
- **Reference 2:** An-Nur 24:35 — `ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ` — *"Allah is the Light of the heavens and the earth."*
- **Special note:** Surah is literally named after this word — visually rich ayah to show.

#### Word 4: رَحْمَة (rahma) — "mercy / compassion"
- **Root:** ر-ح-م (r-h-m) — mercy, womb, compassion
- **Frequency in Quran:** ~79 times
- **Reference 1:** Al-Fatiha 1:3 — `ٱلرَّحْمَٰنِ ٱلرَّحِيمِ` — *"The Entirely Merciful, the Especially Merciful."*
- **Reference 2:** Al-Baqarah 2:105 — `وَٱللَّهُ يَخْتَصُّ بِرَحْمَتِهِۦ مَن يَشَآءُ` — *"And Allah selects for His mercy whom He wills."*
- **Special note:** Point out that رَحْمَن and رَحِيم share this root — plants seed for Level 4 root system.

---

### Exercise Sequence (8 exercises, ~5-7 minutes)

| # | Type | Content |
|---|---|---|
| 1 | Learn mode | Introduce كِتَاب + 2 ayah cards |
| 2 | Learn mode | Introduce رَبّ + Al-Fatiha recognition moment |
| 3 | MCQ (4-choice) | Quiz: كِتَاب → "book / scripture" \| "light" \| "mercy" \| "path" |
| 4 | Learn mode | Introduce نُور + Ayat al-Nur (An-Nur 24:35) |
| 5 | MCQ (4-choice) | Quiz: رَبّ → "Lord / Sustainer" \| "book" \| "light" \| "prophet" |
| 6 | Learn mode | Introduce رَحْمَة + root connection teaser |
| 7 | Fill-in-blank | `ٱللَّهُ ___ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ` — choices: نُور \| كِتَاب \| رَحْمَة \| رَبّ |
| 8 | MCQ consolidation | Weakest word from session (or رَحْمَة if all confident) |

---

## Quranic Reference Feature (Ayah Card)

Each **Ayah Card** displays:
```
┌─────────────────────────────────────┐
│  Al-Baqarah • 2:2                   │
│                                     │
│  ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ فِيهِ  │  ← RTL, taught word highlighted teal
│                                     │
│  "That is the Book about which      │
│   there is no doubt."               │  ← English translation
│                                     │
│  [🔊 Coming soon]  [View full →]    │  ← audio grayed out MVP1; drill-down active
└─────────────────────────────────────┘
```

- **Highlighting:** taught word → `bg-teal-100 border-b-2 border-teal-600`; other words plain but tappable
- **Word Drawer:** tap any word → slide-up panel with root, meaning, grammatical role in this verse, up to 5 other occurrences; non-blocking (dismiss returns to lesson)
- **Audio:** speaker icon shown but grayed out with "Coming soon" tooltip in MVP1; wired in MVP2

---

## Global Word Tracker

### Header (3 elements)
```
Streak flame + count  |  XP bar  |  Book icon + word count
```
`WordCountBadge` sits alongside `StreakBadge` and `XpBar` in the global header.

### "Words Learned" Definition
Count of `UserWordReview` rows where `repetitions >= 2` — word has entered SRS cycle, not just glimpsed.

### Dashboard Dual Display
- **Words learned:** raw count (e.g. `47 words`)
- **Quran coverage:** computed from frequency rank of learned words (e.g. `~18% of Quran`)

The coverage number is the unique emotional hook: "I can understand 1 in 5 words I recite."

### Word Count Badge Milestones
First Word → 10 Words → 50 Words → 100 Words → 250 Words → 500 Words

---

## Curriculum Structure

### Key Numbers
- Quran: ~77,000 total occurrences, ~14,870 unique word forms, ~1,750 unique roots
- Top 300 words = ~80% of Quranic text; Top 500 = ~85%
- **App target: ~350 explicitly taught words → ~80–85% reading comprehension**

### Level Breakdown

| Level | Title | Focus | Units | Lessons | Words/Lesson | Total Words |
|---|---|---|---|---|---|---|
| 1 | The Building Blocks (Ism) | High-freq nouns, names of Allah, definiteness, gender, number, Idhafah | 5 | 15 | 4–5 | ~65 |
| 2 | The Engine (Fi'l) | Past/present conjugation, attached pronouns, high-freq verb roots | 4 | 15 | 3–4 | ~55 |
| 3 | The Connectors (Harf) | Prepositions, negation particles, emphasis letters | 3 | 10 | 3–4 | ~35 |
| 4 | The Root System (Sarf) | 10 verb patterns (أوزان), morphological pattern recognition | 4 | 12 | 5–8* | ~75 |
| 5 | Sentence Anatomy (Nahw) | Nominal/verbal sentence structures, word order, I'rab rules | 3 | 10 | 3–4 | ~35 |
| 6 | Contextual Reading | Full passage comprehension, short surahs, rhetorical beauty | 4 | 12 | 5–10 | ~85 |
| **Total** | | | **23 units** | **74 lessons** | | **~350 words** |

*Level 4: pattern recognition multiplies comprehension — knowing ك-ت-ب + مَفعَل pattern lets learner read مَكتَبة without being explicitly taught it.

### Comprehension Milestones

| After Level | Words Known | Quran Coverage |
|---|---|---|
| Level 1 | ~65 | ~25–30% |
| Level 2 | ~120 | ~45–50% |
| Level 3 | ~155 | ~55% |
| Level 4 | ~230 | ~65–70% (root recognition multiplies this) |
| Level 5 | ~265 | ~72% + can parse sentence structure |
| Level 6 | ~350 | ~80–85% — functional reading comprehension |

---

## Design Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Learn mode scope | Only Lesson 1 | From Lesson 2 onward, straight to quiz — learner has seen the pattern |
| Ayah count per word | 2 in lesson, up to 5 in Word Drawer | Consistent lesson UX; depth is opt-in |
| Audience assumption | Assume Muslim | Prayer recognition moments ("you say this 17x a day") are a core motivational hook |
| Audio in MVP1 | Grayed-out icon + "Coming soon" | Wired in MVP2; shows the feature is coming without breaking UX |
| Wrong answer feedback | Amber (never red), show correct answer, "Got it →" | Goal is learning, not testing; no failure state |
| Words Learned definition | `repetitions >= 2` in SRS | Entered the memory cycle, not just glimpsed |

---

## New Components (not in original ARCHITECTURE.md)

| Component | File | Purpose |
|---|---|---|
| AyahCard | `apps/web/src/components/AyahCard.tsx` | Displays a Quranic verse with highlighted word, translation, audio stub, drill-down link |
| WordCountBadge | `apps/web/src/components/WordCountBadge.tsx` | Header badge showing total words learned |

### API Change
`GET /api/v1/users/me/stats` must return two additional fields:
```ts
{
  wordsLearned: number,       // UserWordReview count where repetitions >= 2
  quranCoverage: number,      // percentage (0-100) based on frequency ranks of learned words
}
```
