import type { StudyDay } from './types';

export const INTERVIEW_DATE = '2026-12-02';
export const PLAN_START = '2026-11-21';

/** Daily study block recommendation from the plan. */
export const studyBlocks = [
  { label: 'Concepts & complexity', minutes: '60–90 min' },
  { label: 'LeetCode practice', minutes: '2–3 h' },
  { label: 'Explanation / behavioral', minutes: '30–45 min' },
];

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
    date: '2026-11-25', theme: 'Fixed and variable sliding window',
    focus: 'Fixed/variable sliding window.',
    lessons: ['sliding-window/fixed', 'sliding-window/variable'],
    terms: ['contiguous', 'consecutive', 'amortized', 'maximum', 'monotonic'],
    drills: ['sliding-window-amortized', 'slice-in-loop'],
    patterns: ['longest-contiguous-condition', 'count-subarrays-k'],
    target: 1,
    extras: ['Optional: re-solve LC 121 (from Nov 22) framed as a window — left = buy day, right = sell day; move left when a cheaper day appears'],
  },
  {
    date: '2026-11-26', theme: 'Stacks, queues, deque, and edge cases',
    focus: 'Stack, queue, `deque` and edge cases.',
    lessons: ['stacks-queues/stacks', 'stacks-queues/queues', 'stacks-queues/monotonic'],
    terms: ['stack', 'queue', 'amortized', 'edge-case', 'decreasing'],
    drills: ['pop-front', 'monotonic-stack'],
    patterns: ['most-recent-first', 'arrival-order', 'matching-brackets'],
    target: 4,
    extras: [],
  },
  {
    date: '2026-11-27', theme: 'Sorting, binary search, and intervals',
    focus: 'Sorting and binary search; intervals.',
    lessons: ['big-o/classes', 'search-sort/binary-search', 'search-sort/bounds', 'search-sort/sorting', 'patterns/intervals'],
    terms: ['binary-search', 'lower-bound', 'upper-bound', 'off-by-one', 'stable-ordering', 'range'],
    drills: ['binary-search-drill', 'sorting-then-scan', 'halving'],
    patterns: ['search-sorted', 'overlapping-ranges'],
    target: 3,
    extras: [],
  },
  {
    date: '2026-11-28', theme: 'Recursion, backtracking, and tree basics',
    focus: 'Recursion/backtracking, trees basics. The heaviest lesson day: do recursion → backtracking → permutations → combinations/subsets before the tree lessons, and stop after LC 46 and 78 if time runs short.',
    lessons: ['recursion/basics', 'big-o/recursion-space', 'recursion/backtracking', 'recursion/permutations', 'recursion/combinations-subsets', 'recursion/duplicates', 'recursion/digit-grouping', 'trees/terminology', 'trees/dfs'],
    terms: ['recursion', 'base-case', 'backtracking', 'permutation', 'combination', 'subset', 'factorial', 'depth', 'height'],
    drills: ['factorial-recursion', 'fib-naive', 'subsets-enum', 'permutations-enum', 'tree-dfs'],
    patterns: ['generate-arrangements', 'choose-k', 'all-subsets', 'group-digit-perms'],
    target: 4,
    extras: [],
  },
  {
    date: '2026-11-29', theme: 'Prefix sums and Kadane; timed mock',
    focus: 'Prefix sums and Kadane; timed mock. Kadane and Climbing Stairs are both 1-D dynamic programming: each keeps a small state and a transition from the previous step.',
    lessons: ['patterns/prefix-sums', 'patterns/kadane', 'patterns/dp'],
    terms: ['prefix', 'subarray', 'memoization', 'state', 'transition'],
    drills: ['prefix-hash', 'fib-naive'],
    patterns: ['count-subarrays-k', 'max-contiguous-sum', 'ways-to-climb'],
    target: 3,
    extras: ['Timed 45-minute technical mock'],
  },
  {
    date: '2026-11-30', theme: 'BFS/DFS overview, OOP, project defense, behavioral & product',
    focus: 'BFS/DFS overview, OOP, project defense, behavioral and product practice. Validate BST (DFS passing bounds) opens the day as the bridge from tree DFS to graph DFS; the three P1 problems are optional.',
    lessons: ['trees/bfs', 'graphs/representation', 'graphs/traversal', 'patterns/heaps', 'patterns/oop'],
    terms: ['invariant', 'bfs', 'dfs', 'connected-component', 'visited', 'shortest-path', 'directed-graph'],
    drills: ['grid-bfs', 'heap-topk'],
    patterns: ['connected-cells', 'unweighted-shortest', 'k-largest'],
    target: 3,
    extras: ['Project-defense cards', 'Behavioral STAR(R) stories', 'Product-thinking prompt'],
  },
  {
    date: '2026-12-01', theme: 'Revisit failures, two short mocks, rest',
    focus: 'Revisit failures, two short mocks, rest; no deep new topics.',
    lessons: [],
    terms: ['trade-off', 'invariant', 'edge-case', 'auxiliary-space'],
    drills: ['sliding-window-amortized', 'permutations-enum', 'group-anagrams-count'],
    patterns: ['count-subarrays-k', 'group-digit-perms', 'small-n-check'],
    target: 0,
    extras: ['Two short mocks', 'Clear the review queue', 'Rest'],
  },
  {
    date: '2026-12-02', theme: 'Interview day',
    focus: 'Interview-day checklist and short warm-up only.',
    lessons: [],
    terms: [],
    drills: ['sum-list'],
    patterns: [],
    target: 0,
    extras: ['Warm-up: re-explain one solved problem out loud', 'Checklist: quiet room, charger, water, Python editor, LeetCode logged in, STAR stories open'],
  },
];

export const interviewDayChecklist = [
  'Sleep and eat normally — no new topics today.',
  'Warm up for 15 minutes: explain Two Sum and Group Anagrams out loud, including Big-O.',
  'Have your STAR(R) stories and project cards open for a quick skim.',
  'Test your mic, camera, and the interview link 15 minutes early.',
  'During the interview: clarify → brute force → optimize → walk through → code → test → Big-O.',
  'It is fine to say "Let me think out loud for a moment."',
];
