/**
 * The seven-day guided bootcamp (sources/seven-day-bootcamp-request.md): Nov 25 – Dec 1, 2026.
 *
 * Every day is an ORDERED list of activities following the requested learning sequence
 * (learn → vocabulary → Big-O → visual walkthrough → pattern recognition → guided exercise →
 * LeetCode → mistake review → OOP → blind assessment → behavioral / architecture / product →
 * end-of-day review). Each activity points at real content by id; tests/bootcamp.test.ts checks
 * that every reference resolves.
 *
 * Minutes are the planned time for a first pass. lib/bootcamp.ts adapts them to recorded progress
 * (recaps for lessons already read, short retention checks for problems already solved
 * independently) and to the learner's hours budget (stretch, then reinforcement, is deferred).
 *
 * Allocation follows sources/scope-priority-correction.md: about 65% algorithms (dsa), 15% OOP,
 * 10% behavioral and product, 5% résumé architecture, 5% vocabulary and code reading.
 */
import { getLesson } from './modules';
import { getProblem } from './problems';
import { getDrill } from './drills';
import { decoderProblems } from './patterns';
import { behavioralPrompts, mockProblems, productPrompts } from './mocks';
import { getOopChallenge } from './oop-challenges';
import { getCodeReading } from './code-reading';
import { getProject } from './projects';

export const BOOTCAMP_START = '2026-11-25';
export const BOOTCAMP_END = '2026-12-01';
/** Default study hours on a full day; the learner can change it. */
export const DEFAULT_HOURS = 8;
/** The final day is lighter: its budget is this share of the daily hours. */
export const FINAL_DAY_SHARE = 0.6;

export type ActivityKind =
  | 'lesson' | 'terms' | 'reading' | 'drill' | 'visual' | 'patterns' | 'decoder' | 'mock' | 'problem' | 'review'
  | 'oop' | 'blind' | 'behavioral' | 'product' | 'project' | 'stories' | 'day-review' | 'review-plan';

export type Tier = 'core' | 'reinforcement' | 'stretch';
export type AllocationId = 'dsa' | 'oop' | 'behavioral' | 'resume' | 'vocab';

/** The requested 12-step learning sequence. `step` on an activity is its index here (1-based). */
export const SEQUENCE_STEPS = [
  'Learn the concept',
  'Vocabulary and code reading',
  'Big-O complexity',
  'Visual walkthrough',
  'Pattern recognition',
  'Guided exercise',
  'LeetCode problems',
  'Mistake review',
  'OOP',
  'Blind assessment',
  'Behavioral, architecture, product',
  'End-of-day review',
] as const;

export const TIER_LABELS: Record<Tier, string> = { core: 'Core', reinforcement: 'Reinforcement', stretch: 'Stretch' };

export const ALLOCATION_LABELS: Record<AllocationId, string> = {
  dsa: 'Algorithms & LeetCode',
  oop: 'Python OOP',
  behavioral: 'Behavioral & product',
  resume: 'Projects & architecture',
  vocab: 'Vocabulary & code reading',
};

export type BootcampActivity = {
  /** Stable id, e.g. "d1-lesson-hashing-frequency-maps". Used in the URL /study/<id> and in saved progress. */
  id: string;
  day: number;
  kind: ActivityKind;
  /** Position in SEQUENCE_STEPS (1–12). */
  step: number;
  title: string;
  /**
   * What the activity points at. lesson/visual: lesson key; terms: term ids; drill, decoder, mock, oop,
   * reading, behavioral, product, project: one id; problem: the LeetCode number; patterns: scenario ids;
   * blind: ordered candidate ids (the first one not attempted before the day is served).
   */
  refs: string[];
  minutes: number;
  tier: Tier;
  category: AllocationId;
  /** Shown above the content: what to focus on in this activity. */
  note?: string;
  /** Day 6 groups its activities into simulated interview rounds. */
  group?: string;
  /** Always a short recap (review days), whatever the lesson's status. */
  recap?: boolean;
};

export type BootcampDay = {
  day: number;
  date: string;
  title: string;
  topics: string[];
  objectives: string[];
  /** One-paragraph instruction shown on the home page. */
  focus: string;
  activities: BootcampActivity[];
};

// ------------------------------------------------------------------------------ builders

