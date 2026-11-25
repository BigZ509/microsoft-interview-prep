import type { StudyDay } from './types';

export const INTERVIEW_DATE = '2026-12-02';
export const PLAN_START = '2026-11-21';

/**
 * How active study time is split (scope correction, Nov 25 — sources/scope-priority-correction.md).
 * `minutes` assumes a 5-hour study day; scale it to the time you actually have.
 */
export const studyAllocation = [
  { id: 'dsa', label: 'LeetCode, patterns, blind assessments, mistake review', share: 65, minutes: 195 },
  { id: 'oop', label: 'Python OOP and practical coding', share: 15, minutes: 45 },
  { id: 'behavioral', label: 'Behavioral and product design', share: 10, minutes: 30 },
  { id: 'resume', label: 'Résumé and project architecture', share: 5, minutes: 15 },
  { id: 'vocab', label: 'Vocabulary and code reading', share: 5, minutes: 15 },
] as const;

/** Blind assessments served per day (see lib/plan.ts blindForDay). */
export const BLIND_PER_DAY = 2;

/**
 * The plan's "Suggested study plan until Dec 2, 2026", expanded with the lessons, vocabulary,
 * drills and pattern exercises that support each day. `target` equals the number of First-wave +
 * Supporting problems assigned that day in content/problems.ts (verified by tests).
 */
