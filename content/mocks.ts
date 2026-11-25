export type MockStepId =
  | 'clarify'
  | 'io'
  | 'assumptions'
  | 'brute'
  | 'improve'
  | 'structure'
  | 'walkthrough'
  | 'bigo'
  | 'edge'
  | 'tradeoffs';

export const mockSteps: { id: MockStepId; title: string; prompt: string }[] = [
  { id: 'clarify', title: 'Clarify the problem', prompt: 'Restate the problem in your own words. What questions would you ask the interviewer before solving?' },
  { id: 'io', title: 'Inputs and outputs', prompt: 'What exactly is the input (types, sizes)? What exactly must be returned?' },
  { id: 'assumptions', title: 'State assumptions', prompt: 'Which assumptions are you making (value ranges, duplicates, empty input, can the input be modified)?' },
  { id: 'brute', title: 'Propose brute force', prompt: 'Describe a simple correct approach and its time/space complexity.' },
  { id: 'improve', title: 'Improve the solution', prompt: 'What repeated work does brute force do? How can you remove it?' },
  { id: 'structure', title: 'Justify the data structure', prompt: 'Which data structure(s) will you use, and why are they better than the alternatives here?' },
  { id: 'walkthrough', title: 'Walk through an example', prompt: 'Trace your algorithm on a small example, showing the state after each step.' },
  { id: 'bigo', title: 'Calculate Big-O', prompt: 'Derive time and auxiliary space. Name every size variable.' },
  { id: 'edge', title: 'Test edge cases', prompt: 'List the edge cases you would test and what your code returns for each.' },
  { id: 'tradeoffs', title: 'Explain trade-offs', prompt: 'Compare your approach with at least one alternative. When would you choose the other one?' },
];

export type MockProblem = {
  id: string;
  title: string;
  label?: string;
  statement: string;
  leetcode?: number;
  /** Model talking points per step, revealed only after the learner writes an answer. */
  points: Record<MockStepId, string[]>;
  followUps: string[];
};

