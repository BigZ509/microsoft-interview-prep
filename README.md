# Explore Prep

An interactive study platform for the Microsoft Explore interview on **December 2, 2026**, organised as a **linear, guided seven-day bootcamp** (Day 1 = Nov 25 … Day 7 = Dec 1). Open it, press **Continue Studying**, and keep pressing **Complete & Continue**: every lesson, vocabulary set, Big-O drill, visual walkthrough, pattern exercise, LeetCode problem, mistake review, OOP challenge, blind assessment, behavioral / architecture / product exercise and end-of-day review is scheduled in order and embedded in the activity page. The standalone pages remain available in a secondary **Reference Library**, but nothing scheduled requires them.

You solve problems on LeetCode. This app covers everything around that: learning the concepts, decoding the wording, analyzing complexity, tracking what you solved and how, and reviewing.

Sources of truth:
- `sources/seven-day-bootcamp-request.md`: the bootcamp request (curriculum per day, activity sequence, UX).
- `sources/scope-priority-correction.md`: time split 65/15/10/5/5, LeetCode-first, small OOP and résumé prep.
- `sources/colorstack-explore-research.md`: evidence labels (reported / historical / recommended; all anecdotal).
- `microsoft_explore_study_guide_agent_prompt.md`: the original problem catalog (35 problems), imported into `content/problems.ts`. Nov 21–24 keep their original schedule.

## Run it

```bash
npm install
npm run build && npm start      # http://127.0.0.1:3000
# or, for development
npm run dev
```

Progress is saved in your browser's localStorage under the key `explore-prep-v1`. To move it to another browser, use **Tracker → Back up or restore progress**.

## Sections

| Route | What it does |
|---|---|
| `/` | **Bootcamp home**: days remaining, the current day, objectives, today's ordered activities (tier, minutes, status), estimated time and progress, **Continue Studying**, the hours-per-day setting, and a card per day (topics, completion %, workload, status, Start/Continue) |
| `/study/[activity]` | **Activity player** (200 statically generated pages). Top: Day N · Activity k of n, day progress, duration. Main: the real content (lesson, terms, drill, visual walkthrough, pattern scenarios, decoder, guided mock, problem with hint ladder and LeetCode link, review queue, OOP challenge, blind assessment, code reading, story/product/project editors, end-of-day review, Day 6 targeted review plan). Bottom: Previous · Skip for now · Complete & Continue, with the next activity linked |
| `/review` | Spaced review queue, mistake log, problems solved with help vs. independently, weak concepts |
| **Reference Library** | Everything below. Still available; never required by a scheduled activity |
| `/learn` | 15 modules and 66 lessons. Each lesson has the same 10 parts, ending in a knowledge check and LeetCode links |
| `/dictionary` | "Decode the Interview Question": 92 searchable terms. Each has a "Check before choosing" section on how constraints and input properties change the approach, plus a knowledge check |
| `/patterns` | Keyword → pattern scenarios (some are deliberate traps) and the interactive problem decoder |
| `/big-o` | 29 original snippets. You choose time, space, and the dominant operation, explain your reasoning, and only then see the derivation |
| `/tracker` | All 56 problems (35 plan, 20 ColorStack, LC 102) with the five retention levels, status, notes, approach, complexity, rescheduling, and a hint ladder |
| `/mock` | Guided technical mocks with a timer and rubric; STAR(R) stories, project-defense cards, product prompts |
| `/search?q=` | Searches lessons, terms, problems, drills, patterns, and mocks |

## Content layout

All educational content is typed data in `content/`, validated by `tests/content.test.ts`:

- `content/modules/*.ts`: lessons (schema in `content/types.ts`)
- `content/glossary-a.ts`, `glossary-b.ts`: dictionary terms
- `content/drills.ts`: Big-O Lab drills
- `content/patterns.ts`: pattern scenarios and decoder problems
- `content/bootcamp.ts`: the seven days, each an ordered list of activities (stable ids such as `d1-lesson-hashing-frequency-maps`, kind, refs to real content, minutes, tier `core`/`reinforcement`/`stretch`, allocation `dsa`/`oop`/`behavioral`/`resume`/`vocab`)
- `content/problems.ts`, `content/schedule.ts`: the problem catalog and the calendar. Nov 21–24 are as studied; Nov 25 – Dec 1 are derived from the bootcamp, so the tracker and the bootcamp always agree
- `content/mocks.ts`, `content/sources.ts`

Logic lives in `lib/` as pure functions (`bootcamp.ts`, `progress.ts`, `plan.ts`, `insights.ts`, `search.ts`, `dates.ts`). The localStorage store is in `lib/store.ts`.

## The bootcamp engine (`lib/bootcamp.ts`, tested in `tests/bootcamp-engine.test.ts`)