type Opt = { tier?: Tier; note?: string; group?: string; slug?: string; title?: string; recap?: boolean; category?: AllocationId };
type Draft = Omit<BootcampActivity, 'id' | 'day'> & { slug: string; tag: string };

const slugify = (s: string) => s.replace(/[/_ ]/g, '-').toLowerCase();
const lessonTitle = (key: string) => getLesson(key)?.lesson.title ?? key;

function act(kind: ActivityKind, tag: string, step: number, category: AllocationId, refs: string[], minutes: number, title: string, o: Opt = {}): Draft {
  return { kind, tag, step, category, refs, minutes, title: o.title ?? title, tier: o.tier ?? 'core', note: o.note, group: o.group, recap: o.recap, slug: o.slug ?? slugify(refs[0] ?? kind) };
}

const lesson = (key: string, minutes: number, o: Opt = {}) => {
  const oop = key.startsWith('oop/');
  return act('lesson', 'lesson', oop ? 9 : 1, o.category ?? (oop ? 'oop' : 'dsa'), [key], minutes, `${o.recap ? 'Recap: ' : ''}${lessonTitle(key)}`, o);
};
const terms = (slug: string, ids: string[], minutes: number, o: Opt = {}) =>
  act('terms', 'vocab', 2, 'vocab', ids, minutes, `Vocabulary: ${ids.length} interview terms`, { slug, ...o });
const reading = (id: string, minutes: number, o: Opt = {}) =>
  act('reading', 'read', 2, 'vocab', [id], minutes, `Code reading: ${getCodeReading(id)?.title ?? id}`, o);
const drill = (id: string, minutes: number, o: Opt = {}) =>
  act('drill', 'bigo', 3, 'dsa', [id], minutes, `Big-O drill: ${getDrill(id)?.title ?? id}`, o);
const visual = (key: string, minutes: number, o: Opt = {}) =>
  act('visual', 'visual', 4, 'dsa', [key], minutes, `Visual walkthrough: ${getLesson(key)?.lesson.visual?.title ?? lessonTitle(key)}`, o);
const patterns = (slug: string, ids: string[], minutes: number, o: Opt = {}) =>
  act('patterns', 'patterns', 5, 'dsa', ids, minutes, `Pattern recognition: ${ids.length} scenario${ids.length === 1 ? '' : 's'}`, { slug, ...o });
const decoder = (id: string, minutes: number, o: Opt = {}) =>
  act('decoder', 'decoder', 6, 'dsa', [id], minutes, `Guided decoder: ${decoderProblems.find((d) => d.id === id)?.title ?? id}`, o);
const mock = (id: string, minutes: number, o: Opt = {}) =>
  act('mock', 'mock', 6, 'dsa', [id], minutes, `Guided mock: ${mockProblems.find((m) => m.id === id)?.title ?? id}`, o);
const problem = (id: number, minutes: number, o: Opt = {}) => {
  const p = getProblem(id);
  return act('problem', 'lc', 7, 'dsa', [String(id)], minutes, p ? `${p.id}. ${p.title}` : `LC ${id}`, o);
};
const review = (minutes: number, o: Opt = {}) =>
  act('review', 'review', 8, 'dsa', [], minutes, 'Mistake review: what is due today', { slug: 'mistakes', ...o });
const oop = (id: string, minutes: number, o: Opt = {}) =>
  act('oop', 'oop', 9, 'oop', [id], minutes, `OOP challenge: ${getOopChallenge(id)?.title ?? id}`, o);
const blind = (slug: string, candidates: string[], minutes: number, o: Opt = {}) =>
  act('blind', 'blind', 10, 'dsa', candidates, minutes, 'Blind assessment: an unseen question', { slug, ...o });
const behavioral = (id: string, minutes: number, o: Opt = {}) =>
  act('behavioral', 'behavioral', 11, 'behavioral', [id], minutes, `Behavioral: ${behavioralPrompts.find((b) => b.id === id)?.prompt ?? id}`, o);
const product = (id: string, minutes: number, o: Opt = {}) =>
  act('product', 'product', 11, 'behavioral', [id], minutes, `Product: ${productPrompts.find((p) => p.id === id)?.prompt ?? id}`, o);