export const mockProblems: MockProblem[] = [
  {
    id: 'digit-buckets',
    title: 'Digit-permutation buckets',
    label: 'Candidate-reported problem reconstruction (2025 Microsoft Explore report). NOT an official or verified question — wording and details are reconstructed for practice.',
    statement: 'Given a list of three-digit integers, group together the numbers whose digits are permutations of each other. Example: [112, 121, 211, 123, 321] → [[112, 121, 211], [123, 321]].',
    leetcode: 49,
    points: {
      clarify: ['"Two numbers go together if one is a rearrangement of the other\'s digits."', 'Ask: are numbers distinct? Can there be negatives? Is 011 possible (no — three-digit integers)? Does output order matter?'],
      io: ['Input: list of n integers (100–999).', 'Output: list of groups; each group is a list of integers.'],
      assumptions: ['Positive three-digit integers, so d = 3 digits and no leading zeros.', 'Duplicates, if present, go in the same group.', 'Any output order is acceptable.'],
      brute: ['Compare every pair with a digit Counter: O(n² · d) time.', 'Or for each number generate all d! digit arrangements and look them up: O(n · d! · d).'],
      improve: ['The pairwise check repeats the same "digit multiset" computation; compute it ONCE per number as a key.', 'Equal keys ⇔ same group, so a hash map does the grouping in one pass.'],
      structure: ['defaultdict(list) mapping canonical key → numbers.', 'Key: tuple of 10 digit counts (hashable) or "".join(sorted(str(x))).', 'Lists cannot be keys; tuples can.'],
      walkthrough: ['112 → counts (0,2,1,0,…) → new group.', '121, 211 → same key → same group.', '123, 321 → key (0,1,1,1,0,…) → second group.', '101 and 110 → (1,2,0,…) → together.'],
      bigo: ['n numbers × O(d) to count digits + O(10) to build the key → O(n · d) = O(n) for d = 3.', 'Space: O(n) keys + O(n) output.'],
      edge: ['Empty list → [].', 'All numbers in one group (e.g. 123, 132, 213, 231, 312, 321).', 'Repeated digits (111, 112).', 'Zeros: 101 vs 110 (same) vs 100 (different).', 'Duplicate values if allowed.'],
      tradeoffs: ['Sorted-string key: O(d log d) per number — same in practice for d = 3, simpler to write.', 'Count key scales better for long numbers/strings.', 'Generating permutations only makes sense if the OUTPUT is the arrangements.'],
    },
    followUps: ['What if numbers can have any number of digits?', 'What if negative numbers appear — should -123 group with 321?', 'How would you return only the largest group? (Track max size.)', 'Compare with LeetCode 49 Group Anagrams: what changes between 26 letters and 10 digits?'],
  },
  {
    id: 'mock-group-anagrams',
    title: 'Group Anagrams',
    statement: 'Group a list of lowercase words so that anagrams are together.',
    leetcode: 49,
    points: {
      clarify: ['Anagram = same letters, same counts, any order.', 'Lowercase English only? Empty strings allowed?'],
      io: ['Input: list of n strings, each up to length k.', 'Output: list of groups.'],
      assumptions: ['Lowercase a–z → 26-slot counts possible.', 'Output order does not matter.'],
      brute: ['Pairwise Counter comparisons: O(n² · k).'],
      improve: ['Canonical key per word, group with a hash map.'],
      structure: ['defaultdict(list); key = tuple(26 counts) or sorted string.'],
      walkthrough: ['eat → aet; tea → aet; tan → ant; ate → aet; nat → ant; bat → abt.'],
      bigo: ['Count key: O(n · k) time. Sorted key: O(n · k log k).', 'Space: O(n · k).'],
      edge: ['[""] → [[""]].', 'All words identical.', 'Single word.'],
      tradeoffs: ['Sorted key is simpler; count key is asymptotically faster for long words.'],
    },
    followUps: ['What if the input includes Unicode?', 'How would you stream words that don’t fit in memory?'],
  },
  {
    id: 'mock-two-sum',
    title: 'Two Sum',
    statement: 'Return indices of the two numbers in an array that add up to a target.',
    leetcode: 1,
    points: {
      clarify: ['Exactly one solution? Can I use the same element twice (no)?', 'Return indices in any order?'],
      io: ['Input: nums (n ints), target.', 'Output: two indices.'],
      assumptions: ['Exactly one answer exists; values may be negative or repeated.'],
      brute: ['All pairs: O(n²) time, O(1) space.'],
      improve: ['For each x, the partner is target − x; remember values already seen.'],
      structure: ['dict value → index; average O(1) lookup.'],
      walkthrough: ['[2, 7, 11, 15], 9: see 2 (store), see 7 → need 2 → found at 0 → [0, 1].'],
      bigo: ['O(n) time, O(n) space.'],
      edge: ['[3, 3], target 6.', 'Negative numbers.', '[3, 2, 4], target 6 — do not pair 3 with itself.'],
      tradeoffs: ['Sorted + two pointers: O(n log n) and loses indices unless pairs are sorted with their indices.'],
    },
    followUps: ['What if the array were sorted? (Two Sum II)', 'Return all pairs instead of one?'],
  },
  {
    id: 'mock-merge-intervals',
    title: 'Merge Intervals',
    statement: 'Merge all overlapping intervals and return the non-overlapping result.',
    leetcode: 56,
    points: {
      clarify: ['Do touching intervals ([1,4],[4,5]) count as overlapping?', 'Is the input sorted? Can I modify it?'],
      io: ['Input: list of n [start, end].', 'Output: merged list.'],
      assumptions: ['start ≤ end; touching intervals merge.'],
      brute: ['Repeatedly merge any overlapping pair until none remain: O(n²) or worse.'],
      improve: ['After sorting by start, only the last merged interval can overlap the next one.'],
      structure: ['Sorted list + output list used like a stack (merged[-1]).'],
      walkthrough: ['[[1,3],[2,6],[8,10],[15,18]] → [1,6], [8,10], [15,18].'],
      bigo: ['O(n log n) time (sort), O(n) space.'],
      edge: ['Empty.', 'One interval.', 'Containment [1,10],[2,3].', 'All overlapping.'],
      tradeoffs: ['If intervals arrive already sorted, the merge is O(n).'],
    },
    followUps: ['Insert a new interval into a sorted, merged list.', 'Count the minimum removals to make intervals non-overlapping.'],
  },
  {
    id: 'mock-max-subarray',
    title: 'Maximum Subarray',
    statement: 'Find the contiguous subarray with the largest sum and return its sum.',
    leetcode: 53,
    points: {
      clarify: ['Non-empty subarray? Values may be negative?'],
      io: ['Input: nums of length n.', 'Output: an integer.'],
      assumptions: ['n ≥ 1; negatives allowed.'],
      brute: ['All subarrays with running sums: O(n²).'],
      improve: ['The best subarray ending at i depends only on the best ending at i − 1.'],
      structure: ['Two scalars: cur and best.'],
      walkthrough: ['[-2,1,-3,4,-1,2,1,-5,4]: cur restarts at 1, then at 4, grows to 6.'],
      bigo: ['O(n) time, O(1) space.'],
      edge: ['All negative → largest element.', 'Single element.'],
      tradeoffs: ['Divide and conquer is O(n log n) — mention as a follow-up only.'],
    },
    followUps: ['Return the subarray indices too.', 'Maximum product subarray.'],
  },
  {
    id: 'mock-reverse-list',
    title: 'Reverse Linked List',
    statement: 'Reverse a singly linked list and return the new head.',
    leetcode: 206,
    points: {
      clarify: ['Iterative or recursive preferred? Can I modify the nodes?'],
      io: ['Input: head (may be None).', 'Output: new head.'],
      assumptions: ['Modify in place.'],
      brute: ['Copy values to a list, rebuild reversed: O(n) time, O(n) space.'],
      improve: ['Rewire next pointers in place with prev/curr/nxt.'],
      structure: ['Three references.'],
      walkthrough: ['1→2→3: flip 1, then 2→1, then 3→2→1.'],
      bigo: ['O(n) time; O(1) space iterative, O(n) recursive.'],
      edge: ['Empty list.', 'One node.'],
      tradeoffs: ['Recursive is elegant but uses O(n) stack and can hit the recursion limit.'],
    },
    followUps: ['Reverse only positions left..right.', 'Reverse in groups of k.'],
  },
  {
    id: 'mock-longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    statement: 'Return the length of the longest substring with all distinct characters.',
    leetcode: 3,
    points: {
      clarify: ['Character set? Empty string?'],
      io: ['Input: string s.', 'Output: integer length.'],
      assumptions: ['Any ASCII characters.'],
      brute: ['Check every substring: O(n²) substrings × O(n) check → O(n³).'],
      improve: ['Sliding window: maintain a window with no repeats and only move pointers forward.'],
      structure: ['Set of window characters (or dict of last index).'],
      walkthrough: ['"abcabcbb": abc (3), then shrink on each repeat; best stays 3.'],
      bigo: ['O(n) amortized; O(min(n, alphabet)) space.'],
      edge: ['"" → 0.', '"bbbb" → 1.', '"pwwkew" → 3.'],
      tradeoffs: ['Last-index dict jumps left directly; same Big-O.'],
    },
    followUps: ['At most two distinct characters.', 'Return the substring itself.'],
  },
];