- **Current day** comes from today's date. Before Nov 25 the app previews Day 1; on Dec 2 it shows the interview-day checklist.
- **Day plan** = that day's activities in sequence order + **carry-over**: core problems, blind assessments and OOP challenges from earlier days that were neither completed nor recorded. Carried items sit just before the day's mistake review.
- **Hours budget**: default 8 h, configurable on the home page and saved in progress. Day 7 gets 60% of it. Over budget, pending **stretch** items are deferred first (latest first), then **reinforcement**. Core work is never deferred; completed work is never deferred.
- **Intelligent modes**: a lesson already completed on an earlier day becomes a 10-minute recap at reinforcement tier; a problem already solved independently on an earlier day becomes a 15-minute **retention check**. If a retention check is not solved independently, the existing review queue brings it back in the next day's mistake review.
- **Status** per activity: done / skipped / pending / deferred. Only done and skipped are stored.
- **Order**: Continue goes to the saved position if it is unfinished, otherwise the next pending item. Skipped items come back at the end of the day, before the end-of-day review; skipping them again moves forward, never in a loop. Completing the end-of-day review returns to the plan.
- **Completion gates**: a problem needs a status recorded that day; blind assessments, OOP challenges and code readings need an attempt recorded that day. Viewing hints or a reference solution records nothing. Completing a lesson marks it read; completing a vocabulary set marks its terms reviewed. Skip for now is always available, and skipping a completed activity keeps it completed.
- **Blind picks**: each blind activity has an explicit candidate list. It serves the first candidate not attempted before that day and not served by an earlier activity, so the pick is stable all day and never repeats that day's LeetCode problems. In the bootcamp, the source label stays hidden until the reveal.
- **Persistence**: `progress.bootcamp = { position, activities: { id: { status, at } }, hours }`. Older saves without the key load unchanged with an empty bootcamp state. Opening an activity saves it as the resume position.

### The seven days

| Day | Date | Focus | Core problems |
|---|---|---|---|
| 1 | Nov 25 | Arrays, strings, hashing; first class + phone book | 1, 13, 217, 242, 49, 344 |
| 2 | Nov 26 | Two pointers, sliding window; inheritance/composition + library | 125, 283, 26, 167, 121, 3 |
| 3 | Nov 27 | Linked lists, stacks, queues; copying + Canva (reported) | 206, 21, 141, 237, 20, 232, 203 |
| 4 | Nov 28 | Recursion (new `recursion/call-stack` lesson with frame-by-frame traces) and trees; Road Report architecture | 104, 226, 100, 98, 102 |
| 5 | Nov 29 | Backtracking, sorting, binary search; SpeakLab AI and ZBXP; test a pen, accessible calculator. Graphs, matrix and DP are stretch | 78, 46, 704, 35, 268 |
| 6 | Nov 30 | Two simulated rounds (blind coding, OOP parking lot, code reading, complexity, behavioral, product), then a targeted review plan | — |
| 7 | Dec 1 | Lighter: reattempt failures, pattern/OOP/complexity recaps, projects, STAR stories, one short confidence mock | — |

Days 1–5 are about 8 hours of core + reinforcement work; Day 6 about 6.6 hours; Day 7 about 3.5 hours. `tests/bootcamp.test.ts` checks every day against the 65/15/10/5/5 split within bounds (algorithms 55–75%, OOP 5–20%, behavioral 5–15%, résumé 2–12%, vocabulary 2–10%).

## Rules the app enforces

- **Five levels, tracked separately**: read the lessons → attempted → solved with help → solved independently → **retained**. A problem is retained only after you solve it *independently on two different days*. Solving it with help, or viewing hints, never counts. (The function is still `isMastered`; the label is now “Retained”.)
- **Review timing.** Attempted or solved-with-help problems come back after 1 day. A first independent solve comes back after 3 days. Needs Review, or "mark for another attempt", is due immediately.
- **On track.** Unfinished problems from earlier days count as *behind*. Today's problems count as *due today*.
- **Countdown.** After Dec 2 the home page stops counting down and says how long ago the interview was.
- **Revisiting never erases history.** Retrying a check, drill, or pattern exercise adds an attempt and counts earlier misses (shown under Review → Recovered). Marking a solved problem "Needs Review" queues it again but still counts the original solve.

## Schedule rules (enforced by `tests/schedule-audit.test.ts`)

- The catalog matches the source file exactly: 18 first-wave and 17 supporting problems, with the final three (994, 215, 207) as P1. Everything else is a labeled ColorStack addition (with evidence) or LC 102, a bootcamp addition (`origin: 'bootcamp'`, deliberately no evidence).
- Every prerequisite lesson of a problem is scheduled on or before that problem's date, and in the bootcamp it comes earlier in the day than the problem.
- Each problem's day studies one of its prerequisites or its primary module. On bootcamp days, the bootcamp's recap lessons count as studied that day.
- Every Phase 1 and Phase 2 lesson is scheduled exactly once (recaps live only in the bootcamp), and a module's prerequisite modules start no later than the module itself.
- A bootcamp problem's tier matches the catalog: core ⇔ not Stretch. Reinforcement and stretch plan problems are demoted with a written reason (`demoted`), never silently.

