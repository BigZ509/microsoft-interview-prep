import type { ProjectBrief, ProjectPromptId } from './types';

/**
 * Résumé project preparation (scope correction §5) — deliberately small.
 *
 * Sources, and nothing else:
 *  - Résumé: ~/Downloads/may2029_always_use.pdf (claims quoted verbatim; matches the portfolio résumé).
 *  - Portfolio project notes: ~/portfolio/data/projects.ts, whose comments cite the repositories
 *    (BigZ509/speaklab, Lockop1/Road-Report, BigZ509/Productivity-WebApp).
 *  - ZBXP repository docs: ~/Desktop/zbxp/README.md and docs/ARCHITECTURE.md.
 *  - SpeakLab 2.1 issue pack README (Nov 3, 2026) — a proposed backlog, not completed work.
 * Guiding Hands is excluded: it was not on the submitted résumé.
 * Where a résumé claim is not supported by the evidence above, it is listed under `verify`
 * instead of being explained. Nothing here invents a metric or a design detail.
 */

export const projectPromptOrder: { id: ProjectPromptId; label: string }[] = [
  { id: 'problem', label: 'What problem does it solve?' },
  { id: 'architecture', label: 'High-level architecture' },
  { id: 'dataflow', label: 'How data flows through it' },
  { id: 'technologies', label: 'Why these technologies?' },
  { id: 'contribution', label: 'My personal contribution' },
  { id: 'challenge', label: 'One significant technical challenge' },
  { id: 'tradeoff', label: 'One important trade-off' },
  { id: 'measurement', label: 'How I measured the claimed results' },
  { id: 'improve', label: 'What I would improve' },
];

/** Timed explanation drills. Word targets assume ~150 spoken words per minute. */
export const explanationDrills = [
  { id: '30s', label: '30-second version', seconds: 30, words: 75, guide: 'Problem → what you built → one result you can defend. No technology list.' },
  { id: '60s', label: '60-second version', seconds: 60, words: 150, guide: 'Add the architecture in one sentence and your specific contribution.' },
  { id: '2min', label: 'Two-minute version', seconds: 120, words: 300, guide: 'Add the data flow, one challenge, one trade-off, and what you would improve.' },
] as const;