export const rubric = [
  { id: 'clarity', label: 'Clarity', describe: 'Restated the problem, asked good questions, explained steps in order.' },
  { id: 'correctness', label: 'Correctness', describe: 'Algorithm handles all cases; walkthrough matches the approach.' },
  { id: 'efficiency', label: 'Efficiency', describe: 'Reached an appropriate Big-O and derived it, naming variables.' },
  { id: 'testing', label: 'Testing', describe: 'Listed meaningful edge cases and traced at least one.' },
  { id: 'communication', label: 'Collaboration', describe: 'Thought out loud, discussed trade-offs, responded to follow-ups.' },
] as const;

export type RubricId = (typeof rubric)[number]['id'];

// ------------------------- Behavioral (STAR(R)) -------------------------

/** Story-bank slots: a few reusable stories cover most behavioral questions (scope correction §6). */
export type StorySlotId = 'lead' | 'build' | 'team-trouble' | 'ambiguity' | 'persistence' | 'pitch';

export const storySlots: { id: StorySlotId; title: string; covers: string; seeds: string[] }[] = [
  { id: 'lead', title: 'Leading people under pressure', covers: 'Leadership, teamwork, conflict, adapting your style',
    seeds: ['Résumé: Security Team Lead, Universal Studios Florida (Aug 2021 – Aug 2023) — led a 12-person team during park operations serving 30,000–35,000 daily visitors; coordinated assignments, real-time incident response, and communication with staff and park leadership.', 'Pick ONE specific shift or incident. The details must be yours.'] },
  { id: 'build', title: 'A technical thing I built and can defend', covers: 'Technical competence, technical decisions, "why should we hire you"',
    seeds: ['Road Report classifier (your code + tests), the ZBXP XP ledger and data model, or the SpeakLab backend/analysis — see Mock → Projects for the grounded facts.', 'Choose the one where you can explain a decision and a trade-off without notes.'] },
  { id: 'team-trouble', title: 'A team project that was going poorly', covers: 'Team project going poorly, conflict, adapting your working style',
    seeds: ['Candidates from your own work: a hackathon (Road Report) or coordinating SpeakLab teammates as technical lead.', 'What was going wrong, what did YOU change, and what happened after?'] },
  { id: 'ambiguity', title: 'Little information or guidance', covers: 'Ambiguous projects, learning fast, initiative',
    seeds: ['A project where you had to define the scope yourself or learn a technology quickly.', 'Show how you reduced the ambiguity: questions you asked, a prototype, a decision you wrote down.'] },
  { id: 'persistence', title: 'Persistence when it was hard', covers: 'Persistence, failure, receiving feedback',
    seeds: ['A bug, a rejected idea or a setback you kept working through.', 'End with what you would do differently — the reflection is the point.'] },
  { id: 'pitch', title: 'My pitch: why CS, why Microsoft, what makes me tick', covers: 'Why CS, what makes you tick, PM vs SWE, why should Microsoft hire you',
    seeds: ['Not a STAR story: 3–4 sentences connecting your background (security lead, Boys & Girls Club volunteer, the projects you built) to what you want to learn in Explore.', 'Explore rotates through SWE and PM — have a genuine answer for which you lean toward and why.'] },
];

