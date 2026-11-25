import type { Module } from '../types';

const py = String.raw;

export const patternsModule: Module = {
  id: 'patterns',
  number: 13,
  title: 'Additional Important Patterns',
  priority: 'P1',
  phase: 2,
  blurb: 'Prefix sums, difference arrays, intervals, and Kadane first (Phase 2); then heaps/top-K, greedy, dynamic programming, bits, tries, and OOP basics (Phase 3, long-term).',
  prerequisites: ['arrays', 'hashing'],
  lessons: [
    {
      id: 'prefix-sums',
      title: 'Prefix sums, prefix sum + hash map, and difference arrays',
      summary: 'Precompute running totals once; answer any range-sum question in O(1).',
      what: "A **prefix sum** array stores `prefix[i] = a[0] + … + a[i-1]` (with `prefix[0] = 0`). Then the sum of `a[l..r]` is `prefix[r + 1] - prefix[l]` — O(1) after O(n) preprocessing.\n\n**Prefix sum + hash map**: to count subarrays summing to k, note that a subarray ending at j sums to k iff some earlier prefix equals `current - k`. Keep a Counter of prefixes seen so far.\n\n**Difference array**: the reverse idea. To add v to every element of a[l..r] many times, record `diff[l] += v`, `diff[r + 1] -= v`, then take a prefix sum at the end.",
      why: "\"Subarray sum equals K\" with negative numbers can't use sliding window (sums aren't monotonic). Prefix sums + hashing solve it in O(n). Range-update problems (bookings, schedules) become O(n + q) instead of O(n · q).",
      how: [
        "Running sum `cur`; Counter `seen = {0: 1}` (the empty prefix).",
        "For each x: `cur += x`; `count += seen[cur - k]`; `seen[cur] += 1`.",
        "Order matters: look up before inserting the current prefix (otherwise k = 0 counts empty subarrays).",
        "Difference array: apply all updates in O(1) each, then one prefix-sum pass.",
      ],
      visual: {
        kind: 'array',
        title: 'Count subarrays with sum k = 3 in [1, 2, 1, -1, 3]',
        steps: [
          { cells: [1, 2, 1, -1, 3], pointers: { j: 0 }, vars: { cur: '1', 'need cur-k': '-2', seen: '{0:1}', count: '0' }, note: 'Prefix 1. No earlier prefix equals -2.' },
          { cells: [1, 2, 1, -1, 3], pointers: { j: 1 }, window: [0, 1], vars: { cur: '3', 'need cur-k': '0', seen: '{0:1, 1:1}', count: '1' }, note: 'Prefix 3. Earlier prefix 0 exists once → subarray [1, 2].' },
          { cells: [1, 2, 1, -1, 3], pointers: { j: 2 }, window: [1, 2], vars: { cur: '4', 'need cur-k': '1', seen: '{0:1, 1:1, 3:1}', count: '2' }, note: 'Prefix 4. Earlier prefix 1 → subarray [2, 1].' },
          { cells: [1, 2, 1, -1, 3], pointers: { j: 3 }, window: [0, 3], vars: { cur: '3', 'need cur-k': '0', count: '3' }, note: 'Prefix 3 again (the -1 brought it down — impossible to handle with a sliding window). Prefix 0 → subarray [1, 2, 1, -1].' },
          { cells: [1, 2, 1, -1, 3], pointers: { j: 4 }, vars: { cur: '6', 'need cur-k': '3', count: '5' }, note: 'Prefix 6. Prefix 3 was seen twice → two more subarrays: [1, -1, 3] and [3]. Total 5.' },
        ],
      },
      code: py`
from collections import Counter

def range_sums(a):
    prefix = [0]
    for x in a:
        prefix.append(prefix[-1] + x)
    return lambda l, r: prefix[r + 1] - prefix[l]     # sum of a[l..r]

rs = range_sums([3, -1, 4, 2])
assert rs(0, 3) == 8 and rs(1, 2) == 3 and rs(2, 2) == 4

def subarray_sum(nums, k):
    seen = Counter({0: 1})
    cur = count = 0
    for x in nums:
        cur += x
        count += seen[cur - k]       # earlier prefixes that complete a sum of k
        seen[cur] += 1
    return count

def subarray_sum_brute(nums, k):
    return sum(1 for i in range(len(nums)) for j in range(i, len(nums))
               if sum(nums[i:j + 1]) == k)

assert subarray_sum([1, 2, 1, -1, 3], 3) == subarray_sum_brute([1, 2, 1, -1, 3], 3) == 5
assert subarray_sum([1, 1, 1], 2) == 2 and subarray_sum([1, -1, 0], 0) == 3

def apply_range_adds(n, updates):
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        diff[r + 1] -= v
    out, running = [], 0
    for i in range(n):
        running += diff[i]
        out.append(running)
    return out

assert apply_range_adds(5, [(1, 3, 2), (0, 1, 1)]) == [1, 3, 2, 2, 0]
`,
      codeNotes: [
        "`Counter({0: 1})` seeds the empty prefix so subarrays starting at index 0 are counted.",
        "Missing keys in a Counter read as 0, so `seen[cur - k]` never raises.",
        "The brute force is a good test oracle: O(n³) as written, O(n²) with a running sum.",
      ],
      complexity: {
        time: 'Prefix build O(n), each query O(1); subarray_sum O(n); difference array O(n + q)',
        space: 'O(n)',
        derivation: [
          "subarray_sum: one pass with O(1) average Counter work per element → O(n). The Counter can hold n + 1 distinct prefixes → O(n).",
          "Brute force enumerates O(n²) subarrays; summing each from scratch makes it O(n³).",
          "Difference array: q updates × O(1) + one O(n) pass → O(n + q).",
        ],
      },
      whenToUse: [
        "Many range-sum queries on a static array.",
        "\"Count/find subarrays with sum (or difference) equal to k\", especially with negatives.",
        "Many range-increment updates followed by reads.",
      ],
      mistakes: [
        "Forgetting the {0: 1} seed.",
        "Inserting the current prefix before looking up (miscounts when k = 0).",
        "Reaching for sliding window when numbers can be negative.",
      ],
      checks: [
        { q: "With prefix[0] = 0, sum(a[2..4]) equals…", options: ['prefix[4] - prefix[2]', 'prefix[5] - prefix[2]', 'prefix[5] - prefix[1]', 'prefix[4] - prefix[1]'], answer: 1, explain: "prefix[r + 1] - prefix[l] with l = 2, r = 4." },
        { q: "Why seed the prefix map with {0: 1}?", options: ['Avoid KeyError', 'To count subarrays that start at index 0', 'Python requires it', 'To handle negatives'], answer: 1, explain: "A subarray a[0..j] summing to k corresponds to the empty prefix (sum 0)." },
      ],
      problems: [560, 53],
      terms: ['prefix', 'subarray', 'range', 'target'],
      verbal: "\"A subarray ending here sums to k exactly when some earlier prefix equals current − k, so I count prefixes in a hash map as I go. O(n) time and space, and it works with negative numbers.\"",
    },
    {
      id: 'intervals',
      title: 'Intervals: sorting, merging, and overlap',
      summary: 'Sort by start time; then every overlap is with the most recent interval.',
      what: "An **interval** [start, end] represents a range. Two intervals [a, b] and [c, d] with a ≤ c **overlap** iff c ≤ b (with closed intervals; whether touching endpoints count is a clarifying question).\n\nCore technique: **sort by start**, then scan. After sorting, an interval can only overlap the last one you kept, because everything earlier ends no later than that one's merged end.",
      why: "Merge Intervals, meeting rooms, insert interval, and non-overlapping intervals are all variants. An Explore report mentioned an overlapping-intervals question (variant unclear), so practice merge, count, and remove variants.",
      how: [
        "Sort: `intervals.sort(key=lambda iv: iv[0])`.",
        "Start `merged = [intervals[0]]`.",
        "For each next [s, e]: if `s <= merged[-1][1]` → overlap → `merged[-1][1] = max(merged[-1][1], e)`; else append.",
        "Use `max` because a later interval may be fully contained ([1, 10] then [2, 3]).",
        "Variants: count overlaps (number of merges), minimum removals (greedy by end time), meeting rooms (max concurrent via sorted starts/ends or a heap).",
      ],
      visual: {
        kind: 'array',
        title: 'Merging [[1,3],[8,10],[2,6],[15,18]]',
        steps: [
          { cells: ['[1,3]', '[2,6]', '[8,10]', '[15,18]'], note: 'Sort by start first.' },
          { cells: ['[1,3]', '[2,6]', '[8,10]', '[15,18]'], highlight: [0, 1], vars: { merged: '[[1,6]]' }, note: '2 ≤ 3 → overlap → extend the end to max(3, 6) = 6.' },
          { cells: ['[1,3]', '[2,6]', '[8,10]', '[15,18]'], highlight: [2], vars: { merged: '[[1,6],[8,10]]' }, note: '8 > 6 → no overlap → append.' },
          { cells: ['[1,3]', '[2,6]', '[8,10]', '[15,18]'], highlight: [3], vars: { merged: '[[1,6],[8,10],[15,18]]' }, note: '15 > 10 → append. Done.' },
        ],
      },
      code: py`
def merge(intervals):
    if not intervals:
        return []
    intervals = sorted(intervals, key=lambda iv: iv[0])
    merged = [list(intervals[0])]
    for s, e in intervals[1:]:
        if s <= merged[-1][1]:                   # overlaps (touching counts)
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged

assert merge([[1, 3], [8, 10], [2, 6], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]
assert merge([[1, 4], [4, 5]]) == [[1, 5]]
assert merge([[1, 10], [2, 3]]) == [[1, 10]]                 # containment
assert merge([]) == [] and merge([[5, 7]]) == [[5, 7]]

def min_removals_to_avoid_overlap(intervals):
    """Greedy: keep the interval that ends earliest (touching is allowed)."""
    intervals = sorted(intervals, key=lambda iv: iv[1])
    removed, last_end = 0, float("-inf")
    for s, e in intervals:
        if s >= last_end:
            last_end = e
        else:
            removed += 1
    return removed

assert min_removals_to_avoid_overlap([[1, 2], [2, 3], [3, 4], [1, 3]]) == 1
`,
      codeNotes: [
        "`list(intervals[0])` copies so we don't mutate the caller's interval.",
        "`for s, e in intervals[1:]` unpacks each pair (the slice copies O(n)).",
        "Removal variant sorts by END — a greedy choice explained in the Greedy lesson.",
      ],
      complexity: {
        time: 'O(n log n)',
        space: 'O(n) (sorted copy + output)',
        derivation: [
          "Sorting n intervals: O(n log n).",
          "One scan with O(1) work per interval: O(n).",
          "Total O(n log n) — sorting dominates. Output can be n intervals → O(n).",
        ],
      },
      whenToUse: [
        "\"Overlapping\", \"merge\", \"meetings\", \"schedule\", \"ranges\".",
        "Ask early: are endpoints inclusive? Do touching intervals overlap? Is input sorted?",
      ],
      mistakes: [
        "Forgetting to sort.",
        "Setting `merged[-1][1] = e` instead of `max(...)` (fails on containment).",
        "Not clarifying whether [1, 2] and [2, 3] overlap.",
      ],
      checks: [
        { q: "Why sort intervals by start before merging?", options: ['Required by Python', 'So any overlap must be with the last merged interval', 'To remove duplicates', 'To make it O(n)'], answer: 1, explain: "Sorted starts guarantee you never need to look further back." },
        { q: "merge([[1, 10], [2, 3], [4, 5]]) returns…", options: ['[[1, 3], [4, 10]]', '[[1, 10]]', '[[1, 5]]', '[[1, 10], [4, 5]]'], answer: 1, explain: "Both later intervals are contained in [1, 10]; max keeps the end at 10." },
      ],
      problems: [56],
      terms: ['range', 'sorted', 'greedy', 'edge-case'],
      verbal: "\"I'll sort by start time. Then each interval either overlaps the last merged one — extend its end with max — or starts a new group. Sorting dominates: O(n log n).\"",
    },
    {
      id: 'kadane',
      title: "Kadane's algorithm: maximum subarray",
      summary: 'At each index, either extend the best subarray ending before it, or start fresh.',
      what: "**Kadane's algorithm** finds the maximum sum of a contiguous subarray in one pass. It keeps:\n\n- `cur` — the best sum of a subarray that **ends at the current index**.\n- `best` — the best seen anywhere.\n\nTransition: `cur = max(x, cur + x)` — if the previous run is negative, it only hurts, so start over at x. It's the simplest example of **dynamic programming**: the state is \"best ending here\".",
      why: "Maximum Subarray (LeetCode 53) is a first-wave problem and was mentioned in a 2026 Explore report. Brute force is O(n²) or O(n³); Kadane is O(n) time, O(1) space.",
      how: [
        "Initialize `cur = best = nums[0]` (NOT 0 — all-negative arrays).",
        "For each x after the first: `cur = max(x, cur + x)`; `best = max(best, cur)`.",
        "Return best.",
        "Why correct: the best subarray ending at i either includes the best subarray ending at i-1, or is just [x]; nothing else could be better.",
      ],
      visual: {
        kind: 'array',
        title: 'Kadane on [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        steps: [
          { cells: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 0 }, vars: { cur: '-2', best: '-2' }, note: 'Start with the first element.' },
          { cells: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 1 }, window: [1, 1], vars: { cur: 'max(1, -1) = 1', best: '1' }, note: 'Previous run is negative → start fresh at 1.' },
          { cells: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 3 }, window: [3, 3], vars: { cur: 'max(4, -2+4) = 4', best: '4' }, note: 'Start fresh at 4.' },
          { cells: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 6 }, window: [3, 6], vars: { cur: '6', best: '6' }, note: '4 - 1 + 2 + 1 = 6 — extending beats restarting.' },
          { cells: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 8 }, window: [3, 6], vars: { cur: '5', best: '6' }, note: 'After -5 and 4, cur = 5 < best. Answer 6 from [4, -1, 2, 1].' },
        ],
      },
      code: py`
def max_subarray(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)      # extend or restart
        best = max(best, cur)
    return best

def max_subarray_brute(nums):
    best = nums[0]
    for i in range(len(nums)):
        total = 0
        for j in range(i, len(nums)):
            total += nums[j]       # running sum: O(n^2) overall
            best = max(best, total)
    return best

tests = [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [1], [5, 4, -1, 7, 8], [-3, -1, -2]]
for t in tests:
    assert max_subarray(t) == max_subarray_brute(t)
assert max_subarray(tests[0]) == 6 and max_subarray([-3, -1, -2]) == -1
`,
      codeNotes: [
        "Starting `best` at 0 would wrongly return 0 for all-negative input — the subarray must be non-empty.",
        "`nums[1:]` copies the list (O(n)); `for i in range(1, len(nums))` avoids that copy.",
      ],
      complexity: {
        time: 'O(n) (brute force O(n²))',
        space: 'O(1)',
        derivation: [
          "One pass; each element does two max() calls → O(n).",
          "Only two scalars are kept → O(1) auxiliary space.",
          "Brute force tries every start i and extends j with a running sum → n(n+1)/2 additions → O(n²).",
        ],
      },
      whenToUse: [
        "\"Maximum (or minimum) sum contiguous subarray\".",
        "Variants: maximum product subarray (track min and max), best time to buy/sell (max of differences).",
      ],
      mistakes: [
        "Initializing with 0.",
        "Confusing subarray (contiguous) with subsequence (would just sum the positives).",
        "Resetting `cur` to 0 when negative without handling all-negative input.",
      ],
      checks: [
        { q: "Kadane's answer for [-5, -2, -9]?", options: ['0', '-2', '-16', '-5'], answer: 1, explain: "The best non-empty subarray is the single element -2." },
        { q: "What does `cur` represent?", options: ['Best sum anywhere so far', 'Best sum of a subarray ending at the current index', 'Prefix sum', 'Number of positives'], answer: 1, explain: "That's the DP state; best is the max over all such states." },
        { q: "Kadane on [2, -1, 2] returns…", options: ['2', '3', '4', '1'], answer: 1, explain: "cur: 2 → max(-1, 1) = 1 → max(2, 3) = 3. Extending through the -1 pays off." },
      ],
      problems: [53, 121],
      terms: ['subarray', 'contiguous', 'maximum', 'state', 'transition'],
      verbal: "\"At each index the best subarray ending there either extends the previous best or starts fresh — cur = max(x, cur + x). I track the global best. O(n) time, O(1) space; I initialize with the first element so all-negative input works.\"",
    },
    {
      id: 'heaps',
      phase: 3,
      title: 'Heaps, priority queues, and Top-K',
      summary: 'Always get the smallest (or largest) item in O(log n) per operation.',
      what: "A **heap** is a complete binary tree stored in an array, where every parent ≤ its children (**min-heap**). The minimum is always at index 0. A **priority queue** is the abstract idea \"remove the highest-priority item next\"; a heap is the usual implementation.\n\nPython's `heapq` is a min-heap: `heappush`/`heappop` O(log n), `heapify` O(n), peek `h[0]` O(1). For a max-heap, store negatives.\n\n**Top-K pattern**: to find the k largest of n items, keep a min-heap of size k; whenever it grows past k, pop the smallest. The root is the k-th largest.",
      why: "Sorting everything is O(n log n); a size-k heap is O(n log k) and O(k) memory — better when k ≪ n or the data streams in.",
      how: [
        "Push each x; if `len(h) > k`: heappop (discard the smallest).",
        "After processing all items, h holds the k largest; `h[0]` is the k-th largest.",
        "For the k smallest, use a max-heap of negatives.",
        "Alternative: quickselect, O(n) average, O(n²) worst.",
      ],
      code: py`
import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)        # drop the smallest; keep k largest
    return h[0]

assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4
assert kth_largest([7], 1) == 7
assert heapq.nlargest(2, [3, 2, 1, 5, 6, 4]) == [6, 5]

# Max-heap via negation, and (priority, item) tuples
tasks = []
for priority, name in [(2, "email"), (1, "deploy"), (3, "lunch")]:
    heapq.heappush(tasks, (priority, name))
assert [heapq.heappop(tasks)[1] for _ in range(3)] == ["deploy", "email", "lunch"]
`,
      codeNotes: [
        "Tuples compare element by element, so `(priority, name)` pops the lowest priority first.",
        "`heapq.nlargest(k, it)` is a library Top-K — mention it, but know the manual version.",
      ],
      complexity: {
        time: 'O(n log k)',
        space: 'O(k)',
        derivation: [
          "The heap never exceeds k + 1 items, so each push/pop is O(log k).",
          "n items × O(log k) → O(n log k). Sorting would be O(n log n).",
        ],
      },
      whenToUse: [
        "\"k largest/smallest/most frequent\", \"k closest\", \"merge k sorted lists\".",
        "Scheduling: always process the earliest deadline / lowest cost next.",
      ],
      mistakes: [
        "Using a max-heap of all n items (O(n log n) and O(n) memory).",
        "Forgetting heapq is a MIN-heap.",
        "Assuming the whole heap list is sorted.",
      ],
      checks: [
        { q: "For k-th largest, why a MIN-heap of size k?", options: ['It is faster to build', 'Its root is the smallest of the k largest — exactly the k-th largest', 'Python has no max-heap', 'To sort the output'], answer: 1, explain: "Anything smaller than the root can't be in the top k." },
        { q: "Top-K with a size-k heap costs…", options: ['O(n log n)', 'O(n log k)', 'O(k log n)', 'O(n)'], answer: 1, explain: "n operations on a heap of size ≤ k." },
      ],
      problems: [215, 23],
      terms: ['heap', 'priority-queue', 'top-k', 'kth-largest'],
      verbal: "\"I'll keep a min-heap of the k largest elements seen so far; its root is the k-th largest. O(n log k) time, O(k) space — better than sorting when k is small.\"",
    },
    {
      id: 'greedy',
      phase: 3,
      title: 'Greedy algorithms: local choices, and when they fail',
      summary: 'Make the best-looking choice now — correct only when you can argue no later choice regrets it.',
      what: "A **greedy** algorithm builds a solution step by step, always taking the locally best option and never reconsidering. It is correct only when the problem has the **greedy-choice property** (some optimal solution starts with the greedy choice) — you should be able to give a short exchange argument.\n\nExamples where greedy works: interval scheduling by earliest end time; Best Time to Buy and Sell Stock (track min); Jump Game (track farthest reach). Where it fails: coin change with coins {1, 3, 4} for amount 6 (greedy 4+1+1 = 3 coins; optimal 3+3 = 2 coins).",
      why: "Greedy solutions are short and fast (often O(n) or O(n log n) with sorting), but a wrong greedy is a classic interview trap. Always test it against a small counterexample.",
      how: [
        "Propose the greedy rule (\"take the interval that ends first\").",
        "Exchange argument: take any optimal solution; swap its first choice for the greedy one; show it's still valid and no worse.",
        "Try to break it with small cases. If you find a counterexample, switch to DP or search.",
      ],
      code: py`
def can_jump(nums):
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:
            return False            # this index is unreachable
        farthest = max(farthest, i + step)
    return True

assert can_jump([2, 3, 1, 1, 4]) and not can_jump([3, 2, 1, 0, 4])

def greedy_coins(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):
        count += amount // c
        amount %= c
    return count if amount == 0 else -1

def dp_coins(coins, amount):
    INF = float("inf")
    best = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                best[a] = min(best[a], best[a - c] + 1)
    return best[amount] if best[amount] < INF else -1

assert greedy_coins([1, 3, 4], 6) == 3        # 4 + 1 + 1
assert dp_coins([1, 3, 4], 6) == 2            # 3 + 3: greedy is NOT optimal here
assert greedy_coins([1, 5, 10, 25], 63) == dp_coins([1, 5, 10, 25], 63) == 6
`,
      codeNotes: [
        "`amount // c` is how many coins of value c fit; `amount %= c` keeps the remainder.",
        "dp_coins is a preview of dynamic programming: best[a] = fewest coins for amount a.",
      ],
      complexity: {
        time: 'can_jump O(n); greedy coins O(c log c); DP coins O(amount · c)',
        space: 'can_jump O(1); DP O(amount)',
        derivation: [
          "can_jump: one pass with O(1) updates → O(n).",
          "DP coins: for each of `amount` values, try each of c coins → O(amount · c).",
        ],
      },
      whenToUse: [
        "Scheduling/intervals, reachability, running min/max, problems with a clear \"best next step\".",
        "When you can prove it — otherwise prefer DP.",
      ],
      mistakes: [
        "Assuming greedy works without a proof or counterexample search.",
        "Sorting by the wrong key (start instead of end for interval scheduling).",
      ],
      checks: [
        { q: "Greedy coin change with {1, 3, 4} for 6 gives 3 coins. The optimum is…", options: ['3', '2', '1', '4'], answer: 1, explain: "3 + 3. Greedy grabbed 4 first and got stuck with 1 + 1." },
        { q: "For maximum non-overlapping intervals, the proven greedy rule is…", options: ['Earliest start', 'Shortest length', 'Earliest end', 'Latest start'], answer: 2, explain: "Finishing earliest leaves the most room for the rest (exchange argument)." },
      ],
      problems: [121, 56],
      terms: ['greedy', 'optimal', 'maximum', 'trade-off'],
      verbal: "\"A greedy choice works here because finishing earliest never leaves less room for later intervals — any optimal solution can be swapped to start with it.\"",
    },
    {
      id: 'dp',
      title: 'Basic dynamic programming: memoization and tabulation',
      summary: 'Recursion that remembers: solve each subproblem once.',
      what: "**Dynamic programming (DP)** applies when a problem has:\n\n- **Overlapping subproblems** — the same smaller problem is solved many times (naive fib).\n- **Optimal substructure** — the answer is built from answers to smaller problems.\n\nTwo styles:\n\n- **Memoization** (top-down): write the recursion, cache results by **state**.\n- **Tabulation** (bottom-up): fill a table from base cases upward using the **transition** formula.\n\nClimbing Stairs: `ways(n) = ways(n-1) + ways(n-2)` (your last move was 1 or 2 steps).",
      why: "It turns exponential recursion into polynomial time. Even if DP isn't the main interview topic, recognizing \"this recursion repeats\" and adding a cache is expected.",
      how: [
        "Define the state in words: \"ways(i) = number of ways to reach step i\".",
        "Write the transition: ways(i) = ways(i-1) + ways(i-2).",
        "Base cases: ways(0) = 1 (stand still), ways(1) = 1.",
        "Memoize the recursion, or loop i from 2 to n.",
        "Optimize space: keep only the last two values.",
      ],
      visual: {
        kind: 'array',
        title: 'Tabulating Climbing Stairs: dp[i] = dp[i-1] + dp[i-2]',
        steps: [
          { cells: [1, 1, '?', '?', '?', '?'], highlight: [0, 1], note: 'Base cases: dp[0] = 1 (stand still), dp[1] = 1.' },
          { cells: [1, 1, 2, '?', '?', '?'], pointers: { i: 2 }, highlight: [2], note: 'dp[2] = dp[1] + dp[0] = 2: the last move was 1 step or 2 steps.' },
          { cells: [1, 1, 2, 3, '?', '?'], pointers: { i: 3 }, highlight: [3], note: 'dp[3] = 2 + 1 = 3.' },
          { cells: [1, 1, 2, 3, 5, 8], pointers: { i: 5 }, highlight: [5], note: 'dp[4] = 5, dp[5] = 8. Each cell needs only the previous two → O(n) time, and O(1) space if you keep two variables.' },
        ],
      },
      code: py`
from functools import lru_cache

def climb_naive(n):
    if n <= 1:
        return 1
    return climb_naive(n - 1) + climb_naive(n - 2)     # O(2^n)

@lru_cache(maxsize=None)
def climb_memo(n):
    if n <= 1:
        return 1
    return climb_memo(n - 1) + climb_memo(n - 2)       # O(n)

def climb_table(n):
    dp = [1] * (n + 1)
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

def climb_two_vars(n):
    a, b = 1, 1                                        # ways(i-2), ways(i-1)
    for _ in range(n - 1):
        a, b = b, a + b
    return b

for n in range(1, 15):
    assert climb_naive(n) == climb_memo(n) == climb_table(n) == climb_two_vars(n)
assert climb_two_vars(2) == 2 and climb_two_vars(3) == 3 and climb_two_vars(45) == 1836311903
`,
      codeNotes: [
        "`a, b = b, a + b` updates both simultaneously using the OLD values.",
        "Climbing Stairs is Fibonacci shifted by one.",
      ],
      complexity: {
        time: 'Naive O(2ⁿ); memo/table/two-vars O(n)',
        space: 'Memo O(n) cache + O(n) stack; table O(n); two-vars O(1)',
        derivation: [
          "Naive: two recursive calls per level, depth n → about 2ⁿ (≈ 1.618ⁿ) calls.",
          "Memo: n distinct states, each computed once with O(1) work → O(n).",
          "Table: one loop of n - 1 iterations → O(n) time, O(n) array; two-vars keeps only two numbers → O(1).",
        ],
      },
      whenToUse: [
        "\"Count the number of ways\", \"minimum cost to reach\", \"maximum value with constraints\".",
        "When your recursion tree repeats identical calls.",
      ],
      mistakes: [
        "Not defining the state precisely before coding.",
        "Wrong base cases (ways(0) = 1, not 0).",
        "Using a mutable default dict as a memo across test cases.",
      ],
      checks: [
        { q: "What makes a problem a DP candidate?", options: ['Sorted input', 'Overlapping subproblems and optimal substructure', 'A graph', 'Hashable keys'], answer: 1, explain: "Repeated subproblems whose answers combine into the full answer." },
        { q: "Memoized Climbing Stairs runs in…", options: ['O(2ⁿ)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 2, explain: "Each of the n states is computed once." },
        { q: "Using the table, how many ways are there to climb 5 stairs?", options: ['5', '8', '13', '10'], answer: 1, explain: "dp = [1, 1, 2, 3, 5, 8] → dp[5] = 8." },
      ],
      problems: [70, 53],
      terms: ['memoization', 'state', 'transition', 'base-case', 'optimal'],
      verbal: "\"The state is the number of ways to reach step i; the transition is ways(i-1) + ways(i-2) because the last move was one or two steps. Bottom-up with two variables: O(n) time, O(1) space.\"",
    },
    {
      id: 'bits-tries',
      phase: 3,
      title: 'Introductory bit manipulation and tries',
      summary: 'XOR tricks and bitmasks; prefix trees for fast prefix lookups.',
      what: "**Bit manipulation** works on the binary representation of integers:\n\n- `x & 1` — lowest bit (odd/even). `x >> 1` — divide by 2. `1 << k` — 2ᵏ.\n- `a ^ b` (XOR) — 1 where bits differ. Key facts: `x ^ x = 0`, `x ^ 0 = x`, XOR is commutative.\n- `x & (x - 1)` — clears the lowest set bit (count bits, power-of-two test).\n- Bitmasks represent subsets of up to ~20 items as one integer.\n\nA **trie** (prefix tree) stores strings character by character: each node has children keyed by character and an end-of-word flag. Insert and search take O(L) for a word of length L, independent of how many words are stored.",
      why: "\"Find the single number that appears once when all others appear twice\" is O(1) space with XOR. Tries power autocomplete and \"does any word start with this prefix?\" queries.",
      how: [
        "Single Number: XOR everything; pairs cancel, the unique value remains.",
        "Count set bits: repeat `x &= x - 1` until 0.",
        "Trie insert: walk from the root, creating child nodes for missing characters; mark the last node as a word end.",
        "Trie startsWith: walk the prefix; True if you never fall off.",
      ],
      code: py`
from functools import reduce

def single_number(nums):
    return reduce(lambda a, b: a ^ b, nums)

assert single_number([4, 1, 2, 1, 2]) == 4

def count_bits(x):
    count = 0
    while x:
        x &= x - 1           # drop lowest set bit
        count += 1
    return count

assert count_bits(0b1011) == 3 and bin(11) == "0b1011"
assert (12 & (12 - 1)) != 0 and (16 & (16 - 1)) == 0   # 16 is a power of two

class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True                 # end-of-word marker

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and "$" in node

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

t = Trie()
for w in ["app", "apple", "bat"]:
    t.insert(w)
assert t.search("app") and not t.search("ap") and t.starts_with("ap") and not t.starts_with("c")
`,
      codeNotes: [
        "`reduce(f, items)` folds a list into one value: ((4 ^ 1) ^ 2) ^ …",
        "`0b1011` is a binary literal (11). `bin(11)` shows the binary string.",
        "This trie uses nested dicts; '$' marks the end of a word.",
      ],
      complexity: {
        time: 'XOR O(n); count_bits O(number of set bits); trie ops O(L)',
        space: 'XOR O(1); trie O(total characters inserted)',
        derivation: [
          "XOR touches each element once → O(n) with one accumulator.",
          "Each trie operation follows one edge per character of the word → O(L).",
          "In the worst case every character creates a node → O(sum of word lengths) space.",
        ],
      },
      whenToUse: [
        "\"Appears once, others twice\", parity, subsets as bitmasks.",
        "Prefix search, autocomplete, word dictionaries with wildcard search.",
      ],
      mistakes: [
        "Operator precedence: `x & 1 == 0` means `x & (1 == 0)` — parenthesize `(x & 1) == 0`.",
        "Forgetting the end-of-word marker (\"app\" vs prefix of \"apple\").",
      ],
      checks: [
        { q: "What is 5 ^ 5 ^ 3?", options: ['3', '5', '0', '13'], answer: 0, explain: "5 ^ 5 = 0, and 0 ^ 3 = 3." },
        { q: "Trie search for a word of length L costs…", options: ['O(n) words', 'O(L)', 'O(n · L)', 'O(log n)'], answer: 1, explain: "One step per character, regardless of how many words are stored." },
      ],
      problems: [78],
      terms: ['prefix', 'subset', 'hashing'],
      verbal: "\"XOR cancels pairs, so XOR-ing everything leaves the single number: O(n) time, O(1) space.\"",
    },
    {
      id: 'oop',
      phase: 3,
      title: 'Basic object-oriented programming for interview design questions',
      summary: 'Classes bundle state with the methods that keep it valid.',
      what: "A **class** defines a type: data (**attributes**) plus behavior (**methods**). `__init__` is the constructor. `self` is the specific instance.\n\n- **Instance vs class attributes** — per-object vs shared by all objects.\n- **Encapsulation** — hide internal state behind methods that keep it consistent (Min Stack hides its tuple stack).\n- **Inheritance** — a subclass reuses/extends a parent (`class Dog(Animal)`).\n- **Composition** — an object holds other objects (a Queue that HAS two stacks). Often preferred over inheritance.\n- **Polymorphism** — different classes respond to the same method call (`shape.area()`).\n- **Abstraction** — expose what an object does, not how.",
      why: "LeetCode design problems (Min Stack, Implement Queue using Stacks, Number of Recent Calls) are classes. Interviewers also ask you to discuss design choices and trade-offs in project questions.",
      how: [
        "Identify the operations required (push, pop, getMin) and their target complexities.",
        "Choose internal state that makes every operation meet its target.",
        "Write `__init__` to set up that state; each method maintains the class invariant.",
        "Explain the invariant: \"each stack entry stores the min of everything at or below it\".",
      ],
      code: py`
class Shape:
    sides = 0                          # class attribute (shared)
    def area(self):
        raise NotImplementedError

class Rect(Shape):                     # inheritance
    sides = 4
    def __init__(self, w, h):
        self.w, self.h = w, h          # instance attributes
    def area(self):
        return self.w * self.h

class Square(Rect):
    def __init__(self, s):
        super().__init__(s, s)         # reuse the parent constructor

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self):
        return round(3.14159 * self.r ** 2, 2)

shapes = [Rect(2, 3), Square(2), Circle(1)]
assert [s.area() for s in shapes] == [6, 4, 3.14]      # polymorphism
assert Square(5).sides == 4 and Circle(1).sides == 0

class Counter2:
    """Encapsulation: callers use methods, never touch _count directly."""
    def __init__(self):
        self._count = 0
    def increment(self):
        self._count += 1
        return self._count

c = Counter2()
c.increment()
assert c.increment() == 2
`,
      codeNotes: [
        "`super().__init__(s, s)` calls the parent class's constructor.",
        "A leading underscore (`_count`) is a convention for \"internal — don't access from outside\".",
        "`raise NotImplementedError` marks a method subclasses must override (an informal abstract method).",
      ],
      complexity: {
        time: 'Method calls O(1) here',
        space: 'O(1) per object',
        derivation: [
          "Each method does a constant amount of arithmetic or attribute access.",
          "In design problems, state the complexity of EACH method separately.",
        ],
      },
      whenToUse: [
        "\"Design a data structure that supports …\".",
        "Explaining project architecture and responsibilities in behavioral/project rounds.",
      ],
      mistakes: [
        "Forgetting `self` in method definitions or attribute access.",
        "Mutable class attributes (`items = []`) shared accidentally across instances.",
        "Overusing inheritance where composition is simpler.",
      ],
      checks: [
        { q: "A queue implemented with two stacks inside it is an example of…", options: ['Inheritance', 'Composition', 'Polymorphism', 'Recursion'], answer: 1, explain: "The queue HAS stacks; it doesn't inherit from them." },
        { q: "Calling `.area()` on a list of different shapes demonstrates…", options: ['Encapsulation', 'Polymorphism', 'Composition', 'Hashing'], answer: 1, explain: "One interface, different implementations." },
      ],
      problems: [155, 232, 933],
      terms: ['state', 'invariant', 'stack'],
      verbal: "\"My class keeps one invariant: every stack entry stores the minimum at that depth. Each method preserves it, so every operation is O(1).\"",
    },
  ],
};