export const schedule: StudyDay[] = [
  {
    date: '2026-11-21', theme: 'Big-O, Python operation costs, hashing review',
    focus: 'Big-O, Python operation costs, hashing review, Group Anagrams and the digit-grouping mock. You have already practiced today’s three problems, so read the hashing lessons at review speed and spend the time on explaining Big-O out loud.',
    lessons: ['big-o/growth', 'big-o/loops', 'big-o/python-costs', 'python/collections-module', 'hashing/how-hashing-works', 'hashing/frequency-maps', 'hashing/hashable-keys', 'arrays/frequency', 'hashing/canonical-keys'],
    terms: ['time-complexity', 'space-complexity', 'hashing', 'key-value-pair', 'anagram', 'canonical-key', 'multiset'],
    drills: ['sum-list', 'sequential-loops', 'all-pairs', 'group-anagrams-sorted', 'group-anagrams-count', 'digit-key'],
    patterns: ['pair-target-unsorted', 'same-chars-any-order', 'group-digit-perms'],
    target: 3,
    extras: ['Mock: Digit-permutation buckets (candidate-reported reconstruction)'],
  },
  {
    date: '2026-11-22', theme: 'Arrays, strings, and hash-set recognition',
    focus: 'Arrays/strings and hash-set recognition.',
    lessons: ['python/collections-basics', 'python/control-flow', 'big-o/notation', 'arrays/traversal', 'arrays/subarrays', 'arrays/strings'],
    terms: ['subarray', 'substring', 'subsequence', 'prefix', 'duplicate', 'distinct', 'set', 'minimum'],
    drills: ['list-membership', 'set-membership', 'string-concat', 'slice-in-loop'],
    patterns: ['find-duplicates', 'small-n-check'],
    target: 5,
    extras: [],
  },
  {
    date: '2026-11-23', theme: 'Two pointers and sorted arrays',
    focus: 'Two pointers and sorted-array problems.',
    lessons: ['python/functions-scope', 'python/builtins', 'two-pointers/opposite', 'two-pointers/same-direction', 'big-o/amortized'],
    terms: ['sorted', 'non-decreasing', 'in-place', 'pointer', 'invariant', 'adjacent'],
    drills: ['two-pointers-converge', 'sorting-then-scan', 'halving'],
    patterns: ['pair-target-sorted', 'pair-target-unsorted'],
    target: 3,
    extras: [],
  },
  {
    date: '2026-11-24', theme: 'Linked lists and pointer rewiring',
    focus: 'Linked lists and pointer rewiring.',
    lessons: ['python/variables-references', 'linked-lists/nodes', 'linked-lists/reverse', 'linked-lists/dummy-merge', 'two-pointers/fast-slow', 'linked-lists/cycle'],
    terms: ['node', 'pointer', 'reference', 'cycle', 'visited', 'edge-case'],
    drills: ['reverse-list-drill', 'fast-slow-drill'],
    patterns: ['list-cycle'],
    target: 3,
    extras: [],
  },
  {
    date: '2026-11-25', theme: 'Sliding window, strings, and reading a problem for its characteristics',
    focus: 'Sliding window plus the reported string question (Roman to Integer). New today: the characteristics checklist — use it on every problem and on both blind assessments before choosing an approach. OOP starts with classes and the phone book.',
    lessons: ['solving/characteristics', 'sliding-window/fixed', 'sliding-window/variable', 'solving/code-reading', 'oop/classes-objects'],
    terms: ['contiguous', 'consecutive', 'amortized', 'maximum', 'monotonic', 'constraint'],
    drills: ['sliding-window-amortized', 'slice-in-loop'],
    patterns: ['longest-contiguous-condition', 'count-subarrays-k'],
    target: 4,
    extras: ['Optional: re-solve LC 121 (from Nov 22) framed as a window — left = buy day, right = sell day; move left when a cheaper day appears'],
    practice: { oop: 'phone-book', reading: ['sum-evens', 'has-duplicates'], behavioral: ['cs-why-cs', 'cs-teamwork'], product: 'gh-test-keyboard', project: 'road-report' },
  },
  {
    date: '2026-11-26', theme: 'Stacks, queues, and the reported "remove a node" question',
    focus: 'Stacks and queues, then every variant of removing a linked-list node (reported). Practice brute force → bottleneck → optimize on each problem before looking at hints. OOP: inheritance and composition with the bank account.',
    lessons: ['stacks-queues/stacks', 'stacks-queues/queues', 'stacks-queues/monotonic', 'linked-lists/remove', 'solving/brute-to-optimal', 'oop/inheritance-composition'],
    terms: ['stack', 'queue', 'amortized', 'edge-case', 'decreasing', 'node', 'brute-force'],
    drills: ['pop-front', 'monotonic-stack'],
    patterns: ['most-recent-first', 'arrival-order', 'matching-brackets'],
    target: 5,
    extras: ['Optional: LC 933 (made optional), 237 and 19 (other "remove a node" variants), 160, 42 (hard stretch)'],
    practice: { oop: 'bank-account', reading: ['find-max', 'is-sorted'], behavioral: ['cs-team-poorly', 'cs-led'], product: 'cs-calendar', project: 'speaklab' },
  },
  {
    date: '2026-11-27', theme: 'Sorting, binary search, testing, and the historical "missing number"',
    focus: 'Sorting and binary search; intervals. Today’s skill: test by input class and respond to hints. Missing Number has four correct approaches — explain the trade-offs. OOP: references, collections and validation with the library system.',
    lessons: ['big-o/classes', 'search-sort/binary-search', 'search-sort/bounds', 'search-sort/sorting', 'patterns/intervals', 'solving/testing-hints', 'oop/references-collections'],
    terms: ['binary-search', 'lower-bound', 'upper-bound', 'off-by-one', 'stable-ordering', 'range', 'reference'],
    drills: ['binary-search-drill', 'sorting-then-scan', 'halving'],
    patterns: ['search-sorted', 'overlapping-ranges'],
    target: 5,
    extras: ['Optional: LC 283 and 27 (same read/write pointer as LC 26)'],
    practice: { oop: 'library', reading: ['dedupe-keep-order', 'second-largest'], behavioral: ['cs-conflict', 'cs-little-guidance'], product: 'gh-test-pen', project: 'zbxp' },
  },
  {
    date: '2026-11-28', theme: 'Recursion, backtracking, and tree basics',
    focus: 'Recursion/backtracking, trees basics. The heaviest lesson day: do recursion → backtracking → permutations → combinations/subsets before the tree lessons, and stop after LC 46 and 78 if time runs short. Invert Binary Tree (historical) is the quickest tree recursion. OOP: copying and cloning, then the parking lot.',
    lessons: ['recursion/basics', 'big-o/recursion-space', 'recursion/backtracking', 'recursion/permutations', 'recursion/combinations-subsets', 'recursion/duplicates', 'recursion/digit-grouping', 'trees/terminology', 'trees/dfs', 'oop/copying'],
    terms: ['recursion', 'base-case', 'backtracking', 'permutation', 'combination', 'subset', 'factorial', 'depth', 'height', 'deep-copy'],
    drills: ['factorial-recursion', 'fib-naive', 'subsets-enum', 'permutations-enum', 'tree-dfs'],
    patterns: ['generate-arrangements', 'choose-k', 'all-subsets', 'group-digit-perms'],
    target: 5,
    extras: ['Optional: LC 138 Copy List with Random Pointer (deep copy by hand)'],
    practice: { oop: 'parking-lot', reading: ['count-words'], behavioral: ['cs-persistence', 'cs-technical-competence'], product: 'cs-remote-comms', project: 'road-report' },
  },
  {
    date: '2026-11-29', theme: 'Prefix sums, Kadane, digit simulation; timed mock',
    focus: 'Prefix sums and Kadane (basic DP is a secondary topic — understand the idea, do not drill variants). Digit simulation covers Add Strings and the historical clock-angle question. Guided Canva OOP today; the independent attempt is tomorrow.',
    lessons: ['patterns/prefix-sums', 'patterns/kadane', 'patterns/dp', 'solving/math-simulation'],
    terms: ['prefix', 'subarray', 'memoization', 'state', 'transition'],
    drills: ['prefix-hash', 'fib-naive'],
    patterns: ['count-subarrays-k', 'max-contiguous-sum', 'ways-to-climb'],
    target: 5,
    extras: ['Timed 45-minute technical mock', 'Optional: LC 9 Palindrome Number, LC 2 Add Two Numbers'],
    practice: { oop: 'canva', reading: ['palindrome-check'], behavioral: ['cs-adapted-style', 'cs-why-hire'], product: 'gh-calculator-vi', project: 'speaklab' },
  },
  {
    date: '2026-11-30', theme: 'Validate BST, BFS/DFS overview (secondary), Canva OOP, behavioral & product',
    focus: 'Validate BST (DFS passing bounds) and Flood Fill. Graphs and heaps are secondary: read the overview lessons, skip the optional problems unless everything else is solid. Main event: the Canva OOP challenge independently, timed (45 min). Then project explanations and behavioral.',
    lessons: ['trees/bfs', 'graphs/representation', 'graphs/traversal', 'patterns/heaps', 'patterns/oop'],
    terms: ['invariant', 'bfs', 'dfs', 'connected-component', 'visited', 'shortest-path', 'directed-graph'],
    drills: ['grid-bfs', 'heap-topk'],
    patterns: ['connected-cells', 'unweighted-shortest', 'k-largest'],
    target: 2,
    extras: ['Canva OOP challenge: independent, 45-minute timer', 'Project explanations: 30 s / 60 s / 2 min for all three', 'Optional: LC 200 (made optional), 994, 215, 207, 23'],
    practice: { oop: 'canva', behavioral: ['cs-pm-or-swe', 'cs-tick'], product: 'cs-app-scope-market', project: 'zbxp' },
  },
  {
    date: '2026-12-01', theme: 'Mistake review, two blind mocks, rest',
    focus: 'No new topics. Clear the review queue, reread your mistake log, do today’s blind assessments as two short mocks (talk out loud, 25 minutes each), and re-explain one project. Then rest.',
    lessons: [],
    terms: ['trade-off', 'invariant', 'edge-case', 'auxiliary-space'],
    drills: ['sliding-window-amortized', 'permutations-enum', 'group-anagrams-count'],
    patterns: ['count-subarrays-k', 'group-digit-perms', 'small-n-check'],
    target: 0,
    extras: ['Two blind assessments as timed mocks', 'Read the mistake log', 'Clear the review queue', 'Rest'],
    practice: { behavioral: ['cs-why-hire'], product: 'cs-remote-phone', project: 'road-report' },
  },
  {
    date: '2026-12-02', theme: 'Interview day',
    focus: 'Interview-day checklist and short warm-up only.',
    lessons: [],
    terms: [],
    drills: ['sum-list'],
    patterns: [],
    target: 0,
    extras: ['Warm-up: re-explain one solved problem out loud (Two Sum → sorted follow-up)', 'Checklist: quiet room, charger, water, Python editor, LeetCode logged in, STAR stories open'],
  },
];

export const interviewDayChecklist = [
  'Sleep and eat normally — no new topics today.',
  'Warm up for 15 minutes: explain Two Sum (and its sorted follow-up), Roman to Integer and Merge Two Sorted Lists out loud, including Big-O.',
  'Expect project questions: have the 60-second versions of Road Report, SpeakLab AI and ZBXP ready — and only claim what you can explain.',
  'Have your STAR(R) stories and project cards open for a quick skim.',
  'Test your mic, camera, and the interview link 15 minutes early.',
  'During the interview: clarify → characteristics → brute force → bottleneck → optimize → code → test → Big-O.',
  'If you get a hint or a correction, acknowledge it, restate it, and re-derive out loud — reported candidates recovered this way.',
  'It is fine to say "Let me think out loud for a moment."',
];