export type PromptSource = 'colorstack-reported' | 'github-historical' | 'general';

export const behavioralPrompts: { id: string; theme: string; prompt: string; tip: string; source: PromptSource; slot?: StorySlotId }[] = [
  // ColorStack-reported (sources/colorstack-explore-research.md §5)
  { id: 'cs-teamwork', theme: 'Teamwork', source: 'colorstack-reported', slot: 'lead', prompt: 'How do you work in a team?', tip: 'Give one habit and one example: how you split work, communicate status, and handle disagreement.' },
  { id: 'cs-why-cs', theme: 'Motivation', source: 'colorstack-reported', slot: 'pitch', prompt: 'What made you pursue computer science?', tip: 'A specific moment or project, not "I always liked computers". Connect it to what you build now.' },
  { id: 'cs-persistence', theme: 'Persistence', source: 'colorstack-reported', slot: 'persistence', prompt: 'Describe a time your persistence allowed you to achieve something others could not.', tip: 'Make the obstacle concrete and show the specific things you tried, not just that you "kept going".' },
  { id: 'cs-team-poorly', theme: 'Teamwork', source: 'colorstack-reported', slot: 'team-trouble', prompt: 'Describe a team project that was going poorly and how you responded.', tip: 'Do not blame teammates. Spend the time on what you changed and the result.' },
  { id: 'cs-tick', theme: 'Motivation', source: 'colorstack-reported', slot: 'pitch', prompt: 'What makes you tick?', tip: 'One honest driver plus evidence from something you did.' },
  { id: 'cs-little-guidance', theme: 'Ambiguity', source: 'colorstack-reported', slot: 'ambiguity', prompt: 'Describe a project where you received very little information or guidance.', tip: 'Show how you created structure: questions, a small prototype, a written plan.' },
  { id: 'cs-technical-competence', theme: 'Technical', source: 'colorstack-reported', slot: 'build', prompt: 'Describe a time you had to demonstrate your technical competence.', tip: 'Pick a decision you can explain in depth; interviewers may follow up on details.' },
  { id: 'cs-adapted-style', theme: 'Adaptability', source: 'colorstack-reported', slot: 'team-trouble', prompt: 'Describe a time you adapted your working style within a team.', tip: 'Name your default style, why it did not fit, and what you changed.' },
  { id: 'cs-conflict', theme: 'Conflict', source: 'colorstack-reported', slot: 'lead', prompt: 'Describe a time you resolved a team conflict.', tip: 'Listening first, then a shared goal or data to decide — not "I convinced them".' },
  { id: 'cs-led', theme: 'Leadership', source: 'colorstack-reported', slot: 'lead', prompt: 'Describe a time you led a team or project.', tip: 'Your security-lead role is a real leadership story; quantify only with résumé facts.' },
  { id: 'cs-pm-or-swe', theme: 'Motivation', source: 'colorstack-reported', slot: 'pitch', prompt: 'Do you lean more toward product management or software engineering?', tip: 'Either answer is fine — give a reason and show curiosity about the other side (Explore rotates through both).' },
  { id: 'cs-why-hire', theme: 'Motivation', source: 'colorstack-reported', slot: 'pitch', prompt: 'Why should Microsoft hire you?', tip: 'Three points with evidence: what you build, how you work with people, how fast you learn.' },
  // Earlier general prompts (kept so existing story cards keep their prompt and tip)
  { id: 'why-microsoft', theme: 'Motivation', source: 'general', slot: 'pitch', prompt: 'Why Microsoft?', tip: 'Connect a specific product, mission statement, or technology to something you have actually built or used. Avoid generic praise.' },
  { id: 'why-explore', theme: 'Motivation', source: 'general', slot: 'pitch', prompt: 'Why the Explore program?', tip: 'Explore rotates through software engineering and program/product management — say what you want to learn from both.' },
  { id: 'teamwork', theme: 'Teamwork', source: 'general', slot: 'lead', prompt: 'Tell me about a time you worked on a team to deliver something.', tip: 'Make your personal contribution explicit: "I" for your actions, "we" only for shared outcomes.' },
  { id: 'conflict', theme: 'Conflict', source: 'general', slot: 'lead', prompt: 'Describe a disagreement with a teammate and how you resolved it.', tip: 'Show listening and data-driven resolution, not winning the argument.' },
  { id: 'failure', theme: 'Growth', source: 'general', slot: 'persistence', prompt: 'Tell me about a time something you built did not work as planned.', tip: 'Spend most of the time on what you changed afterwards (Reflection).' },
  { id: 'feedback', theme: 'Growth', source: 'general', slot: 'persistence', prompt: 'Describe a time you received difficult feedback.', tip: 'Name the feedback, the action you took, and evidence that you improved.' },
  { id: 'pressure', theme: 'Adaptability', source: 'general', slot: 'lead', prompt: 'Tell me about a time you had to deliver under a tight deadline.', tip: 'Explain how you prioritized and what you deliberately cut.' },
  { id: 'learn-fast', theme: 'Adaptability', source: 'general', slot: 'ambiguity', prompt: 'Describe a time you had to learn a new technology quickly.', tip: 'Describe your learning process — that is what transfers to the internship.' },
  { id: 'leadership', theme: 'Leadership', source: 'general', slot: 'lead', prompt: 'Tell me about a time you took initiative without being asked.', tip: 'Leadership can be small: unblocking a teammate, writing docs, organizing tests.' },
  { id: 'project-decision', theme: 'Technical judgment', source: 'general', slot: 'build', prompt: 'Walk me through a technical decision you made on a project and the alternatives you considered.', tip: 'Use Mock → Projects; quantify only with numbers you can verify.' },
];

