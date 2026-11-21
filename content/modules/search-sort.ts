import type { Module } from '../types';

const py = String.raw;

export const searchSortModule: Module = {
  id: 'search-sort',
  number: 10,
  title: 'Binary Search and Sorting',
  priority: 'P0',
  phase: 2,
  blurb: 'Search invariants, lower/upper bounds, binary search over an answer space, the classic sorting algorithms, stability, and when sorting simplifies a problem.',
  prerequisites: ['arrays', 'big-o'],
  lessons: [
    {
      id: 'binary-search',
      title: 'Linear vs. binary search, search invariants, off-by-one errors',
      summary: 'On sorted data, compare with the middle and throw away half — O(log n).',
      what: "**Linear search** checks items one by one: O(n), works on anything. **Binary search** requires **sorted** (or otherwise monotonic) data: look at the middle element, and discard the half that cannot contain the target. Each step halves the range → O(log n).\n\nThe **search invariant** is the promise your loop keeps: \"if the target exists, its index is within [lo, hi].\" Every update must preserve it, and the loop must shrink the range every iteration.",
      why: "log₂(10⁹) ≈ 30: binary search finds an item among a billion in 30 comparisons. Most binary-search bugs are off-by-one errors that come from not stating the invariant.",
      how: [
        "Inclusive template: `lo, hi = 0, n - 1`; `while lo <= hi`.",
        "`mid = (lo + hi) // 2` (in Python no overflow; in other languages use `lo + (hi - lo) // 2`).",
        "If `a[mid] == target` → return mid.",
        "If `a[mid] < target` → target must be right of mid: `lo = mid + 1`.",
        "Else → `hi = mid - 1`.",
        "Loop ends with lo > hi: the range is empty → not found.",
      ],
      visual: {
        kind: 'array',
        title: 'Binary search for 9 in [-1, 0, 3, 5, 9, 12]',
        steps: [
          { cells: [-1, 0, 3, 5, 9, 12], pointers: { lo: 0, mid: 2, hi: 5 }, window: [0, 5], note: 'mid = 2, a[2] = 3 < 9 → discard left half: lo = 3.' },
          { cells: [-1, 0, 3, 5, 9, 12], pointers: { lo: 3, mid: 4, hi: 5 }, window: [3, 5], note: 'mid = 4, a[4] = 9 == target → return 4.' },
          { cells: [-1, 0, 3, 5, 9, 12], pointers: { lo: 3, hi: 2 }, window: [3, 2], note: 'Searching for 2 instead would end with lo = 2 > hi = 1 → empty range → -1 (not shown step by step).' },
        ],
      },
      code: py`
def linear_search(a, target):
    for i, x in enumerate(a):
        if x == target:
            return i
    return -1

def binary_search(a, target):
    lo, hi = 0, len(a) - 1           # invariant: target in a[lo..hi] if present
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1             # mid is too small; exclude it
        else:
            hi = mid - 1             # mid is too big; exclude it
    return -1

a = [-1, 0, 3, 5, 9, 12]
for f in (linear_search, binary_search):
    assert f(a, 9) == 4 and f(a, 2) == -1 and f([], 1) == -1 and f([5], 5) == 0

# Every element is found, and missing values in every gap are rejected
data = list(range(0, 100, 3))
assert all(binary_search(data, x) == data.index(x) for x in data)
assert all(binary_search(data, x) == -1 for x in range(1, 100, 3))
`,
      codeNotes: [
        "`mid + 1` and `mid - 1` exclude mid after it is checked — this guarantees progress (no infinite loop).",
        "`data.index(x)` is O(n) linear search — fine as a test oracle.",
      ],
      complexity: {
        time: 'Linear O(n); binary O(log n)',
        space: 'O(1) (iterative)',
        derivation: [
          "Each iteration at least halves the range size: n → n/2 → n/4 → … → 1.",
          "After t iterations, size ≤ n / 2ᵗ; it becomes 0 when t > log₂ n → O(log n) iterations, O(1) each.",
          "Recursive binary search would add O(log n) stack space.",
        ],
      },
      whenToUse: [
        "\"Sorted array\" + find/insert/count.",
        "Any monotonic yes/no predicate over indices or values (next lesson).",
        "Search in O(log n) time is required.",
      ],
      mistakes: [
        "Mixing templates: `while lo < hi` with `hi = mid - 1` (inclusive/half-open confusion).",
        "`lo = mid` in an inclusive loop → infinite loop when lo == mid.",
        "Applying binary search to unsorted data.",
      ],
      checks: [
        { q: "Max comparisons for binary search over 1,000,000 sorted items?", options: ['~10', '~20', '~1000', '~500,000'], answer: 1, explain: "log₂(10⁶) ≈ 20." },
        { q: "In the inclusive template, after `a[mid] < target`, why `lo = mid + 1` and not `lo = mid`?", options: ['Style', 'mid is already ruled out; keeping it can cause an infinite loop', 'Python requires it', 'To find the first occurrence'], answer: 1, explain: "Excluding mid guarantees the range shrinks." },
      ],
      problems: [704, 35],
      terms: ['binary-search', 'sorted', 'invariant', 'off-by-one'],
      verbal: "\"My invariant is that the target, if present, lies in [lo, hi]. Each step compares the middle and discards half, so it's O(log n) time and O(1) space.\"",
    },
    {
      id: 'bounds',
      title: 'Lower and upper bounds, and binary search over the answer space',
      summary: 'Find the first position where a condition becomes true.',
      what: "Generalize binary search to: **\"find the first index where predicate(i) is True\"**, where the predicate is False…False True…True (monotonic).\n\n- **Lower bound**: first index with `a[i] >= target` (where target is, or would be inserted). Python: `bisect.bisect_left`.\n- **Upper bound**: first index with `a[i] > target`. Python: `bisect.bisect_right`.\n- Count of target = upper − lower.\n\n**Binary search over the answer space**: when the answer is a number in a range and \"is x feasible?\" is monotonic (e.g. smallest speed/capacity that works), binary search on x instead of on an array.",
      why: "The half-open lower-bound template handles \"insert position\", \"first occurrence\", \"count occurrences\", and \"minimum feasible value\" with one pattern — far fewer off-by-one bugs than ad-hoc variations.",
      how: [
        "Half-open template: `lo, hi = 0, n` (hi is one past the end).",
        "`while lo < hi`: `mid = (lo + hi) // 2`.",
        "If predicate(mid) is True: `hi = mid` (mid might be the answer — keep it).",
        "Else: `lo = mid + 1`.",
        "Loop ends with lo == hi = the first True index (n if none).",
      ],
      visual: {
        kind: 'array',
        title: 'lower_bound([1, 3, 5, 5, 5, 6], 5) with a half-open range [lo, hi)',
        steps: [
          { cells: [1, 3, 5, 5, 5, 6, 'end'], pointers: { lo: 0, mid: 3, hi: 6 }, window: [0, 5], note: 'hi starts at len(a) = 6 (one past the end). a[3] = 5 ≥ 5 → mid could be the answer: hi = 3.' },
          { cells: [1, 3, 5, 5, 5, 6, 'end'], pointers: { lo: 0, mid: 1, hi: 3 }, window: [0, 2], note: 'a[1] = 3 < 5 → the answer is right of mid: lo = 2.' },
          { cells: [1, 3, 5, 5, 5, 6, 'end'], pointers: { lo: 2, mid: 2, hi: 3 }, window: [2, 2], note: 'a[2] = 5 ≥ 5 → hi = 2.' },
          { cells: [1, 3, 5, 5, 5, 6, 'end'], pointers: { 'lo = hi': 2 }, highlight: [2], note: 'lo == hi == 2: the FIRST 5. upper_bound would stop at 5, so the count of 5s is 5 − 2 = 3.' },
        ],
      },
      code: py`
import bisect

def lower_bound(a, target):
    lo, hi = 0, len(a)               # answer in [lo, hi]
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] >= target:         # predicate True -> answer is mid or left
            hi = mid
        else:
            lo = mid + 1
    return lo

def upper_bound(a, target):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > target:
            hi = mid
        else:
            lo = mid + 1
    return lo

a = [1, 3, 5, 5, 5, 6]
assert lower_bound(a, 5) == 2 and upper_bound(a, 5) == 5
assert upper_bound(a, 5) - lower_bound(a, 5) == 3        # count of 5s
assert lower_bound(a, 4) == 2 and lower_bound(a, 7) == 6 and lower_bound(a, 0) == 0
for t in range(0, 8):
    assert lower_bound(a, t) == bisect.bisect_left(a, t)
    assert upper_bound(a, t) == bisect.bisect_right(a, t)

# Binary search over the answer space:
# smallest integer speed k so that all piles are eaten within h hours
def min_eating_speed(piles, h):
    def hours(k):
        return sum((p + k - 1) // k for p in piles)   # ceil(p / k)
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours(mid) <= h:          # feasible -> try smaller
            hi = mid
        else:
            lo = mid + 1
    return lo

assert min_eating_speed([3, 6, 7, 11], 8) == 4
`,
      codeNotes: [
        "`(p + k - 1) // k` is integer ceiling division.",
        "`bisect.bisect_left` / `bisect_right` are the standard-library lower/upper bounds — good to mention, but be able to write them.",
        "In the half-open template, `hi = mid` (not mid - 1) because mid could be the answer.",
      ],
      complexity: {
        time: 'Bounds O(log n); answer-space search O(n log M) where M = max(piles)',
        space: 'O(1)',
        derivation: [
          "Bounds: the range [lo, hi) halves each iteration → O(log n).",
          "Answer space: binary search over k in [1, M] takes O(log M) iterations; each feasibility check sums over n piles → O(n log M).",
        ],
      },
      whenToUse: [
        "\"Insert position\", \"first/last occurrence\", \"count in sorted array\".",
        "\"Minimum X such that …\" / \"maximum X such that …\" with a monotonic feasibility check.",
      ],
      mistakes: [
        "Using `hi = len(a) - 1` with the half-open template — can never return n (insert at end).",
        "Non-monotonic predicate — binary search silently returns garbage.",
        "Writing `hi = mid - 1` when mid might be the answer.",
      ],
      checks: [
        { q: "Search Insert Position for target 2 in [1, 3, 5, 6]?", options: ['0', '1', '2', '-1'], answer: 1, explain: "The first index with value ≥ 2 is index 1 (value 3)." },
        { q: "How do you count occurrences of x in a sorted array in O(log n)?", options: ['Linear scan', 'upper_bound(x) - lower_bound(x)', 'len(set(a))', 'Sort again'], answer: 1, explain: "The occurrences occupy exactly [lower, upper)." },
        { q: "Binary search on the answer requires…", options: ['A sorted input array', 'A monotonic feasibility predicate over candidate answers', 'A hash map', 'Recursion'], answer: 1, explain: "If x works, every larger x works (or vice versa)." },
      ],
      problems: [35, 704],
      terms: ['lower-bound', 'upper-bound', 'binary-search', 'off-by-one', 'threshold'],
      verbal: "\"I'll find the first index where a[i] >= target using a half-open range: if mid satisfies it, the answer is mid or to its left, so hi = mid; otherwise lo = mid + 1. O(log n).\"",
    },
    {
      id: 'sorting',
      title: 'Sorting algorithms, stability, and when sorting simplifies a problem',
      summary: 'Bubble and insertion are O(n²); merge sort and quicksort are O(n log n) — and sorting is often the key preprocessing step.',
      what: "- **Bubble sort**: repeatedly swap adjacent out-of-order pairs. O(n²).\n- **Insertion sort**: grow a sorted prefix, inserting each new item into place. O(n²) worst, O(n) on nearly sorted data.\n- **Merge sort**: split in half, sort each half recursively, merge. O(n log n) always; O(n) extra space; **stable**.\n- **Quicksort**: pick a pivot, partition into smaller/larger, recurse. O(n log n) average, O(n²) worst (bad pivots); in-place; not stable.\n- **Python's sort (Timsort)**: hybrid of merge + insertion sort. O(n log n) worst, O(n) best, **stable**.\n\nA sort is **stable** if equal elements keep their original relative order — important when sorting by one key after another.",
      why: "You'll rarely implement a sort, but you will (1) explain why sorting costs O(n log n), (2) use sorting to simplify problems: adjacent elements become the closest pairs, overlapping intervals become neighbors, duplicates become adjacent, two pointers become possible.",
      how: [
        "Merge sort: if len ≤ 1 return; split at mid; sort both halves; merge with two pointers. (It is recursive — read the recursion tree below intuitively today; Module 9 covers recursion in depth on Nov 28.)",
        "Recurrence: T(n) = 2T(n/2) + O(n) → log₂ n levels, O(n) merge work per level → O(n log n).",
        "Quicksort: partition around a pivot so left < pivot ≤ right, recurse on both sides. Balanced splits → O(n log n); always-smallest pivot → O(n²).",
        "Before solving, ask: \"would sorted order make this easier?\" — then pay O(n log n) once.",
      ],
      visual: {
        kind: 'tree',
        title: 'Merge sort on [5, 2, 4, 1]: log n levels of O(n) merging',
        root: { id: 'r', label: '[5,2,4,1] → [1,2,4,5]', children: [
          { id: 'l', label: '[5,2] → [2,5]', children: [{ id: 'll', label: '[5]' }, { id: 'lr', label: '[2]' }] },
          { id: 'rr', label: '[4,1] → [1,4]', children: [{ id: 'rl', label: '[4]' }, { id: 'rrr', label: '[1]' }] },
        ] },
        steps: [
          { active: ['ll', 'lr', 'rl', 'rrr'], note: 'Split until single elements (already sorted). Depth = log₂ 4 = 2.' },
          { active: ['l', 'rr'], note: 'Merge pairs: [5],[2] → [2,5]; [4],[1] → [1,4]. Total work this level: 4 element moves.' },
          { active: ['r'], note: 'Merge [2,5] and [1,4] → [1,2,4,5]. Again 4 moves. log n levels × n moves = O(n log n).' },
        ],
      },
      code: py`
def insertion_sort(a):
    a = a[:]
    for i in range(1, len(a)):
        x, j = a[i], i - 1
        while j >= 0 and a[j] > x:     # shift larger items right
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = x
    return a

def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:        # <= keeps it stable
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

def quicksort(a):
    if len(a) <= 1:
        return a
    pivot = a[len(a) // 2]
    return (quicksort([x for x in a if x < pivot])
            + [x for x in a if x == pivot]
            + quicksort([x for x in a if x > pivot]))

import random
random.seed(7)
for _ in range(50):
    data = [random.randint(-20, 20) for _ in range(random.randint(0, 15))]
    assert insertion_sort(data) == merge_sort(data) == quicksort(data) == sorted(data)

# Stability: sort by grade, ties keep the original (alphabetical) order
students = [("ana", "B"), ("bo", "A"), ("cy", "B"), ("di", "A")]
assert sorted(students, key=lambda s: s[1]) == [("bo", "A"), ("di", "A"), ("ana", "B"), ("cy", "B")]

# Sorting simplifies: minimum absolute difference pairs are adjacent after sorting
def min_abs_pairs(arr):
    arr = sorted(arr)
    best = min(b - a for a, b in zip(arr, arr[1:]))
    return [[a, b] for a, b in zip(arr, arr[1:]) if b - a == best]

assert min_abs_pairs([4, 2, 1, 3]) == [[1, 2], [2, 3], [3, 4]]
`,
      codeNotes: [
        "This quicksort builds new lists for readability (O(n) extra per level); in-place partitioning (Lomuto/Hoare) is the classic O(log n)-space version.",
        "`random.seed(7)` makes the randomized test reproducible.",
        "`out.extend(left[i:])` appends whatever is left over from one side.",
      ],
      complexity: {
        time: 'Bubble/insertion O(n²); merge O(n log n); quicksort O(n log n) avg, O(n²) worst; Timsort O(n log n)',
        space: 'Insertion O(1) in place; merge O(n); in-place quicksort O(log n) avg stack',
        derivation: [
          "Insertion sort: item i may shift past all i earlier items → 1 + 2 + … + (n-1) = O(n²) worst case; on sorted input the inner loop never runs → O(n).",
          "Merge sort: the recursion tree has log₂ n levels; each level merges a total of n elements → O(n log n). The merge buffer is O(n).",
          "Quicksort: balanced partitions give the same log n levels × O(n) partitioning; if the pivot is always the min or max, depth becomes n → O(n²).",
          "Any comparison-based sort needs Ω(n log n) comparisons in the worst case (there are n! possible orderings to distinguish, and log₂(n!) ≈ n log n).",
        ],
      },
      whenToUse: [
        "Closest pairs / minimum difference → sort, scan adjacent.",
        "Intervals → sort by start, scan.",
        "Duplicates or grouping with O(1) extra space → sort, then compare neighbors.",
        "Pair-sum without extra memory → sort + two pointers.",
      ],
      mistakes: [
        "Saying sorting is O(n).",
        "Forgetting the cost of sorting when claiming a later scan makes the algorithm O(n).",
        "Assuming every sort is stable (quicksort/heapsort aren't); Python's built-in sort is.",
      ],
      checks: [
        { q: "Merge sort's recurrence T(n) = 2T(n/2) + O(n) solves to…", options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 1, explain: "log n levels, O(n) work per level." },
        { q: "What does stable sorting guarantee?", options: ['O(n log n) time', 'Equal elements keep their original relative order', 'In-place', 'No recursion'], answer: 1, explain: "That's what lets you sort by a secondary key, then a primary key." },
        { q: "Quicksort's worst case happens when…", options: ['Input is random', 'Pivots repeatedly split very unevenly (e.g. always the minimum)', 'There are no duplicates', 'n is even'], answer: 1, explain: "Depth becomes n instead of log n." },
      ],
      problems: [1200, 56, 88],
      terms: ['sorted', 'stable-ordering', 'adjacent', 'trade-off'],
      verbal: "\"After sorting, the closest pair must be adjacent, so one linear scan finds it. Sorting dominates: O(n log n) time.\"",
    },
  ],
};
