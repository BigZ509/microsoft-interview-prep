import type { Module } from '../types';

const py = String.raw;

/**
 * Module 14 — Independent problem solving (added Nov 25, scope correction §3).
 * Targets the learner's stated weakness: choosing an approach when the problem does not name its
 * pattern. Each lesson is paired with the daily blind assessments (/blind).
 */
export const solvingModule: Module = {
  id: 'solving',
  number: 14,
  title: 'Independent problem solving',
  priority: 'P0',
  phase: 1,
  blurb: 'How to find an approach when the question does not tell you the pattern: read characteristics, start brute force, find the bottleneck, optimize, test, and use hints well.',
  prerequisites: ['big-o', 'arrays', 'hashing'],
  lessons: [
    // ------------------------------------------------------------------------------------------
    {
      id: 'characteristics',
      title: 'Read the problem for characteristics, not keywords',
      summary: 'Questions rarely name their pattern, but they always reveal properties of the input and the output. Those properties choose the data structure.',
      what: "A **characteristic** is a property of the input, the output, or the constraints that rules approaches in or out. Interview questions are often worded to hide the pattern (\"find two days whose steps add to the goal\" never says *hash map*), but they cannot hide the characteristics.\n\nAsk the same questions every time:\n\n- **Input shape** — list, string, linked list, tree, grid? Is it **sorted**? Can it contain duplicates or negatives?\n- **What is asked** — does something *exist*, *how many*, *which one*, *all of them*, the *longest/shortest*, the *minimum/maximum*?\n- **Relationship** — pairs? contiguous runs? matching open/close? order of arrival? something compared with its neighbour?\n- **Constraints** — size of n, in-place / O(1) extra space, must keep order, values in a small fixed range?\n\nEach answer narrows the candidates. *Exists + fast lookup* → set or dict. *Sorted + pairs* → two pointers. *Contiguous + longest* → sliding window. *Matching / most recent first* → stack. *All arrangements* → backtracking.",
      why: "Memorising \"keyword → pattern\" fails as soon as the wording changes, which is exactly what happens in an interview. Characteristics transfer: the same five questions work on a problem you have never seen.",
      how: [
        "Restate the problem in one sentence with the input type and the exact return value (\"return the indices, not the values\").",
        "Go through the four groups (input shape, what is asked, relationship, constraints) and write down every characteristic you notice — even obvious ones.",
        "Map each characteristic to 1–2 candidate structures or techniques. Keep two or three candidates, not one.",
        "Use the constraints to choose: O(1) extra space rules out a dict; unsorted input rules out plain two pointers; n ≤ 20 allows exponential work.",
        "Say a brute-force solution anyway. It proves you understand the problem and shows you where the work goes.",
      ],
      code: py`
# The SAME request ("find two numbers that add to target") has different best answers
# depending on the characteristics of the input. Read them before choosing.

def pair_unsorted(nums, target):
    """Unsorted, need indices -> remember what you've seen in a dict: O(n) time, O(n) space."""
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

def pair_sorted(nums, target):
    """Sorted + O(1) extra space -> two pointers from both ends: O(n) time, O(1) space."""
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return [lo, hi]
        if s < target:
            lo += 1                 # need a bigger sum: only moving lo right can help
        else:
            hi -= 1
    return []

def count_pairs_small(nums, target):
    """Tiny n and we need ALL pairs -> brute force is the clearest correct answer."""
    n = len(nums)
    return sum(1 for i in range(n) for j in range(i + 1, n) if nums[i] + nums[j] == target)

assert pair_unsorted([3, 9, 1, 7], 10) == [1, 2]      # 9 + 1 is found first
assert pair_sorted([1, 3, 7, 9], 10) == [0, 3]
assert count_pairs_small([1, 9, 9, 1], 10) == 4
assert pair_unsorted([], 5) == [] and pair_sorted([5], 5) == []

# Characteristic checklist as data: what you noticed -> candidates worth considering.
CANDIDATES = {
    "need fast 'have I seen it?'": ["set", "dict"],
    "sorted input": ["two pointers", "binary search"],
    "contiguous + longest/shortest": ["sliding window"],
    "matching / most recent first": ["stack"],
    "all arrangements or choices": ["backtracking"],
}
assert "two pointers" in CANDIDATES["sorted input"]
`,
      codeNotes: [
        "`enumerate(nums)` yields `(index, value)` pairs, so you get the index without `range(len(...))`.",
        "`target - x in seen` asks \"have I already seen the value that completes this pair?\" in O(1) average time.",
        "`sum(1 for ... if ...)` counts matches with a generator expression.",
      ],
      complexity: {
        time: 'Depends on the choice: O(n) dict, O(n) two pointers on sorted input, O(n²) all pairs',
        space: 'O(n) for the dict, O(1) for two pointers and brute force',
        derivation: [
          "Dict version: one pass of n steps, each an O(1) average lookup and insert → O(n) time; the dict can hold n entries → O(n) space.",
          "Two pointers: every iteration moves lo or hi one step closer, so at most n − 1 iterations → O(n) time, two integers → O(1) space.",
          "All pairs: n(n − 1)/2 comparisons → O(n²). Fine for n ≤ ~10⁴ in Python, too slow beyond that.",
        ],
      },
      whenToUse: [
        "At the start of every unfamiliar problem, before writing any code.",
        "When you feel stuck: go back to the checklist and look for a characteristic you skipped (\"I never asked whether it is sorted\").",
        "When an interviewer changes one constraint in a follow-up (\"now it is sorted\", \"now use O(1) space\") — re-run the checklist.",
      ],
      mistakes: [
        "Choosing from a keyword alone (\"subarray\" → sliding window) without checking a constraint that breaks it (negative numbers break the shrink rule).",
        "Committing to the first idea. Keep two candidates until the constraints pick one.",
        "Skipping the restatement and solving a different problem (returning values instead of indices, counting instead of listing).",
        "Treating \"no pattern comes to mind\" as failure. Brute force plus a bottleneck search is a valid way to *find* the pattern.",
      ],
      checks: [
        { q: "\"Ticket prices are listed in non-decreasing order. Find two whose total equals the budget, using O(1) extra memory.\" Which characteristic decides the approach?", options: ['The word "two"', 'Sorted input plus the O(1) space limit', 'That prices are integers', 'That an answer always exists'], answer: 1, explain: "Sorted order lets you move pointers inward with a guarantee; the space limit rules out a dict. Together they point to two pointers." },
        { q: "A question asks for the LONGEST stretch of consecutive days with no repeated song. What should you check before choosing a sliding window?", options: ['Whether the input is sorted', 'Whether extending the window can only make it worse once it is invalid (so shrinking from the left is safe)', 'Whether the songs are strings', 'Nothing — "longest" always means sliding window'], answer: 1, explain: "A sliding window is correct when validity is monotonic: once a repeat is inside, it stays until the left edge passes it. Check that property instead of trusting the keyword." },
        { q: "Roman to Integer: which characteristic tells you that one left-to-right pass is enough?", options: ['Each symbol only needs its right-hand neighbour to decide add vs. subtract', 'The string is sorted', 'Symbols are unique', 'The answer is below 4000'], answer: 0, explain: "The subtraction rule is local: compare a symbol with the next one. A local rule means a single pass with a look-ahead." },
      ],
      problems: [13, 125, 344, 1, 167],
      terms: ['constraint', 'sorted', 'contiguous', 'brute-force'],
      verbal: "\"Before I pick an approach, let me list what I notice: the input is unsorted, I need indices, n can be large, and there's no space limit. Fast lookup of a complement suggests a dictionary; sorting would lose the original indices.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'code-reading',
      title: 'Explaining code you did not write',
      summary: 'Read a function, say what it does, name its inputs, outputs and edge cases, and spot risky behavior — a reported Explore question type.',
      what: "Some Explore interviews hand you a short function and ask you to **explain** it rather than write one. ColorStack members reported \"explain a function that sums the even numbers in an array\", \"explain a function that detects duplicates\" and \"identify possible inputs, outputs and edge cases\".\n\nA complete explanation has five parts:\n\n- **Purpose** — one sentence, in terms of the caller (\"returns True if any value appears twice\").\n- **Inputs** — the types it expects and what it assumes (list of ints? may be empty? may contain None?).\n- **Outputs** — exact type and meaning, including what it returns in the empty case.\n- **Edge cases** — empty, one element, all equal, negatives, zero, very large n, wrong types.\n- **Complexity and risks** — Big-O, plus anything surprising: mutating the input, crashing on bad input, a hidden O(n) operation inside a loop.",
      why: "Reading code is most of a software engineer's day, and interviewers use it to see whether you reason precisely. It also trains the habit you need for your own code: tracing a small input and naming edge cases before running anything.",
      how: [
        "Read the signature and every `return` first — they tell you the output before you read the loop.",
        "Trace a tiny example by hand (2–4 elements) and write the variables after each iteration.",
        "Name what each variable means in words (\"`seen` holds every value before index i\"). That is the invariant.",
        "List input classes: empty, single element, typical, duplicates, negatives/zero, large, wrong type. Say what the function returns for each.",
        "Give time and space, then mention risks: does it modify the input? could it raise? is there an O(n) call (like `x in list`) inside the loop?",
      ],
      code: py`
def sum_of_evens(nums):
    total = 0
    for x in nums:
        if x % 2 == 0:          # True for 0 and for negative evens such as -4
            total += x
    return total

# Trace on [3, 4, -2, 7]:  x=3 skip | x=4 total=4 | x=-2 total=2 | x=7 skip  -> 2
assert sum_of_evens([3, 4, -2, 7]) == 2
assert sum_of_evens([]) == 0            # empty input: loop never runs
assert sum_of_evens([1, 3, 5]) == 0     # no evens: same answer as empty — worth saying
assert sum_of_evens([0]) == 0           # zero is even
assert sum_of_evens([-4]) == -4         # % with negatives still works in Python

def has_duplicates_slow(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False

def has_duplicates(nums):
    seen = set()                 # invariant: every value before the current one
    for x in nums:
        if x in seen:
            return True          # early exit on the first repeat
        seen.add(x)
    return False

for case in ([], [1], [1, 2, 3], [1, 2, 1], [5, 5], [-1, 0, -1]):
    assert has_duplicates(case) == has_duplicates_slow(case)

# Risk worth naming: a set needs hashable values. Lists inside the input would raise TypeError.
try:
    has_duplicates([[1], [1]])
    raised = False
except TypeError:
    raised = True
assert raised and has_duplicates_slow([[1], [1]]) is True
`,
      codeNotes: [
        "`x % 2 == 0` is True for 0 and for negative even numbers; Python's `%` returns a result with the sign of the divisor.",
        "`set()` membership (`x in seen`) is O(1) on average, which is what makes `has_duplicates` O(n).",
        "The `try/except TypeError` block demonstrates a real risk: unhashable values (lists) cannot go in a set.",
      ],
      complexity: {
        time: 'sum_of_evens O(n); has_duplicates_slow O(n²); has_duplicates O(n) average',
        space: 'sum_of_evens O(1); slow version O(1); set version O(n)',
        derivation: [
          "sum_of_evens touches each element once with O(1) work → O(n); it stores one integer → O(1) space.",
          "The nested loops compare every pair: (n − 1) + (n − 2) + … + 1 = n(n − 1)/2 → O(n²), no extra memory.",
          "The set version does one O(1) average lookup and insert per element → O(n) time; in the worst case (no duplicates) the set holds all n values → O(n) space.",
        ],
      },
      whenToUse: [
        "Whenever an interviewer says \"walk me through this function\" or \"what does this return for…\".",
        "Before submitting your own solution: read it back as if someone else wrote it.",
        "In code review style questions: \"what could go wrong with this?\"",
      ],
      mistakes: [
        "Narrating syntax line by line (\"this is a for loop\") instead of stating the purpose first.",
        "Forgetting the empty input and what the function returns for it.",
        "Saying \"it's O(n)\" without naming n or noticing a hidden O(n) operation inside the loop.",
        "Not separating \"what it does\" from \"what it was probably meant to do\" when there is a bug.",
      ],
      checks: [
        { q: "What does `sum_of_evens([1, 3, 5])` return, and why is that worth mentioning?", options: ['None, because no value matched', '0 — the same as for an empty list, so a caller cannot tell the two cases apart', 'It raises an error', '9'], answer: 1, explain: "total starts at 0 and nothing is added. Pointing out that \"no evens\" and \"empty\" look the same shows careful reading." },
        { q: "Why is `has_duplicates` O(n) while `has_duplicates_slow` is O(n²)?", options: ['The set version uses fewer variables', 'The set answers "seen before?" in O(1) average instead of re-scanning earlier elements', 'Sets are sorted', 'It stops at the first duplicate'], answer: 1, explain: "Early exit helps both versions equally; the difference is the O(1) membership test versus an inner loop." },
        { q: "Which input makes the set-based `has_duplicates` fail but not the nested-loop version?", options: ['An empty list', 'A list of lists, e.g. [[1], [1]]', 'Negative numbers', 'A very long list'], answer: 1, explain: "Lists are unhashable, so `seen.add([1])` raises TypeError. `==` comparison works on lists, so the slow version still runs." },
      ],
      problems: [217, 1],
      terms: ['edge-case', 'duplicate', 'invariant', 'hashable'],
      verbal: "\"This function returns True if any value appears more than once. It keeps a set of values seen so far and stops at the first repeat, so it's O(n) time and O(n) space. Edge cases: empty list returns False, a single element returns False, and unhashable values like lists would raise a TypeError.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'brute-to-optimal',
      title: 'Brute force → bottleneck → optimized',
      summary: 'Find the repeated work in a correct slow solution, then pick the structure that removes exactly that work.',
      what: "When no pattern is obvious, **start with brute force on purpose**. A correct slow solution tells you where the time goes, and the place where time goes — the **bottleneck** — tells you which tool to use.\n\nCommon bottlenecks and what removes them:\n\n- **Searching the same collection again and again** (\"is the complement anywhere?\") → a set/dict for O(1) lookup, or sort once + binary search.\n- **Recomputing a sum or count over overlapping ranges** → prefix sums or a sliding window.\n- **Checking all pairs on sorted data** → two pointers (each step discards a whole row of pairs).\n- **Recomputing the same subproblem** → memoization / dynamic programming.\n- **Rescanning for the current min or max** → keep a running min/max, or a heap.\n- **Generating every arrangement when you only need a property** → a canonical key or a count.",
      why: "Interviewers expect the brute force → optimize story, and it is a reliable way to reach the pattern when recognition fails. The bottleneck is the evidence for your choice, so it also gives you a clear explanation of WHY the optimized version works.",
      how: [
        "Write (or say) the brute force and its Big-O, naming every size variable.",
        "Point at the line that runs the most times. Ask: what question is that line answering over and over?",
        "Match that repeated question to a tool from the list (lookup → hash; overlapping ranges → prefix/window; sorted pairs → two pointers; running extreme → variable or heap).",
        "Re-derive the new time AND space. Say the trade-off out loud (\"O(n) extra memory to save a factor of n in time\").",
        "Check that the brute force and the optimized version agree on small inputs — the brute force is your test oracle.",
      ],
      code: py`
import random

# Bottleneck 1: repeated search. Brute force asks "is target - x anywhere?" by scanning.
def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):       # <- this scan is the bottleneck
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

def two_sum_fast(nums, target):
    seen = {}                                   # replaces the scan with O(1) lookups
    for j, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], j]
        seen[x] = j
    return []

# Bottleneck 2: rescanning for a running minimum (best single buy/sell).
def max_profit_brute(prices):
    best = 0
    for sell in range(len(prices)):
        for buy in range(sell):                 # <- re-finds the minimum before 'sell' every time
            best = max(best, prices[sell] - prices[buy])
    return best

def max_profit_fast(prices):
    best, lowest = 0, float("inf")
    for p in prices:
        lowest = min(lowest, p)                 # carry the minimum forward instead
        best = max(best, p - lowest)
    return best

# The brute force is the oracle: compare on many small random inputs.
rng = random.Random(7)
for _ in range(300):
    nums = [rng.randint(-5, 5) for _ in range(rng.randint(0, 7))]
    t = rng.randint(-6, 6)
    a, b = two_sum_brute(nums, t), two_sum_fast(nums, t)
    assert (a == []) == (b == [])                       # both find a pair or both don't
    if b:
        assert nums[b[0]] + nums[b[1]] == t and b[0] < b[1]
    assert max_profit_brute(nums) == max_profit_fast(nums)
`,
      codeNotes: [
        "`random.Random(7)` creates a seeded generator, so the random tests are repeatable.",
        "`float(\"inf\")` is a value larger than any number — a safe starting point for a running minimum.",
        "The two Two Sum versions may return different (valid) pairs, so the test checks validity instead of equality.",
      ],
      complexity: {
        time: 'Two Sum O(n²) → O(n); max profit O(n²) → O(n)',
        space: 'Two Sum O(1) → O(n); max profit O(1) → O(1)',
        derivation: [
          "Brute Two Sum: the inner loop runs n − 1, n − 2, …, 1 times → n(n − 1)/2 → O(n²).",
          "Fast Two Sum: one loop of n iterations with O(1) average dict work → O(n); the dict may hold n keys → O(n) space. That is the trade-off.",
          "Max profit: the brute force recomputes min(prices[0..sell]) for every sell day → O(n²). Carrying `lowest` forward makes each day O(1) → O(n) with no extra memory.",
        ],
      },
      whenToUse: [
        "Every time you do not immediately recognise the problem.",
        "When the interviewer asks \"can you do better?\" — point at the bottleneck before proposing the fix.",
        "When testing: keep the brute force as an oracle for random small inputs.",
      ],
      mistakes: [
        "Skipping brute force to look clever, then getting stuck with nothing on the board.",
        "Optimising the wrong line (micro-optimising arithmetic instead of removing the inner scan).",
        "Forgetting to re-derive space after optimising — the dict is not free.",
        "Assuming the optimized version is correct because it is faster; compare it against the brute force.",
      ],
      checks: [
        { q: "In brute-force Two Sum, what question does the inner loop repeat?", options: ['"Is the list sorted?"', '"Does the value target − nums[i] appear later?"', '"What is the maximum?"', '"How long is the list?"'], answer: 1, explain: "Every inner scan searches for one specific value. Repeated search → hash map." },
        { q: "Brute force sums every subarray from scratch. Which tool removes that bottleneck?", options: ['A stack', 'Prefix sums (or a sliding window when values are non-negative)', 'Backtracking', 'A heap'], answer: 1, explain: "Overlapping ranges share most of their sum; prefix sums make each range sum O(1)." },
        { q: "After replacing an O(n²) pair scan with a dict, what must you also say?", options: ['Nothing else changes', 'Space grew from O(1) to O(n) — that is the trade-off', 'The answer may now be wrong', 'Time is now O(log n)'], answer: 1, explain: "Always re-derive both time and space after an optimization." },
      ],
      problems: [1, 121, 217, 268],
      terms: ['brute-force', 'trade-off', 'time-complexity', 'auxiliary-space'],
      verbal: "\"The brute force checks every pair, O(n²). The inner loop is just searching for target minus x, so the bottleneck is repeated search. A dictionary answers that in O(1), which brings the total to O(n) at the cost of O(n) extra space.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'testing-hints',
      title: 'Testing your solution and responding to hints',
      summary: 'Pick edge cases systematically, trace one by hand, and treat an interviewer hint as information — then re-derive out loud.',
      what: "Two habits separate a working solution from an accepted one.\n\n**Testing.** After coding, trace one normal example by hand, then name edge cases by *input class* rather than guessing:\n\n- Size: empty, one element, two elements, very large.\n- Values: duplicates, all equal, negatives, zero, the minimum/maximum allowed.\n- Structure: already sorted, reverse sorted, answer at the first or last position, no answer exists.\n- Linked lists and trees: empty, single node, removing the head, a skewed (list-like) tree.\n\n**Hints.** A hint is not a penalty; it is the interviewer telling you where to look. ColorStack members reported getting a complexity answer wrong, receiving a hint, and correcting it. A good response: (1) acknowledge it, (2) restate what it implies, (3) connect it to your current plan, (4) re-derive the result aloud.",
      why: "Interviewers grade testing and collaboration, not just a green checkmark. Edge cases are where off-by-one errors and crashes live. And handling a hint well can turn a stuck interview into a strong signal about how you work with a team.",
      how: [
        "Trace your code on the example from the prompt, writing variable values after each step.",
        "Run through the edge-case classes for your input type; for each, say what your code returns and whether that is right.",
        "When you have a brute force, compare it with your solution on small random inputs (in practice) or on 2–3 hand cases (in the interview).",
        "When given a hint: pause, repeat it in your own words, and say what it changes (\"you're saying I don't need the whole sort — so maybe a running value\").",
        "After any correction, restate the final approach and complexity from scratch rather than patching the old explanation.",
      ],
      code: py`
import random

def missing_brute(nums):
    n = len(nums)
    for candidate in range(n + 1):           # O(n) candidates x O(n) membership in a list
        if candidate not in nums:
            return candidate

def missing_sum(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)      # expected total minus actual total

def missing_xor(nums):
    acc = len(nums)
    for i, x in enumerate(nums):
        acc ^= i ^ x                         # pairs cancel; the missing value remains
    return acc

def check(fn, cases):
    """Tiny test helper: every (input, expected) pair must match."""
    for args, expected in cases:
        got = fn(list(args))
        assert got == expected, (fn.__name__, args, got, expected)

edge_cases = [
    ((0,), 1),             # one element, missing value is n
    ((1,), 0),             # one element, missing value is 0
    ((3, 0, 1), 2),        # example from the prompt
    ((0, 1, 2, 3), 4),     # nothing missing inside -> answer is n
    ((), 0),               # empty input: n = 0, only 0 can be missing
]
for fn in (missing_brute, missing_sum, missing_xor):
    check(fn, edge_cases)

rng = random.Random(1)
for _ in range(200):                         # brute force as the oracle
    n = rng.randint(0, 12)
    nums = list(range(n + 1))
    nums.remove(rng.randint(0, n))
    rng.shuffle(nums)
    assert missing_brute(nums) == missing_sum(nums) == missing_xor(nums)
`,
      codeNotes: [
        "`n * (n + 1) // 2` is the sum 0 + 1 + … + n; `//` keeps it an integer.",
        "`^` is bitwise XOR: `a ^ a == 0` and `a ^ 0 == a`, so every number that appears both as an index and as a value cancels.",
        "`list(args)` copies the tuple so a function that mutates its input cannot affect the next test.",
      ],
      complexity: {
        time: 'brute O(n²); sum O(n); XOR O(n)',
        space: 'all O(1) extra',
        derivation: [
          "Brute force: n + 1 candidates, and `candidate not in nums` scans a list → O(n) each → O(n²).",
          "Sum formula: `sum(nums)` is one pass → O(n); the formula is O(1).",
          "XOR: one pass with O(1) work per element → O(n); one accumulator → O(1) space. (Python ints do not overflow, so the sum version is safe here; in C or Java the XOR version avoids overflow.)",
        ],
      },
      whenToUse: [
        "Every solution, every time — testing is part of the answer, not an extra.",
        "When the interviewer goes quiet or asks \"are you sure?\": trace an edge case instead of defending your code.",
        "When you receive a hint or a correction about complexity.",
      ],
      mistakes: [
        "Testing only the example from the prompt.",
        "Listing edge cases without saying what your code returns for them.",
        "Ignoring a hint or arguing with it before you have understood it.",
        "After a correction, keeping the old complexity in your summary.",
      ],
      checks: [
        { q: "For Missing Number with nums = [0, 1, 2, 3], what should be returned?", options: ['0', '3', '4 (the missing value is n)', 'None'], answer: 2, explain: "The range is 0..n with n = 4; every value 0..3 is present, so 4 is missing. Easy to miss without the edge-case list." },
        { q: "You say your solution is O(n). The interviewer asks, \"What does `x in nums` cost on a list?\" What is the best response?", options: ['Insist it is O(1)', 'Recognise the scan is O(n) per lookup, so the total is O(n²), then propose a set', 'Change the subject to space complexity', 'Say Big-O does not matter in Python'], answer: 1, explain: "Acknowledge, restate, re-derive: the hint points at a hidden O(n) operation inside the loop." },
        { q: "Which is NOT an edge-case class for a linked-list removal function?", options: ['Empty list', 'Removing the head', 'Every node must be removed', 'The list is stored in a dictionary'], answer: 3, explain: "The first three are classic. How the caller stores the list is not an input class of the function." },
      ],
      problems: [268, 26, 704],
      terms: ['edge-case', 'off-by-one', 'invariant', 'trade-off'],
      verbal: "\"Let me test it: for [3, 0, 1] the expected sum is 6, actual is 4, so it returns 2. Edge cases: one element, nothing missing in the middle so the answer is n, and the empty list returns 0.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'math-simulation',
      title: 'Simulation and digit math: carries, clocks, digits',
      summary: 'Some questions have no data-structure trick: model the rule exactly, then compute. Say the formula before you code it.',
      what: "**Simulation** means doing what the problem describes, step by step, with careful bookkeeping. Typical forms:\n\n- **Digit-by-digit arithmetic with a carry** — Add Strings, Add Two Numbers: walk from the least significant digit, add, write `total % 10`, carry `total // 10`.\n- **Digit extraction** — `x % 10` gives the last digit, `x // 10` drops it. Used for palindrome numbers and digit counts.\n- **Modeling a physical rule** — the clock-hands angle: the minute hand moves 6° per minute; the hour hand moves 30° per hour **plus** 0.5° per minute.\n- **Lookup-and-scan rules** — Roman numerals: a table of symbol values plus a rule about neighbours.\n\nThe pattern is not a data structure but a discipline: write the rule as a formula or an invariant first, then implement it.",
      why: "Historical Microsoft reports include the clock angle and \"find a missing number\", and ColorStack recommends Add Strings and Palindrome Number. These questions test whether you can turn words into a correct model — and they punish skipping the edge cases (carry left at the end, 12 o'clock, negative numbers).",
      how: [
        "Write the rule in words, then as a formula (\"hour angle = 30·h + 0.5·m\").",
        "Decide the processing order (right-to-left for carries, left-to-right with a look-ahead for Roman numerals).",
        "Name the state you carry between steps (carry, running total, previous value).",
        "Loop until every input AND the state are exhausted (\"while i ≥ 0 or j ≥ 0 or carry\").",
        "Test the boundary values the rule creates: 12:00, a final carry, a single digit, zero.",
      ],
      code: py`
def add_strings(a, b):
    i, j, carry, out = len(a) - 1, len(b) - 1, 0, []
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += ord(a[i]) - ord("0")      # digit value without int(a)
            i -= 1
        if j >= 0:
            total += ord(b[j]) - ord("0")
            j -= 1
        out.append(str(total % 10))
        carry = total // 10
    return "".join(reversed(out))

assert add_strings("11", "123") == "134"
assert add_strings("456", "77") == "533"
assert add_strings("999", "1") == "1000"     # final carry creates a new digit
assert add_strings("0", "0") == "0"

def clock_angle(hour, minutes):
    minute_angle = 6 * minutes                     # 360 degrees / 60 minutes
    hour_angle = 30 * (hour % 12) + 0.5 * minutes  # 360 / 12 per hour, plus drift per minute
    diff = abs(hour_angle - minute_angle)
    return min(diff, 360 - diff)                   # the smaller (acute or right) angle

assert clock_angle(12, 30) == 165
assert clock_angle(3, 30) == 75
assert clock_angle(3, 15) == 7.5
assert clock_angle(12, 0) == 0

def is_palindrome_number(x):
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    rev = 0
    while x > rev:                                 # reverse only half the digits
        rev = rev * 10 + x % 10
        x //= 10
    return x == rev or x == rev // 10              # odd length: drop the middle digit

assert is_palindrome_number(121) and is_palindrome_number(0) and is_palindrome_number(1221)
assert not is_palindrome_number(-121) and not is_palindrome_number(10)
`,
      codeNotes: [
        "`ord(ch) - ord(\"0\")` turns a digit character into its integer value without converting the whole string.",
        "`\"\".join(reversed(out))` builds the result once; digits were collected least-significant first.",
        "`hour % 12` maps 12 to 0 so 12:30 is computed like 0:30.",
      ],
      complexity: {
        time: 'add_strings O(max(n, m)); clock_angle O(1); palindrome O(d) for d digits',
        space: 'add_strings O(max(n, m)) output; others O(1)',
        derivation: [
          "add_strings: each loop iteration consumes at least one digit or the final carry → at most max(n, m) + 1 iterations.",
          "clock_angle does a fixed number of arithmetic operations regardless of input → O(1).",
          "Each palindrome iteration removes one digit from x; it stops halfway → O(d/2) = O(d).",
        ],
      },
      whenToUse: [
        "Numbers given as strings or linked lists that are too long for built-in types (Add Strings, Add Two Numbers).",
        "Problems described as a physical or business rule (clocks, calendars, change-making by rule).",
        "Any time the follow-up says \"without converting to a string\".",
      ],
      mistakes: [
        "Stopping the addition loop when both strings end, and losing the final carry (999 + 1).",
        "Forgetting that the hour hand moves between hours (3:30 is not 90°).",
        "Returning the larger angle when the question asks for the smaller one.",
        "Treating negative numbers as palindromes, or forgetting that 10 is not one.",
      ],
      checks: [
        { q: "Why does the add_strings loop condition include `or carry`?", options: ['To handle empty strings', 'So a carry left after the last digits still produces a new leading digit (999 + 1 = 1000)', 'To skip zeros', 'It is not needed'], answer: 1, explain: "Without it, 999 + 1 would return 000." },
        { q: "At 3:30, where is the hour hand?", options: ['Exactly on the 3 (90°)', 'Halfway between 3 and 4 (105°)', 'On the 6', 'On the 4'], answer: 1, explain: "30 × 3 + 0.5 × 30 = 105°. The minute hand is at 180°, so the angle is 75°." },
      ],
      problems: [415, 1344, 9, 13, 2],
      terms: ['edge-case', 'constraint', 'state'],
      verbal: "\"I'll simulate grade-school addition from the right: add the two digits and the carry, write the last digit, carry the rest, and keep going while either string has digits or a carry remains. That's O(max(n, m)).\"",
    },
  ],
};