export const starFields = [
  { id: 'situation', label: 'Situation', hint: 'Context in 1–2 sentences: where, when, who.' },
  { id: 'task', label: 'Task', hint: 'Your responsibility or the goal.' },
  { id: 'action', label: 'Action', hint: 'What YOU did, step by step. The longest part.' },
  { id: 'result', label: 'Result', hint: 'Outcome — measurable only if you can verify it.' },
  { id: 'reflection', label: 'Reflection', hint: 'What you learned or would do differently.' },
] as const;

export type StarFieldId = (typeof starFields)[number]['id'];

// ------------------------- Project defense -------------------------

export const projectFields = [
  { id: 'problem', label: 'Problem', hint: 'What problem did the project solve, and for whom?' },
  { id: 'contribution', label: 'My contribution', hint: 'Exactly what you built or decided.' },
  { id: 'constraints', label: 'Constraints', hint: 'Time, team size, technology, data, budget.' },
  { id: 'alternatives', label: 'Alternatives considered', hint: 'At least one other approach and why you did not pick it.' },
  { id: 'implementation', label: 'Implementation', hint: 'Architecture in 3–4 sentences.' },
  { id: 'tradeoffs', label: 'Trade-offs', hint: 'What you gave up for what you gained.' },
  { id: 'testing', label: 'Testing', hint: 'How you knew it worked.' },
  { id: 'results', label: 'Results', hint: 'Only verifiable outcomes.' },
  { id: 'lessons', label: 'Lessons', hint: 'What you would change next time.' },
] as const;