const project = (id: string, minutes: number, o: Opt = {}) =>
  act('project', 'project', 11, 'resume', [id], minutes, `Project: explain ${getProject(id)?.name ?? id}`, o);
const stories = (minutes: number, o: Opt = {}) =>
  act('stories', 'stories', 11, 'behavioral', [], minutes, 'STAR story bank: rehearse all six stories', { slug: 'bank', ...o });
const dayReview = (minutes: number, o: Opt = {}) =>
  act('day-review', 'wrap', 12, 'dsa', [], minutes, 'End-of-day review', { slug: 'end-of-day', ...o });
const reviewPlan = (minutes: number, o: Opt = {}) =>
  act('review-plan', 'plan', 12, 'dsa', [], minutes, 'Targeted review plan from today’s results', { slug: 'targeted-review', ...o });

function day(n: number, date: string, meta: Omit<BootcampDay, 'day' | 'date' | 'activities'>, drafts: Draft[]): BootcampDay {
  return {
    day: n, date, ...meta,
    activities: drafts.map(({ slug, tag, ...a }) => ({ ...a, id: `d${n}-${tag}-${slug}`, day: n })),
  };
}

const R1 = 'Round 1';
const R2 = 'Round 2';

// ------------------------------------------------------------------------------ the seven days

export const bootcampDays: BootcampDay[] = [
  day(1, '2026-11-25', {
    title: 'Arrays, strings and hashing',
    topics: ['Dictionaries and sets', 'Frequency counting', 'Counter and defaultdict', 'Array and string traversal', 'Time and space complexity'],
    objectives: [
      'Choose between a list scan, a set and a dict by the question each one answers in O(1).',
      'Count frequencies with Counter / defaultdict and build canonical keys.',
      'Read a problem for its characteristics, then go brute force → bottleneck → optimized out loud.',
      'Write your first class (constructor, self, methods) and build a phone book.',
    ],
    focus: 'Hashing is the most-reported Explore topic (Two Sum, Roman to Integer). Lessons you already completed on Nov 21–24 appear as short recaps. Problems you already solved independently are short retention checks: solve them cold, without hints.',
  }, [
    lesson('hashing/frequency-maps', 20),
    lesson('python/collections-module', 15),
    lesson('arrays/strings', 15, { tier: 'reinforcement' }),
    lesson('solving/characteristics', 25),
    lesson('solving/brute-to-optimal', 25),
    lesson('solving/code-reading', 12, { category: 'vocab', note: 'Code comprehension counts toward the 5% vocabulary and code-reading share.' }),
    terms('hashing', ['hashing', 'key-value-pair', 'frequency', 'set', 'duplicate', 'distinct', 'anagram', 'canonical-key'], 12),
    reading('sum-evens', 10, { note: 'A ColorStack-reported question type: explain a function you did not write.' }),
    drill('set-membership', 8),
    drill('string-concat', 8, { tier: 'reinforcement' }),
    visual('hashing/how-hashing-works', 8),
    patterns('hashing', ['pair-target-unsorted', 'same-chars-any-order', 'find-duplicates'], 12),
    decoder('decode-digit-groups', 15),
    problem(1, 20, { note: 'Reported in Explore interviews, with the follow-up "what if the array is sorted?". Say the brute force first.' }),
    problem(13, 25, { note: 'Reported in Explore interviews. List the characteristics before choosing a structure.' }),
    problem(217, 15),
    problem(242, 15),
    problem(49, 30),
    problem(344, 12),
    review(15),
    lesson('oop/classes-objects', 25),
    oop('phone-book', 45),
    blind('unseen', ['first-solo', 'sensor-repeat'], 25),
    behavioral('cs-why-cs', 15),
    behavioral('cs-teamwork', 15, { tier: 'reinforcement' }),
    product('gh-test-keyboard', 15, { tier: 'reinforcement' }),
    project('road-report', 20, { tier: 'reinforcement', note: 'Today: only the 30-second and 60-second versions. Architecture comes on Day 4.' }),
    dayReview(10),
  ]),

  day(2, '2026-11-26', {
    title: 'Two pointers and sliding window',
    topics: ['Opposite-direction pointers', 'Same-direction pointers', 'Sorted array traversal', 'Fixed and variable windows', 'Window state'],
    objectives: [
      'Recognise when sorted input or in-place rules call for two pointers.',
      'Maintain a window invariant: expand right, shrink left, update the answer.',
      'Test by input class (empty, one element, all equal, sorted, reversed).',
      'Use inheritance, super() and composition, then build the library system.',
    ],
    focus: 'Two pointers was reported as the Two Sum follow-up (sorted input). Sliding window is new today. Watch the trap: with negative values a window has no shrink rule (prefix sums are a stretch item).',
  }, [
    lesson('two-pointers/opposite', 15),
    lesson('two-pointers/same-direction', 15),
    lesson('sliding-window/fixed', 25),
    lesson('sliding-window/variable', 30),
    lesson('solving/testing-hints', 15),
    lesson('patterns/prefix-sums', 20, { tier: 'stretch' }),
    terms('windows', ['contiguous', 'subarray', 'substring', 'sorted', 'in-place', 'pointer', 'invariant', 'amortized'], 12),
    reading('has-duplicates', 10, { note: 'A ColorStack-reported question type: purpose, inputs, outputs, edge cases, complexity.' }),
    drill('sliding-window-amortized', 10),
    drill('two-pointers-converge', 8, { tier: 'reinforcement' }),
    visual('sliding-window/variable', 10),
    patterns('windows', ['pair-target-sorted', 'longest-contiguous-condition', 'small-n-check'], 12),
    patterns('prefix', ['count-subarrays-k'], 6, { tier: 'stretch' }),
    decoder('decode-window', 15),
    problem(125, 15),
    problem(283, 15),
    problem(26, 15),
    problem(167, 20, { note: 'Reported in Explore interviews as the sorted follow-up to Two Sum. Explain why O(1) space rules out the dict.' }),
    problem(121, 15),
    problem(3, 35),
    problem(560, 30, { tier: 'stretch' }),
    review(15),
    lesson('oop/inheritance-composition', 20),
    lesson('oop/references-collections', 15),
    oop('library', 40),
    blind('unseen', ['sensor-repeat', 'step-goal', 'legacy-years'], 25, { note: 'No pattern labels. Write the characteristics before choosing an approach.' }),
    behavioral('cs-team-poorly', 15),
    behavioral('cs-led', 15, { tier: 'reinforcement' }),
    product('cs-calendar', 15, { tier: 'reinforcement' }),
    project('zbxp', 20, { tier: 'reinforcement', note: 'Today: the 30-second and 60-second versions only.' }),
    dayReview(10),
  ]),

  day(3, '2026-11-27', {
    title: 'Linked lists, stacks and queues',
    topics: ['Nodes and references', 'Insertion and deletion', 'Dummy nodes', 'Fast and slow pointers', 'LIFO and FIFO', 'deque'],
    objectives: [
      'Draw pointer changes before coding them; use a dummy node when the head can change.',
      'Delete a node in every reported variant (by value, given only the node).',
      'Pick a stack for "most recent first" and a queue for "arrival order".',
      'Manage a collection of objects with validation and copying: the reported Canva question.',
    ],
    focus: 'Two linked-list questions were reported (merge two sorted lists, remove a node), and so was the simplified Canva OOP question. Today you attempt Canva guided; on Day 5 you redo it timed.',
  }, [
    lesson('linked-lists/nodes', 15),
    lesson('linked-lists/remove', 20),
    lesson('two-pointers/fast-slow', 15),
    lesson('stacks-queues/stacks', 20),
    lesson('stacks-queues/queues', 20),
    lesson('stacks-queues/monotonic', 20, { tier: 'stretch' }),
    terms('lists-stacks', ['node', 'reference', 'cycle', 'stack', 'queue', 'edge-case'], 10),
    reading('dedupe-keep-order', 10),
    drill('pop-front', 10),
    drill('fast-slow-drill', 8, { tier: 'stretch' }),
    drill('monotonic-stack', 8, { tier: 'stretch' }),
    visual('linked-lists/remove', 10),
    patterns('lists-stacks', ['most-recent-first', 'arrival-order', 'matching-brackets', 'list-cycle'], 12),
    decoder('decode-brackets', 12),
    problem(206, 15),
    problem(21, 20, { note: 'Reported in Explore interviews. Use a dummy head and a tail pointer.' }),
    problem(141, 15),
    problem(237, 20, { note: 'Reported in Explore interviews: you get only the node to delete, not the head.' }),
    problem(20, 20),
    problem(232, 25),
    problem(203, 20, { note: 'Reported in Explore interviews (remove a node). Try it with and without a dummy node.' }),
    problem(155, 30, { tier: 'stretch' }),
    problem(83, 15, { tier: 'stretch' }),
    problem(19, 30, { tier: 'stretch' }),
    review(15),
    lesson('oop/copying', 20),
    oop('canva', 50, { note: 'Reported Explore question. Ask about the inferred requirements before coding.' }),
    blind('unseen', ['draft-keystrokes', 'middle-carriage'], 25),
    behavioral('cs-conflict', 15),
    behavioral('cs-little-guidance', 15, { tier: 'reinforcement' }),
    product('cs-remote-comms', 15, { tier: 'reinforcement' }),
    project('speaklab', 15, { tier: 'reinforcement', note: 'Today: the 30-second and 60-second versions only.' }),
    dayReview(10),
  ]),

  day(4, '2026-11-28', {
    title: 'Recursion and binary trees',
    topics: ['Base and recursive cases', 'The call stack', 'Returning recursive results', 'Execution tracing', 'Binary tree structure', 'DFS', 'BFS'],
    objectives: [
      'State what a recursive function returns in one sentence, then write its base case first.',
      'Trace frames by hand: what each call waits for, when it returns, how the caller combines results.',
      'Solve tree problems with DFS (recursion) and BFS (queue, level by level).',
      'Explain Road Report’s architecture and data flow in two minutes.',
    ],
    focus: 'Recursion is your weakest area, so today is mostly tracing. Step through every call-stack frame and predict the next step before pressing Next. On each tree problem, trace a three-node example on paper before coding.',
  }, [
    lesson('recursion/basics', 20),
    lesson('recursion/call-stack', 30),
    lesson('big-o/recursion-space', 10),
    lesson('trees/terminology', 15),
    lesson('trees/dfs', 25),
    lesson('trees/bfs', 20),
    terms('recursion-trees', ['recursion', 'base-case', 'depth', 'height', 'leaf', 'dfs', 'bfs', 'traversal'], 12),
    reading('palindrome-check', 10),
    drill('factorial-recursion', 10),
    drill('tree-dfs', 10),
    drill('fib-naive', 8, { tier: 'stretch' }),
    visual('recursion/call-stack', 15, { note: 'Second pass on the frames: cover the note, say what the next step is, then press Next.' }),
    visual('trees/dfs', 10, { tier: 'stretch' }),
    patterns('trees', ['unweighted-shortest'], 8, { tier: 'reinforcement' }),
    problem(104, 20),
    problem(226, 15),
    problem(100, 20),
    problem(98, 35),
    problem(102, 30),
    review(15),
    oop('bank-account', 45, { tier: 'reinforcement', note: 'Keeps OOP fresh before the Day 6 simulation: inheritance, super() and validation.' }),
    blind('unseen', ['trail-total'], 25, { note: 'An unseen recursive question. Trace a small example before coding.' }),
    project('road-report', 25, { note: 'Today: architecture and data flow. Only claim what the grounded facts support.' }),
    behavioral('cs-persistence', 15),
    behavioral('cs-technical-competence', 15, { tier: 'reinforcement' }),
    product('gh-explain-computer', 15, { tier: 'reinforcement' }),
    dayReview(10),
  ]),

  day(5, '2026-11-29', {
    title: 'Backtracking, sorting and binary search',
    topics: ['Decision trees', 'Choose, explore, undo', 'Recursive state', 'Sorting trade-offs', 'Binary search boundaries'],
    objectives: [
      'Draw the decision tree, then write choose → explore → un-choose with a copied path.',
      'Pick lo/hi and the loop condition from the invariant, and test the boundaries.',
      'Explain when sorting first is worth O(n log n).',
      'Explain SpeakLab AI and ZBXP; practise two product questions.',
    ],
    focus: 'Backtracking builds directly on yesterday’s call stack. Graphs, matrices and basic DP are secondary topics: they are stretch items and are deferred automatically when the day runs long.',
  }, [
    lesson('recursion/backtracking', 25),
    lesson('recursion/permutations', 20),
    lesson('recursion/combinations-subsets', 20),
    lesson('search-sort/sorting', 15),
    lesson('big-o/classes', 10),
    lesson('search-sort/binary-search', 15),
    lesson('search-sort/bounds', 10),
    lesson('recursion/digit-grouping', 15, { tier: 'reinforcement' }),
    lesson('patterns/intervals', 15, { tier: 'stretch' }),
    lesson('solving/math-simulation', 15, { tier: 'stretch' }),
    lesson('recursion/duplicates', 15, { tier: 'stretch' }),
    lesson('graphs/representation', 15, { tier: 'stretch' }),
    lesson('graphs/traversal', 25, { tier: 'stretch' }),
    lesson('patterns/dp', 20, { tier: 'stretch' }),
    lesson('patterns/kadane', 15, { tier: 'stretch' }),
    lesson('patterns/heaps', 15, { tier: 'stretch' }),
    terms('backtracking-search', ['backtracking', 'permutation', 'subset', 'combination', 'binary-search', 'lower-bound', 'off-by-one', 'stable-ordering'], 12),
    reading('second-largest', 10),
    drill('subsets-enum', 10),
    drill('binary-search-drill', 10),
    drill('permutations-enum', 8, { tier: 'reinforcement' }),
    visual('recursion/backtracking', 10),
    patterns('backtracking-search', ['generate-arrangements', 'choose-k', 'all-subsets', 'search-sorted'], 12),
    patterns('secondary', ['connected-cells', 'max-contiguous-sum', 'ways-to-climb'], 8, { tier: 'stretch' }),
    decoder('decode-intervals', 12, { tier: 'stretch' }),
    problem(78, 25),
    problem(46, 30),
    problem(704, 15),
    problem(35, 15),
    problem(268, 15, { note: 'Historical report. There are four correct approaches: explain the trade-offs.' }),
    problem(56, 30, { tier: 'stretch' }),
    problem(1344, 25, { tier: 'stretch' }),
    problem(733, 20, { tier: 'stretch' }),
    problem(200, 30, { tier: 'stretch' }),
    problem(70, 20, { tier: 'stretch' }),
    problem(53, 25, { tier: 'stretch' }),
    review(15),
    oop('canva', 45, { tier: 'reinforcement', slug: 'canva-timed', title: 'OOP challenge: Simplified Canva, timed re-attempt', note: 'Start a fresh attempt and give yourself 45 minutes, no reference. This is the reported question.' }),
    blind('unseen', ['badge-compact', 'gadget-trade', 'budget-tickets'], 25, { note: 'An unseen foundational question.' }),
    project('speaklab', 15, { note: 'Architecture and data flow.' }),
    project('zbxp', 15, { note: 'Architecture and data flow.' }),
    product('gh-test-pen', 15),
    product('gh-calculator-vi', 15),
    behavioral('cs-pm-or-swe', 15, { tier: 'reinforcement' }),
    dayReview(10),
  ]),

  day(6, '2026-11-30', {
    title: 'Mixed interview simulation',
    topics: ['Blind Easy and Medium coding', 'Practical OOP', 'Code comprehension', 'Complexity and edge cases', 'Behavioral', 'Product design'],
    objectives: [
      'Run two simulated interview rounds: talk out loud, keep to the time, no notes.',
      'Solve unlabeled questions: characteristics → approach → brute force → optimize → test.',
      'Finish with a targeted review plan built from what you actually missed.',
    ],
    focus: 'No new material today. Coding questions show no pattern, difficulty or source until you commit to an approach. Treat each round as the real interview: a timer, out loud, then record honestly.',
  }, [
    blind('r1-q1', ['legacy-years', 'config-nesting', 'sign-check', 'step-goal'], 30, { group: R1, title: 'Round 1 · Coding question 1' }),
    blind('r1-q2', ['song-streak', 'booked-ranges', 'product-codes'], 30, { group: R1, title: 'Round 1 · Coding question 2' }),
    reading('find-max', 10, { group: R1, note: 'Explain it as if the interviewer just pasted it: purpose, inputs, outputs, edge cases.' }),
    drill('nested-different', 10, { group: R1, note: 'Complexity analysis out loud: name every size variable.' }),
    behavioral('cs-adapted-style', 12, { group: R1 }),
    product('cs-app-scope-market', 15, { group: R1 }),
    blind('r2-q1', ['detach-cars', 'playlist-merge', 'middle-carriage', 'mirror-tree'], 30, { group: R2, title: 'Round 2 · Coding question 1' }),
    blind('r2-q2', ['store-orders', 'ledger-runs', 'clock-hands', 'budget-tickets'], 30, { group: R2, title: 'Round 2 · Coding question 2' }),
    oop('parking-lot', 50, { group: R2, note: 'An OOP question you have not seen. Clarify, build in stages, test each stage.' }),
    reading('count-words', 10, { group: R2 }),
    drill('doubling-inner', 10, { group: R2 }),
    behavioral('cs-tick', 12, { group: R2 }),
    product('cs-remote-phone', 15, { group: R2, tier: 'reinforcement' }),
    patterns('mixed', ['group-digit-perms', 'count-subarrays-k', 'overlapping-ranges'], 12, { tier: 'reinforcement' }),
    mock('mock-longest-substring', 30, { tier: 'reinforcement' }),
    blind('extra-1', ['empty-seat', 'long-digits', 'gadget-trade'], 30, { tier: 'reinforcement', title: 'Extra coding question' }),
    blind('extra-2', ['clock-hands', 'ledger-runs', 'mirror-tree', 'product-codes'], 30, { tier: 'stretch', title: 'Extra coding question (stretch)' }),
    project('zbxp', 20, { tier: 'reinforcement', note: 'Answer two of the realistic follow-ups out loud.' }),
    review(20),
    reviewPlan(20),
  ]),

  day(7, '2026-12-01', {
    title: 'Final review and retention',
    topics: ['Reattempt failed problems', 'Common patterns', 'Python OOP fundamentals', 'Explaining complexity', 'Project explanations', 'STAR stories'],
    objectives: [
      'Reattempt what you failed, cold, and confirm what you retained.',
      'Re-explain patterns, OOP basics and Big-O out loud without notes.',
      'Rehearse projects and STAR stories, then finish with one short confidence mock.',
    ],
    focus: 'A lighter day: no new topics. Stop when the list is done and rest. Tomorrow is the interview.',
  }, [
    review(45, { note: 'Reattempt previously failed problems and assessments first. Record honestly; anything still shaky goes on your interview-morning skim list.' }),
    lesson('solving/characteristics', 10, { recap: true }),
    patterns('final', ['small-n-check', 'group-digit-perms', 'all-subsets', 'search-sorted'], 15),
    drill('halving', 8, { note: 'Explain time and space out loud before submitting.' }),
    drill('all-pairs', 8, { tier: 'reinforcement' }),
    lesson('oop/classes-objects', 8, { recap: true }),
    lesson('oop/inheritance-composition', 8, { recap: true, tier: 'reinforcement' }),
    lesson('oop/copying', 8, { recap: true, tier: 'reinforcement' }),
    terms('final', ['trade-off', 'invariant', 'edge-case', 'auxiliary-space', 'time-complexity', 'space-complexity'], 10),
    project('road-report', 8, { note: 'Say the 60-second version out loud once.' }),
    project('speaklab', 8, { note: 'Say the 60-second version out loud once.' }),
    project('zbxp', 8, { tier: 'reinforcement', note: 'Say the 60-second version out loud once.' }),
    stories(20),
    behavioral('cs-why-hire', 10),
    mock('mock-two-sum', 25, { note: 'A short confidence mock on a problem you know: 20 minutes, out loud, then score yourself.' }),
    dayReview(10, { title: 'Final review and interview checklist' }),
  ]),
];

export const allActivities: BootcampActivity[] = bootcampDays.flatMap((d) => d.activities);

export function getActivity(id: string): BootcampActivity | undefined {
  return allActivities.find((a) => a.id === id);
}

export function getBootcampDay(n: number): BootcampDay | undefined {
  return bootcampDays.find((d) => d.day === n);
}

/** The day whose date is `date`, if any. */
export function bootcampDayByDate(date: string): BootcampDay | undefined {
  return bootcampDays.find((d) => d.date === date);
}
