import type { Module } from '../types';

const py = String.raw;

export const twoPointersModule: Module = {
  id: 'two-pointers',
  number: 5,
  title: 'Two Pointers',
  priority: 'P0',
  phase: 1,
  blurb: 'Opposite-direction, same-direction, and fast/slow pointers — and the invariants that prove they never skip an answer.',
  prerequisites: ['arrays', 'big-o'],
  lessons: [
    {
      id: 'opposite',
      title: 'Opposite-direction pointers on sorted arrays',
      summary: 'Start at both ends; each comparison safely eliminates one end.',
      what: "Two indices, `left = 0` and `right = n - 1`, move toward each other. At each step you compare something about `a[left]` and `a[right]` and move exactly one pointer. Because the array is **sorted**, moving a pointer changes the value in a predictable direction: left → bigger, right → smaller.",
      why: "On sorted input this finds pairs in O(n) time and O(1) space. Compare the three Two Sum strategies:\n\n- Brute force: all n(n−1)/2 pairs → O(n²) time, O(1) space.\n- Hash map of complements: O(n) time, O(n) space — works on unsorted input.\n- Opposite pointers: O(n) time, O(1) space — but only because the input is sorted.\n\nSortedness is what lets each comparison discard an element for good. The same idea powers palindrome checks and container-style problems.",
      how: [
        "Set `left, right = 0, len(a) - 1`.",
        "Compute `s = a[left] + a[right]`.",
        "If `s == target`: done. If `s < target`: the only way to grow the sum is `left += 1`. If `s > target`: `right -= 1`.",
        "**Invariant**: any valid pair lies within [left, right]. When `a[left] + a[right] < target`, `a[left]` cannot pair with ANY remaining element (they are all ≤ a[right]), so discarding it is safe.",
        "Stop when `left >= right`.",
      ],
      visual: {
        kind: 'array',
        title: 'Two Sum II: numbers = [1, 3, 4, 6, 9], target = 7',
        steps: [
          { cells: [1, 3, 4, 6, 9], pointers: { L: 0, R: 4 }, vars: { target: '7', sum: '1 + 9 = 10 > 7' }, note: 'Too big. 9 is too large to pair with anything (even the smallest partner, 1, overshoots) → R -= 1.' },
          { cells: [1, 3, 4, 6, 9], pointers: { L: 0, R: 3 }, vars: { target: '7', sum: '1 + 6 = 7' }, highlight: [0, 3], note: 'Found: indices 0 and 3 (LeetCode wants 1-indexed: [1, 4]).' },
        ],
      },
      code: py`
def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        s = numbers[left] + numbers[right]
        if s == target:
            return [left + 1, right + 1]   # LeetCode 167 is 1-indexed
        if s < target:
            left += 1                      # need a bigger sum
        else:
            right -= 1                     # need a smaller sum
    return []

assert two_sum_sorted([2, 7, 11, 15], 9) == [1, 2]
assert two_sum_sorted([1, 3, 4, 6, 9], 7) == [1, 4]
assert two_sum_sorted([-1, 0], -1) == [1, 2]

def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

assert is_palindrome("racecar") and not is_palindrome("ab") and is_palindrome("")
`,
      codeNotes: [
        "`left < right` (strict) prevents using the same element twice.",
        "`+ 1` converts 0-based to the 1-based indices the problem asks for.",
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(1)',
        derivation: [
          "Each iteration moves left forward or right backward by one.",
          "The gap right - left starts at n - 1 and shrinks by 1 per iteration → at most n - 1 iterations → O(n).",
          "Only two indices are stored → O(1) space. Compare with the hash-map Two Sum: O(n) time but O(n) space.",
        ],
      },
      whenToUse: [
        "Sorted array + pair/triple with a target sum.",
        "Symmetry checks (palindromes), reversing in place.",
        "If input is unsorted, sorting first costs O(n log n) — still often worthwhile when you can't use extra space or need sorted output.",
      ],
      mistakes: [
        "Using this on unsorted input — the elimination argument breaks.",
        "`while left <= right` — would allow pairing an element with itself.",
        "Returning 0-based indices when the problem is 1-indexed.",
      ],
      checks: [
        { q: "Sum is too small. Which pointer moves and why?", options: ['right -= 1, to shrink', 'left += 1, because a[left] cannot reach target with any remaining partner', 'Both', 'Neither — restart'], answer: 1, explain: "Every remaining partner is ≤ a[right], and even a[right] was not enough, so a[left] can be discarded." },
        { q: "Two pointers vs hash map for sorted Two Sum: the main advantage of two pointers is…", options: ['Better time complexity', 'O(1) extra space', 'Works on unsorted input', 'Handles duplicates'], answer: 1, explain: "Both are O(n) time; two pointers needs no auxiliary map." },
        { q: "numbers = [1, 2, 3, 4, 6], target = 6. Trace the pointers. Which 1-indexed answer is returned?", options: ['[1, 5]', '[2, 4]', '[1, 4]', '[3, 3]'], answer: 1, explain: "L=1,R=6 → 7 > 6, R moves; 1+4 = 5 < 6, L moves; 2+4 = 6 → indices 1 and 3 → [2, 4]." },
      ],
      problems: [167, 1, 125, 344, 42],
      terms: ['sorted', 'pointer', 'invariant', 'target'],
      verbal: "\"Because the array is sorted, if the sum is too small, the left element can't work with any remaining partner, so I move left. Each step discards one element, so it's O(n) time and O(1) space.\"",
    },
    {
      id: 'same-direction',
      title: 'Same-direction pointers: read/write and merging',
      summary: 'One pointer reads, another writes — or two pointers walk two inputs in lockstep.',
      what: "Both pointers move the same way, at different times:\n\n- **Read/write**: `read` scans everything; `write` marks where the next kept element goes. Used for in-place filtering and deduplication.\n- **Merging**: one pointer per input; take the smaller current element and advance that pointer.\n- **From the right**: when the destination buffer has empty space at the end (Merge Sorted Array), write the largest element at the back so nothing is overwritten.",
      why: "These give O(n) time with O(1) extra space for in-place tasks, and O(n + m) merging — the merge step of merge sort.",
      how: [
        "Merging two sorted arrays from the right: `i = m - 1`, `j = n - 1`, `w = m + n - 1`.",
        "While `j >= 0`: if `i >= 0 and nums1[i] > nums2[j]`, write `nums1[i]` and `i -= 1`; else write `nums2[j]` and `j -= 1`. Then `w -= 1`.",
        "Loop on `j >= 0`: once nums2 is exhausted, the remaining nums1 elements are already in place.",
        "**Invariant**: positions after `w` are final and sorted; `w` is always ≥ `i`, so we never overwrite unread nums1 data.",
      ],
      visual: {
        kind: 'array',
        title: 'Merge Sorted Array from the right: nums1 = [1, 2, 3, _, _, _], nums2 = [2, 5, 6]',
        steps: [
          { cells: [1, 2, 3, '_', '_', '_'], pointers: { i: 2, w: 5 }, vars: { 'nums2[j]': '6 (j=2)' }, note: '3 vs 6 → 6 is larger; write 6 at w = 5.' },
          { cells: [1, 2, 3, '_', '_', 6], pointers: { i: 2, w: 4 }, vars: { 'nums2[j]': '5 (j=1)' }, note: '3 vs 5 → write 5.' },
          { cells: [1, 2, 3, '_', 5, 6], pointers: { i: 2, w: 3 }, vars: { 'nums2[j]': '2 (j=0)' }, note: '3 vs 2 → write 3 from nums1; i moves left.' },
          { cells: [1, 2, 3, 3, 5, 6], pointers: { i: 1, w: 2 }, vars: { 'nums2[j]': '2 (j=0)' }, note: '2 vs 2 → not strictly greater, so write nums2’s 2.' },
          { cells: [1, 2, 2, 3, 5, 6], pointers: { i: 1, w: 1 }, vars: { j: '-1 → done' }, note: 'nums2 is exhausted; [1, 2] are already in place. Result [1, 2, 2, 3, 5, 6].' },
        ],
      },
      code: py`
def merge(nums1, m, nums2, n):
    i, j, w = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[w] = nums1[i]
            i -= 1
        else:
            nums1[w] = nums2[j]
            j -= 1
        w -= 1

a = [1, 2, 3, 0, 0, 0]
merge(a, 3, [2, 5, 6], 3)
assert a == [1, 2, 2, 3, 5, 6]
b = [0]
merge(b, 0, [1], 1)
assert b == [1]

def dedupe_sorted(nums):
    """Remove duplicates in-place from a sorted list; return new length."""
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write

c = [1, 1, 2, 3, 3]
k = dedupe_sorted(c)
assert k == 3 and c[:k] == [1, 2, 3]
`,
      codeNotes: [
        "The `i >= 0 and …` check short-circuits, so `nums1[-1]` is never read by mistake when i = -1.",
        "Python allows negative indices, so an unchecked `nums1[i]` with i = -1 would silently read the LAST element — a nasty bug.",
      ],
      complexity: {
        time: 'merge O(m + n); dedupe O(n)',
        space: 'O(1)',
        derivation: [
          "Each loop iteration writes one element and decrements w; there are at most m + n writes → O(m + n).",
          "Only three integer indices are stored → O(1) space.",
          "dedupe: read visits each index once → O(n); write ≤ read always.",
        ],
      },
      whenToUse: [
        "\"Modify in-place\" filtering, removing, or deduplicating.",
        "Merging sorted sequences (arrays or linked lists).",
        "Destination has trailing free space → fill from the right.",
      ],
      mistakes: [
        "Merging from the left in nums1 — overwrites values you haven't read yet.",
        "Looping on `i >= 0 and j >= 0` and forgetting the leftover nums2 elements.",
        "Negative-index reads when a pointer reaches -1.",
      ],
      checks: [
        { q: "Why merge Merge Sorted Array from the right?", options: ['It is faster', "The free space is at the end, so writing there never overwrites unread nums1 values", 'Python requires it', 'To sort descending'], answer: 1, explain: "Writing at index w ≥ i means the unread part of nums1 is never clobbered." },
        { q: "Why can the loop condition be just `j >= 0`?", options: ['nums1 is empty', 'Once nums2 is used up, remaining nums1 elements are already in the right place', 'It is a bug', 'm is always 0'], answer: 1, explain: "The leftover nums1 prefix is sorted and sits at the front, exactly where it belongs." },
        { q: "merge([4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3): what is written at index 5 on the first iteration?", options: ['3', '6', '1', '0'], answer: 1, explain: "It compares nums1[2] = 6 with nums2[2] = 3; 6 is larger, so it goes to w = 5. All of nums1 is written before any of nums2 here." },
      ],
      problems: [88, 21, 1768, 26, 283, 27],
      terms: ['in-place', 'pointer', 'invariant', 'sorted'],
      verbal: "\"I'll fill nums1 from the back using three indices, so I never overwrite unprocessed values. Each step places one element: O(m + n) time, O(1) space.\"",
    },
    {
      id: 'fast-slow',
      title: 'Fast and slow pointers, and pointer invariants',
      summary: 'Two runners at different speeds detect cycles and find middles.',
      what: "**Fast and slow pointers** (Floyd's tortoise and hare) move through a sequence at different speeds — typically slow moves 1 step and fast moves 2. Uses:\n\n- **Cycle detection**: if there is a cycle, fast eventually laps slow and they meet; if not, fast hits the end.\n- **Middle of a list**: when fast reaches the end, slow is in the middle.\n\nA **pointer invariant** is a statement that is true before and after every iteration — e.g. \"fast is always twice as far from the start as slow.\" Stating invariants is how you prove pointer code correct.",
      why: "They work on structures without random access (linked lists) and use O(1) memory instead of a visited set.",
      how: [
        "Start both at head.",
        "Loop while `fast and fast.next`: `slow = slow.next`; `fast = fast.next.next`.",
        "If `slow is fast` → cycle.",
        "Why they must meet: once both are inside a cycle of length C, the gap between them changes by 1 each step (fast gains 1), so within C steps the gap becomes 0 — fast can't jump over slow.",
        "For the middle: when the loop ends, slow points at the middle (second middle for even lengths).",
      ],
      visual: {
        kind: 'list',
        title: 'Finding the middle of 1 → 2 → 3 → 4 → 5',
        steps: [
          { nodes: ['1', '2', '3', '4', '5'], next: [1, 2, 3, 4, null], pointers: { slow: 0, fast: 0 }, note: 'Both start at the head.' },
          { nodes: ['1', '2', '3', '4', '5'], next: [1, 2, 3, 4, null], pointers: { slow: 1, fast: 2 }, note: 'slow moves 1, fast moves 2. Invariant: fast has gone twice as far as slow.' },
          { nodes: ['1', '2', '3', '4', '5'], next: [1, 2, 3, 4, null], pointers: { slow: 2, fast: 4 }, note: 'fast is at the last node; fast.next is None, so the loop stops.' },
          { nodes: ['1', '2', '3', '4', '5'], next: [1, 2, 3, 4, null], pointers: { slow: 2, fast: 4 }, note: 'slow is at 3 — the middle. Because fast covers the whole list while slow covers half, slow lands in the middle without counting the length first.' },
        ],
      },
      code: py`
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def build(values):
    head = None
    for v in reversed(values):
        head = ListNode(v, head)
    return head

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False

def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val

h = build([1, 2, 3, 4, 5])
assert not has_cycle(h) and middle(h) == 3
assert middle(build([1, 2, 3, 4])) == 3       # second middle for even length

# Create a cycle: 5 -> 3
node = h
while node.next:
    node = node.next
node.next = h.next.next
assert has_cycle(h)
assert not has_cycle(None)
`,
      codeNotes: [
        "`slow = fast = head` assigns both names to the same node.",
        "`while fast and fast.next` guards both hops — `fast.next.next` would crash if `fast.next` were None.",
        "`slow is fast` compares node identity, not values (two different nodes can hold equal values).",
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(1)',
        derivation: [
          "No cycle: fast reaches the end after n/2 iterations → O(n).",
          "Cycle: slow enters the cycle within n steps; then fast closes the gap by 1 per step, meeting within C ≤ n more steps → O(n).",
          "Only two pointers → O(1). The visited-set alternative is O(n) time and O(n) space.",
        ],
      },
      whenToUse: [
        "Linked-list cycle detection or cycle start.",
        "Finding the middle (e.g. before splitting for merge sort, palindrome list check).",
        "Sequences defined by a function x → f(x) (Happy Number style).",
      ],
      mistakes: [
        "Checking `slow == fast` before moving (they start equal!).",
        "Guarding only `fast` and crashing on `fast.next.next`.",
        "Comparing values instead of node identity.",
      ],
      checks: [
        { q: "Why can't fast \"jump over\" slow inside a cycle?", options: ['It can, sometimes', 'Each step fast gains exactly 1 position on slow, so the gap hits 0', 'Fast stops', 'The list is sorted'], answer: 1, explain: "Relative speed is 1 node/step, so the distance decreases one at a time." },
        { q: "Space complexity of fast/slow cycle detection?", options: ['O(n)', 'O(1)', 'O(log n)', 'O(C)'], answer: 1, explain: "Two pointers regardless of list size." },
        { q: "middle() on 1 → 2 → 3 → 4 → 5 → 6 returns…", options: ['3', '4', '6', '2'], answer: 1, explain: "Iterations: (2, 3), (3, 5), (4, None). For even lengths this version returns the SECOND middle, 4." },
      ],
      problems: [141, 206],
      terms: ['cycle', 'pointer', 'invariant', 'node'],
      verbal: "\"I'll move slow by one and fast by two. If there's a cycle, fast gains one node per step on slow, so they must meet; if not, fast hits None. O(n) time, O(1) space.\"",
    },
  ],
};