export type ProjectFieldId = (typeof projectFields)[number]['id'];

/**
 * Legacy project-defense card names (progress.projects[name]). Notes saved under these names are
 * still shown on Mock → Projects. Guiding Hands was removed on Nov 25 (not on the submitted résumé);
 * any notes saved under it stay in storage untouched.
 */
export const legacyProjectNames: Record<string, string> = { 'road-report': 'Road Report', speaklab: 'SpeakLab', zbxp: 'ZBXP' };

// ------------------------- Product thinking -------------------------

/** Frameworks from the ColorStack research (§7). */
export const frameworks = {
  star: { name: 'STAR', steps: ['Situation', 'Task', 'Action', 'Result'] },
  circles: {
    name: 'CIRCLES',
    steps: ['Comprehend the situation.', 'Identify the customer.', 'Report customer needs.', 'Cut through prioritization.', 'List solutions.', 'Evaluate trade-offs.', 'Summarize recommendations.'],
  },
  testing: {
    name: 'Product testing',
    steps: ['What are we hoping to determine?', 'What are we looking for?', 'How do we determine whether the product passes?', 'What possible test cases could cause failure?'],
  },
  explain: {
    name: 'Explain it simply',
    steps: ['Who is the listener and what do they already know?', 'One analogy they will recognise.', 'The 3 ideas that matter, in order.', 'Check understanding: how would they say it back to you?'],
  },
} as const;

