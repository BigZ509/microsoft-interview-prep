import type { Module } from '../types';

const py = String.raw;

export const arraysModule: Module = {
  id: 'arrays',
  number: 3,
  title: 'Arrays and Strings',
  priority: 'P0',
  phase: 1,
  blurb: 'Traversal, index manipulation, prefix/suffix thinking, frequency counting, and in-place edits — the substrate of most interview problems.',
  prerequisites: ['python', 'big-o'],
  lessons: [
    {
      id: 'traversal',
      title: 'Traversal, index manipulation, and in-place operations',
      summary: 'Walk arrays forward, backward, and with running state — and edit them without extra memory.',
      what: "An **array** (Python list) stores elements in consecutive slots, so `a[i]` is O(1). **Traversal** visits elements in order. **Index manipulation** means computing positions: neighbors `i - 1` / `i + 1`, the mirror `n - 1 - i`, or a write position separate from the read position.\n\n**In-place** means modifying the input array itself, using only O(1) extra memory, instead of building a new one.",
      why: "Many problems are solved in a single traversal by carrying **running state** — the minimum so far, the best answer so far, the next write slot. In-place techniques satisfy \"O(1) extra space\" requirements that interviewers often add as a follow-up.",
      how: [
        "Decide direction: left-to-right for running state; right-to-left when filling from the end avoids overwriting (Merge Sorted Array).",
        "Identify state you carry: e.g. `min_price`, `best_profit`.",
        "For in-place filtering, keep a `write` index: copy each kept element to `a[write]`, then `write += 1`.",
        "Swap with tuple assignment: `a[i], a[j] = a[j], a[i]`.",
        "Guard boundaries: `0 <= i < n` before reading `a[i]`.",
      ],
      visual: {
        kind: 'array',
        title: 'Running minimum for Best Time to Buy and Sell Stock',
        steps: [
          { cells: [7, 1, 5, 3, 6, 4], pointers: { i: 0 }, vars: { min_price: '7', best: '0' }, note: 'Day 0: the cheapest price so far is 7; selling today makes 0.' },
          { cells: [7, 1, 5, 3, 6, 4], pointers: { i: 1 }, highlight: [1], vars: { min_price: '1', best: '0' }, note: 'Day 1: new minimum 1.' },
          { cells: [7, 1, 5, 3, 6, 4], pointers: { i: 2 }, vars: { min_price: '1', best: '4' }, note: 'Day 2: selling at 5 after buying at 1 → profit 4.' },
          { cells: [7, 1, 5, 3, 6, 4], pointers: { i: 4 }, highlight: [1, 4], vars: { min_price: '1', best: '5' }, note: 'Day 4: sell at 6 → profit 5. One pass, O(1) state.' },
        ],
      },
      code: py`
def max_profit(prices):
    min_price = float("inf")
    best = 0
    for p in prices:
        min_price = min(min_price, p)   # cheapest buy so far
        best = max(best, p - min_price) # best sell today
    return best

assert max_profit([7, 1, 5, 3, 6, 4]) == 5
assert max_profit([7, 6, 4, 3, 1]) == 0

def remove_value_in_place(nums, val):
    """Keep elements != val at the front; return how many were kept."""
    write = 0
    for read in range(len(nums)):
        if nums[read] != val:
            nums[write] = nums[read]
            write += 1
    return write

a = [3, 2, 2, 3, 4]
k = remove_value_in_place(a, 3)
assert k == 3 and a[:k] == [2, 2, 4]

def reverse_in_place(nums):
    i, j = 0, len(nums) - 1
    while i < j:
        nums[i], nums[j] = nums[j], nums[i]   # tuple swap
        i += 1
        j -= 1

b = [1, 2, 3, 4]
reverse_in_place(b)
assert b == [4, 3, 2, 1]
`,
      codeNotes: [
        "`float('inf')` is larger than every number — a safe starting minimum.",
        "`nums[i], nums[j] = nums[j], nums[i]` evaluates the right side fully first, so no temp variable is needed.",
        "The read/write pattern is the same-direction two-pointer technique (Module 5).",
      ],
      complexity: {
        time: 'All three functions O(n)',
        space: 'O(1) auxiliary',
        derivation: [
          "max_profit: one pass, two O(1) updates per element → O(n); two scalars → O(1) space.",
          "remove_value_in_place: `read` visits each index once; `write` never exceeds `read` → O(n) time, O(1) space.",
          "reverse_in_place: i and j meet in the middle after n/2 swaps → O(n).",
        ],
      },
      whenToUse: [
        "\"Best so far\" problems → single pass with running state.",
        "\"Do it in-place / O(1) extra memory\" → read/write indices or swaps.",
        "Filling a buffer that has free space at the end → write from the right.",
      ],
      mistakes: [
        "Starting `min_price` at 0 instead of infinity (or prices[0]).",
        "Off-by-one: `j = len(nums)` instead of `len(nums) - 1`.",
        "Deleting from a list while iterating it with a for loop — indices shift.",
      ],
      checks: [
        { q: "What does max_profit([7, 6, 4, 3, 1]) return?", options: ['0', '-1', '6', '3'], answer: 0, explain: "Prices only fall, so every sell-after-buy loses money. best starts at 0 (you may choose not to trade) and never improves." },
        { q: "After `k = remove_value_in_place(nums, val)`, what is guaranteed about `nums[k:]`?", options: ['Nothing — they are leftovers the caller ignores', 'They all equal val', 'They are zeros', 'They are sorted'], answer: 0, explain: "Only nums[:k] is meaningful. The read/write pattern overwrites the front and leaves stale values behind." },
        { q: "remove_value_in_place uses how much extra space?", options: ['O(n)', 'O(k)', 'O(1)', 'O(log n)'], answer: 2, explain: "Only two integer indices; the input list itself is reused." },
      ],
      problems: [121, 88],
      terms: ['in-place', 'traversal', 'maximum', 'minimum'],
      verbal: "\"I'll keep a running minimum price; for each day the best profit is today's price minus that minimum. One pass, O(n) time, O(1) space.\"",
    },
    {
      id: 'subarrays',
      title: 'Contiguous vs. non-contiguous: subarray, substring, subsequence, prefix, suffix',
      summary: 'The single most important vocabulary distinction in array problems.',
      what: "- **Subarray** — a **contiguous** (no gaps) slice of an array: `[2, 3]` in `[1, 2, 3, 4]`.\n- **Substring** — a contiguous slice of a string: `'bc'` in `'abcd'`.\n- **Subsequence** — elements in their original order, but gaps allowed: `[1, 3, 4]` from `[1, 2, 3, 4]`.\n- **Subset** — any selection, order irrelevant.\n- **Prefix** — a subarray that starts at index 0: `a[:i]`. **Suffix** — one that ends at the last index: `a[i:]`.\n\nCounts for length n: n(n+1)/2 non-empty subarrays (O(n²)), 2ⁿ subsequences (exponential), n + 1 prefixes.",
      why: "The word decides the algorithm. Contiguous → sliding window, prefix sums, Kadane. Subsequence → usually dynamic programming or greedy. Mixing them up means solving a different problem.",
      how: [
        "Underline \"contiguous\", \"subarray\", or \"substring\" → a window [l, r] describes every candidate.",
        "\"Subsequence\" → you choose which elements to keep, preserving order.",
        "Prefix sums: `prefix[i] = sum(a[:i])` lets you compute any subarray sum as `prefix[r + 1] - prefix[l]`.",
        "Suffix arrays (e.g. max to the right) are prefix arrays computed from the right.",
      ],
      visual: {
        kind: 'array',
        title: 'Subarray vs. subsequence in [1, 2, 3, 4]',
        steps: [
          { cells: [1, 2, 3, 4], window: [1, 2], note: 'Subarray [2, 3]: contiguous indices 1–2.' },
          { cells: [1, 2, 3, 4], highlight: [0, 2, 3], note: 'Subsequence [1, 3, 4]: same order, index 1 skipped. NOT a subarray.' },
          { cells: [1, 2, 3, 4], window: [0, 1], note: 'Prefix [1, 2] = a[:2].' },
          { cells: [1, 2, 3, 4], window: [2, 3], note: 'Suffix [3, 4] = a[2:].' },
        ],
      },
      code: py`
def all_subarrays(a):
    out = []
    for l in range(len(a)):
        for r in range(l, len(a)):
            out.append(a[l:r + 1])
    return out

subs = all_subarrays([1, 2, 3])
assert subs == [[1], [1, 2], [1, 2, 3], [2], [2, 3], [3]]
n = 3
assert len(subs) == n * (n + 1) // 2

def is_subsequence(small, big):
    i = 0
    for ch in big:
        if i < len(small) and small[i] == ch:
            i += 1
    return i == len(small)

assert is_subsequence("ace", "abcde") and not is_subsequence("aec", "abcde")

# Prefix sums: any subarray sum in O(1) after O(n) preprocessing
a = [3, -1, 4, 2]
prefix = [0]
for x in a:
    prefix.append(prefix[-1] + x)
assert prefix == [0, 3, 2, 6, 8]
assert prefix[3 + 1] - prefix[1] == sum(a[1:4]) == 5   # subarray a[1..3]
`,
      codeNotes: [
        "`a[l:r + 1]` includes index r because the slice stop is exclusive.",
        "`prefix[-1]` reads the last element appended so far.",
        "A leading 0 in `prefix` makes the formula work for subarrays starting at index 0.",
      ],
      complexity: {
        time: 'Enumerating subarrays O(n²) windows (O(n³) if each is copied); is_subsequence O(len(big)); prefix build O(n)',
        space: 'prefix O(n); is_subsequence O(1)',
        derivation: [
          "There are n choices of l and up to n choices of r ≥ l: n(n+1)/2 = O(n²) subarrays.",
          "Copying each slice costs up to O(n), so materializing them all is O(n³) — avoid it in real solutions.",
          "is_subsequence advances through big once; i only moves forward → O(len(big)).",
          "prefix is one pass with O(1) work per element → O(n) time and O(n) space.",
        ],
      },
      whenToUse: [
        "Contiguous + a condition on the window → sliding window (if the condition is monotonic) or prefix sums (if negatives are allowed).",
        "Max/min contiguous sum → Kadane.",
        "Subsequence → greedy pointer matching or DP.",
      ],
      mistakes: [
        "Treating \"subsequence\" as \"substring\".",
        "Forgetting the leading 0 in prefix sums, causing off-by-one errors.",
        "Generating all subarrays when a single pass suffices.",
      ],
      checks: [
        { q: "Is [1, 3] a subarray of [1, 2, 3]?", options: ['Yes', 'No — it skips 2, so it is a subsequence only', 'Only if sorted', 'Yes, a prefix'], answer: 1, explain: "Subarrays must be contiguous." },
        { q: "How many non-empty subarrays does an array of length 4 have?", options: ['4', '10', '16', '24'], answer: 1, explain: "n(n+1)/2 = 4·5/2 = 10." },
        { q: "With prefix = [0, a0, a0+a1, …], the sum of a[l..r] inclusive is…", options: ['prefix[r] - prefix[l]', 'prefix[r + 1] - prefix[l]', 'prefix[r] - prefix[l - 1]', 'prefix[r + 1] - prefix[l + 1]'], answer: 1, explain: "prefix[r+1] covers a[0..r]; subtracting prefix[l] removes a[0..l-1]." },
      ],
      problems: [53, 3, 560, 14],
      terms: ['subarray', 'substring', 'subsequence', 'contiguous', 'prefix', 'suffix'],
      verbal: "\"The problem says subarray, so the elements must be contiguous — that suggests a window or prefix sums rather than choosing arbitrary elements.\"",
    },
    {
      id: 'frequency',
      title: 'Frequency counting and fixed-size count arrays',
      summary: 'Count occurrences once, then answer questions about the counts.',
      what: "**Frequency counting** records how many times each value occurs. Two implementations:\n\n- **Dictionary / Counter** — works for any hashable values.\n- **Fixed-size count array** — when values come from a small known range: 26 lowercase letters (`ord(c) - ord('a')`), 10 digits, 128 ASCII codes. Index = value, entry = count.\n\nA frequency table is a **multiset** fingerprint: it captures *what* is present and *how many times*, but not the order.",
      why: "\"Same characters in any order\", \"appears more than n/2 times\", \"first unique character\" all reduce to comparing or scanning counts. Count arrays are faster in practice and their size is a constant, so space is O(1) with respect to n.",
      how: [
        "Choose the key space: arbitrary values → dict; small fixed alphabet → list of that size.",
        "One pass to build counts.",
        "Answer the question from counts: compare two tables (anagram), find count > n // 2 (majority), find first value with count 1.",
        "For two strings, you can increment for one and decrement for the other, then check all zeros.",
      ],
      visual: {
        kind: 'array',
        title: "Counting 'anagram' vs 'nagaram' with one 26-slot array (a–g, n, r, m shown)",
        steps: [
          { cells: ['a:0', 'g:0', 'm:0', 'n:0', 'r:0'], note: 'Start with all zeros.' },
          { cells: ['a:3', 'g:1', 'm:1', 'n:1', 'r:1'], highlight: [0], note: "Increment for every char of 'anagram'." },
          { cells: ['a:0', 'g:0', 'm:0', 'n:0', 'r:0'], note: "Decrement for every char of 'nagaram'. All zeros → anagrams." },
        ],
      },
      code: py`
from collections import Counter

def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = [0] * 26
    for a, b in zip(s, t):
        counts[ord(a) - ord("a")] += 1
        counts[ord(b) - ord("a")] -= 1
    return all(c == 0 for c in counts)

assert is_anagram("anagram", "nagaram") and not is_anagram("rat", "car")
assert Counter("anagram") == Counter("nagaram")       # dict-based equivalent

def majority(nums):
    counts = Counter(nums)
    for value, c in counts.items():
        if c > len(nums) // 2:
            return value

assert majority([2, 2, 1, 1, 1, 2, 2]) == 2

def digit_counts(n):
    """10-slot count array for the digits of a non-negative integer."""
    counts = [0] * 10
    if n == 0:
        counts[0] = 1
    while n > 0:
        counts[n % 10] += 1    # last digit
        n //= 10               # drop last digit
    return tuple(counts)

assert digit_counts(121) == digit_counts(112) == digit_counts(211)
assert digit_counts(101) == digit_counts(110)            # same digits {0,1,1}
assert digit_counts(123) != digit_counts(112)
`,
      codeNotes: [
        "`n % 10` extracts the last decimal digit; `n //= 10` removes it.",
        "101 and 110 have the same digit multiset {0, 1, 1}, so they share a count key — an important test case for the digit-grouping mock.",
        "`counts.items()` yields (key, count) pairs.",
      ],
      complexity: {
        time: 'is_anagram O(n); majority O(n); digit_counts O(d) for d digits',
        space: 'Count arrays O(1) (fixed 26 or 10 slots); Counter O(u) for u distinct values',
        derivation: [
          "is_anagram does one pass over the n paired characters → O(n); the final check scans 26 slots → O(1).",
          "The 26-slot array never grows with n → O(1) auxiliary space (O(a) for an alphabet of size a).",
          "majority builds a Counter in O(n) and scans its ≤ n entries → O(n) time, O(n) worst-case space.",
          "digit_counts loops once per digit; a number ≤ N has about log₁₀ N digits → O(d).",
        ],
      },
      whenToUse: [
        "Anagram / permutation-of-letters checks.",
        "Grouping by \"same multiset\" (Group Anagrams, digit grouping).",
        "Threshold questions (majority, top frequent, first unique).",
      ],
      mistakes: [
        "Using a 26-slot array when input may contain uppercase, digits, or Unicode — check constraints.",
        "Forgetting the n == 0 case when counting digits (the while loop never runs).",
        "Comparing count LISTS as dict keys — convert to tuple first.",
      ],
      checks: [
        { q: "Space complexity of a 26-slot count array for strings of length n?", options: ['O(n)', 'O(26n)', 'O(1)', 'O(log n)'], answer: 2, explain: "26 is fixed by the alphabet and does not grow with n." },
        { q: "Do 101 and 110 belong in the same digit-frequency group?", options: ['Yes — both are {0, 1, 1}', 'No — different order', 'No — 101 is odd', 'Only if sorted'], answer: 0, explain: "Both contain one 0 and two 1s, so their 10-slot count tuples are identical." },
        { q: "What does `n % 10` give for n = 4732?", options: ['4', '47', '2', '473'], answer: 2, explain: "Remainder after dividing by 10 is the last digit." },
      ],
      problems: [242, 169, 49],
      terms: ['frequency', 'occurrence', 'multiset', 'anagram'],
      verbal: "\"Since the input is lowercase letters, I'll use a fixed 26-slot count array — O(n) time and O(1) extra space, because the alphabet size is constant.\"",
    },
    {
      id: 'strings',
      title: 'String manipulation and common array optimization techniques',
      summary: 'Strings are immutable arrays of characters — build them efficiently, and know the standard speed-up moves.',
      what: "Python strings are **immutable**: every \"edit\" makes a new string. Efficient string building collects pieces in a list and calls `''.join(pieces)` once. Useful methods: `s.split()`, `s.strip()`, `s.lower()`, `s.isalnum()`, `s.startswith(p)`.\n\nCommon array/string optimization techniques:\n\n- **Hashing** — replace repeated searches with O(1) lookups.\n- **Sorting first** — brings related items together.\n- **Two pointers** — exploit order or symmetry.\n- **Prefix sums / running state** — avoid recomputing.\n- **Counting arrays** — replace dicts for small alphabets.",
      why: "Repeated concatenation in a loop can be O(n²). Recognizing which optimization technique applies is how you go from brute force to optimal.",
      how: [
        "Merge or transform strings with indices into a list of characters, then join.",
        "Compare prefixes column by column (Longest Common Prefix): stop at the first mismatch or shortest length.",
        "To reverse or check palindromes, use two pointers or `s[::-1]` (O(n) copy).",
        "When brute force is O(n²), ask: would a hash map, sort, two pointers, or prefix sum remove the inner loop?",
      ],
      code: py`
def merge_alternately(w1, w2):
    out = []
    i = 0
    while i < len(w1) or i < len(w2):
        if i < len(w1):
            out.append(w1[i])
        if i < len(w2):
            out.append(w2[i])
        i += 1
    return "".join(out)

assert merge_alternately("abc", "pqrs") == "apbqcrs"

def longest_common_prefix(strs):
    if not strs:
        return ""
    shortest = min(strs, key=len)
    for i, ch in enumerate(shortest):
        for s in strs:
            if s[i] != ch:
                return shortest[:i]
    return shortest

assert longest_common_prefix(["flower", "flow", "flight"]) == "fl"
assert longest_common_prefix(["dog", "racecar", "car"]) == ""
assert longest_common_prefix(["a"]) == "a"

def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]

assert is_palindrome("A man, a plan, a canal: Panama")
`,
      codeNotes: [
        "`min(strs, key=len)` returns the shortest string (O(number of strings)).",
        "The while condition `i < len(w1) or i < len(w2)` continues until BOTH strings are exhausted.",
        "`c.isalnum()` is True for letters and digits.",
      ],
      complexity: {
        time: 'merge O(n + m); LCP O(S) where S = total characters; palindrome O(n)',
        space: 'merge O(n + m) output; LCP O(1) auxiliary; palindrome O(n)',
        derivation: [
          "merge_alternately: i goes up to max(n, m), appending each character once; join is linear → O(n + m).",
          "longest_common_prefix: for each column i of the shortest string we check every string once; total checks ≤ total characters S → O(S).",
          "is_palindrome builds a filtered list (O(n)) and a reversed copy (O(n)) → O(n) time and space; two pointers would make it O(1) space.",
        ],
      },
      whenToUse: [
        "Any time you build a string inside a loop → list + join.",
        "Prefix problems → compare column-wise against the shortest string.",
        "Optimizations checklist when stuck: hash, sort, two pointers, prefix sums, count array.",
      ],
      mistakes: [
        "`s[i] = 'x'` — strings do not support item assignment.",
        "Forgetting an empty input list or a single string.",
        "Indexing `s[i]` past the end of a shorter string — the shortest-string bound prevents this.",
      ],
      checks: [
        { q: "Why build strings with `''.join(list)`?", options: ['It sorts characters', 'Strings are immutable, so repeated += may copy repeatedly (O(n²))', 'join is required by LeetCode', 'It removes duplicates'], answer: 1, explain: "Each concatenation may create a new string; join computes the final size once and copies each piece once." },
        { q: "Longest Common Prefix of ['interview', 'internet', 'interval']?", options: ["'inter'", "'int'", "'interv'", "''"], answer: 0, explain: "All three share 'inter'; the 6th characters are 'v', 'n', 'v'." },
      ],
      problems: [14, 1768, 1200],
      terms: ['immutable', 'prefix', 'brute-force', 'optimal'],
      verbal: "\"Strings are immutable in Python, so I'll collect characters in a list and join at the end, keeping it linear.\"",
    },
  ],
};
