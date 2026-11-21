import type { Module } from '../types';

const py = String.raw;

export const bigOModule: Module = {
  id: 'big-o',
  number: 2,
  title: 'Big-O and Complexity Analysis',
  priority: 'P0',
  phase: 1,
  blurb: 'Learn to derive time and space complexity yourself — from single loops to amortized pointer movement and recursion trees.',
  prerequisites: ['python'],
  lessons: [
    {
      id: 'growth',
      title: 'Algorithms, input size, and growth rate',
      summary: 'Big-O measures how work grows as the input grows — not how many seconds a run takes.',
      what: "An **algorithm** is a finite, step-by-step procedure that turns an input into an output. **Time complexity** describes how the number of basic steps grows as the **input size** grows. **Space complexity** describes how much extra memory grows.\n\nWe name input sizes with variables: `n = len(nums)`, `m = len(other)`, `k = max word length`, `V`/`E` = vertices/edges. Big-O keeps only the fastest-growing term and drops constants: `3n² + 10n + 7` is **O(n²)**.",
      why: "Wall-clock time depends on the machine, language, and other programs. Growth rate does not. An O(n²) solution that is fine for n = 100 takes ~10,000× longer at n = 10,000, while O(n) takes only 100× longer. Interviewers ask for Big-O because it predicts whether your solution scales to the constraints.",
      how: [
        "Name the input size(s): what grows? (`n` items, `k` characters per word…)",
        "Count how many times the most-repeated operation runs, as a function of those sizes.",
        "Drop constant factors (2n → n) and lower-order terms (n² + n → n²).",
        "Keep separate variables separate: O(n + m) is not O(n) unless m ≤ n is guaranteed.",
        "Use the constraints: n ≤ 10⁵ usually rules out O(n²) (10¹⁰ steps); n ≤ 20 often signals 2ⁿ enumeration is acceptable.",
      ],
      visual: { kind: 'growth', title: 'Drag n and compare how each class grows' },
      code: py`
def count_steps_linear(n):
    steps = 0
    for _ in range(n):
        steps += 1
    return steps

def count_steps_quadratic(n):
    steps = 0
    for _ in range(n):
        for _ in range(n):
            steps += 1
    return steps

# Doubling n doubles linear work but quadruples quadratic work
assert count_steps_linear(200) == 2 * count_steps_linear(100)
assert count_steps_quadratic(200) == 4 * count_steps_quadratic(100)

# Constants and lower-order terms stop mattering as n grows
def f(n):
    return 3 * n * n + 10 * n + 7
ratio = f(10_000) / (10_000 * 10_000)
assert 3 < ratio < 3.01      # f(n) behaves like 3n^2 -> O(n^2)
`,
      codeNotes: [
        "`10_000` — underscores in number literals are just for readability.",
        "We count steps instead of timing, which is exactly what Big-O abstracts.",
      ],
      complexity: {
        time: 'Linear O(n); quadratic O(n²)',
        space: 'O(1) — only a counter',
        derivation: [
          "count_steps_linear increments once per iteration: n steps → O(n).",
          "count_steps_quadratic runs the inner loop n times for each of n outer iterations: n · n = n² → O(n²).",
          "f(n) = 3n² + 10n + 7: as n grows, 10n + 7 becomes negligible relative to 3n², and the constant 3 is dropped → O(n²).",
        ],
      },
      whenToUse: [
        "Before coding: estimate your approach's Big-O against the constraints.",
        "After coding: state time AND space, naming every variable you use.",
        "When comparing approaches: Big-O first, constants only as a tie-breaker.",
      ],
      mistakes: [
        "Saying \"O(n)\" without saying what n is.",
        "Collapsing two independent inputs into one variable (O(n + m) → O(n)).",
        "Confusing \"fast on my test\" with \"good complexity\".",
      ],
      checks: [
        { q: "Simplify `5n log n + 2n + 100`.", options: ['O(n)', 'O(n log n)', 'O(5n log n)', 'O(100)'], answer: 1, explain: "n log n grows faster than n; constants (5) are dropped." },
        { q: "Constraints say n ≤ 100,000. Roughly how many steps would an O(n²) algorithm take?", options: ['10⁵', '10⁷', '10¹⁰', '10²⁰'], answer: 2, explain: "(10⁵)² = 10¹⁰ — far beyond the ~10⁸ simple steps per second budget. Look for O(n) or O(n log n)." },
        { q: "You loop over list A (length n) and then, separately, over list B (length m). The time is…", options: ['O(n)', 'O(n · m)', 'O(n + m)', 'O(max(n)²)'], answer: 2, explain: "Sequential loops add. Keep both variables because neither is bounded by the other." },
      ],
      problems: [1, 217],
      terms: ['time-complexity', 'space-complexity', 'constraint'],
      verbal: "\"Let n be the length of nums. The loop runs n times with O(1) work per iteration, so time is O(n); I store at most n entries, so space is O(n).\"",
    },
    {
      id: 'notation',
      title: 'Big-O, Big-Ω, Big-Θ — best, average, and worst cases',
      summary: 'Upper bounds, lower bounds, tight bounds, and which input scenario you are describing.',
      what: "- **Big-O (O)** — an **upper bound**: the algorithm grows no faster than this (up to a constant factor) for large n.\n- **Big-Omega (Ω)** — a **lower bound**: grows at least this fast.\n- **Big-Theta (Θ)** — a **tight bound**: both O and Ω of the same function.\n\nSeparately, **best / average / worst case** describe WHICH inputs you analyze. Linear search: best case Θ(1) (target is first), worst case Θ(n) (absent). Notation (O/Ω/Θ) and case (best/avg/worst) are independent choices.",
      why: "In interviews, \"Big-O\" conventionally means the tight worst-case bound. Knowing the distinction lets you speak precisely: \"Hash lookups are O(1) on average, O(n) worst case\" or \"Quicksort is O(n log n) on average but O(n²) worst case.\"",
      how: [
        "Pick the case: usually worst case unless you explicitly say average (hash tables) or amortized.",
        "Bound the work from above → O. If the same input family also forces that much work → Θ.",
        "Formally, f(n) is O(g(n)) if there exist c > 0 and n₀ with f(n) ≤ c · g(n) for all n ≥ n₀.",
        "O is an upper bound, so linear search is technically also O(n²) — but that is a useless statement. Always give the tightest bound you can justify.",
      ],
      code: py`
def linear_search(nums, target):
    comparisons = 0
    for i, x in enumerate(nums):
        comparisons += 1
        if x == target:
            return i, comparisons
    return -1, comparisons

nums = list(range(100))
assert linear_search(nums, 0) == (0, 1)        # best case: 1 comparison
assert linear_search(nums, 99) == (99, 100)    # worst present: n comparisons
assert linear_search(nums, -5) == (-1, 100)    # absent: n comparisons

# Formal check: f(n) = 3n + 5 is O(n) with c = 4, n0 = 5
assert all(3 * n + 5 <= 4 * n for n in range(5, 10_000))
`,
      codeNotes: [
        "`all(... for n in range(...))` is True only if the condition holds for every n — a quick way to sanity-check an inequality.",
      ],
      complexity: {
        time: 'Linear search: best Θ(1), worst Θ(n), average Θ(n)',
        space: 'O(1)',
        derivation: [
          "Best case: the target is at index 0 → 1 comparison → Θ(1).",
          "Worst case: target absent or last → n comparisons → Θ(n).",
          "Average (target equally likely anywhere): about n/2 comparisons → still Θ(n), since 1/2 is a constant.",
        ],
      },
      whenToUse: [
        "Default to worst case Big-O in interviews.",
        "Say \"average\" explicitly for hash-based structures and randomized quicksort.",
        "Use Ω when arguing no algorithm can do better (e.g. you must read all n inputs → Ω(n)).",
      ],
      mistakes: [
        "Thinking O means \"average\" and Ω means \"best\" — they are bounds, not cases.",
        "Quoting the best case as the complexity (\"it's O(1) if the target is first\").",
        "Giving a loose bound like O(n²) for an O(n) algorithm.",
      ],
      checks: [
        { q: "Linear search's best case is…", options: ['Θ(n)', 'Θ(1)', 'Θ(log n)', 'Undefined'], answer: 1, explain: "If the target is at index 0, one comparison suffices." },
        { q: "\"Every algorithm that finds the max of an unsorted list is Ω(n).\" Why?", options: ['Lists are slow', 'Any unread element could be the max, so all n must be read', 'Sorting is required', 'It is not true'], answer: 1, explain: "A lower bound argument: skipping any element means it might be the max you missed." },
        { q: "The most precise description of a Python dict lookup is…", options: ['O(1) worst case', 'O(1) average, O(n) worst case', 'O(log n)', 'Θ(n)'], answer: 1, explain: "Average-case analysis assumes keys spread across buckets; heavy collisions degrade one lookup to O(n)." },
      ],
      problems: [704, 217],
      terms: ['time-complexity', 'brute-force'],
      verbal: "\"In the worst case — the target isn't present — I compare against all n elements, so it's Θ(n); I'll just say O(n).\"",
    },
    {
      id: 'classes',
      title: 'The complexity classes: O(1) through O(n!)',
      summary: 'Recognize each common class by the code shape that produces it.',
      what: "From fastest to slowest growth:\n\n- **O(1)** constant — index a list, dict lookup (avg), arithmetic.\n- **O(log n)** logarithmic — halve the problem each step (binary search).\n- **O(n)** linear — touch each item a constant number of times.\n- **O(n log n)** — efficient sorting; n items × log n levels.\n- **O(n²)** quadratic — all pairs.\n- **O(n³)** cubic — all triples.\n- **O(2ⁿ)** exponential — all subsets; naive recursion with two branches.\n- **O(n!)** factorial — all orderings (permutations).",
      why: "When you see the code shape, you should immediately suspect the class. When you read constraints, you should know which classes fit: n ≤ 10 → n! is OK; n ≤ 20 → 2ⁿ; n ≤ 5000 → n²; n ≤ 10⁶ → n or n log n.",
      how: [
        "One operation, no loop over input → O(1).",
        "Loop variable multiplies/divides by 2 (`i *= 2`, `hi = mid - 1` halving) → O(log n).",
        "One pass → O(n). Sort then pass → O(n log n).",
        "Loop inside loop over same input → O(n²) (unless amortized — see later).",
        "Recursion with b branches and depth d → about bᵈ calls: two branches, depth n → O(2ⁿ).",
        "Choosing an order for n items: n · (n-1) · … · 1 = n! leaves.",
      ],
      visual: { kind: 'growth', title: 'Steps for each class as n grows' },
      code: py`
import math

def halvings(n):
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps

assert halvings(1024) == 10            # log2(1024) = 10
assert halvings(1_000_000) == 19       # ~log2(10^6) ~ 19.9 -> floor

# Count of subsets and permutations
from itertools import combinations, permutations
items = [1, 2, 3, 4]
subset_count = sum(1 for r in range(len(items) + 1) for _ in combinations(items, r))
assert subset_count == 2 ** 4 == 16
assert len(list(permutations(items))) == math.factorial(4) == 24

# How fast factorial explodes
assert math.factorial(10) == 3_628_800
assert 2 ** 20 == 1_048_576
`,
      codeNotes: [
        "`n //= 2` is integer (floor) division — the shape of every logarithmic loop.",
        "`itertools.combinations(items, r)` yields every r-element selection; summing over all r counts all subsets.",
      ],
      complexity: {
        time: 'halvings(n) is O(log n)',
        space: 'O(1)',
        derivation: [
          "After t iterations, n has been divided by 2 t times: n / 2ᵗ.",
          "The loop stops when n / 2ᵗ ≤ 1, i.e. t ≥ log₂ n.",
          "So the loop runs ⌊log₂ n⌋ times → O(log n). The base of the log doesn't matter in Big-O (log₂ n and log₁₀ n differ by a constant).",
        ],
      },
      whenToUse: [
        "Map constraints to a target class before choosing an algorithm.",
        "Recognize when an exponential answer is unavoidable because the OUTPUT itself is exponential (all subsets, all permutations).",
      ],
      mistakes: [
        "Calling a halving loop O(n/2) — it is O(log n).",
        "Thinking O(2ⁿ) and O(n!) are similar — at n = 20, 2ⁿ ≈ 10⁶ while n! ≈ 2.4 × 10¹⁸.",
        "Forgetting that generating n! permutations of length n costs O(n · n!) once you copy each one.",
      ],
      checks: [
        { q: "A loop runs `i = 1; while i < n: i *= 3`. Complexity?", options: ['O(n)', 'O(n/3)', 'O(log n)', 'O(1)'], answer: 2, explain: "i grows geometrically, reaching n after log₃ n steps → O(log n)." },
        { q: "How many subsets does a 5-element set have?", options: ['5', '25', '32', '120'], answer: 2, explain: "Each element is in or out: 2⁵ = 32 (including the empty set)." },
        { q: "Order these from slowest-growing to fastest: n!, n², 2ⁿ, n log n", options: ['n log n, n², 2ⁿ, n!', 'n², n log n, n!, 2ⁿ', 'n log n, 2ⁿ, n², n!', 'n!, 2ⁿ, n², n log n'], answer: 0, explain: "Polynomial classes grow slower than exponential, and n! outgrows 2ⁿ." },
      ],
      problems: [704, 78, 46],
      terms: ['time-complexity', 'factorial', 'binary-search'],
      verbal: "\"Each iteration halves the search space, so after log₂ n iterations only one candidate remains — O(log n).\"",
    },
    {
      id: 'loops',
      title: 'Counting loops: sequential, nested, multiple variables, triangular',
      summary: 'Sequential loops add; nested loops multiply — but only when the inner work really repeats.',
      what: "A **constant-time operation** does a fixed amount of work regardless of input size: arithmetic, comparisons, list indexing, `append` (amortized), dict get/set (average).\n\nRules for combining:\n\n- **Sequential** blocks add: O(n) + O(n) = O(n); O(n) + O(m) = O(n + m).\n- **Nested** blocks multiply: n outer × m inner = O(n · m).\n- **Triangular** loops (`j` from `i+1` to n) still give O(n²).\n- **Hidden loops** count too: `x in list`, slicing, `sorted`, `''.join`, `sum`, building a tuple of k counts.",
      why: "Most interview code is loops. Deriving the cost line by line — including the hidden loops inside built-ins — is the core Big-O skill. Group Anagrams is the classic: n words × k characters per word = O(n · k).",
      how: [
        "Write the cost of each line, treating built-ins honestly (`sorted(word)` is O(k log k)).",
        "Multiply by the number of times the line runs.",
        "Add up sequential parts; keep the dominant term.",
        "Name each independent size: words n, word length k, alphabet 26 (a constant).",
      ],
      visual: {
        kind: 'vars',
        title: 'Group Anagrams (count-key) cost, line by line',
        steps: [
          { vars: { 'for word in strs': 'runs n times' }, note: 'The outer loop visits each of n words.' },
          { vars: { 'for word in strs': 'n', 'count = [0] * 26': 'O(26) = O(1) each', 'for ch in word': 'O(k) each' }, note: 'Inside: a fixed 26-slot array (constant), then one pass over k characters.' },
          { vars: { 'tuple(count)': 'O(26) = O(1)', 'groups[key].append': 'avg O(1) (hash of 26-tuple is constant)' }, note: 'Building and hashing a 26-element key costs a constant amount.' },
          { vars: { total: 'n × (O(1) + O(k) + O(1)) = O(n·k)' }, note: 'Multiply the per-word cost by n. Space: n keys of size 26 + all words in the output → O(n·k).' },
        ],
      },
      code: py`
from collections import defaultdict

def group_anagrams(strs):
    groups = defaultdict(list)
    for word in strs:                    # n iterations
        count = [0] * 26                 # O(26) = O(1)
        for ch in word:                  # k iterations
            count[ord(ch) - ord("a")] += 1
        groups[tuple(count)].append(word)  # O(26) key + avg O(1) insert
    return list(groups.values())

result = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
assert sorted(sorted(g) for g in result) == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]

# Sequential vs nested
def sequential(a, b):
    total = 0
    for x in a:      # n
        total += x
    for y in b:      # m
        total += y
    return total     # O(n + m)

def nested(a, b):
    pairs = 0
    for x in a:          # n
        for y in b:      # m each
            pairs += 1
    return pairs         # O(n * m)

assert sequential([1, 2], [3]) == 6 and nested([1, 2], [3, 4, 5]) == 6
`,
      codeNotes: [
        "`tuple(count)` converts the list to a tuple so it can be a dictionary key (lists are unhashable).",
        "`sorted(sorted(g) for g in result)` normalizes group order so the assert doesn't depend on dict ordering.",
      ],
      complexity: {
        time: 'group_anagrams O(n·k); sequential O(n + m); nested O(n·m)',
        space: 'group_anagrams O(n·k) (keys + grouped output)',
        derivation: [
          "Per word: 26 for the counts array + k for the inner loop + 26 for the tuple key = O(k) (26 is a constant).",
          "n words × O(k) each = O(n·k). With a sorted-string key instead, each word costs O(k log k), giving O(n·k log k).",
          "sequential: n iterations then m iterations — they add, O(n + m).",
          "nested: the inner m-iteration loop runs once per outer iteration — they multiply, O(n·m).",
        ],
      },
      whenToUse: [
        "Every time you state a complexity, derive it this way out loud.",
        "When the alphabet/digit range is fixed (26, 10), treat it as a constant — but say so.",
      ],
      mistakes: [
        "Calling Group Anagrams O(n) by ignoring the word length k.",
        "Calling the sorted-key version O(n·k) — sorting each word adds a log k factor.",
        "Missing hidden loops: `if x in my_list` inside a loop makes it O(n²).",
      ],
      checks: [
        { q: "Group Anagrams with `key = ''.join(sorted(word))` costs…", options: ['O(n)', 'O(n·k)', 'O(n·k log k)', 'O(n log n)'], answer: 2, explain: "Sorting each of the n words of length up to k costs O(k log k) each." },
        { q: "A loop over n items calls `if x in seen_list:` each time, where seen_list grows to n. Complexity?", options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], answer: 2, explain: "Membership in a list is a hidden O(n) scan inside an O(n) loop. Switch to a set for O(n)." },
        { q: "Why is `[0] * 26` considered O(1)?", options: ['Lists are free', '26 does not grow with the input', 'Python caches it', 'It is O(n)'], answer: 1, explain: "Its size is fixed by the alphabet, not by n or k. If the alphabet were arbitrary (size a), it would be O(a)." },
      ],
      problems: [49, 242, 1],
      terms: ['time-complexity', 'canonical-key', 'trade-off'],
      verbal: "\"Let n be the number of words and k the max length. Each word takes O(k) to count into a 26-slot array, and building the tuple key is constant, so total time is O(n·k).\"",
    },
    {
      id: 'amortized',
      title: 'Amortized analysis and nested loops that are still linear',
      summary: 'Count total work across the whole run, not the worst single step.',
      what: "**Amortized** cost is the average cost per operation over a worst-case **sequence** of operations. A single operation may be expensive, but if expensive ones are rare enough, the total stays small.\n\nTwo key examples:\n\n- `list.append` is amortized O(1): occasionally the list resizes (O(n) copy), but capacity grows geometrically, so n appends cost O(n) total.\n- A **while loop nested inside a for loop** can be O(n) total when the inner loop moves a pointer that only ever moves forward. Sliding window: each index is added once and removed at most once → at most 2n pointer moves.",
      why: "Without amortized reasoning you'd wrongly call sliding window O(n²) and miss the optimal solution, or wrongly think a queue built from two stacks is slow. Interviewers specifically probe this: \"There's a nested loop — why is it still linear?\"",
      how: [
        "Find what the inner loop moves (a pointer, a stack, a queue).",
        "Ask: can that thing ever move backward or be re-added? If not, bound its total moves over the WHOLE run.",
        "Total inner-loop iterations ≤ (number of elements that can be removed) ≤ n.",
        "Total work = outer iterations + total inner iterations = O(n + n) = O(n).",
      ],
      visual: {
        kind: 'array',
        title: 'Sliding window on "abcabcbb": left only moves forward',
        steps: [
          { cells: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], pointers: { L: 0, R: 2 }, window: [0, 2], vars: { window: '{a,b,c}', best: '3' }, note: 'Expand R to 2: window "abc" has no repeats. best = 3.' },
          { cells: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], pointers: { L: 1, R: 3 }, window: [1, 3], vars: { window: '{b,c,a}', 'L moves so far': '1' }, note: "R = 3 brings a second 'a' → inner while moves L once." },
          { cells: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], pointers: { L: 5, R: 6 }, window: [5, 6], vars: { window: '{c,b}', 'L moves so far': '5' }, note: "At R = 6 ('b'), L jumps through several positions — but every one of them is a position L will never revisit." },
          { cells: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], pointers: { L: 7, R: 7 }, window: [7, 7], vars: { 'total R moves': '8', 'total L moves': '7', total: '≤ 2n' }, note: 'Over the whole run R moves n times and L at most n times: O(n), despite the nested while.' },
        ],
      },
      code: py`
def length_of_longest_substring(s):
    seen = set()
    left = 0
    best = 0
    inner_moves = 0                      # instrumented for the proof
    for right, ch in enumerate(s):       # n iterations
        while ch in seen:                # nested... but left only moves forward
            seen.remove(s[left])
            left += 1
            inner_moves += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best, inner_moves

best, moves = length_of_longest_substring("abcabcbb")
assert best == 3
assert moves <= len("abcabcbb")          # total inner work bounded by n

# Amortized append: count element copies made by a doubling array
def copies_for_appends(n):
    capacity, size, copies = 1, 0, 0
    for _ in range(n):
        if size == capacity:
            copies += size               # copy everything into a bigger array
            capacity *= 2
        size += 1
    return copies

for n in [10, 1000, 100_000]:
    assert copies_for_appends(n) < 2 * n # total copy work O(n) -> O(1) per append
`,
      codeNotes: [
        "`right - left + 1` is the length of the inclusive window [left, right].",
        "copies_for_appends simulates a dynamic array that doubles; CPython over-allocates by a smaller factor, but the same geometric argument applies.",
      ],
      complexity: {
        time: 'Sliding window O(n); n appends O(n) total → amortized O(1) each',
        space: 'O(min(n, alphabet)) for the window set',
        derivation: [
          "The for loop advances `right` exactly n times.",
          "Each iteration of the inner while advances `left` by 1, and `left` never decreases and never exceeds n. So across the ENTIRE run, the while body executes at most n times.",
          "Total = n (outer) + at most n (inner) = O(2n) = O(n).",
          "For appends: copies happen at sizes 1, 2, 4, …, < n, summing to less than 2n. Spread across n appends, that's O(1) each.",
        ],
      },
      whenToUse: [
        "Sliding window, two pointers, monotonic stack (each element pushed and popped once), queue via two stacks.",
        "Whenever an inner loop consumes a resource that is never replenished.",
      ],
      mistakes: [
        "Seeing `for` + `while` and declaring O(n²) without asking how far the inner pointer can move in total.",
        "Assuming every nested loop is amortized-linear — if the inner pointer RESETS each outer iteration (e.g. `j = i`), it is quadratic.",
        "Calling amortized O(1) \"worst-case O(1)\" — a single resize really is O(n).",
      ],
      checks: [
        { q: "In a sliding window, why is the inner `while` loop not O(n) per outer iteration overall?", options: ['Sets are fast', 'left only moves forward, so it moves at most n times in total', 'Python optimizes nested loops', 'The window is small'], answer: 1, explain: "The total number of inner iterations across the whole run is bounded by n, so total work is O(n)." },
        { q: "Which inner loop makes the algorithm O(n²)?", options: ['while stack and stack[-1] < x: stack.pop()', 'while ch in window: remove s[left]; left += 1', 'for j in range(i, n): ...', 'while q and q[0] < t - 3000: q.popleft()'], answer: 2, explain: "j restarts at i for every i, so total iterations are n + (n-1) + … = O(n²). The others consume elements that are never re-added." },
        { q: "`list.append` is…", options: ['Worst-case O(1)', 'Amortized O(1)', 'O(n) always', 'O(log n)'], answer: 1, explain: "Most appends are O(1); occasional resizes are O(n), but geometric growth makes the average O(1)." },
      ],
      problems: [3, 232, 933, 167],
      terms: ['amortized', 'invariant', 'pointer'],
      verbal: "\"There's a nested while, but the left pointer only moves forward and can move at most n times total, so the whole algorithm is O(n), not O(n²).\"",
    },
    {
      id: 'recursion-space',
      title: 'Recursion complexity, call-stack space, auxiliary vs. output space',
      summary: 'Time = number of calls × work per call. Space = deepest chain of calls + what you store.',
      what: "For recursion:\n\n- **Time** ≈ (number of calls in the recursion tree) × (non-recursive work per call).\n- **Call-stack space** = the maximum **depth** of the recursion (frames alive at the same time), times frame size.\n\nFor space in general:\n\n- **Auxiliary space** — extra memory your algorithm uses beyond the input (and usually beyond the required output).\n- **Output space** — memory for the answer you must return. Generating all permutations has O(n · n!) output no matter how clever you are.\n\nState which one you mean. Interviewers usually want auxiliary space, and some count output separately.",
      why: "Recursive solutions look like O(1) space because there are no lists — but each pending call occupies stack memory. A skewed tree makes DFS use O(n) stack. Python's default recursion limit (~1000) can also crash deep recursion.",
      how: [
        "Draw the recursion tree: each node is a call, children are the calls it makes.",
        "Count nodes: factorial(n) is a chain of n calls; fib(n) naive has about 2ⁿ calls; permutations has about n! leaves.",
        "Multiply by per-call work (e.g. copying a path of length n at each leaf).",
        "Space: depth of the tree × per-frame memory, plus any shared structures (path, visited set, memo).",
      ],
      visual: {
        kind: 'tree',
        title: 'Naive fib(4): calls repeat exponentially',
        root: { id: 'f4', label: 'fib(4)', children: [
          { id: 'f3', label: 'fib(3)', children: [
            { id: 'f2a', label: 'fib(2)', children: [{ id: 'f1a', label: 'fib(1)' }, { id: 'f0a', label: 'fib(0)' }] },
            { id: 'f1b', label: 'fib(1)' },
          ] },
          { id: 'f2b', label: 'fib(2)', children: [{ id: 'f1c', label: 'fib(1)' }, { id: 'f0b', label: 'fib(0)' }] },
        ] },
        steps: [
          { active: ['f4', 'f3', 'f2a', 'f1a'], note: 'The deepest chain alive at once is 4 frames: fib(4) → fib(3) → fib(2) → fib(1). Stack space O(n).' },
          { active: ['f2a', 'f2b'], note: 'fib(2) is computed twice. As n grows, repeated work explodes: about 2ⁿ calls → O(2ⁿ) time.' },
          { active: ['f4'], done: ['f3', 'f2a', 'f1a', 'f0a', 'f1b', 'f2b', 'f1c', 'f0b'], note: '9 calls for n = 4. Memoizing each fib(i) once reduces it to n + 1 distinct calls → O(n).' },
        ],
      },
      code: py`
from functools import lru_cache

calls = 0
def fib(n):
    global calls
    calls += 1
    if n < 2:              # base case
        return n
    return fib(n - 1) + fib(n - 2)

assert fib(10) == 55 and calls == 177   # exponential blow-up already

@lru_cache(maxsize=None)
def fib_memo(n):
    if n < 2:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)

assert fib_memo(90) == 2880067194370816120   # instant: O(n) distinct calls

def depth(n):
    """Recursion depth n -> n stack frames alive at the deepest point."""
    if n == 0:
        return 0
    return 1 + depth(n - 1)

assert depth(500) == 500   # Python's default limit is ~1000 frames
`,
      codeNotes: [
        "`global calls` lets the function rebind a module-level counter.",
        "`@lru_cache(maxsize=None)` memoizes: results for each argument are stored and reused.",
        "Python does not optimize tail recursion; very deep recursion raises RecursionError.",
      ],
      complexity: {
        time: 'Naive fib O(2ⁿ) (tighter: O(φⁿ)); memoized fib O(n)',
        space: 'Both use O(n) stack depth; the memo adds O(n) storage',
        derivation: [
          "Naive fib: each call makes two more until n < 2, so the tree has roughly 2ⁿ nodes (more precisely ~1.618ⁿ). Each call is O(1) work → O(2ⁿ).",
          "Stack depth: the longest root-to-leaf chain is fib(n) → fib(n-1) → … → fib(1): n frames → O(n) space, even though total calls are exponential.",
          "Memoized: each distinct n from 0 to n is computed once, every other call is a cache hit → O(n) time, O(n) memo + O(n) stack.",
        ],
      },
      whenToUse: [
        "State recursion stack space whenever you use DFS or backtracking.",
        "Separate output space from auxiliary space for enumeration problems (subsets, permutations).",
        "Memoize when the recursion tree repeats identical subproblems.",
      ],
      mistakes: [
        "Claiming recursive DFS uses O(1) space.",
        "Confusing total calls (time) with maximum depth (space).",
        "Calling permutation generation O(n) or O(n!) and forgetting the O(n) cost to copy each result.",
      ],
      checks: [
        { q: "Recursive DFS on a balanced binary tree with n nodes uses how much stack space?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 1, explain: "Stack depth equals tree height, which is O(log n) when balanced. For a skewed tree it becomes O(n)." },
        { q: "Naive fib(n) uses O(2ⁿ) time. What is its stack space?", options: ['O(2ⁿ)', 'O(n)', 'O(1)', 'O(log n)'], answer: 1, explain: "Only one root-to-leaf path is on the stack at a time; its length is n." },
        { q: "\"Auxiliary space\" usually excludes…", options: ['Recursion stack', 'Hash maps you build', 'The input and the required output', 'Temporary lists'], answer: 2, explain: "Auxiliary space is the extra working memory. Be explicit whether you count the output." },
      ],
      problems: [46, 78, 70, 104],
      terms: ['auxiliary-space', 'recursion', 'memoization', 'base-case', 'space-complexity'],
      verbal: "\"Time is the number of calls times the work per call. Space is the recursion depth — O(h) for this tree — plus the path list, excluding the output.\"",
    },
    {
      id: 'python-costs',
      title: 'Python operation costs, hashing, sorting, and trade-offs',
      summary: 'The cost table you should know cold — and how to trade memory for speed.',
      what: "Key costs (CPython):\n\n- **list**: index / assign O(1); `append` amortized O(1); `pop()` O(1); `pop(0)` / `insert(0, x)` O(n); `x in list` O(n); slice O(k); `sort` O(n log n).\n- **dict / set**: get, set, `in`, delete — **average O(1)**, worst case O(n). Keys must be hashable; hashing a key of length k costs O(k).\n- **deque**: `append`, `appendleft`, `pop`, `popleft` O(1).\n- **str**: immutable; `s + t` O(len(s) + len(t)); `''.join(parts)` O(total length); `s[::-1]` O(n).\n- **heapq**: push/pop O(log n); heapify O(n).\n\nA **trade-off** is choosing between resources: e.g. a hash set spends O(n) memory to turn an O(n²) duplicate check into O(n).",
      why: "Python hides loops inside operators. Knowing these costs is how you avoid accidental O(n²) and how you justify your data-structure choice in an interview.",
      how: [
        "For each line inside a loop, ask: is this operation O(1) on this structure?",
        "Replace O(n) operations inside loops: `x in list` → set; `list.pop(0)` → deque; repeated `s += c` → list + join.",
        "When you trade space for time, say it: \"O(n) extra space buys O(n) instead of O(n²) time.\"",
        "Mention the average-case caveat for hashing when asked about worst case.",
      ],
      code: py`
from collections import deque

# Brute force duplicate check: O(n^2) time, O(1) space
def has_dup_brute(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False

# Sort first: O(n log n) time, O(n) space for sorted copy
def has_dup_sort(nums):
    s = sorted(nums)
    return any(a == b for a, b in zip(s, s[1:]))

# Hash set: O(n) average time, O(n) space
def has_dup_set(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False

for f in (has_dup_brute, has_dup_sort, has_dup_set):
    assert f([1, 2, 3, 1]) and not f([1, 2, 3]) and not f([])

# Build strings with join, not repeated +=
parts = []
for ch in "abc":
    parts.append(ch.upper())
assert "".join(parts) == "ABC"

# Queue: deque.popleft is O(1); list.pop(0) shifts everything
q = deque([1, 2, 3])
assert q.popleft() == 1
`,
      codeNotes: [
        "`any(generator)` stops at the first True — short-circuiting.",
        "`zip(s, s[1:])` pairs each element with its neighbor (the slice copies O(n)).",
        "CPython sometimes optimizes `s += c` in place, but don't rely on it — `join` is guaranteed linear.",
      ],
      complexity: {
        time: 'brute O(n²); sort O(n log n); set O(n) average',
        space: 'brute O(1); sort O(n); set O(n)',
        derivation: [
          "Brute force compares every pair: n(n-1)/2 comparisons → O(n²), no extra storage.",
          "Sorting dominates the sort version: O(n log n); the adjacent scan is O(n).",
          "Set version: n iterations × average O(1) membership + insert → O(n); the set can hold all n items → O(n) space.",
          "Worst case for the set version is O(n²) if every key collided, which is extremely unlikely with Python's hashing of ints.",
        ],
      },
      whenToUse: [
        "Present brute force first, then improve: \"I can trade O(n) memory for linear time with a set.\"",
        "Sorting is the middle option when memory is constrained or sorted order helps later steps.",
      ],
      mistakes: [
        "Saying dict lookups are O(1) worst case.",
        "Forgetting that string keys cost O(k) to hash.",
        "Using `list.insert(0, x)` or `pop(0)` in a loop.",
      ],
      checks: [
        { q: "Which operation is O(n) on a Python list?", options: ['lst[i]', 'lst.append(x)', 'lst.pop()', 'lst.pop(0)'], answer: 3, explain: "Removing the first element shifts all remaining elements one slot left." },
        { q: "Using a set for Contains Duplicate trades…", options: ['time for correctness', 'O(n) extra space for O(n) time', 'O(1) space for O(n log n) time', 'nothing'], answer: 1, explain: "The set uses O(n) memory but avoids the O(n²) pair comparisons." },
        { q: "What is the worst-case time for `x in my_dict`?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explain: "Average O(1), but if many keys collide in one bucket, a lookup can degrade to O(n)." },
      ],
      problems: [217, 1, 933, 1768],
      terms: ['trade-off', 'hashing', 'collision', 'brute-force'],
      verbal: "\"Brute force is O(n²). Sorting gets O(n log n). A hash set gets O(n) average time at the cost of O(n) space — I'll go with the set unless memory is constrained.\"",
    },
  ],
};