export type ProductFramework = 'circles' | 'testing' | 'explain';

export const productPrompts: { id: string; prompt: string; framework: ProductFramework; source: PromptSource; steps: string[] }[] = [
  // ColorStack-reported (§5)
  { id: 'cs-app-scope-market', source: 'colorstack-reported', framework: 'circles', prompt: 'How would you create an application, determine its scope, implement its features and market it?', steps: [] },
  { id: 'cs-unlimited', source: 'colorstack-reported', framework: 'circles', prompt: 'What application would you create with unlimited resources?', steps: [] },
  { id: 'cs-remote-comms', source: 'colorstack-reported', framework: 'circles', prompt: 'How would you improve enterprise communication products such as Teams, Zoom or Slack for remote workers?', steps: [] },
  { id: 'cs-calendar', source: 'colorstack-reported', framework: 'circles', prompt: 'Design a calendar.', steps: [] },
  { id: 'cs-remote-phone', source: 'colorstack-reported', framework: 'circles', prompt: 'Design a phone for a remote group.', steps: [] },
  // Historical GitHub reports (§6)
  { id: 'gh-test-keyboard', source: 'github-historical', framework: 'testing', prompt: 'How would you test a keyboard?', steps: [] },
  { id: 'gh-test-pen', source: 'github-historical', framework: 'testing', prompt: 'How would you test a pen?', steps: [] },
  { id: 'gh-calculator-vi', source: 'github-historical', framework: 'circles', prompt: 'Design a calculator for a visually impaired student.', steps: [] },
  { id: 'gh-vending-toaster', source: 'github-historical', framework: 'circles', prompt: 'Design a vending machine or toaster.', steps: [] },
  { id: 'gh-explain-computer', source: 'github-historical', framework: 'explain', prompt: 'Explain a computer to a five-year-old in two to three minutes.', steps: [] },
  { id: 'gh-c-vs-java', source: 'github-historical', framework: 'explain', prompt: 'Explain differences between C and Java or C and C# and their implications for design decisions.', steps: [] },
  { id: 'gh-ice-cream', source: 'github-historical', framework: 'circles', prompt: 'How would you serve a large group of waiting customers in an ice cream shop?', steps: [] },
  { id: 'gh-cookbook', source: 'github-historical', framework: 'circles', prompt: 'Design a multimedia cookbook for a family with varying cooking skills and abilities.', steps: [] },
  // Earlier general prompts (kept; their saved answers live under projects["product:<id>"])
  {
    id: 'favorite-product', source: 'general', framework: 'circles',
    prompt: 'What is your favorite Microsoft product, and how would you improve it?',
    steps: ['Pick a product you genuinely use.', 'Choose a specific target user.', 'Name one concrete pain point.', 'Propose one improvement.', 'Explain the trade-off (cost, complexity, risk).', 'Define a success metric.'],
  },
  {
    id: 'student-feature', source: 'general', framework: 'circles',
    prompt: 'Design a feature for students in a Microsoft product (e.g., Teams, OneNote, Outlook).',
    steps: ['Who is the student and what are they trying to do?', 'What do they do today, and where does it hurt?', 'List 2–3 ideas; pick one and say why.', 'Sketch the user flow in words.', 'How would you measure success after launch?'],
  },
  {
    id: 'prioritize', source: 'general', framework: 'circles',
    prompt: 'You have three feature requests and time for one. How do you choose?',
    steps: ['Clarify the goal (growth, retention, accessibility…).', 'Estimate impact and effort for each.', 'Consider risk and dependencies.', 'Decide and state what you would revisit later.'],
  },
];

/** The answer steps for a product prompt: its own steps, or its framework's. */
export function productSteps(p: (typeof productPrompts)[number]): readonly string[] {
  return p.steps.length ? p.steps : frameworks[p.framework].steps;
}