Tier changes made for the bootcamp:

| Problem | Change | Why |
|---|---|---|
| 155, 56, 53, 70, 733, 560 (plan) | → optional (Stretch, P1) | Not on the bootcamp's priority lists; DP, graphs and matrices are Day 5 “if time permits” |
| 83, 415, 1344 (ColorStack) | → optional | Reinforcement/stretch on their day |
| 283, 237 (ColorStack) | → core (Supporting, P0) | Listed as Day 2 and Day 3 priority problems |
| 102 | added | Listed for Day 4 |

Problems from Nov 21–24 keep their dates (a test locks them); in the bootcamp they appear as retention checks.

Problems moved during the audit:

| Problem | Moved | Why |
|---|---|---|
| LC 121 | Nov 25 → Nov 22 | It is a running-minimum traversal; the `arrays/traversal` lesson (Nov 22) builds exactly this solution. Nov 25 keeps it as an optional window-style re-solve. |
| LC 98 | Nov 28 → Nov 30 | It applies the Nov 28 tree-DFS lessons on the DFS/BFS day, instead of adding a fifth problem to the heaviest day. |
| LC 70 | stays on Nov 29 | Paired with Kadane: both are 1-D DP with a state and a transition. Its recursion prerequisites come on Nov 28. |
| LC 1200 | stays on Nov 23 | It is a sorted-array problem that uses `sorted()`, taught in `python/builtins` (Nov 23). The sorting algorithms themselves are taught on Nov 27. |

## Design system

All styling lives in `app/globals.css`, organized as tokens → base → layout → components → page sections. Shared markup lives in `components/ui.tsx`.

- **Tokens.** Slate neutrals with one Fluent-style blue accent (`--accent`) and semantic `--good` / `--warn` / `--bad` colors, each with a soft background and a line color. There are full light and dark sets (dark follows `prefers-color-scheme`). Every text/background pair meets WCAG AA (≥ 4.5:1); the ratios were checked when the palette was set.
- **Scales.** Type uses 12 / 13 / 15 / 16 / 18 / 22 / 28 px. Spacing uses a 4 px base (`--s1`…`--s10`). Radii are 6 / 8 / 12 px plus pills.
- **Components** (`components/ui.tsx`): `PageHeader`, `Panel` (with a numbered or completed step marker), `ProgressBar`, `Stat`, `DifficultyBadge`, `EmptyState`. Lists use one divided-row style (`.item-list`). Problem rows (`ProblemItem`) are fully clickable, with a single LeetCode icon button. Status pills (`.status`), chips, segmented controls, exercise accordions (`.exercise`), and code frames are shared CSS classes.
- **Navigation.** The desktop sidebar is fixed. The primary group is Bootcamp and Review; every other page sits under a secondary **Reference Library** group. It shows a review-count badge and a countdown / day-progress card. On screens ≤ 960 px it becomes a drawer: open it with the menu button, close it with Escape, the scrim, or by navigating.
- **Pages.** The bootcamp home has a hero with **Continue Studying**, the ordered activity list (tier badges, minutes, status) and the day cards. The activity player has a progress header and a sticky bottom bar (Previous · Skip for now · Complete & Continue). Lessons are grouped into three bands (*Understand* / *Implement & analyze* / *Apply*), and the table of contents highlights the section you're reading. Pattern exercises and decoder problems are single-open accordions that support deep links (`/patterns#id`). The Big-O Lab keeps the code pinned beside numbered answer blocks. Mock sessions use a step navigator and a sticky timer bar.

## Verify

```bash
npm run typecheck && npm run lint && npm test   # unit + content tests (runs every lesson's Python sample)
npm run build && npm run e2e                     # Playwright end-to-end tests (desktop + mobile; 3 workers)
# On a heavily loaded machine: npx playwright test --workers=1 --timeout=90000
npm start & npm run smoke -- http://127.0.0.1:3000   # crawls every internal link and every /study page
```

`e2e/complete-flow.spec.ts` walks Day 1 end to end on a fixed date (`page.clock`): Continue Studying, then Complete & Continue or Skip on every activity until the end-of-day review, checking real content, the resume position across a reload, and that every day's first activity loads.

The Python test needs `python3` on your PATH. If Python is missing, those tests are skipped.

## Honesty notes

- The digit-permutation grouping exercise is a **candidate-reported reconstruction**, not an official or verified Microsoft question. It is labeled that way everywhere it appears.
- P0/P1 priorities are study recommendations from the plan, not interview-frequency data. LeetCode company tags cover all of Microsoft, not just Explore.
- Nothing syncs from LeetCode. Every status is one you record yourself.
