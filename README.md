# Explore Prep

An interactive study platform for the Microsoft Explore interview on **December 2, 2026**. It combines concept lessons, an interview-vocabulary dictionary, pattern recognition, Big-O training, a daily LeetCode tracker, and mock interviews.

You solve problems on LeetCode. This app covers everything around that: learning the concepts, decoding the wording, analyzing complexity, tracking what you solved and how, and reviewing.

The source of truth for the plan is `microsoft_explore_study_guide_agent_prompt.md`. Its problem list, dates, and priorities are imported unchanged into `content/problems.ts` and `content/schedule.ts`.

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
| `/` | Dashboard: today's plan (Learn → Vocabulary → Big-O → Pattern → Solve → Review), countdown, on-track status, review queue, weak areas |
| `/learn` | 13 modules and 55 lessons. Each lesson has the same 10 parts, ending in a knowledge check and LeetCode links |
| `/dictionary` | "Decode the Interview Question": 92 searchable terms. Each has a "Check before choosing" section on how constraints and input properties change the approach, plus a knowledge check |
| `/patterns` | Keyword → pattern scenarios (some are deliberate traps) and the interactive problem decoder |
| `/big-o` | 29 original snippets. You choose time, space, and the dominant operation, explain your reasoning, and only then see the derivation |
| `/tracker` | The 35 plan problems, with status, notes, approach, complexity, rescheduling, and a hint ladder |
| `/review` | Spaced review queue, problems solved with help vs. independently, weak concepts |
| `/mock` | Guided technical mocks with a timer and rubric; STAR(R) stories, project-defense cards, product prompts |
| `/search?q=` | Searches lessons, terms, problems, drills, patterns, and mocks |

## Content layout

All educational content is typed data in `content/`, validated by `tests/content.test.ts`:

- `content/modules/*.ts`: lessons (schema in `content/types.ts`)
- `content/glossary-a.ts`, `glossary-b.ts`: dictionary terms
- `content/drills.ts`: Big-O Lab drills
- `content/patterns.ts`: pattern scenarios and decoder problems
- `content/problems.ts`, `content/schedule.ts`: the imported study plan
- `content/mocks.ts`, `content/sources.ts`

Logic lives in `lib/` as pure functions (`progress.ts`, `plan.ts`, `search.ts`, `dates.ts`). The localStorage store is in `lib/store.ts`.

## Rules the app enforces

- **Mastery is not a single completion.** A problem is mastered only after you solve it *independently on two different days*. Solving it with help never counts toward mastery.
- **Review timing.** Attempted or solved-with-help problems come back after 1 day. A first independent solve comes back after 3 days. Needs Review, or "mark for another attempt", is due immediately.
- **On track.** Unfinished problems from earlier days count as *behind*. Today's problems count as *due today*.
- **Countdown.** After Dec 2 the dashboard stops counting down and says how long ago the interview was.
- **Revisiting never erases history.** Retrying a check, drill, or pattern exercise adds an attempt and counts earlier misses (shown under Review → Recovered). Marking a solved problem "Needs Review" queues it again but still counts the original solve.

## Schedule rules (enforced by `tests/schedule-audit.test.ts`)

The source plan gives a topic for each day and a topic for each problem, but no problem-to-day mapping and no daily counts. The mapping and the daily targets are derived from those topics, and these rules are enforced:

- The catalog matches the source file exactly: 18 first-wave and 17 supporting problems, with the final three (994, 215, 207) as P1.
- Every prerequisite lesson of a problem is scheduled on or before that problem's date.
- Each problem's day teaches one of its prerequisites or its primary module.
- Every Phase 1 and Phase 2 lesson is scheduled exactly once, and a module's prerequisite modules start no later than the module itself.

Problems moved during the audit:

| Problem | Moved | Why |
|---|---|---|
| LC 121 | Nov 25 → Nov 22 | It is a running-minimum traversal; the `arrays/traversal` lesson (Nov 22) builds exactly this solution. Nov 25 keeps it as an optional window-style re-solve. |
| LC 98 | Nov 28 → Nov 30 | It applies the Nov 28 tree-DFS lessons on the DFS/BFS day, instead of adding a fifth problem to the heaviest day. |
| LC 70 | stays on Nov 29 | Paired with Kadane: both are 1-D DP with a state and a transition. Its recursion prerequisites come on Nov 28. |
| LC 1200 | stays on Nov 23 | It is a sorted-array problem that uses `sorted()`, taught in `python/builtins` (Nov 23). The sorting algorithms themselves are taught on Nov 27. |

## Verify

```bash
npm run typecheck && npm run lint && npm test   # unit + content tests (runs every lesson's Python sample)
npm run build && npm run e2e                     # Playwright end-to-end tests (desktop + mobile)
npm start & npm run smoke -- http://127.0.0.1:3000   # crawls every internal link
```

The Python test needs `python3` on your PATH. If Python is missing, those tests are skipped.

## Honesty notes

- The digit-permutation grouping exercise is a **candidate-reported reconstruction**, not an official or verified Microsoft question. It is labeled that way everywhere it appears.
- P0/P1 priorities are study recommendations from the plan, not interview-frequency data. LeetCode company tags cover all of Microsoft, not just Explore.
- Nothing syncs from LeetCode. Every status is one you record yourself.
