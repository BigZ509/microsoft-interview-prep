import type { Module } from '../types';

const py = String.raw;

export const slidingWindowModule: Module = {
  id: 'sliding-window',
  number: 6,
  title: 'Sliding Window',
  priority: 'P0',
  phase: 2,
  blurb: 'Fixed and variable windows over contiguous data, with running counts and amortized O(n) shrinking.',
  prerequisites: ['two-pointers', 'hashing'],
  lessons: [
    {
      id: 'fixed',
      title: 'Fixed-size windows and running counts',
      summary: 'Slide a window of size k: add the new element, remove the old one.',
      what: "A **sliding window** is a contiguous range `[left, right]` that moves across an array or string. In a **fixed-size** window the length is always k: each step adds `a[right]` and removes `a[right - k]`.\n\nInstead of recomputing the window's sum/counts from scratch (O(k) each), you maintain a **running** value updated in O(1).",
      why: "Recomputing every window costs O(n · k). Updating incrementally costs O(n). Many \"in every window of size k\" or \"in the last T milliseconds\" problems are this.",
      how: [
        "Build the first window: sum (or counts) of `a[0:k]`.",
        "For `right` from k to n - 1: add `a[right]`, subtract `a[right - k]`.",
        "After each update, check/record the answer for this window.",
        "Time-based windows (Number of Recent Calls): use a deque of timestamps; pop from the left while too old.",
      ],
      visual: {
        kind: 'array',
        title: 'Max sum of any 3 consecutive elements in [2, 1, 5, 1, 3, 2]',
        steps: [
          { cells: [2, 1, 5, 1, 3, 2], window: [0, 2], vars: { sum: '8', best: '8' }, note: 'First window [2, 1, 5] → 8.' },
          { cells: [2, 1, 5, 1, 3, 2], window: [1, 3], vars: { sum: '8 + 1 - 2 = 7', best: '8' }, note: 'Slide: add 1, remove 2.' },
          { cells: [2, 1, 5, 1, 3, 2], window: [2, 4], vars: { sum: '7 + 3 - 1 = 9', best: '9' }, note: 'Add 3, remove 1 → 9.' },
          { cells: [2, 1, 5, 1, 3, 2], window: [3, 5], vars: { sum: '9 + 2 - 5 = 6', best: '9' }, note: 'Add 2, remove 5 → 6. Answer 9.' },
        ],
      },
      code: py`
from collections import deque

def max_window_sum(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        best = max(best, window)
    return best

assert max_window_sum([2, 1, 5, 1, 3, 2], 3) == 9
assert max_window_sum([5], 1) == 5

class RecentCounter:
    """Counts pings in the last 3000 ms (timestamps strictly increase)."""
    def __init__(self):
        self.q = deque()

    def ping(self, t):
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()          # O(1), unlike list.pop(0)
        return len(self.q)

rc = RecentCounter()
assert [rc.ping(t) for t in [1, 100, 3001, 3002]] == [1, 2, 3, 3]
`,
      codeNotes: [
        "`sum(nums[:k])` computes the first window once: O(k).",
        "`self.q[0]` peeks at the oldest timestamp without removing it.",
        "Each timestamp is appended once and popped at most once — amortized O(1) per ping.",
      ],
      complexity: {
        time: 'max_window_sum O(n); RecentCounter amortized O(1) per ping',
        space: 'max_window_sum O(1) (the initial slice is O(k)); RecentCounter O(w) for w pings in the window',
        derivation: [
          "Building the first window is O(k); each of the remaining n - k slides is O(1) → O(n) total.",
          "Each ping is appended once and removed at most once across all calls → total O(number of pings) → amortized O(1) per ping.",
          "The deque holds only pings within 3000 ms; with strictly increasing integer times that is at most 3001 items.",
        ],
      },
      whenToUse: [
        "\"Every window of size k\", \"k consecutive elements\", \"in the last T seconds\".",
        "Averages, sums, counts, or distinct-counts over fixed-length ranges.",
      ],
      mistakes: [
        "Recomputing `sum(nums[i:i+k])` each step (O(n·k)).",
        "Off-by-one: the element leaving is `nums[right - k]`, not `nums[right - k + 1]`.",
        "Using a list as a queue with pop(0).",
      ],
      checks: [
        { q: "When the window moves so `right` enters, which index leaves (size k)?", options: ['right - k + 1', 'right - k', 'right - 1', 'left + k'], answer: 1, explain: "The window was [right - k, right - 1]; after adding right, the new window is [right - k + 1, right], so right - k leaves." },
        { q: "Recomputing each window's sum from scratch costs…", options: ['O(n)', 'O(n · k)', 'O(k)', 'O(n log k)'], answer: 1, explain: "n windows × k elements each." },
      ],
      problems: [933],
      terms: ['contiguous', 'consecutive', 'queue', 'amortized'],
      verbal: "\"Rather than re-summing each window, I add the entering element and subtract the leaving one — O(1) per step, O(n) overall.\"",
    },
    {
      id: 'variable',
      title: 'Variable-size windows: expand, shrink, at-most vs. exactly K',
      summary: 'Grow the window until it breaks the rule, then shrink from the left until it is valid again.',
      what: "In a **variable-size** window, `right` always advances; `left` advances only when the window becomes invalid. You maintain a **window frequency map** (or set) so validity checks are O(1).\n\nThis works when the condition is **monotonic**: if a window is invalid, every larger window containing it is also invalid (e.g. \"no repeated characters\", \"at most K distinct\", \"sum ≤ S with non-negative numbers\").\n\n**At-most vs exactly K**: windows with *exactly* K distinct are not monotonic, but `exactly(K) = atMost(K) - atMost(K - 1)`.",
      why: "Longest/shortest contiguous range problems would take O(n²) to enumerate all windows. The window visits each element at most twice → O(n).",
      how: [
        "For each `right`: add `s[right]` to the window state.",
        "While the window is invalid: remove `s[left]` from state, `left += 1`.",
        "Now the window is valid — update the answer with `right - left + 1`.",
        "Sliding window vs two pointers: a window cares about EVERYTHING between the pointers (contiguous content); opposite-direction two pointers usually care only about the two endpoint values.",
        "When values can be negative, sums aren't monotonic in window size → use prefix sums + hash map instead.",
      ],
      visual: {
        kind: 'array',
        title: "Longest substring without repeats: 'pwwkew'",
        steps: [
          { cells: ['p', 'w', 'w', 'k', 'e', 'w'], window: [0, 1], pointers: { L: 0, R: 1 }, vars: { window: '{p, w}', best: '2' }, note: "'pw' is valid; best = 2." },
          { cells: ['p', 'w', 'w', 'k', 'e', 'w'], window: [2, 2], pointers: { L: 2, R: 2 }, vars: { window: '{w}', best: '2' }, note: "R = 2 adds a second 'w' → shrink: remove 'p', then 'w'. L = 2." },
          { cells: ['p', 'w', 'w', 'k', 'e', 'w'], window: [2, 4], pointers: { L: 2, R: 4 }, vars: { window: '{w, k, e}', best: '3' }, note: "'wke' → best = 3." },
          { cells: ['p', 'w', 'w', 'k', 'e', 'w'], window: [3, 5], pointers: { L: 3, R: 5 }, vars: { window: '{k, e, w}', best: '3' }, note: "Another 'w' → shrink once. 'kew' is length 3. Answer 3 ('pwke' is a subsequence, not a substring)." },
        ],
      },
      code: py`
from collections import defaultdict

def longest_unique(s):
    seen = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best

assert longest_unique("abcabcbb") == 3
assert longest_unique("pwwkew") == 3
assert longest_unique("") == 0 and longest_unique("bbbb") == 1

def at_most_k_distinct(s, k):
    """Number of substrings with at most k distinct characters."""
    counts = defaultdict(int)
    left = total = 0
    for right, ch in enumerate(s):
        counts[ch] += 1
        while len(counts) > k:
            counts[s[left]] -= 1
            if counts[s[left]] == 0:
                del counts[s[left]]
            left += 1
        total += right - left + 1        # windows ending at right
    return total

def exactly_k_distinct(s, k):
    return at_most_k_distinct(s, k) - at_most_k_distinct(s, k - 1)

# "aba": substrings a, b, a, ab, ba, aba -> exactly 2 distinct: ab, ba, aba
assert exactly_k_distinct("aba", 2) == 3
assert at_most_k_distinct("aba", 1) == 3
`,
      codeNotes: [
        "`del counts[key]` removes a key whose count hit 0, so `len(counts)` equals the number of distinct characters.",
        "`total += right - left + 1` counts every valid window that ends at `right` (starting anywhere in [left, right]).",
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(min(n, a)) for alphabet size a',
        derivation: [
          "right moves n times. left only moves forward and never passes right, so the inner while runs at most n times in TOTAL.",
          "Each move does O(1) average set/dict work → O(n) overall (amortized).",
          "The window state holds at most one entry per distinct character → O(min(n, a)).",
          "exactly_k calls at_most twice → still O(n).",
        ],
      },
      whenToUse: [
        "\"Longest/shortest contiguous …\" with a monotonic validity rule.",
        "\"At most K distinct / K replacements / K zeros\".",
        "Not when negatives break monotonicity (use prefix sums), and not for subsequences.",
      ],
      mistakes: [
        "Using `if` instead of `while` to shrink — one removal may not restore validity.",
        "Updating the answer before the window is valid again.",
        "Forgetting to delete zero-count keys, so `len(counts)` overcounts distinct characters.",
      ],
      checks: [
        { q: "Why does sliding window fail for \"subarray sum equals k\" when numbers can be negative?", options: ['It is too slow', 'Adding an element can decrease the sum, so shrinking/growing decisions are not monotonic', 'Windows must be fixed', 'Hash maps are needed for all sums'], answer: 1, explain: "With negatives, a larger window can have a smaller sum; you can't know which way to move. Prefix sums + hash map solve it." },
        { q: "exactly(K) distinct substrings can be computed as…", options: ['atMost(K) + atMost(K-1)', 'atMost(K) - atMost(K-1)', 'atMost(K) × 2', 'atMost(K+1) - atMost(K)'], answer: 1, explain: "Windows with ≤ K distinct minus windows with ≤ K-1 distinct leaves exactly K." },
        { q: "Longest substring without repeats of 'dvdf' is…", options: ['2', '3', '4', '1'], answer: 1, explain: "'vdf' has length 3." },
      ],
      problems: [3, 560],
      terms: ['substring', 'distinct', 'contiguous', 'amortized', 'maximum'],
      verbal: "\"I'll expand right one step at a time and shrink left while there's a repeat. Each index enters and leaves the window at most once, so it's O(n) even though there's a nested while.\"",
    },
  ],
};
