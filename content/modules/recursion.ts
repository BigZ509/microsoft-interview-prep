import type { Module } from '../types';

const py = String.raw;

export const recursionModule: Module = {
  id: 'recursion',
  number: 9,
  title: 'Recursion, Permutations, Combinations, and Backtracking',
  priority: 'P0',
  phase: 1,
  blurb: 'Base cases, call stacks, recursion trees, and backtracking over choices — permutations, combinations, subsets, duplicates — plus when counting beats enumerating.',
  prerequisites: ['python', 'big-o'],
  lessons: [
    {
      id: 'basics',
      title: 'What recursion means: base cases, recursive calls, call-stack frames',
      summary: 'A function that solves a problem by calling itself on a smaller version of the same problem.',
      what: "**Recursion** is when a function calls itself. Every correct recursive function has:\n\n- A **base case** — an input small enough to answer directly, with no further calls.\n- A **recursive case** — reduce the problem to smaller subproblem(s), call the function on them, and combine their results.\n\nEach call gets its own **stack frame** holding its parameters and local variables. Frames pile up on the **call stack** until base cases return, then unwind in reverse order.",
      why: "Many structures are defined recursively: a tree is a node plus subtrees; a list is a head plus the rest; a permutation is a first choice plus a permutation of the rest. Recursion lets the code mirror that definition.",
      how: [
        "Define what the function returns for an input, in one sentence (\"sum_list(a) returns the sum of a\").",
        "Write the base case: the smallest input (empty list, n == 0, node is None).",
        "Trust the recursive call (\"leap of faith\"): assume it correctly solves the smaller input.",
        "Combine: e.g. `a[0] + sum_list(a[1:])` — but prefer passing an index to avoid copying slices.",
        "Check progress: every call must move strictly toward the base case.",
      ],
      visual: {
        kind: 'stack',
        title: 'Call stack for factorial(3)',
        steps: [
          { items: ['factorial(3)'], note: 'Call factorial(3): not a base case, needs factorial(2).' },
          { items: ['factorial(3)', 'factorial(2)'], note: 'A new frame for factorial(2), waiting on factorial(1).' },
          { items: ['factorial(3)', 'factorial(2)', 'factorial(1)'], note: 'factorial(1) waits on factorial(0).' },
          { items: ['factorial(3)', 'factorial(2)', 'factorial(1)', 'factorial(0)'], note: 'Base case: factorial(0) returns 1. Max depth = 4 frames → O(n) stack space.' },
          { items: ['factorial(3)', 'factorial(2)'], vars: { returned: 'factorial(1) = 1 × 1 = 1' }, note: 'Frames unwind: factorial(1) returns 1.' },
          { items: [], vars: { returned: 'factorial(3) = 3 × 2 = 6' }, note: 'factorial(2) returns 2, then factorial(3) returns 6. Stack empty.' },
        ],
      },
      code: py`
def factorial(n):
    if n == 0:                  # base case
        return 1
    return n * factorial(n - 1) # recursive case: smaller input

assert [factorial(i) for i in range(6)] == [1, 1, 2, 6, 24, 120]

def sum_list(a, i=0):
    """Sum of a[i:], using an index instead of slicing (no copies)."""
    if i == len(a):
        return 0
    return a[i] + sum_list(a, i + 1)

assert sum_list([3, 4, 5]) == 12 and sum_list([]) == 0

def count_digits(n):
    if n < 10:
        return 1
    return 1 + count_digits(n // 10)

assert count_digits(7) == 1 and count_digits(12345) == 5

import sys
assert sys.getrecursionlimit() >= 1000   # deep recursion can hit this limit
`,
      codeNotes: [
        "`def sum_list(a, i=0)` — a default parameter so callers can write `sum_list(a)`.",
        "Writing `a[0] + sum_list(a[1:])` works but copies the list at every level → O(n²) time overall.",
        "Python's default recursion limit is about 1000 frames; LeetCode inputs of 10⁵ may need an iterative solution.",
      ],
      complexity: {
        time: 'factorial O(n); sum_list O(n); count_digits O(d)',
        space: 'O(n) stack frames (O(d) for digits)',
        derivation: [
          "factorial makes one call per value n, n-1, …, 0 → n + 1 calls, each O(1) work → O(n).",
          "All those calls are on the stack simultaneously at the deepest point → O(n) space.",
          "sum_list with slicing would copy n-1, n-2, … elements → O(n²); passing an index keeps it O(n).",
        ],
      },
      whenToUse: [
        "The input is recursive (trees, nested lists) or the solution is \"make a choice, then solve the rest\".",
        "Divide and conquer (merge sort, binary search).",
        "Prefer iteration when depth can be very large and a simple loop exists.",
      ],
      mistakes: [
        "Missing or unreachable base case → RecursionError.",
        "Not returning the recursive result (`factorial(n - 1)` without `return`).",
        "Slicing at every level, silently adding O(n) per call.",
      ],
      checks: [
        { q: "What is the base case's job?", options: ['Make the function faster', 'Stop the recursion with a directly-known answer', 'Call the function again', 'Print the result'], answer: 1, explain: "Without it, calls never stop." },
        { q: "Maximum stack depth of factorial(n)?", options: ['1', 'log n', 'n + 1', '2ⁿ'], answer: 2, explain: "factorial(n) through factorial(0) are all active at once." },
        { q: "Why prefer an index parameter over `a[1:]` in recursion?", options: ['Readability', 'Slicing copies the list each call, adding O(n) per level', 'Indexes are required', 'Slices are unhashable'], answer: 1, explain: "n levels × O(n) copy = O(n²) total." },
      ],
      problems: [104, 100, 70],
      terms: ['recursion', 'base-case', 'state'],
      verbal: "\"My base case is the empty input; otherwise I solve the smaller problem recursively and combine. There are n calls with O(1) work each, so O(n) time and O(n) stack space.\"",
    },
    {
      id: 'backtracking',
      title: 'Recursion trees, decision trees, backtracking, state and choices',
      summary: 'Explore every sequence of choices by choosing, recursing, and un-choosing.',
      what: "A **recursion tree** draws every call as a node with its sub-calls as children. When each level represents a decision, it's a **decision tree**: the root is \"no choices yet\", each edge is a choice, each leaf is a complete candidate.\n\n**Backtracking** walks that tree depth-first with a single shared **state** (e.g. `path`, `used`):\n\n1. **Choose** — modify state.\n2. **Explore** — recurse.\n3. **Un-choose** — undo the modification so the next choice starts clean.\n\n**Pruning** skips branches that can't lead to a valid answer.",
      why: "\"Generate all …\" problems (permutations, combinations, subsets, N-Queens, word search) have exponentially many candidates. Backtracking enumerates them with only O(depth) working memory and lets you prune early.",
      how: [
        "Define the state: what has been chosen so far (path) and what's still available.",
        "Define the choices at each step.",
        "Base case: the state is complete → record a COPY (`path[:]`).",
        "For each choice: append → recurse → pop.",
        "Prune: `if invalid(choice): continue` before recursing.",
      ],
      visual: {
        kind: 'stack',
        title: 'The shared `path` during permutations of [1, 2] (bottom → top)',
        steps: [
          { items: [], vars: { res: '[]' }, note: 'Start: path = [] — nothing chosen yet.' },
          { items: ['1'], vars: { used: '{1}', res: '[]' }, note: 'Choose 1 (append), then explore (recurse).' },
          { items: ['1', '2'], vars: { used: '{1, 2}', res: '[[1, 2]]' }, note: 'Choose 2. len(path) == 2 → record a COPY: res.append(path[:]).' },
          { items: ['1'], vars: { used: '{1}', res: '[[1, 2]]' }, note: 'Un-choose 2 (pop). No other unused choice at this depth → return.' },
          { items: [], vars: { used: '{}', res: '[[1, 2]]' }, note: 'Un-choose 1 (pop). Back at the root with a clean path.' },
          { items: ['2', '1'], vars: { used: '{1, 2}', res: '[[1, 2], [2, 1]]' }, note: 'Choose 2, then 1 → record [2, 1].' },
          { items: [], vars: { res: '[[1, 2], [2, 1]]' }, note: 'Pop twice. Every choose was matched by an un-choose, so path ends empty — that is why storing `path` itself (not a copy) would leave empty lists in res.' },
        ],
      },
      code: py`
def backtrack_template(choices, k):
    """All length-k sequences from choices (with reuse), as a template."""
    res, path = [], []
    def dfs():
        if len(path) == k:          # base case: complete candidate
            res.append(path[:])     # COPY - path keeps changing
            return
        for c in choices:
            path.append(c)          # choose
            dfs()                   # explore
            path.pop()              # un-choose (backtrack)
    dfs()
    return res

assert backtrack_template("ab", 2) == [["a", "a"], ["a", "b"], ["b", "a"], ["b", "b"]]

# The copy bug: storing path itself
def buggy(choices, k):
    res, path = [], []
    def dfs():
        if len(path) == k:
            res.append(path)        # BUG: same list object every time
            return
        for c in choices:
            path.append(c); dfs(); path.pop()
    dfs()
    return res

assert buggy("ab", 2) == [[], [], [], []]   # all aliases of the emptied path

# Pruning: sequences of digits 1..3 with sum exactly 4
def sums_to(target):
    res, path = [], []
    def dfs(total):
        if total == target:
            res.append(path[:]); return
        for d in (1, 2, 3):
            if total + d > target:  # prune: can only get bigger
                break
            path.append(d); dfs(total + d); path.pop()
    dfs(0)
    return res

assert sums_to(4) == [[1, 1, 1, 1], [1, 1, 2], [1, 2, 1], [1, 3], [2, 1, 1], [2, 2], [3, 1]]
`,
      codeNotes: [
        "`res.append(path[:])` stores a snapshot. Without the copy, every entry is the same list, which ends empty after all pops.",
        "`break` (not `continue`) is valid in sums_to because choices are in increasing order — once one is too big, the rest are too.",
      ],
      complexity: {
        time: 'k-length sequences from c choices: O(cᵏ · k)',
        space: 'O(k) auxiliary (path + recursion depth), plus output',
        derivation: [
          "The decision tree has c branches per level and k levels → cᵏ leaves (and fewer than 2·cᵏ nodes total for c ≥ 2).",
          "Each leaf copies a path of length k → O(cᵏ · k).",
          "At any time the stack holds at most k + 1 frames and path holds at most k items → O(k) auxiliary space.",
        ],
      },
      whenToUse: [
        "\"Generate all\", \"list every\", \"find all combinations/arrangements\".",
        "Constraint satisfaction where you can reject partial candidates early.",
        "Small n (often ≤ 10–20) in the constraints is a hint that exponential output is expected.",
      ],
      mistakes: [
        "Appending `path` instead of `path[:]`.",
        "Forgetting to un-choose (pop), so state leaks into sibling branches.",
        "Calling backtracking O(n) — the output alone is exponential.",
      ],
      checks: [
        { q: "What are the three steps of backtracking?", options: ['Sort, search, return', 'Choose, explore, un-choose', 'Push, pop, peek', 'Hash, store, lookup'], answer: 1, explain: "Modify state, recurse, then undo the modification." },
        { q: "Why does `res.append(path)` produce empty lists?", options: ['path is a tuple', 'Every entry references the same list, which is emptied by later pops', 'append fails silently', 'Recursion limit'], answer: 1, explain: "Store a copy: path[:] or list(path)." },
        { q: "Backtracking permutations of [1, 2, 3]: how many times does `res.append(path[:])` run?", options: ['3', '6', '9', '27'], answer: 1, explain: "Once per leaf of the decision tree: 3 × 2 × 1 = 3! = 6." },
      ],
      problems: [46, 78],
      terms: ['backtracking', 'state', 'recursion', 'dfs', 'transition'],
      verbal: "\"I'll backtrack: the state is the current path; at each step I choose an option, recurse, then pop it. At the base case I append a copy of the path.\"",
    },
    {
      id: 'permutations',
      title: 'Permutations and factorials — order matters',
      summary: 'Every ordering of n distinct items: n choices, then n-1, … → n! arrangements.',
      what: "A **permutation** is an arrangement where **order matters**: [1, 2, 3] and [3, 2, 1] are different permutations of the same items.\n\nNumber of permutations of n distinct items: **n! = n × (n-1) × … × 1** (the **factorial**). Choosing and ordering r of n items: n! / (n - r)!.\n\nPermutations of [1, 2, 3]: [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1] — 3! = 6.",
      why: "\"Generate all arrangements/orderings\" is a direct permutation problem (LeetCode 46). Understanding the n! count tells you the problem is only feasible for small n.",
      how: [
        "State: `path` (chosen so far) and `used` (which indices are in the path).",
        "Base case: `len(path) == n` → record `path[:]`.",
        "Choices: every index i not yet used.",
        "Choose: mark used[i], append nums[i]; recurse; un-choose: pop, unmark.",
        "Level 1 has n branches, level 2 has n - 1, … → n! leaves.",
      ],
      visual: {
        kind: 'tree',
        title: 'Decision tree for permutations of [1, 2, 3]',
        root: { id: 'r', label: '[]', children: [
          { id: 'a', label: '[1]', children: [
            { id: 'a1', label: '[1,2]', children: [{ id: 'a1x', label: '[1,2,3]' }] },
            { id: 'a2', label: '[1,3]', children: [{ id: 'a2x', label: '[1,3,2]' }] },
          ] },
          { id: 'b', label: '[2]', children: [
            { id: 'b1', label: '[2,1]', children: [{ id: 'b1x', label: '[2,1,3]' }] },
            { id: 'b2', label: '[2,3]', children: [{ id: 'b2x', label: '[2,3,1]' }] },
          ] },
          { id: 'c', label: '[3]', children: [
            { id: 'c1', label: '[3,1]', children: [{ id: 'c1x', label: '[3,1,2]' }] },
            { id: 'c2', label: '[3,2]', children: [{ id: 'c2x', label: '[3,2,1]' }] },
          ] },
        ] },
        steps: [
          { active: ['r', 'a', 'b', 'c'], note: 'Level 1: 3 choices for the first position.' },
          { active: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'], note: 'Level 2: 2 remaining choices each → 3 × 2 = 6 partial paths.' },
          { active: ['a1x', 'a2x', 'b1x', 'b2x', 'c1x', 'c2x'], note: 'Level 3: 1 choice each → 3 × 2 × 1 = 3! = 6 leaves = 6 permutations.' },
          { active: ['r', 'a', 'a1', 'a1x'], done: ['a2', 'a2x'], note: 'DFS order: go down [1] → [1,2] → [1,2,3], record, pop back to [1], try [1,3]… Only one root-to-leaf path is in memory at a time.' },
        ],
      },
      code: py`
import math
from itertools import permutations

def permute(nums):
    res, path = [], []
    used = [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            dfs()
            path.pop()
            used[i] = False
    dfs()
    return res

out = permute([1, 2, 3])
assert out == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
assert len(permute([1, 2, 3, 4])) == math.factorial(4) == 24
assert [list(p) for p in permutations([1, 2, 3])] == out   # library equivalent
assert permute([]) == [[]]                                 # one empty arrangement

# r-permutations: ordered selections of r from n
assert len(list(permutations([1, 2, 3, 4], 2))) == math.factorial(4) // math.factorial(2) == 12
`,
      codeNotes: [
        "`used` is a boolean list parallel to nums — O(1) to check whether index i is taken.",
        "`itertools.permutations` is fine for checking your work; interviewers usually want the backtracking version.",
        "0! = 1: there is exactly one way to arrange nothing.",
      ],
      complexity: {
        time: 'O(n · n!)',
        space: 'O(n) auxiliary (path, used, stack); O(n · n!) output',
        derivation: [
          "Leaves: n · (n-1) · … · 1 = n!.",
          "Internal nodes: n!/(n-1)! + n!/(n-2)! + … ≤ e · n! — still O(n!).",
          "Each node loops over n indices, and each leaf copies n items → O(n · n!) total time.",
          "Output: n! lists of length n → O(n · n!) space just to hold the answer. Auxiliary: path (n), used (n), stack depth (n + 1) → O(n).",
          "This is output-sensitive: no algorithm can list n! permutations in less than Ω(n · n!) time, because it has to write them.",
        ],
      },
      whenToUse: [
        "\"All arrangements / orderings / anagrams of a word (generated)\".",
        "Small n (≤ 8–10): 10! = 3.6 million.",
        "NOT for checking whether two things are permutations of each other — use counting/sorting (canonical key).",
      ],
      mistakes: [
        "Forgetting to reset `used[i] = False` after recursing.",
        "Calling it O(n!) without the factor of n for copying.",
        "Generating permutations when the problem only needs to COMPARE or GROUP them.",
      ],
      checks: [
        { q: "How many permutations does [a, b, c, d] have?", options: ['4', '16', '24', '256'], answer: 2, explain: "4! = 4 × 3 × 2 × 1 = 24." },
        { q: "Ordered selections of 2 from 5 items?", options: ['10', '20', '25', '120'], answer: 1, explain: "5!/(5-2)! = 5 × 4 = 20. Order matters, so (a,b) ≠ (b,a)." },
        { q: "Can generating all permutations ever be O(n)?", options: ['Yes, with hashing', 'No — there are n! outputs of length n to write', 'Yes, if sorted', 'Only for n ≤ 3'], answer: 1, explain: "The output size alone is n · n!." },
      ],
      problems: [46],
      terms: ['permutation', 'factorial', 'backtracking', 'lexicographical-order'],
      verbal: "\"There are n choices for the first slot, n-1 for the second, and so on, so n! permutations. Copying each costs O(n), so O(n · n!) time; auxiliary space is O(n) for the path, the used array, and the recursion depth.\"",
    },
    {
      id: 'combinations-subsets',
      title: 'Combinations and subsets — selection matters, order does not',
      summary: 'Choose k of n (C(n, k)), or every subset (2ⁿ), by only moving forward through the items.',
      what: "A **combination** is a selection where **order does not matter**: {1, 2} and {2, 1} are the same combination. The number of ways to choose k of n is **C(n, k) = n! / (k! (n-k)!)**.\n\nA **subset** is any selection from a set — of any size, including empty and the whole set. A set of n elements has **2ⁿ** subsets (each element is in or out).\n\nCombinations of [1, 2, 3] taken 2 at a time: {1,2}, {1,3}, {2,3} → C(3, 2) = 3.\nSubsets of [1, 2, 3]: {}, {1}, {2}, {3}, {1,2}, {1,3}, {2,3}, {1,2,3} → 2³ = 8.",
      why: "Avoiding duplicates like {1,2} and {2,1} is the whole trick: you only consider items AFTER the last chosen one, using a `start` index.",
      how: [
        "Combinations: `dfs(start)`; base case when `len(path) == k`; loop `i` from `start` to n-1; recurse with `i + 1`.",
        "Subsets (include/exclude): at index i, either skip nums[i] or take it; base case i == n records the path.",
        "Subsets (loop form): record path at EVERY node, then loop i from start.",
        "Bitmask view: subset ↔ n-bit number from 0 to 2ⁿ - 1; bit j set means nums[j] is included.",
        "Permutation vs combination: permutations loop over ALL unused items; combinations loop only over items after `start`.",
      ],
      visual: {
        kind: 'tree',
        title: 'Include/exclude decision tree for subsets of [1, 2, 3]',
        root: { id: 's', label: '{}', children: [
          { id: 'n1', label: 'skip 1: {}', children: [
            { id: 'n1n2', label: '{}', children: [{ id: 'l0', label: '{}' }, { id: 'l1', label: '{3}' }] },
            { id: 'n1y2', label: '{2}', children: [{ id: 'l2', label: '{2}' }, { id: 'l3', label: '{2,3}' }] },
          ] },
          { id: 'y1', label: 'take 1: {1}', children: [
            { id: 'y1n2', label: '{1}', children: [{ id: 'l4', label: '{1}' }, { id: 'l5', label: '{1,3}' }] },
            { id: 'y1y2', label: '{1,2}', children: [{ id: 'l6', label: '{1,2}' }, { id: 'l7', label: '{1,2,3}' }] },
          ] },
        ] },
        steps: [
          { active: ['s', 'n1', 'y1'], note: 'Decision 1: skip or take 1 → 2 branches.' },
          { active: ['n1n2', 'n1y2', 'y1n2', 'y1y2'], note: 'Decision 2 for element 2 → 4 branches.' },
          { active: ['l0', 'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'], note: 'Decision 3 → 2³ = 8 leaves, one per subset.' },
          { active: ['l3', 'l5', 'l6'], note: 'The leaves with exactly 2 elements are the combinations C(3, 2) = 3: {2,3}, {1,3}, {1,2}.' },
        ],
      },
      code: py`
import math
from itertools import combinations

def combine(nums, k):
    res, path = [], []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1)              # only items AFTER i -> no reordered duplicates
            path.pop()
    dfs(0)
    return res

assert combine([1, 2, 3], 2) == [[1, 2], [1, 3], [2, 3]]
assert len(combine(list(range(5)), 2)) == math.comb(5, 2) == 10
assert [list(c) for c in combinations([1, 2, 3], 2)] == combine([1, 2, 3], 2)

def subsets(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])
            return
        dfs(i + 1)                  # exclude nums[i]
        path.append(nums[i])        # include nums[i]
        dfs(i + 1)
        path.pop()
    dfs(0)
    return res

subs = subsets([1, 2, 3])
assert len(subs) == 2 ** 3
assert sorted(subs) == [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]

def subsets_bitmask(nums):
    n = len(nums)
    return [[nums[j] for j in range(n) if mask >> j & 1] for mask in range(1 << n)]

assert sorted(subsets_bitmask([1, 2, 3])) == sorted(subs)
`,
      codeNotes: [
        "`math.comb(n, k)` computes C(n, k) exactly.",
        "`1 << n` is 2ⁿ; `mask >> j & 1` tests whether bit j is set (`>>` binds tighter than `&`).",
        "Passing `i + 1` (not `start + 1`) is the key detail in combinations.",
      ],
      complexity: {
        time: 'combinations O(k · C(n, k)); subsets O(n · 2ⁿ)',
        space: 'O(n) auxiliary; output O(k · C(n, k)) or O(n · 2ⁿ)',
        derivation: [
          "Subsets: the include/exclude tree has depth n and 2 branches per level → 2ⁿ leaves.",
          "Each leaf copies a path of up to n items → O(n · 2ⁿ).",
          "Combinations produce C(n, k) results, each copied in O(k); the tree's internal nodes add at most a polynomial factor, commonly summarized as O(k · C(n, k)).",
          "Stack depth ≤ n and path ≤ n → O(n) auxiliary.",
        ],
      },
      whenToUse: [
        "\"Choose k\", \"all teams of size k\", \"all subsets / power set\".",
        "n ≤ 20 → 2²⁰ ≈ 10⁶ subsets is feasible.",
        "Counting only? Use the formula C(n, k) or 2ⁿ — don't enumerate.",
      ],
      mistakes: [
        "Looping from 0 instead of `start` → duplicates like [1,2] and [2,1].",
        "Recursing with `start + 1` instead of `i + 1`.",
        "Forgetting the empty subset.",
      ],
      checks: [
        { q: "C(4, 2) equals…", options: ['6', '8', '12', '16'], answer: 0, explain: "4! / (2! · 2!) = 24 / 4 = 6." },
        { q: "What distinguishes the combination loop from the permutation loop?", options: ['Combinations loop from start, permutations over all unused items', 'Combinations use a stack', 'Permutations use start', 'No difference'], answer: 0, explain: "Only moving forward prevents reorderings of the same selection." },
        { q: "How many subsets does [1, 2, 3, 4, 5] have?", options: ['5', '25', '32', '120'], answer: 2, explain: "Each of the 5 elements is in or out: 2⁵ = 32 (120 = 5! counts orderings)." },
      ],
      problems: [78, 46],
      terms: ['combination', 'subset', 'backtracking', 'state'],
      verbal: "\"Each element is either in or out, so there are 2ⁿ subsets; copying each costs up to O(n), giving O(n · 2ⁿ) time. I only move forward with a start index, so I never produce the same set in two orders.\"",
    },
    {
      id: 'duplicates',
      title: 'Repeated elements, unique permutations, and duplicate elimination',
      summary: 'With repeats, n! overcounts — sort and skip equal siblings, or count with a frequency map.',
      what: "When the input has **repeated elements**, naive permutation generation produces duplicates. For [1, 1, 2], the 3! = 6 orderings contain only **3 unique** arrangements: [1,1,2], [1,2,1], [2,1,1].\n\nThe count of unique arrangements of a **multiset** is n! / (c₁! · c₂! · …), where cᵢ are the counts of each distinct value: 3! / (2! · 1!) = 3.\n\nTwo ways to eliminate duplicates:\n\n- **Sort + skip**: sort nums; at each level skip `nums[i]` if it equals `nums[i-1]` and `nums[i-1]` is not used.\n- **Counter-based**: iterate over distinct values with remaining count > 0 — duplicates can never be generated.",
      why: "Generating then de-duplicating with a set wastes work and memory (still n! candidates). Pruning duplicates at the source is the standard expected answer.",
      how: [
        "Counter approach: `count = Counter(nums)`.",
        "At each level, loop over each distinct `value` with `count[value] > 0`.",
        "Choose: `count[value] -= 1; path.append(value)`; recurse; un-choose: pop and `+= 1`.",
        "Because each distinct value is tried at most once per level, two branches never produce the same sequence.",
      ],
      visual: {
        kind: 'tree',
        title: 'Unique permutations of [1, 1, 2] using counts',
        root: { id: 'r', label: '{1:2, 2:1}', children: [
          { id: 'a', label: 'pick 1', children: [
            { id: 'a1', label: 'pick 1', children: [{ id: 'a1x', label: '[1,1,2]' }] },
            { id: 'a2', label: 'pick 2', children: [{ id: 'a2x', label: '[1,2,1]' }] },
          ] },
          { id: 'b', label: 'pick 2', children: [
            { id: 'b1', label: 'pick 1', children: [{ id: 'b1x', label: '[2,1,1]' }] },
          ] },
        ] },
        steps: [
          { active: ['r', 'a', 'b'], note: 'Level 1 offers only the DISTINCT values 1 and 2 — not "first 1" and "second 1" separately.' },
          { active: ['a1', 'a2', 'b1'], note: 'After picking 1, counts are {1:1, 2:1} → two choices. After picking 2, only 1 remains.' },
          { active: ['a1x', 'a2x', 'b1x'], note: '3 leaves = 3!/(2!·1!) — no duplicates were ever generated.' },
        ],
      },
      code: py`
import math
from collections import Counter

def permute_unique(nums):
    res, path = [], []
    count = Counter(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for value in sorted(count):          # distinct values, deterministic order
            if count[value] == 0:
                continue
            count[value] -= 1
            path.append(value)
            dfs()
            path.pop()
            count[value] += 1
    dfs()
    return res

assert permute_unique([1, 1, 2]) == [[1, 1, 2], [1, 2, 1], [2, 1, 1]]

def multiset_perm_count(nums):
    total = math.factorial(len(nums))
    for c in Counter(nums).values():
        total //= math.factorial(c)
    return total

assert multiset_perm_count([1, 1, 2]) == 3
assert len(permute_unique([1, 1, 2, 2])) == multiset_perm_count([1, 1, 2, 2]) == 6

# Sort + skip variant
def permute_unique_sorted(nums):
    nums = sorted(nums)
    res, path, used = [], [], [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:]); return
        for i in range(len(nums)):
            if used[i]:
                continue
            if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                continue                     # skip duplicate sibling
            used[i] = True; path.append(nums[i])
            dfs()
            path.pop(); used[i] = False
    dfs()
    return res

assert permute_unique_sorted([2, 1, 1]) == [[1, 1, 2], [1, 2, 1], [2, 1, 1]]
`,
      codeNotes: [
        "`for value in sorted(count)` iterates over distinct keys; sorting makes output order predictable.",
        "In the sort + skip version, `not used[i - 1]` means: \"an identical value was already tried at THIS position\" — skip it.",
        "`total //= math.factorial(c)` keeps everything as exact integers.",
      ],
      complexity: {
        time: 'O(n · U) where U = number of unique permutations ≤ n!',
        space: 'O(n) auxiliary (+ O(d) for the counter); O(n · U) output',
        derivation: [
          "U = n! / (c₁! c₂! …) leaves are generated, each copied in O(n).",
          "Each tree node loops over at most d distinct values (d ≤ n) → the n factor bounds the per-node work.",
          "In the worst case (all distinct) U = n!, matching ordinary permutations.",
        ],
      },
      whenToUse: [
        "Permutations/combinations of inputs that may contain duplicates.",
        "Counting arrangements of a multiset → use the formula, no enumeration.",
      ],
      mistakes: [
        "Generating all n! and de-duplicating with a set of tuples — correct but wasteful.",
        "Skipping duplicates without sorting first.",
        "Using `used[i - 1]` instead of `not used[i - 1]` — prunes the wrong branches (it can still work, but is harder to reason about).",
      ],
      checks: [
        { q: "How many unique arrangements does 'AAB' have?", options: ['6', '3', '2', '1'], answer: 1, explain: "3! / 2! = 3: AAB, ABA, BAA." },
        { q: "Unique arrangements of the digits of 1122?", options: ['24', '12', '6', '4'], answer: 2, explain: "4! / (2! · 2!) = 6." },
        { q: "Why does the Counter approach never produce duplicates?", options: ['It uses a set', 'At each level, each distinct value is tried at most once', 'It sorts the output', 'Recursion forbids it'], answer: 1, explain: "Identical values are not treated as different choices." },
      ],
      problems: [46, 78],
      terms: ['unique', 'duplicate', 'multiset', 'repeated', 'permutation'],
      verbal: "\"With repeated values I'll iterate over distinct values and their remaining counts, so identical numbers aren't treated as different choices. That generates each unique arrangement exactly once.\"",
    },
    {
      id: 'digit-grouping',
      title: 'Grouping three-digit numbers by digit frequency: enumerate or count?',
      summary: 'Recursion, backtracking, and frequency counting compared on the candidate-reported problem shape.',
      what: "**Candidate-reported problem reconstruction (not an official or verified question):** given a list of three-digit integers, group together numbers whose digits are permutations of each other. Example: [112, 121, 211, 123, 321] → [[112, 121, 211], [123, 321]].\n\nTwo very different mental models:\n\n- **Enumerate**: for each number, generate all permutations of its digits and look for matches. Exponential in digit count, plus extra work to avoid double-grouping.\n- **Canonicalize (frequency count)**: map each number to a 10-slot digit-count tuple (or its sorted digit string) and group in a hash map. One pass.\n\nThe insight: \"is a permutation of\" is an equivalence relation, and the multiset of digits is a perfect canonical key for it.",
      why: "Interviewers love this because \"permutation\" in the prompt tempts you into backtracking. Recognizing that you need to COMPARE permutations, not GENERATE them, turns an exponential idea into O(n · d).",
      how: [
        "Clarify: integers or strings? Exactly three digits (100–999, no leading zeros)? Negative numbers? Output order?",
        "Brute force idea: compare every pair with a Counter check → O(n² · d).",
        "Enumeration idea: generate permutations (d! each) and look up in a set → O(n · d! · d).",
        "Optimal: `key = tuple(digit_counts)`; `groups[key].append(num)` → O(n · d) time.",
        "Test: repeated digits (112), zeros (101 vs 110), a singleton group, all same group, empty input.",
      ],
      visual: {
        kind: 'buckets',
        title: 'Canonical keys (sorted digits shown for readability)',
        steps: [
          { incoming: '112 → "112"', buckets: [{ key: '"112"', items: ['112'] }], note: 'Sorted digits of 112 are "112".' },
          { incoming: '121 → "112", 211 → "112"', buckets: [{ key: '"112"', items: ['112', '121', '211'] }], note: 'Same key → same group.' },
          { incoming: '123 → "123", 321 → "123"', buckets: [{ key: '"112"', items: ['112', '121', '211'] }, { key: '"123"', items: ['123', '321'] }], note: 'Done in one pass: n numbers × d digits.' },
        ],
      },
      code: py`
from collections import Counter, defaultdict
from itertools import permutations

nums = [112, 121, 211, 123, 321]
expected = [[112, 121, 211], [123, 321]]

def normalize(groups):
    return sorted(sorted(g) for g in groups)

# 1) Brute force: pairwise multiset comparison, O(n^2 * d)
def group_brute(nums):
    groups, placed = [], [False] * len(nums)
    for i, a in enumerate(nums):
        if placed[i]:
            continue
        group, placed[i] = [a], True
        for j in range(i + 1, len(nums)):
            if not placed[j] and Counter(str(a)) == Counter(str(nums[j])):
                group.append(nums[j]); placed[j] = True
        groups.append(group)
    return groups

# 2) Enumeration via permutations (what NOT to do), O(n * d! * d)
def group_enumerate(nums):
    remaining = set(nums)
    groups = []
    for n in nums:
        if n not in remaining:
            continue
        arrangements = {int("".join(p)) for p in permutations(str(n)) if p[0] != "0"}
        group = sorted(x for x in arrangements if x in remaining)
        remaining -= set(group)
        groups.append(group)
    return groups

# 3) Canonical frequency key, O(n * d)
def group_counts(nums):
    groups = defaultdict(list)
    for n in nums:
        counts = [0] * 10
        for ch in str(n):
            counts[ord(ch) - ord("0")] += 1
        groups[tuple(counts)].append(n)
    return list(groups.values())

for f in (group_brute, group_enumerate, group_counts):
    assert normalize(f(nums)) == expected
    assert normalize(f([101, 110, 999])) == [[101, 110], [999]]
    assert f([]) == []

# A repeated number exposes the enumeration approach's hidden set logic
assert normalize(group_counts([112, 112, 121])) == [[112, 112, 121]]
assert normalize(group_enumerate([112, 112, 121])) == [[112, 121]]   # lost a duplicate!
`,
      codeNotes: [
        "`ord(ch) - ord('0')` maps '0'…'9' to slots 0…9 (same as `int(ch)`).",
        "group_enumerate assumes distinct input numbers (it uses a set) — another reason it's the weakest option.",
        "`p[0] != '0'` drops arrangements with a leading zero, which are not valid three-digit integers.",
      ],
      complexity: {
        time: 'Brute O(n² · d); enumerate O(n · d! · d); counts O(n · d) — O(n) when d = 3 is fixed',
        space: 'Counts: O(n) keys of 10 slots + O(n) output',
        derivation: [
          "Let n = how many numbers, d = digits per number (3 here).",
          "Brute force: up to n(n-1)/2 pairs × O(d) Counter comparison → O(n² · d).",
          "Enumeration: each number generates d! arrangements of length d → O(d · d!) per number → O(n · d · d!). With d = 3 that's only 6 arrangements, but it doesn't scale to longer numbers.",
          "Counts: each number costs O(d) to count digits + O(10) for the key → O(n · d). With d fixed at 3, that's O(n).",
          "Space: n keys of size 10 (constant) plus n numbers in the output → O(n).",
        ],
      },
      whenToUse: [
        "Whenever the prompt says items are \"permutations/rearrangements/anagrams of each other\" and asks to group, count, or test them.",
        "Enumeration is right only when the output IS the list of arrangements.",
      ],
      mistakes: [
        "Reaching for backtracking because the prompt says \"permutation\".",
        "Using `set(str(n))` as a key: 112 and 122 would collide.",
        "Forgetting to clarify leading zeros or negative numbers.",
      ],
      checks: [
        { q: "Which key groups 112, 121, 211 together but keeps 122 separate?", options: ['set(str(n))', 'sum of digits', "''.join(sorted(str(n)))", 'n % 9'], answer: 2, explain: "Sorted digits preserve counts. A set loses counts; digit sums and n % 9 collide for many non-permutations (e.g. 112 and 400 share digit sum 4)." },
        { q: "With d-digit numbers, the count-key approach is…", options: ['O(n · d!)', 'O(n² · d)', 'O(n · d)', 'O(2ⁿ)'], answer: 2, explain: "One pass over each number's d digits." },
        { q: "Which input does group_enumerate get wrong but group_counts handles?", options: ['[112, 121]', '[112, 112, 121] — a repeated number', '[]', '[999]'], answer: 1, explain: "group_enumerate tracks `remaining` in a set, so the second 112 collapses into the first and is dropped. The count-key version simply appends every number to its bucket." },
      ],
      problems: [49, 46, 242],
      terms: ['permutation', 'canonical-key', 'multiset', 'frequency', 'bucket', 'hashing'],
      verbal: "\"Although the prompt mentions permutations, I don't need to generate any. Two numbers are digit-permutations exactly when their digit counts match, so I'll use a 10-slot count tuple as a hash key — O(n · d) time, which is O(n) for three-digit numbers.\"",
    },
  ],
};
