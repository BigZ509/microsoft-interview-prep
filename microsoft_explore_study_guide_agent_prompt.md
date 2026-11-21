# Agent Implementation Brief — Microsoft Explore Learning & Interview Prep Guide

## Mission and constraints
You are the implementation agent. Inspect the current repository first, then **build and populate a functioning study-guide experience**, not merely another planning document. Reuse the existing Next.js/React/TypeScript architecture, design system, navigation, study-plan dashboard, and fundamentals modules where present. Do not replace functioning interview features. If the repository differs, adapt rather than inventing paths or dependencies. If there is no existing relevant app, implement the smallest maintainable app using the project's current stack. Work in the repository; do not ask the learner to build features manually.

**Learner:** CS student preparing for Microsoft Explore interviews on **December 2, 2026**. Python is the coding language. Learner has practiced Two Sum, Valid Anagram, Group Anagrams, `defaultdict`, and fixed-size character-frequency arrays but still wants intuition, pattern recognition, Big-O, and clear verbal explanations. Teach from fundamentals without assuming the learner can implement linked lists, recursion, or trees without help.

**Division of labor:** The app teaches concepts, gives clear visual walkthroughs, checks understanding, quizzes time/space complexity, teaches pattern recognition, and tracks learning. **LeetCode handles coding submissions.** Link to LeetCode's official problem pages; do not scrape questions, copy proprietary descriptions, or build a LeetCode clone. Include lightweight original code snippets for complexity exercises and a handwritten-explanation text box; do not implement a full online judge.

**Priorities:** P0 essential for the approaching Explore interview; P1 supporting; P2 advanced/long-term. Build complete P0 lessons before optional visual flourishes. Keep the December 2 deadline visible, but don't hard-code a fake countdown after the date. Display real due-date status using the client's date. Avoid turning this into an extensive full-stack rewrite.

