import type { Drill } from './types';

const py = String.raw;

const STD_TIME = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'];

/**
 * Original complexity-analysis drills for the Big-O Lab.
 * Every `time`/`space` answer must appear in its options (validated by tests).
 */
export const drills: Drill[] = [
  {
    id: 'sum-list', title: 'Summing a list', module: 'big-o',
    code: py`
def total(nums):
    s = 0
    for x in nums:
        s += x
    return s`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(log n)'], space: 'O(1)',
    dominantOptions: ['s = 0', 'the for loop body s += x', 'return s'], dominant: 1,
    derivation: ['`s = 0` and `return s` run once: O(1).', 'The loop body runs once per element: n times × O(1).', 'Total: O(1) + O(n) = O(n).'],
    spaceWhy: 'Only one integer accumulator regardless of n.',
    optimization: 'Already optimal — every element must be read at least once (Ω(n)).',
    tags: ['single loop'],
  },
  {
    id: 'sequential-loops', title: 'Two loops, one after the other', module: 'big-o',
    code: py`
def stats(a, b):
    best = float("-inf")
    for x in a:
        best = max(best, x)
    count = 0
    for y in b:
        if y > best:
            count += 1
    return count`,
    sizes: 'n = len(a), m = len(b)',
    timeOptions: ['O(n)', 'O(n + m)', 'O(n · m)', 'O(max(n, m)²)'], time: 'O(n + m)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n + m)'], space: 'O(1)',
    dominantOptions: ['The loop over a', 'The loop over b', 'Both loops together; they add'], dominant: 2,
    derivation: ['First loop: n iterations of O(1) work → O(n).', 'Second loop: m iterations of O(1) work → O(m).', 'They run sequentially, so the costs ADD: O(n + m).', 'Keep both variables — m could be much larger than n.'],
    spaceWhy: 'Two scalars (best, count).',
    optimization: 'None needed; both inputs must be read.',
    trap: 'O(n · m) is wrong — the loops are not nested.',
    tags: ['sequential', 'multiple variables'],
  },
  {
    id: 'all-pairs', title: 'Checking every pair', module: 'big-o',
    code: py`
def has_pair(nums, target):
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return True
    return False`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n²)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(1)',
    dominantOptions: ['n = len(nums)', 'The inner comparison nums[i] + nums[j] == target', 'return False'], dominant: 1,
    derivation: ['For i = 0 the inner loop runs n − 1 times, for i = 1 it runs n − 2, …, for i = n − 1 it runs 0.', 'Total comparisons: (n − 1) + (n − 2) + … + 0 = n(n − 1)/2.', 'n(n − 1)/2 = ½n² − ½n → drop the constant and the lower-order term → O(n²).', 'Worst case: no pair exists, so it never returns early.'],
    spaceWhy: 'Only loop indices.',
    optimization: 'Use a hash set of seen values and check target − x: O(n) time, O(n) space. If sorted, two pointers: O(n) time, O(1) space.',
    trap: 'Starting j at i + 1 halves the work but it is still O(n²).',
    problem: 1, tags: ['nested', 'triangular'],
  },
  {
    id: 'nested-different', title: 'Nested loops over different inputs', module: 'big-o',
    code: py`
def common(a, b):
    out = []
    for x in a:
        for y in b:
            if x == y:
                out.append(x)
    return out`,
    sizes: 'n = len(a), m = len(b)',
    timeOptions: ['O(n + m)', 'O(n · m)', 'O(n²)', 'O(m log n)'], time: 'O(n · m)',
    spaceOptions: ['O(1)', 'O(min(n, m))', 'O(n · m)'], space: 'O(n · m)',
    dominantOptions: ['out = []', 'The inner comparison x == y', 'return out'], dominant: 1,
    derivation: ['The outer loop runs n times.', 'For EACH outer iteration, the inner loop runs m times.', 'Total comparisons: n × m → O(n · m).'],
    spaceWhy: 'Worst case (all values equal), every pair appends: n · m output items. With distinct values in each list, the output is at most min(n, m).',
    optimization: 'Put b in a set (O(m)), then check each x (O(n)): O(n + m) time, O(m) space.',
    trap: 'Do not write O(n²) — the inputs have different sizes.',
    tags: ['nested', 'multiple variables'],
  },
  {
    id: 'halving', title: 'A loop that halves', module: 'big-o',
    code: py`
def steps(n):
    count = 0
    while n > 1:
        n = n // 2
        count += 1
    return count`,
    sizes: 'n = the input integer',
    timeOptions: STD_TIME, time: 'O(log n)',
    spaceOptions: ['O(1)', 'O(log n)', 'O(n)'], space: 'O(1)',
    dominantOptions: ['count = 0', 'The loop body (n //= 2)', 'return count'], dominant: 1,
    derivation: ['After k iterations n has become about n / 2ᵏ.', 'The loop stops when n / 2ᵏ ≤ 1, i.e. when k ≥ log₂ n.', 'So the body runs about log₂ n times → O(log n).'],
    spaceWhy: 'Two integers.',
    optimization: 'Equivalent to n.bit_length() − 1 for n ≥ 1, but the loop is already logarithmic.',
    trap: 'O(n/2) is not a thing in Big-O here — repeated halving is logarithmic, not linear.',
    tags: ['logarithmic'],
  },
  {
    id: 'doubling-inner', title: 'An outer loop with an inner doubling loop', module: 'big-o',
    code: py`
def mix(n):
    total = 0
    for i in range(n):
        j = 1
        while j < n:
            total += 1
            j *= 2
    return total`,
    sizes: 'n = the input integer',
    timeOptions: STD_TIME, time: 'O(n log n)',
    spaceOptions: ['O(1)', 'O(log n)', 'O(n)'], space: 'O(1)',
    dominantOptions: ['for i in range(n)', 'total += 1 inside the while loop', 'return total'], dominant: 1,
    derivation: ['The while loop doubles j from 1 until it reaches n: about log₂ n iterations.', 'It restarts (j = 1) for every one of the n outer iterations.', 'Total: n × log₂ n → O(n log n).'],
    spaceWhy: 'Three integers.',
    optimization: 'The result is n · ⌈log₂ n⌉ and could be computed directly, but as an exercise the structure is the point.',
    tags: ['nested', 'logarithmic'],
  },
  {
    id: 'sorting-then-scan', title: 'Sort, then scan', module: 'search-sort',
    code: py`
def min_gap(nums):
    nums = sorted(nums)
    best = float("inf")
    for i in range(1, len(nums)):
        best = min(best, nums[i] - nums[i - 1])
    return best`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n log n)',
    spaceOptions: ['O(1)', 'O(log n)', 'O(n)'], space: 'O(n)',
    dominantOptions: ['sorted(nums)', 'The adjacent-difference loop', 'best = float("inf")'], dominant: 0,
    derivation: ['sorted() is O(n log n).', 'The scan is O(n).', 'O(n log n) + O(n) = O(n log n): sorting dominates.'],
    spaceWhy: 'sorted() returns a new list of n elements.',
    optimization: 'Use nums.sort() to avoid a second list if you may modify the input (Timsort may still use O(n) temporary space).',
    trap: 'Answering O(n) because the visible loop is linear — the sort is a hidden O(n log n).',
    problem: 1200, tags: ['sorting', 'hidden cost'],
  },
  {
    id: 'list-membership', title: 'Membership in a growing list', module: 'big-o',
    code: py`
def first_repeat(nums):
    seen = []
    for x in nums:
        if x in seen:
            return x
        seen.append(x)
    return None`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n²)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['seen.append(x)', 'x in seen', 'return None'], dominant: 1,
    derivation: ['`x in seen` scans the list: up to i comparisons when seen has i elements.', 'Worst case (no repeat): 0 + 1 + 2 + … + (n − 1) = n(n − 1)/2 comparisons.', 'That is O(n²). The append is amortized O(1) and does not dominate.'],
    spaceWhy: 'seen grows to n elements.',
    optimization: 'Make seen a set: membership becomes average O(1), total O(n).',
    trap: 'It looks like one loop, but `in` on a list is a hidden loop.',
    problem: 217, tags: ['hidden cost', 'hashing'],
  },
  {
    id: 'set-membership', title: 'Membership in a set', module: 'hashing',
    code: py`
def first_repeat(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return x
        seen.add(x)
    return None`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['seen = set()', 'The loop: n iterations of O(1) set operations', 'return None'], dominant: 1,
    derivation: ['Each iteration does one set lookup and at most one insert: average O(1) each.', 'n iterations × O(1) = O(n) average.', 'Worst case with pathological collisions would be O(n²), which is extremely unlikely for ints.'],
    spaceWhy: 'The set can hold up to n elements.',
    optimization: 'For O(1) extra space, sort in place first (O(n log n)) and compare neighbors — a time-space trade-off.',
    problem: 217, tags: ['hashing'],
  },
  {
    id: 'group-anagrams-sorted', title: 'Group Anagrams with sorted keys', module: 'hashing',
    code: py`
from collections import defaultdict

def group(strs):
    groups = defaultdict(list)
    for w in strs:
        key = "".join(sorted(w))
        groups[key].append(w)
    return list(groups.values())`,
    sizes: 'n = len(strs), k = maximum word length',
    timeOptions: ['O(n)', 'O(n · k)', 'O(n · k log k)', 'O(n log n)', 'O(n² · k)'], time: 'O(n · k log k)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n · k)', 'O(k)'], space: 'O(n · k)',
    dominantOptions: ['sorted(w) for each word', 'groups[key].append(w)', 'list(groups.values())'], dominant: 0,
    derivation: ['For each word: sorted(w) is O(k log k); join is O(k); hashing the key is O(k); append is O(1).', 'Per word: O(k log k) dominates.', 'n words → O(n · k log k).'],
    spaceWhy: 'Up to n distinct keys of length ≤ k, plus all n words stored in the groups → O(n · k).',
    optimization: 'Use a 26-slot count tuple as the key: O(k) per word → O(n · k) total.',
    trap: 'O(n) ignores word length; O(n log n) confuses sorting each word with sorting the list of words.',
    problem: 49, tags: ['canonical key', 'sorting', 'multiple variables'],
  },
  {
    id: 'group-anagrams-count', title: 'Group Anagrams with count keys', module: 'hashing',
    code: py`
from collections import defaultdict

def group(strs):
    groups = defaultdict(list)
    for w in strs:
        count = [0] * 26
        for ch in w:
            count[ord(ch) - ord("a")] += 1
        groups[tuple(count)].append(w)
    return list(groups.values())`,
    sizes: 'n = len(strs), k = maximum word length (alphabet fixed at 26)',
    timeOptions: ['O(n)', 'O(n · k)', 'O(n · k log k)', 'O(26ⁿ)', 'O(n² · k)'], time: 'O(n · k)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n · k)', 'O(26)'], space: 'O(n · k)',
    dominantOptions: ['[0] * 26', 'The inner loop over characters', 'tuple(count)'], dominant: 1,
    derivation: ['[0] * 26 and tuple(count) are O(26) = O(1) — the alphabet does not grow.', 'The inner loop runs k times per word.', 'Per word O(k); n words → O(n · k).', 'If the alphabet size a were variable, it would be O(n · (k + a)).'],
    spaceWhy: 'Keys are constant-size tuples (n × 26), but the grouped output holds all n words of length ≤ k → O(n · k) total. Excluding output, the keys are O(n).',
    optimization: 'This is optimal: every character must be read.',
    problem: 49, tags: ['canonical key', 'counting', 'multiple variables'],
  },
  {
    id: 'sliding-window-amortized', title: 'A for loop with an inner while', module: 'sliding-window',
    code: py`
def longest_unique(s):
    seen = set()
    left = best = 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
    sizes: 'n = len(s)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(min(n, a)) — a = alphabet size', 'O(n²)'], space: 'O(min(n, a)) — a = alphabet size',
    dominantOptions: ['The outer for loop alone', 'Total pointer movement of left and right combined', 'best = max(...)'], dominant: 1,
    derivation: ['right advances exactly n times.', 'left only moves forward, and never past right, so across the ENTIRE run the while body executes at most n times.', 'Total work ≤ n (right moves) + n (left moves) = 2n → O(n).', 'This is amortized reasoning: one iteration might move left many steps, but those steps are "paid for" by earlier right moves.'],
    spaceWhy: 'The set holds at most one copy of each distinct character in the window → bounded by both n and the alphabet size.',
    optimization: 'Store last-seen indices in a dict and jump left directly: still O(n), fewer operations.',
    trap: 'A for + while does NOT automatically mean O(n²). Ask how far the inner pointer can move in total.',
    problem: 3, tags: ['amortized', 'nested but linear', 'sliding window'],
  },
  {
    id: 'two-pointers-converge', title: 'Two pointers moving inward', module: 'two-pointers',
    code: py`
def pair_sorted(a, target):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == target:
            return (i, j)
        if s < target:
            i += 1
        else:
            j -= 1
    return None`,
    sizes: 'n = len(a)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(log n)'], space: 'O(1)',
    dominantOptions: ['The comparison and one pointer move per iteration', 'The return statements', 'Computing len(a)'], dominant: 0,
    derivation: ['Each iteration moves i right or j left by exactly one.', 'j − i starts at n − 1 and decreases by 1 per iteration, so there are at most n − 1 iterations.', 'O(1) per iteration → O(n).'],
    spaceWhy: 'Two indices and one sum.',
    optimization: 'Optimal for sorted input. (Unsorted input would need a sort first, O(n log n), or a hash map, O(n) space.)',
    problem: 167, tags: ['two pointers'],
  },
  {
    id: 'reverse-list-drill', title: 'Reversing a linked list in place', module: 'linked-lists',
    code: py`
def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev, curr = curr, nxt
    return prev`,
    sizes: 'n = number of nodes',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(log n)'], space: 'O(1)',
    dominantOptions: ['One pointer flip per node', 'The return statement', 'Creating prev'], dominant: 0,
    derivation: ['The loop advances curr one node per iteration until it is None.', 'n iterations × O(1) pointer assignments → O(n).'],
    spaceWhy: 'Three references regardless of n — nodes are re-linked, never copied.',
    optimization: 'Optimal. A recursive version is also O(n) time but O(n) stack space.',
    trap: 'Thinking it needs O(n) space because the result is a "new" list — it reuses the same nodes.',
    problem: 206, tags: ['linked list', 'in-place'],
  },
  {
    id: 'fast-slow-drill', title: 'Fast and slow pointers', module: 'linked-lists',
    code: py`
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
    sizes: 'n = number of nodes',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(log n)'], space: 'O(1)',
    dominantOptions: ['Pointer moves until fast ends or meets slow', 'The `is` comparison', 'Initializing slow and fast'], dominant: 0,
    derivation: ['No cycle: fast reaches the end after about n/2 iterations → O(n).', 'Cycle: slow enters the cycle within n steps; inside, fast closes the gap by 1 node per iteration, so they meet within at most C ≤ n more iterations.', 'Total O(n).'],
    spaceWhy: 'Two references.',
    optimization: 'A visited set is simpler to explain but O(n) space.',
    trap: 'Fearing an infinite loop inside the cycle — the shrinking gap guarantees termination.',
    problem: 141, tags: ['linked list', 'fast/slow'],
  },
  {
    id: 'monotonic-stack', title: 'Next greater element with a stack', module: 'stacks-queues',
    code: py`
def next_greater(nums):
    ans = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        stack.append(i)
    return ans`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['The for loop', 'Total pushes + pops across the whole run', 'Allocating ans'], dominant: 1,
    derivation: ['Every index is pushed exactly once (n pushes).', 'An index can be popped at most once after being pushed (≤ n pops in total).', 'The while loop body therefore runs ≤ n times over the entire run.', 'Total: O(n) + O(n) = O(n).'],
    spaceWhy: 'ans has n slots; the stack can hold all n indices (strictly decreasing input).',
    optimization: 'Already optimal.',
    trap: 'Nested while inside for — still linear because pops are bounded by pushes.',
    problem: 155, tags: ['amortized', 'nested but linear', 'stack'],
  },
  {
    id: 'pop-front', title: 'Using a list as a queue', module: 'stacks-queues',
    code: py`
def drain(items):
    q = list(items)
    out = []
    while q:
        out.append(q.pop(0))
    return out`,
    sizes: 'n = len(items)',
    timeOptions: STD_TIME, time: 'O(n²)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['out.append', 'q.pop(0)', 'list(items)'], dominant: 1,
    derivation: ['q.pop(0) removes the first element and shifts all remaining elements left.', 'With i elements left, that shift costs O(i).', 'Total: n + (n − 1) + … + 1 = O(n²).'],
    spaceWhy: 'q and out each hold up to n items.',
    optimization: 'Use collections.deque and popleft(): O(1) each → O(n) total.',
    trap: 'pop(0) looks constant-time but is linear.',
    problem: 933, tags: ['hidden cost', 'queue'],
  },
  {
    id: 'string-concat', title: 'Building a string with +=', module: 'arrays',
    code: py`
def build(n):
    s = ""
    for i in range(n):
        s = s + "x"
    return s`,
    sizes: 'n = the input integer',
    timeOptions: STD_TIME, time: 'O(n²)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['range(n)', 's = s + "x" (creates a new string)', 'return s'], dominant: 1,
    derivation: ['Strings are immutable: s + "x" allocates a new string and copies all i existing characters.', 'Iteration i copies i characters: 0 + 1 + … + (n − 1) = O(n²) character copies.', '(CPython sometimes optimizes s += in place, but you cannot rely on it — reason about the guaranteed cost.)'],
    spaceWhy: 'At any moment only the current string (and one temporary) exists: O(n).',
    optimization: 'Append pieces to a list and "".join(parts) once: O(n).',
    problem: 1768, tags: ['hidden cost', 'strings'],
  },
  {
    id: 'slice-in-loop', title: 'Slicing inside a loop', module: 'arrays',
    code: py`
def suffix_sums(nums):
    out = []
    for i in range(len(nums)):
        out.append(sum(nums[i:]))
    return out`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n²)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['out.append', 'nums[i:] and sum(...) — each O(n − i)', 'range(len(nums))'], dominant: 1,
    derivation: ['nums[i:] copies n − i elements and sum() reads them again.', 'Total: Σ (n − i) for i = 0…n−1 = n(n + 1)/2 → O(n²).'],
    spaceWhy: 'Each slice is temporary (freed after sum), so peak extra space is O(n) for one slice plus the O(n) output.',
    optimization: 'Iterate from the right with a running total: O(n) time.',
    tags: ['hidden cost', 'prefix/suffix'],
  },
  {
    id: 'prefix-hash', title: 'Prefix sum with a hash map', module: 'patterns',
    code: py`
from collections import Counter

def count_k(nums, k):
    seen = Counter({0: 1})
    cur = ans = 0
    for x in nums:
        cur += x
        ans += seen[cur - k]
        seen[cur] += 1
    return ans`,
    sizes: 'n = len(nums)',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n²)'], space: 'O(n)',
    dominantOptions: ['Counter({0: 1})', 'The loop: O(1) average dictionary work per element', 'return ans'], dominant: 1,
    derivation: ['One pass over n elements.', 'Each step: one addition, one Counter lookup, one Counter increment → average O(1).', 'Total: O(n).', 'Brute force over all subarrays would be O(n²) with running sums.'],
    spaceWhy: 'Up to n + 1 distinct prefix sums stored.',
    optimization: 'Optimal in time; space cannot generally be reduced when negatives are allowed.',
    problem: 560, tags: ['prefix sum', 'hashing'],
  },
  {
    id: 'factorial-recursion', title: 'Recursive factorial', module: 'recursion',
    code: py`
def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)`,
    sizes: 'n = the input integer',
    timeOptions: STD_TIME, time: 'O(n)',
    spaceOptions: ['O(1)', 'O(log n)', 'O(n)'], space: 'O(n)',
    dominantOptions: ['The base case check', 'The chain of n recursive calls', 'The multiplication only'], dominant: 1,
    derivation: ['fact(n) calls fact(n − 1), which calls fact(n − 2), … down to fact(1): n calls.', 'Each call does O(1) work besides its recursive call (treating multiplication as O(1)).', 'Total: O(n).'],
    spaceWhy: 'All n frames are on the call stack at the deepest point → O(n). (An iterative loop would be O(1).)',
    optimization: 'Use a loop to get O(1) space and avoid Python’s recursion limit.',
    trap: 'Saying O(1) space because no lists are created — the call stack counts.',
    tags: ['recursion', 'call stack'],
  },
  {
    id: 'fib-naive', title: 'Two recursive calls per level', module: 'recursion',
    code: py`
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)`,
    sizes: 'n = the input integer',
    timeOptions: STD_TIME, time: 'O(2ⁿ)',
    spaceOptions: ['O(1)', 'O(n)', 'O(2ⁿ)'], space: 'O(n)',
    dominantOptions: ['The base case', 'The exponentially many repeated calls', 'The addition'], dominant: 1,
    derivation: ['Each call spawns two more until n < 2, so the recursion tree roughly doubles each level.', 'The tree has depth n, so there are at most about 2ⁿ calls (more precisely ~1.618ⁿ).', 'O(1) work per call → O(2ⁿ) time (a valid upper bound; Θ(φⁿ) is tight).'],
    spaceWhy: 'Only one root-to-leaf chain is on the stack at once: depth n → O(n).',
    optimization: 'Memoize (lru_cache) or iterate with two variables: O(n) time, O(1) space for the iterative version.',
    trap: 'Space is NOT O(2ⁿ) — calls finish and pop off before siblings start.',
    problem: 70, tags: ['recursion', 'exponential', 'memoization'],
  },
  {
    id: 'subsets-enum', title: 'Generating all subsets', module: 'recursion',
    code: py`
def subsets(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])
            return
        dfs(i + 1)
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
    dfs(0)
    return res`,
    sizes: 'n = len(nums)',
    timeOptions: ['O(n)', 'O(n²)', 'O(2ⁿ)', 'O(n · 2ⁿ)', 'O(n!)'], time: 'O(n · 2ⁿ)',
    spaceOptions: ['O(1)', 'O(n) auxiliary (excluding output)', 'O(2ⁿ) auxiliary'], space: 'O(n) auxiliary (excluding output)',
    dominantOptions: ['Copying path[:] at each of the 2ⁿ leaves', 'path.pop()', 'The base-case comparison'], dominant: 0,
    derivation: ['Each element is either excluded or included: 2 branches per level, n levels → 2ⁿ leaves.', 'Each leaf copies a path of up to n elements → O(n) per leaf.', 'Total: O(n · 2ⁿ). (Internal nodes add only O(2ⁿ) more.)'],
    spaceWhy: 'Recursion depth n + 1 and a path of ≤ n items → O(n) auxiliary. The output itself is O(n · 2ⁿ).',
    optimization: 'Cannot beat the output size: there are 2ⁿ subsets to write down.',
    problem: 78, tags: ['backtracking', 'output-sensitive'],
  },
  {
    id: 'permutations-enum', title: 'Generating all permutations', module: 'recursion',
    code: py`
def permute(nums):
    res, path, used = [], [], [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if not used[i]:
                used[i] = True
                path.append(nums[i])
                dfs()
                path.pop()
                used[i] = False
    dfs()
    return res`,
    sizes: 'n = len(nums)',
    timeOptions: ['O(n)', 'O(n²)', 'O(2ⁿ)', 'O(n!)', 'O(n · n!)'], time: 'O(n · n!)',
    spaceOptions: ['O(1)', 'O(n) auxiliary (excluding output)', 'O(n!) auxiliary'], space: 'O(n) auxiliary (excluding output)',
    dominantOptions: ['Work at the n! leaves (copying) and the n-way loops', 'used = [False] * len(nums)', 'return res'], dominant: 0,
    derivation: ['Level 1 has n choices, level 2 has n − 1, …: n! leaves.', 'Each leaf copies n items: O(n · n!).', 'Internal nodes number about e · n! and each loops over n indices, which is also O(n · n!).', 'Total: O(n · n!). No algorithm that outputs every permutation can be faster than its output size.'],
    spaceWhy: 'path, used, and the recursion stack are all O(n); the output is O(n · n!).',
    optimization: 'If the task is to COMPARE or GROUP permutations (e.g. digit grouping), avoid generation entirely and use a canonical key.',
    trap: 'Answering O(n) or O(n²) — enumeration cost is output-sensitive.',
    problem: 46, tags: ['backtracking', 'output-sensitive', 'permutations'],
  },
  {
    id: 'digit-key', title: 'Digit-count keys for n numbers', module: 'recursion',
    code: py`
from collections import defaultdict

def group_by_digits(nums):
    groups = defaultdict(list)
    for x in nums:
        counts = [0] * 10
        for ch in str(x):
            counts[int(ch)] += 1
        groups[tuple(counts)].append(x)
    return list(groups.values())`,
    sizes: 'n = len(nums), d = digits per number',
    timeOptions: ['O(n)', 'O(n · d)', 'O(n · d!)', 'O(n² · d)', 'O(n log n)'], time: 'O(n · d)',
    spaceOptions: ['O(1)', 'O(n)', 'O(n · d)', 'O(10ⁿ)'], space: 'O(n)',
    dominantOptions: ['Converting and counting the d digits of each number', '[0] * 10', 'list(groups.values())'], dominant: 0,
    derivation: ['str(x) and the counting loop are O(d) per number.', '[0] * 10 and tuple(counts) are O(10) = O(1).', 'n numbers → O(n · d). For three-digit numbers d = 3 is constant, so O(n).'],
    spaceWhy: 'At most n keys of 10 slots (O(n)) plus n numbers in the output (O(n)).',
    optimization: 'Already linear in input size; generating permutations instead would be O(n · d · d!).',
    trap: 'Thinking "permutation" in the prompt forces factorial time.',
    problem: 49, tags: ['canonical key', 'candidate-reported'],
  },
  {
    id: 'binary-search-drill', title: 'Binary search loop', module: 'search-sort',
    code: py`
def find(a, t):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t:
            return mid
        if a[mid] < t:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    sizes: 'n = len(a)',
    timeOptions: STD_TIME, time: 'O(log n)',
    spaceOptions: ['O(1)', 'O(log n)', 'O(n)'], space: 'O(1)',
    dominantOptions: ['Each halving iteration', 'len(a)', 'return -1'], dominant: 0,
    derivation: ['Each iteration discards at least half of the remaining range [lo, hi].', 'Range sizes: n, n/2, n/4, … reach 0 after about log₂ n + 1 iterations.', 'O(1) per iteration → O(log n).'],
    spaceWhy: 'Three indices. (A recursive version would use O(log n) stack.)',
    optimization: 'Optimal for comparison-based search on sorted data.',
    problem: 704, tags: ['logarithmic', 'binary search'],
  },
  {
    id: 'tree-dfs', title: 'Recursive DFS on a binary tree', module: 'trees',
    code: py`
def max_depth(node):
    if node is None:
        return 0
    return 1 + max(max_depth(node.left), max_depth(node.right))`,
    sizes: 'n = number of nodes, h = height',
    timeOptions: ['O(log n)', 'O(h)', 'O(n)', 'O(n log n)', 'O(2ⁿ)'], time: 'O(n)',
    spaceOptions: ['O(1)', 'O(h)', 'O(n²)'], space: 'O(h)',
    dominantOptions: ['One call per node (plus one per None child)', 'The max() call alone', 'The base case alone'], dominant: 0,
    derivation: ['Every node is visited exactly once; None children add at most n + 1 extra O(1) calls.', 'O(1) work per call → O(n).', 'Two recursive calls per node does NOT mean 2ⁿ: the calls are on disjoint subtrees, so the total is bounded by the number of nodes.'],
    spaceWhy: 'The stack holds one frame per level of the current path: O(h) — O(log n) balanced, O(n) skewed.',
    optimization: 'BFS gives the same O(n) time with O(w) queue space (w = max width).',
    trap: 'Two recursive calls per call ≠ exponential when the subproblems do not overlap.',
    problem: 104, tags: ['trees', 'recursion', 'call stack'],
  },
  {
    id: 'grid-bfs', title: 'BFS over a grid', module: 'graphs',
    code: py`
from collections import deque

def reachable(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    seen = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for nr, nc in ((r+1, c), (r-1, c), (r, c+1), (r, c-1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append((nr, nc))
    return len(seen)`,
    sizes: 'R = rows, C = columns',
    timeOptions: ['O(R + C)', 'O(R · C)', 'O((R · C)²)', 'O(4^(R·C))'], time: 'O(R · C)',
    spaceOptions: ['O(1)', 'O(R + C)', 'O(R · C)'], space: 'O(R · C)',
    dominantOptions: ['Processing each cell once and checking its 4 neighbors', 'Creating the deque', 'len(seen)'], dominant: 0,
    derivation: ['Each cell is added to seen and the queue at most once (marked when enqueued).', 'Each dequeued cell checks 4 neighbors: O(1).', 'Total: O(R · C) cells × O(1) = O(R · C). In graph terms: O(V + E) with V = R·C and E ≤ 4V.'],
    spaceWhy: 'seen and the queue can each hold O(R · C) cells.',
    optimization: 'Mark visited in the grid itself to drop the set (still O(R · C) worst-case queue).',
    problem: 200, tags: ['graphs', 'bfs'],
  },
  {
    id: 'heap-topk', title: 'Top-K with a heap', module: 'patterns',
    code: py`
import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]`,
    sizes: 'n = len(nums), k = the parameter',
    timeOptions: ['O(n)', 'O(n log n)', 'O(n log k)', 'O(k log n)', 'O(n · k)'], time: 'O(n log k)',
    spaceOptions: ['O(1)', 'O(k)', 'O(n)'], space: 'O(k)',
    dominantOptions: ['heappush / heappop on a heap of size ≤ k + 1', 'Reading h[0]', 'len(h)'], dominant: 0,
    derivation: ['The heap never exceeds k + 1 elements.', 'Each push or pop costs O(log k).', 'n pushes and at most n pops → O(n log k).'],
    spaceWhy: 'The heap holds at most k + 1 items.',
    optimization: 'Quickselect is O(n) on average (O(n²) worst case). heapq.heapify(nums) then k pops is O(n + k log n).',
    trap: 'O(n log n) would be the cost of sorting, not of a size-k heap.',
    problem: 215, tags: ['heap', 'multiple variables'],
  },
];

export function getDrill(id: string): Drill | undefined {
  return drills.find((drill) => drill.id === id);
}