export const projects: ProjectBrief[] = [
  {
    id: 'road-report',
    name: 'Road Report',
    stack: 'TypeScript, React, Next.js, TigerData, ElevenLabs, REST APIs',
    resumeClaims: [
      'Implemented a weighted phrase-scoring classifier for 5 roadway hazard categories, achieving 92% accuracy on 100+ reports.',
      'Reduced geospatial processing by approximately 67% using 0.3-mile incident clustering and geohashing.',
      'Developed a confirm-before-submit REST API workflow with idempotency protection to validate reports and prevent duplicates.',
    ],
    facts: [
      { text: 'A hackathon road-hazard map. You wrote the report classifier, its input validation and its tests; teammates built the map, which shows live incidents and ranks alternative routes by the hazards along them.', source: 'Portfolio notes (Lockop1/Road-Report: lib/reports/classify.ts, docs/incident-classification.md)' },
      { text: 'The classifier sorts a free-text description into collision, road obstruction, flooding, traffic signal issue or other — or returns a clarification prompt instead of guessing.', source: 'Portfolio notes' },
      { text: 'Explainable rules instead of a black box: specific hazard phrases score 4, generic ones such as "blocking the lane" score 2, so "a crash is blocking the lane" resolves to a collision. Resolved reports, device talk ("my phone crashed") and descriptions naming two hazards ask the reporter to clarify.', source: 'Portfolio notes' },
      { text: 'Portfolio stack: Next.js, React, TypeScript, MapLibre GL, PostgreSQL. Live demo at hazard-identifier.vercel.app.', source: 'Portfolio notes' },
    ],
    diagram: [
      { label: 'Reporter', detail: 'Free-text (or voice) hazard description' },
      { label: 'REST API', detail: 'Validates the report; confirm-before-submit flow (résumé)' },
      { label: 'Classifier', detail: 'Weighted phrase scores → category or "please clarify" (your code)' },
      { label: 'Incident store', detail: 'PostgreSQL / TigerData (résumé)' },
      { label: 'Map', detail: 'Live incidents + route ranking (teammates)' },
    ],
    verify: [
      'The portfolio notes say geohash deduplication from the original brief is NOT in the repository. Do not explain the "67% via geohashing" bullet unless you can point to that code and to how 67% was measured.',
      '"92% accuracy on 100+ reports": be ready to say what the 100+ reports were, who labeled the correct category, and whether they were held out from tuning the phrase weights. If you do not know, say so plainly.',
      'The résumé lists TigerData and ElevenLabs; the portfolio stack lists PostgreSQL and MapLibre. Know which parts used which, and which you personally touched.',
      'Idempotency protection: be ready to say what the idempotency key was and where duplicates were rejected — or describe it as a teammate\'s part.',
    ],
    prompts: {
      problem: 'People describe hazards loosely ("crash", "a tree is blocking the lane", or no hazard at all). Forcing every message into a category would put false incidents on the map.',
      architecture: 'Use the diagram: report → API validation → your classifier → incident store → map. Say clearly which box is yours.',
      dataflow: 'A description arrives, is validated, scored against the phrase rules, and either filed under a category or returned with a clarification prompt; filed incidents appear on the map.',
      technologies: 'Rules over a model: explainable, testable, and tunable during a hackathon without training data. Next.js/React for the web app (team choice).',
      contribution: 'The classifier, its input validation and its tests (per the portfolio notes). Teammates built the map and routing.',
      challenge: 'Ambiguous input: phrases like "crashed" that are not road hazards, generic phrases that fit several categories, and reports naming two hazards. The weighting (4 vs 2) and the clarify path handle them.',
      tradeoff: 'Explainable rules vs. a learned classifier: easier to debug and justify, but you must add phrases by hand and it will miss unusual wording.',
      measurement: 'Only describe what you actually measured (see "Verify"). A good honest answer names the test set, the labels and the result — or says the number is an estimate.',
      improve: 'Hold out a labeled test set and track per-category precision/recall; log clarification requests to find missing phrases.',
    },
    followUps: [
      'Walk me through how "a crash is blocking the lane" gets classified.',
      'How did you test the classifier? What does a failing test look like?',
      'What happens if a report mentions two hazards?',
      'How would you know the accuracy number still holds on new reports?',
    ],
  },
  {
    id: 'speaklab',
    name: 'SpeakLab AI',
    stack: 'React Native, TypeScript, Firebase, OpenAI API, Railway',
    resumeClaims: [
      'Built a mobile public-speaking coach that records speech, transcribes audio, and generates personalized performance feedback.',
      'Evaluated speech analysis across 150+ recordings and 10+ metrics, including pacing, pauses, filler words, and delivery.',
      'Integrated the OpenAI API, Firebase, and Railway to return personalized feedback in under 2.5 seconds.',
    ],
    facts: [
      { text: 'An Expo (React Native) app records a practice run and turns the returned transcript into feedback: pace in words per minute across the talk and the timestamp of every filler word.', source: 'Portfolio notes (BigZ509/speaklab: speechEngine/, services/transcription-services.ts)' },
      { text: '"Um"-type sounds always count as fillers; words like "like" and "so" are checked against their neighbours before being flagged.', source: 'Portfolio notes' },
      { text: 'Audio goes through a Node.js/Express backend instead of the phone calling the transcription API directly: keeps API keys off the device and gives one place to validate requests and control cost, at the price of an extra network hop. Portfolio stack lists Whisper for transcription, Firebase Authentication and Cloud Firestore.', source: 'Portfolio notes' },
      { text: 'The app rejects a transcript with missing or out-of-order word timings before any analysis runs.', source: 'Portfolio notes' },
      { text: 'In progress, not yours to claim as done: an authenticated owner-only session API (a teammate\'s PR in review) and an offline Common Voice evaluation set. The SpeakLab 2.1 backlog (Nov 2026) lists latency instrumentation and a human-reviewed gold set as future work.', source: 'Portfolio notes; SpeakLab 2.1 issue pack README' },
    ],
    diagram: [
      { label: 'Mobile app', detail: 'Expo / React Native records the practice run' },
      { label: 'Backend', detail: 'Node.js + Express validates the request, holds API keys' },
      { label: 'Transcription', detail: 'Whisper / OpenAI API returns words with timestamps' },
      { label: 'Analysis', detail: 'Checks timings, computes WPM and filler-word events' },
      { label: 'Feedback + storage', detail: 'Shown in the app; accounts and sessions in Firebase' },
    ],
    verify: [
      '"Under 2.5 seconds": the 2.1 backlog lists "instrument processing latency" as future work. Be ready to say how you timed it (which step, how many runs, average or worst case) — or describe it as an observed typical time.',
      '"150+ recordings and 10+ metrics": the backlog plans a 30–50-recording human-reviewed gold set. Know exactly what the 150+ evaluation was and which 10+ metrics exist in the code today.',
      'Résumé says Railway and the OpenAI API; the portfolio names Node.js/Express and Whisper. Know where the backend runs and which API the transcription call uses.',
      'Separate your work from teammates\': the session API is a teammate\'s PR.',
    ],
    prompts: {
      problem: 'After a practice talk, most people only remember how it felt. Without a record, it is hard to know whether to slow down, cut filler words or rework a section.',
      architecture: 'Use the diagram: app → backend → transcription → analysis → feedback/storage.',
      dataflow: 'Recording → uploaded through the backend → transcript with word timings → timing check → WPM and filler events → feedback card in the app.',
      technologies: 'React Native/Expo: one codebase for phones. A backend proxy: secrets stay off the device, one place to validate and control cost. Firebase: authentication and storage without running a database.',
      contribution: 'Say exactly which parts you wrote (for example the analysis engine or the backend proxy) and which were teammates\'.',
      challenge: 'Filler words that are also normal words ("like", "so"): flagging them needs their neighbours; plus rejecting transcripts whose timings are missing or out of order before analysis.',
      tradeoff: 'Backend proxy vs. calling the API from the phone: safer keys, validation and cost control, but an extra network hop that adds latency.',
      measurement: 'State the recording count, metric list and timing method you can actually show (see "Verify").',
      improve: 'A human-labeled evaluation set to measure filler-word accuracy, latency instrumentation per step, and timestamp-linked playback of each feedback item.',
    },
    followUps: [
      'Why not call the transcription API directly from the phone?',
      'How do you decide whether "like" is a filler word?',
      'How did you measure the feedback time, and where does most of it go?',
      'What would you do if the transcript\'s word timings are missing?',
    ],
  },
  {
    id: 'zbxp',
    name: 'ZBXP',
    stack: 'React, JavaScript, Supabase, PostgreSQL, REST APIs',
    resumeClaims: [
      'Built a gamified productivity web app supporting 50+ users, including persistent tasks, XP progression, streaks, and quests.',
      'Designed Supabase/PostgreSQL data models for users, tasks, guilds, sessions, and progression with email/password authentication.',
      'Implemented dynamic guild leaderboards using aggregated XP and activity data, with an average refresh time of 1.8 seconds.',
    ],
    facts: [
      { text: 'Loop: choose a quest → focus → complete the work → earn XP → level up → compete with your guild. Live at zbxp.vercel.app.', source: 'ZBXP README (Desktop/zbxp); portfolio notes' },
      { text: 'React SPA → supabase-js → PostgREST → Postgres, plus Supabase Auth. Reads of your own rows go through row-level security; every write goes through a validated RPC (SECURITY DEFINER function). Clients cannot insert or update app tables directly.', source: 'ZBXP docs/ARCHITECTURE.md' },
      { text: 'XP is an append-only ledger (xp_events). A unique (user_id, source_type, source_id) key makes each award idempotent; the invariant profiles.xp_total == sum(xp_events.amount) is enforced in SQL and tested. Level = floor(xp / 100) + 1; ranks E–S come from fixed thresholds.', source: 'ZBXP docs/ARCHITECTURE.md' },
      { text: 'Tables include profiles, quests, user_active_quests, quest_completions, focus_sessions, workout_logs, groups and group_members. accept_quest takes a per-user advisory lock so the 5-active-quest limit cannot be raced.', source: 'ZBXP docs/ARCHITECTURE.md' },
      { text: 'Two versions exist: the earlier repo (BigZ509/Productivity-WebApp) awards XP through complete_quest / log_workout RPCs and its Pomodoro timer does not award XP; the current rebuild verifies focus time on the server before awarding focus XP. Describe the version you can show.', source: 'Portfolio notes; ZBXP README' },
    ],
    diagram: [
      { label: 'React app', detail: 'Quest board, focus timer, guild hall' },
      { label: 'Supabase Auth', detail: 'Email/password sign-in' },
      { label: 'RPC functions', detail: 'Validate every write, award XP' },
      { label: 'Postgres', detail: 'Append-only XP ledger, quests, guilds; RLS on reads' },
      { label: 'Leaderboards', detail: 'Aggregated from the same ledger' },
    ],
    verify: [
      '"50+ users": know how you counted them (sign-ups in the auth table? active users?) and over what period.',
      '"1.8-second average refresh": know what was timed (query, network, render), how many samples, and on what data size.',
      'Streaks and sessions: the current schema has workout streaks and focus_sessions — be specific about which "sessions" the résumé means.',
    ],
    prompts: {
      problem: 'A finished to-do list does not feel like much. Games make progress visible with levels, ranks and a team; ZBXP gives everyday tasks the same weight.',
      architecture: 'Use the diagram: React app → Supabase Auth and RPC functions → Postgres, with leaderboards read from the same ledger.',
      dataflow: 'Completing a quest calls an RPC → the function validates it and inserts one ledger row → xp_total updates → the app shows the XP actually awarded and refreshes level/rank and the leaderboard.',
      technologies: 'Supabase: Postgres with auth, row-level security and RPC functions without writing a separate server. React for the interactive UI.',
      contribution: 'Name what you designed: the data model, the XP ledger and the award RPCs, the leaderboard aggregation, the UI.',
      challenge: 'Making XP impossible to fake or double-award: server-side awards, an append-only ledger with a unique idempotency key, and a lock for the active-quest limit.',
      tradeoff: 'Business rules in database functions: secure and consistent, but harder to test and change than application code.',
      measurement: 'Only the user count and refresh time you can explain (see "Verify").',
      improve: 'Cache or materialize leaderboard aggregates, add monitoring for refresh time, and expand integration tests for the RPCs.',
    },
    followUps: [
      'Why does the database award XP instead of the browser?',
      'How do you stop the same quest completion from awarding XP twice?',
      'How is the leaderboard computed, and what happens as the ledger grows?',
      'How did you get to 50+ users, and how do you know they used it?',
    ],
  },
];

export function getProject(id: string): ProjectBrief | undefined {
  return projects.find((p) => p.id === id);
}