## Research basis and uncertainty
Use these sources as reference material; write original explanations and attribution links, do not copy course text:
- Microsoft technical interviews: https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html
- Microsoft interview guidance: https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips
- Microsoft student interviews: https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing.html
- MIT 6.006 Algorithms: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
- Python built-in operation complexity: https://docs.python.org/3.14/builtins/time-complexity.html
- Python collections/deque: https://docs.python.org/3/library/collections.html
- NeetCode interview patterns: https://neetcode.io/roadmap
- VisuAlgo (visual references; link out, don't reuse illustrations without verifying rights): https://visualgo.net/en
- First-person Explore experience: https://www.teach.cs.toronto.edu/ambassadors/blog/2023-microsoft-explore/first-year/
- Aggregated Explore account (one India Explore account; other student roles are NOT Explore): https://www.fastprep.io/experience/microsoft-explore-and-student-swe-12-experiences-part-6-of-6-1t6v0p8cg8

Distinguish OFFICIAL guidance from ANECDOTAL candidate experiences and from CURATED practice recommendations. LeetCode company tags are Microsoft-wide, not a confirmed Explore-only bank. Interview formats vary by team and interviewer; do not claim guaranteed questions or a guaranteed two-round technical/behavioral split.

## Curriculum — implement every module with actual content
Each module must have: definitions in plain English, when/why to use it, operation-cost tradeoffs, Python examples, an original step-by-step input trace, complexity derivation, one brute-force-vs-improved comparison when appropriate, common pitfalls, edge cases, at least 3 objective checks with explanations, at least 2 pattern-recognition prompts, one brief verbal interview-answer template, and LeetCode links. Prerequisites must be correctly mapped. P0 modules must have multiple bite-sized lessons instead of a single wall of text.

### P0 — Essential
1. **Big-O and space complexity:** input-size variables n, m, k; asymptotic notation; O(1), O(log n), O(n), O(n log n), O(n²), O(2^n), O(n!); worst vs average; amortized; loops, nested vs sequential loops, recursion, sorting, auxiliary vs output space; O(V+E), O(n+m), O(nk); difference between runtime measurements and growth. Include >=20 original code-analysis drills across this and other modules.
2. **Python interview toolkit:** list/set/dict/tuple; hashability; `defaultdict(list)`, `defaultdict(int)`, `Counter`; `ord` and digit values; `collections.deque`; `enumerate`, `zip`, `range`; comprehensions; `sorted` versus `.sort()`; `heapq` intro; slices and string construction; mutability and aliasing; common time-cost traps.
3. **Arrays and strings:** indexing, traversal, mutation, fixed-size count arrays, prefix/suffix, subarray vs subsequence, in-place edits, immutability of strings.
4. **Hash maps and hash sets:** hashability, collisions, average O(1) lookups and worst-case caveat, frequency maps, membership, grouping by canonical sorted or count tuple key, 26 letters vs 10 digits, duplicates, missing keys. Do a focused comparison of Group Anagrams with digit-permutation grouping.
5. **Two pointers:** opposite ends, same-direction read/write, sorted pairs, fast/slow linked list pointers, pointer invariants. Why a moving nested `while` loop can remain O(n).
6. **Sliding window:** fixed and variable width, tracking counts, how to shrink safely, amortized O(n) reasoning. Distinguish from two pointers and prefix sums.
7. **Linked lists:** node model, null checks, dummy heads, next-pointer rewiring, reversal, merge, cycle detection, O(1) insertion with node reference vs O(n) search, pointer diagrams.
8. **Stacks and queues:** LIFO/FIFO, bracket matching, monotonic stack introduction, queue simulation, Python `deque.popleft()` O(1) vs `list.pop(0)` O(n).
9. **Sorting and binary search:** selection/insertion/merge/quick sorting concepts; at least one O(n log n) algorithm explained in detail; Python built-in sort O(n log n) worst-case; search-space invariant; lower/upper bounds; sorted-input precondition.
10. **Recursion and backtracking:** base case, recursive call flow, recursion depth/stack space, simple factorial/tree recursion, subsets, digit and character permutations; complexity of enumeration; pruning.
11. **Trees:** node terminology; binary tree vs BST; preorder/inorder/postorder; recursive/iterative DFS; BFS using queue; depth, balanced vs skewed trees; O(h) stack and O(n) traversal.
12. **Prefix sums, intervals, Kadane:** O(1) range queries after O(n) preprocessing, prefix-sum + hashmap intuition, sorting and merging overlapping intervals, maximum-subarray rolling best; negative-number and boundary cases.

### P1 — Supporting
13. Graphs/grids: adjacency list/matrix, BFS/DFS, visited, connected components, grid bounds, O(V+E), iterative/recursive tradeoffs.
14. Heaps/priority queues: min heap, max heap via negation, heapify, heappush/heappop, top K, operation complexity.
15. Greedy: local choice, why greedy can fail, proof sketches, interval scheduling, jump game.
16. OOP / CS basics: Python classes, instance vs class, constructor, encapsulation, inheritance, composition, abstraction, polymorphism; simple interface design, tradeoffs; elementary SQL/database and HTTP overview only as optional discussion, not full system design.

### P2 — Long-term, collapsed or optional before interview
17. Dynamic programming: overlapping subproblems, optimal substructure, memoization/tabulation, 1-D and 2-D examples, state transitions.
18. Tries and bit manipulation: prefix search, XOR, bit masks, integer representation.
19. Advanced graphs: topological ordering, union-find, Dijkstra, shortest-path distinctions.
20. Advanced patterns: monotonic stack, deeper greedy, advanced binary search-on-answer, complex design such as LRU cache, multi-dimensional DP. Clearly mark as NOT required for the first Explore prep pass.

## Dedicated non-DSA interview tracks — P0
- **Behavioral:** why Microsoft, why Explore, teamwork, leadership, feedback, adaptability, conflict resolution, working under pressure, failure/learning, project decisions. Teach STAR(R): Situation, Task, Action, Result, Reflection. Practice concise 60–90-second responses, with editable personal story cards; never invent accomplishments.
- **Project-defense:** help the learner document problem, personal contribution, constraints, alternatives, implementation, tradeoffs, testing, measurable results, lessons. Offer optional starter cards for Road Report, Guiding Hands, SpeakLab, ZBXP; don't assert unverified metrics. Favor the learner's own words.
- **Product thinking:** favorite Microsoft product, identify a target user and pain point, propose improvement, prioritize one feature, articulate tradeoffs, choose a success metric. The product track is important because some first-hand Explore reports describe a product round, but not all interviews use that format.
- **Interview communication:** clarify assumptions -> articulate brute force -> optimize with justification -> dry-run -> code in Python -> edge cases -> time/space complexity -> follow-ups. Include timed 35- to 45-minute mock prompts and a rubric.

## LeetCode practice catalog (official problem links)
Seed a deduplicated problem catalog with these IDs, exact names, correct official links, difficulty, module, priority, notes, and whether a topic appeared in candidate report. Prefer IDs over guessed slugs for routing, but store verified URLs.

**P0 first-wave (~18)**
- 49 Group Anagrams (M): canonical frequency/sorted key; connect to candidate-reported digit-grouping prompt.
- 242 Valid Anagram (E): character counts.
- 46 Permutations (M): backtracking; relevant to generating digit arrangements, but distinct from grouping them.
- 1 Two Sum (E): hash complement lookup.
- 217 Contains Duplicate (E): set membership.
- 169 Majority Element (E): frequency count.
- 206 Reverse Linked List (E): rewiring.
- 21 Merge Two Sorted Lists (E): dummy node.
- 141 Linked List Cycle (E): fast/slow.
- 167 Two Sum II – Input Array Is Sorted (M): opposite pointers.
- 88 Merge Sorted Array (E): in-place from right.
- 232 Implement Queue using Stacks (E): FIFO from LIFO.
- 933 Number of Recent Calls (E): deque.
- 20 Valid Parentheses (E): stack.
- 155 Min Stack (M): data-structure design.
- 56 Merge Intervals (M): sort+scan; overlapping-interval report was ambiguous (could have been merge/count/remove).
- 53 Maximum Subarray (M): Kadane, referenced by one 2026 Explore report.
- 3 Longest Substring Without Repeating Characters (M): variable sliding window.

**Add supporting problems**
- 121 Best Time to Buy and Sell Stock (E); 14 Longest Common Prefix (E); 1768 Merge Strings Alternately (E); 1200 Minimum Absolute Difference (E); 704 Binary Search (E); 35 Search Insert Position (E); 733 Flood Fill (E); 104 Maximum Depth of Binary Tree (E); 100 Same Tree (E); 98 Validate Binary Search Tree (M); 78 Subsets (M); 70 Climbing Stairs (E); 560 Subarray Sum Equals K (M); 200 Number of Islands (M); 994 Rotting Oranges (M); 215 Kth Largest Element in an Array (M); 207 Course Schedule (M). Tag final three as P1 unless spare time.

**Original mock task** (NOT a verified verbatim interview question): given [112, 121, 211, 123, 321], group three-digit numbers with identical multisets of digits. Show how a 10-slot count tuple makes a key, unlike the 26-letter count array for lowercase strings. Demonstrate test cases with repeated digits and zero (e.g. 101 vs 110). Input constraints must be explicit (integers vs strings, leading zero not allowed for three-digit integers).

## Teaching/interaction requirements
1. Dashboard: deadline-aware prioritized learning queue, modules grouped P0/P1/P2, weak topics, last practiced, next suggested LeetCode task. Explain that priority is a recommendation, not verified interview-frequency data.
2. Lesson page: **Intuition -> worked trace -> visual explanation -> Python example -> time/space derivation -> pattern recognition -> quick check -> LeetCode practice -> verbal recap**. Reveal solutions only after an attempt; offer progressive hints. Accessible keyboard navigation, usable on mobile.
3. Complexity lab: original snippets for sequential loops, nested loops, triangular loops, loops that halve, pointer windows, hash operations, string slicing, dictionary key construction, recursion depth, backtracking, sorting, BFS/DFS. Let learner choose time AND auxiliary-space expressions; show accurate step-by-step reasoning with named input sizes. Prevent wrong explanations like assuming all nested loops are quadratic.
4. Pattern classifier: original scenario, multiple plausible structures, ask for the reason and a counterexample. Highlight recognition clues AND when a pattern is a bad fit. Do not tell the pattern before a learner tries.
5. Manual LeetCode tracking: buttons for not started / attempted / solved independently / solved with hint / review needed, personal notes, date, complexity explanation; no fabricated LeetCode sync or completion. External problem links open LeetCode directly.
6. Recall review: light spaced-repetition scheduling (e.g. 1, 3, 7 days), with an option to mark unfamiliar lessons. Store state through existing persistence if available, otherwise localStorage with explicit labels. No login/auth overhaul needed.
7. Search and filters: priority, topic, pattern, difficulty, practice status. Show why a question was selected.
8. Mocks: technical mock flow (clarification, plan, implementation on LeetCode or user editor, tests, complexity), behavioral STAR(R) prompts, simple rubric for clarity, correctness, efficiency, tests, collaboration. Do not pretend automatically to judge code execution unless genuinely implemented.
9. Reference links panel with attribution and confidence labels OFFICIAL / EDUCATIONAL / ANECDOTAL / CURATED. No copyrighted content scraping.

## Content correctness requirements (unit test these where possible)
- `list.append` amortized O(1); `list.pop(0)` O(n); list index O(1); list search O(n).
- `dict` and `set` lookups average O(1), conditional on hashing and key costs; keys must be hashable. For arbitrary-length string keys, hashing/comparison need not be O(1).
- `deque.append`, `deque.popleft` O(1) approximately; prefer deque for BFS.
- Python sorting O(n log n) worst case; `sorted()` returns a new list; `.sort()` modifies the list.
- `O(n+m)` for traversing two inputs, not automatically `O(n)` unless appropriately defined.
- Frequency-array grouping of n lowercase words length ≤k: O(nk) time, O(n) fixed-length keys plus output references when alphabet is fixed, with nuances in input/output-space counting; sorting each word: O(n k log k) general case.
- Backtracking that enumerates all n! permutations cannot be O(n); explain output-sensitive cost.
- Recursive stack space is extra space; BFS on graph with adjacency list O(V+E) time and typically O(V) visit/queue memory (excluding representation).
- Explain when multiple loops with advancing pointers are linear despite syntactic nesting.

## Suggested study plan until Dec 2, 2026
- Nov 21: Big-O, Python operation costs, hashing review, Group Anagrams and digit-grouping mock.
- Nov 22: arrays/strings and hash-set recognition.
- Nov 23: two pointers and sorted-array problems.
- Nov 24: linked lists and pointer rewiring.
- Nov 25: fixed/variable sliding window.
- Nov 26: stack, queue, `deque` and edge cases.
- Nov 27: sorting and binary search; intervals.
- Nov 28: recursion/backtracking, trees basics.
- Nov 29: prefix sums and Kadane; timed mock.
- Nov 30: BFS/DFS overview, OOP, project defense, behavioral and product practice.
- Dec 1: revisit failures, two short mocks, rest; no deep new topics.
- Dec 2: interview-day checklist and short warm-up only.
Allow the learner to reschedule; don't claim all modules can be mastered in 11 days. Study block recommendation: 60–90 min concept/complexity, 2–3h LC, 30–45 min explanation/behavior daily, with breaks.

## Implementation instructions and deliverables
1. Inspect package scripts, routing, components, data stores, tests, existing interview prep pages, and relevant markdown guidance. Summarize integration approach briefly in your developer output, then implement.
2. Prefer a typed declarative curriculum dataset, e.g. `src/content/interview-prep/` or the repository's equivalent, with schema for `Module`, `Lesson`, `ComplexityQuestion`, `PatternScenario`, `PracticeProblem`, `Source`, `ReviewRecord`. Do not hardcode giant arrays in JSX.
3. Reuse existing UI and persistence, build accessible visual traces with ordinary components or small SVGs. Keep animations optional; prioritize readability.
4. Fully populate all P0 modules and dedicated interview tracks with ORIGINAL substantive lessons, worked examples, quizzes (not placeholders), correct solutions/feedback, and cross-links. Populate P1/P2 with concise honest introductory content, not fake “coming soon” modules marketed as complete.
5. Add integration tests for content schema, module prerequisite references, links/IDs, duplicate questions, quiz keys, complexity answer consistency, learning status persistence and module navigation. Run lint/typecheck/tests and report results honestly.
6. Return: changed file list, new routes, implemented modules, count of real lessons/quizzes/problems, how to run, verified test results, and any remaining limitations. DO THE IMPLEMENTATION; do not finish by writing a plan only.

## Definition of done
- P0 study-guide navigation works and each essential module contains nontrivial learning material.
- Complexity lab distinguishes time and auxiliary space with sound explanations.
- Learner can move from a lesson to a relevant LeetCode problem and manually record progress.
- 2025 Explore candidate digit-grouping scenario is clearly marked as reconstructed practice, not an official question.
- Dedicated behavioral/STAR(R), project defense, and product-thinking tracks are usable.
- No fabricated Microsoft guarantee, no fake interview-frequency rankings, no fake LeetCode completion data.
- Responsive layout, accessible contrast, keyboard-friendly interactions, and tests pass.

**Proceed autonomously using this spec, adapt to the existing repository, and implement the highest-value fully working version first.**
