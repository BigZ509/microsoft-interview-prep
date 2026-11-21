import type { Module } from '../types';

const py = String.raw;

export const pythonModule: Module = {
  id: 'python',
  number: 1,
  title: 'Fundamental Programming Concepts (Python)',
  priority: 'P0',
  phase: 1,
  blurb: 'The Python mechanics every interview solution leans on: references, mutability, collections, loops, functions, and the built-ins that make solutions short and fast.',
  prerequisites: [],
  lessons: [
    {
      id: 'variables-references',
      title: 'Variables, references, mutability and identity',
      summary: 'A Python variable is a name tag attached to an object — not a box that holds a value.',
      what: "In Python, `x = [1, 2]` creates a list object and attaches the **name** `x` to it. Assignment never copies; it only points a name at an object. Some objects are **mutable** (lists, dicts, sets — they can change in place) and some are **immutable** (int, float, str, tuple, frozenset — any \"change\" creates a new object).\n\nEvery object has an **identity** (`id(obj)`), a **type** (`type(obj)`), and a **value**. `==` compares values; `is` compares identity (same object).",
      why: "Interview bugs very often come from two names pointing at the same mutable object: appending `path` (instead of `path[:]`) in backtracking, building a grid with `[[0] * n] * m`, or mutating an argument the caller still needs. Knowing what is shared lets you predict these bugs before they happen.",
      how: [
        "`a = [1, 2]` creates one list; `b = a` attaches a second name to the same list.",
        "`b.append(3)` mutates that single list — `a` sees `[1, 2, 3]` too, because `a is b`.",
        "`b = b + [4]` builds a brand-new list and re-points `b`; `a` is untouched.",
        "For immutable objects, `s += 'x'` always creates a new string and re-points `s`.",
        "Copy explicitly when you need independence: `a[:]`, `list(a)`, `a.copy()` (shallow) or `copy.deepcopy(a)` (deep).",
      ],
      visual: {
        kind: 'vars',
        title: 'Two names, one list',
        steps: [
          { vars: { a: '→ list#1 [1, 2]' }, note: 'a = [1, 2] — one list object, one name.' },
          { vars: { a: '→ list#1 [1, 2]', b: '→ list#1 (same object)' }, note: 'b = a — no copy is made. a is b is True.' },
          { vars: { a: '→ list#1 [1, 2, 3]', b: '→ list#1 [1, 2, 3]' }, note: 'b.append(3) mutates list#1, so a sees the change.' },
          { vars: { a: '→ list#1 [1, 2, 3]', b: '→ list#2 [1, 2, 3, 4]' }, note: 'b = b + [4] creates list#2. Now a is b is False.' },
        ],
      },
      code: py`
a = [1, 2]
b = a              # alias: same object
b.append(3)
assert a == [1, 2, 3] and a is b

b = b + [4]        # new list; a is unaffected
assert a == [1, 2, 3] and b == [1, 2, 3, 4] and a is not b

# Immutable strings: "modifying" creates a new object
s = "hi"
t = s
s += "!"
assert t == "hi" and s == "hi!"

# The classic grid bug: the inner list is shared m times
bad = [[0] * 3] * 2
bad[0][0] = 9
assert bad == [[9, 0, 0], [9, 0, 0]]      # both rows changed!
good = [[0] * 3 for _ in range(2)]        # a fresh row each iteration
good[0][0] = 9
assert good == [[9, 0, 0], [0, 0, 0]]

# == compares values, "is" compares identity
x, y = [1, 2], [1, 2]
assert x == y and x is not y
`,
      codeNotes: [
        "`b = b + [4]` and `b += [4]` differ for lists: `+=` mutates in place (like `extend`), `+` builds a new list.",
        "`[0] * 3` is fine because ints are immutable; `[[0] * 3] * 2` repeats a reference to one inner list.",
        "`for _ in range(2)` — `_` is a conventional name for a loop variable you never use.",
      ],
      complexity: {
        time: 'Assignment O(1); copying a list of n items O(n)',
        space: 'Aliasing O(1); a shallow copy O(n) extra',
        derivation: [
          "Assignment only stores a reference, so it does not depend on the object's size: O(1).",
          "`a[:]` must create a new list and copy n references: O(n) time and O(n) space.",
          "String concatenation `s + t` builds a new string of length |s| + |t|, so it costs O(|s| + |t|) — repeated `+=` in a loop can become O(n²).",
        ],
      },
      whenToUse: [
        "Copy (`path[:]`) whenever you store a snapshot of a list you will keep mutating — backtracking results.",
        "Mutate in place when the problem says \"modify in-place\" or memory is tight.",
        "Return a new object when the caller should keep the original unchanged.",
      ],
      mistakes: [
        "Appending `path` instead of `path[:]` in backtracking — every stored result ends up as the same (often empty) list.",
        "Using a mutable default argument `def f(x, seen=[])` — the default list is shared across calls.",
        "Using `is` to compare numbers or strings; use `==` for values (`is None` is the one idiomatic exception).",
      ],
      checks: [
        { q: "After `a = [1]; b = a; b.append(2)`, what is `a`?", options: ['[1]', '[1, 2]', '[2]', 'Error'], answer: 1, explain: "`b = a` makes both names point at one list, so appending through `b` is visible through `a`." },
        { q: "Why is `[[0] * 3 for _ in range(2)]` correct while `[[0] * 3] * 2` is buggy?", options: ['The second is slower', 'The second repeats a reference to the same inner list', 'Ints are mutable', 'The first creates a tuple'], answer: 1, explain: "Multiplying an outer list copies references. The comprehension creates a fresh inner list each iteration." },
        { q: "Which of these types are immutable?", options: ['list, dict', 'str, tuple, int', 'set, list', 'dict, set'], answer: 1, explain: "str, tuple, int (and float, frozenset, bool) cannot change after creation." },
      ],
      problems: [206, 46],
      terms: ['reference', 'mutable', 'immutable', 'shallow-copy', 'deep-copy'],
      verbal: "\"In Python, assignment binds a name to an object rather than copying it, so I'll copy the path with path[:] before storing it — otherwise later mutations would change the stored result.\"",
    },
    {
      id: 'collections-basics',
      title: 'Strings, lists, tuples, dicts, sets — indexing and slicing',
      summary: 'Pick the built-in collection whose operations match what your algorithm does most.',
      what: "Python's five core collections:\n\n- **str** — immutable sequence of characters.\n- **list** — mutable, ordered sequence; O(1) index access.\n- **tuple** — immutable, ordered sequence; hashable if its items are.\n- **dict** — mutable mapping key → value; average O(1) lookup.\n- **set** — mutable collection of unique hashable items; average O(1) membership.\n\nSequences (str, list, tuple) support **indexing** `s[i]`, **negative indexing** `s[-1]` (last item), and **slicing** `s[start:stop:step]`, where `stop` is excluded.",
      why: "Choosing the collection is often the whole optimization. `x in my_list` scans every item (O(n)); `x in my_set` hashes once (average O(1)). Slicing is concise but copies, which matters inside loops.",
      how: [
        "Index from the front with 0…n-1, from the back with -1…-n.",
        "Slice `s[a:b]` returns items a through b-1 as a NEW object of the same type (a copy, O(b - a)).",
        "Omitted bounds default to the ends: `s[:3]` first three, `s[3:]` the rest, `s[::-1]` reversed copy.",
        "Use a dict when you need to associate data with a key; a set when you only need \"seen or not\".",
        "Use a tuple when you need an immutable, hashable record — e.g. a dictionary key like `(row, col)`.",
      ],
      visual: {
        kind: 'array',
        title: "Indexing and slicing \"python\"",
        steps: [
          { cells: ['p', 'y', 't', 'h', 'o', 'n'], pointers: { 'i=0': 0, 'i=-1': 5 }, note: "Index 0 is the first char; -1 is the last. len('python') == 6." },
          { cells: ['p', 'y', 't', 'h', 'o', 'n'], window: [1, 3], note: "s[1:4] → 'yth'. Start 1 is included, stop 4 is excluded." },
          { cells: ['p', 'y', 't', 'h', 'o', 'n'], highlight: [0, 2, 4], note: "s[::2] → 'pto' — every second character." },
          { cells: ['n', 'o', 'h', 't', 'y', 'p'], note: "s[::-1] → 'nohtyp' — a reversed COPY; the original string is unchanged." },
        ],
      },
      code: py`
s = "python"
assert s[0] == "p" and s[-1] == "n"
assert s[1:4] == "yth" and s[:2] == "py" and s[::-1] == "nohtyp"

nums = [5, 3, 8]
nums[0] = 7                      # lists are mutable
assert nums == [7, 3, 8]

point = (2, 3)                   # tuple: immutable and hashable
grid_cost = {point: 10}          # tuples can be dict keys
assert grid_cost[(2, 3)] == 10

ages = {"ana": 20}
ages["bo"] = 21                  # insert or overwrite
assert "ana" in ages and "zed" not in ages   # membership checks KEYS

seen = set()
for x in [4, 1, 4]:
    seen.add(x)
assert seen == {1, 4}            # duplicates collapse

# Common trap: {} is an empty DICT, not an empty set
assert type({}) is dict and type(set()) is set
`,
      codeNotes: [
        "`key in some_dict` checks keys, not values. Use `value in d.values()` (O(n)) for values.",
        "`set()` is the only way to write an empty set; `{}` is an empty dict.",
        "Slicing never raises IndexError: `s[10:20]` on a short string is just `''`.",
      ],
      complexity: {
        time: 'Index O(1); slice O(k); list search O(n); dict/set lookup average O(1)',
        space: 'A slice of length k allocates O(k)',
        derivation: [
          "Lists store references in a contiguous array, so `nums[i]` computes an address directly: O(1).",
          "`x in nums` must compare against items one by one until found: O(n) worst case.",
          "A slice copies each of its k elements into a new object: O(k) time and space.",
          "Dict/set hash the key to find a bucket: average O(1), worst case O(n) with many collisions.",
        ],
      },
      whenToUse: [
        "\"Have I seen this before?\" → set.",
        "\"Where/how many times did I see this?\" → dict (value → index or count).",
        "Fixed record or multi-part key → tuple.",
        "Ordered data you append to or index into → list.",
      ],
      mistakes: [
        "Checking membership in a list inside a loop — accidentally O(n²).",
        "Slicing inside a loop (e.g. `s[i:]` each iteration) — each slice copies.",
        "Forgetting that slicing excludes the stop index (`s[0:3]` has 3 characters, indices 0–2).",
      ],
      checks: [
        { q: "What is `'leetcode'[2:5]`?", options: ["'etc'", "'etco'", "'ee'", "'tco'"], answer: 0, explain: "Indices 2, 3, 4 → 'e', 't', 'c'. The stop index 5 is excluded." },
        { q: "Which check is average O(1)?", options: ['x in a_list', 'x in a_set', 'x in a_string', 'x in a_tuple'], answer: 1, explain: "Sets (and dict keys) use hashing. Lists, strings and tuples are scanned linearly." },
        { q: "Why can `(r, c)` be a dict key but `[r, c]` cannot?", options: ['Tuples are faster', 'Lists are mutable and therefore unhashable', 'Lists have no order', 'Dict keys must be strings'], answer: 1, explain: "A key's hash must never change; mutable lists could change, so Python forbids hashing them." },
      ],
      problems: [217, 20, 14],
      terms: ['set', 'key-value-pair', 'hashable', 'immutable'],
      verbal: "\"I'll use a set here because I only need membership, and set lookups are O(1) on average versus O(n) for a list.\"",
    },
    {
      id: 'control-flow',
      title: 'Iteration, nested loops, conditions — range, enumerate, zip, len',
      summary: 'How to loop over exactly what you need, and the built-ins that keep loops clean.',
      what: "A **loop** repeats a block of code. Python's `for` loops iterate over any iterable (list, string, range, dict…). **Conditions** (`if / elif / else`) choose a branch. `break` exits the nearest loop; `continue` skips to its next iteration.\n\nFour built-ins appear in almost every solution:\n\n- `range(start, stop, step)` — integers from start up to (not including) stop.\n- `len(x)` — number of items, O(1) for built-in collections.\n- `enumerate(it)` — yields `(index, item)` pairs.\n- `zip(a, b)` — yields `(a[i], b[i])` pairs, stopping at the shorter input.",
      why: "Loops are where time complexity comes from. Writing them clearly — iterating over items when you need items, over `enumerate` when you need both — avoids off-by-one errors and makes the Big-O obvious.",
      how: [
        "Need only values? `for x in nums:`",
        "Need index and value? `for i, x in enumerate(nums):` (avoids `nums[i]` everywhere).",
        "Walking two sequences in parallel? `for a, b in zip(xs, ys):`",
        "Need indices with custom steps or reverse? `range(len(nums) - 1, -1, -1)` counts down to 0.",
        "Nested loop over all pairs i < j: `for i in range(n): for j in range(i + 1, n):` — n(n-1)/2 iterations.",
      ],
      code: py`
nums = [10, 20, 30]

# enumerate gives (index, value)
pairs = [(i, x) for i, x in enumerate(nums)]
assert pairs == [(0, 10), (1, 20), (2, 30)]

# zip walks sequences in parallel and stops at the shorter one
assert list(zip("abc", [1, 2])) == [("a", 1), ("b", 2)]

# range(stop), range(start, stop), range(start, stop, step)
assert list(range(3)) == [0, 1, 2]
assert list(range(2, 8, 3)) == [2, 5]
assert list(range(len(nums) - 1, -1, -1)) == [2, 1, 0]   # indices in reverse

# Every unordered pair i < j: n*(n-1)/2 iterations
count = 0
for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        count += 1
assert count == 3

# continue skips the rest of an iteration; return exits the whole function
def first_negative(xs):
    for i, x in enumerate(xs):
        if x >= 0:
            continue          # skip to next item
        return i              # found one
    return -1                 # loop finished without returning

assert first_negative([3, -1, -5]) == 1 and first_negative([1, 2]) == -1
`,
      codeNotes: [
        "`[(i, x) for i, x in enumerate(nums)]` is a **list comprehension**: a compact loop that builds a list.",
        "`for i, x in ...` unpacks each 2-tuple into two names.",
        "`range` objects are lazy — `range(10**9)` uses O(1) memory until iterated.",
      ],
      complexity: {
        time: 'One loop over n items O(n); all pairs O(n²)',
        space: 'enumerate/zip/range are lazy: O(1) extra',
        derivation: [
          "A single loop does constant work n times → O(n).",
          "The pair loop runs (n-1) + (n-2) + … + 1 + 0 = n(n-1)/2 times → O(n²). Halving the work does not change the class.",
          "enumerate, zip and range produce items one at a time instead of building lists, so they add O(1) space.",
        ],
      },
      whenToUse: [
        "`enumerate` whenever you'd otherwise write `for i in range(len(nums))` and then `nums[i]`.",
        "`zip` for comparing adjacent items: `for a, b in zip(nums, nums[1:])` (note: the slice copies O(n)).",
        "Reverse `range` for right-to-left fills like Merge Sorted Array.",
      ],
      mistakes: [
        "Off-by-one with `range(n)` vs `range(n + 1)` — say out loud whether the stop is included (it never is).",
        "Modifying a list while iterating over it — iterate over a copy or build a new list.",
        "Assuming nested loops are always O(n²): if the inner loop's total work is bounded across all outer iterations, it can be O(n) (see Big-O → Amortized).",
      ],
      checks: [
        { q: "What does `list(range(1, 10, 4))` produce?", options: ['[1, 5, 9]', '[1, 5]', '[1, 4, 8]', '[1, 5, 9, 13]'], answer: 0, explain: "Start at 1, step 4: 1, 5, 9. The next value, 13, is past the stop (10)." },
        { q: "`list(zip([1, 2, 3], 'ab'))` is…", options: ["[(1, 'a'), (2, 'b'), (3, None)]", "[(1, 'a'), (2, 'b')]", 'Error', "[(1, 2, 3), ('a', 'b')]"], answer: 1, explain: "zip stops at the shortest input." },
        { q: "How many iterations does `for i in range(n): for j in range(i + 1, n)` run?", options: ['n', 'n²', 'n(n-1)/2', 'n log n'], answer: 2, explain: "It visits every unordered pair once: (n-1) + (n-2) + … + 0 = n(n-1)/2, which is O(n²)." },
      ],
      problems: [1, 1768, 88],
      terms: ['traversal', 'off-by-one', 'adjacent'],
      verbal: "\"I'll iterate with enumerate so I have both the index and the value; this is a single pass, so it's O(n) time.\"",
    },
    {
      id: 'functions-scope',
      title: 'Functions, parameters, scope, and in-place vs. returning new',
      summary: 'What a function receives, what it can change, and what it hands back.',
      what: "A **function** packages logic: `def area(w, h): return w * h`. **Parameters** are the names in the definition (`w`, `h`); **arguments** are the values passed at a call (`area(3, 4)`). A function without `return` returns `None`.\n\n**Scope** is where a name is visible. Names assigned inside a function are **local** and disappear when the call ends (their lifetime). A nested function can read names from its enclosing function; to rebind them it needs `nonlocal`.\n\nPython passes **references to objects**. A function can mutate a mutable argument (the caller sees it) but rebinding the parameter name does not affect the caller.",
      why: "Interview problems say either \"modify in-place\" (return nothing; change the input) or \"return a new …\". Mixing these up is an instant wrong answer. Nested helper functions (DFS, backtracking) rely on enclosing-scope variables, so scope rules matter constantly.",
      how: [
        "When called, Python creates a new frame with the parameters bound to the argument objects.",
        "`nums.append(x)` inside the function mutates the caller's list (same object).",
        "`nums = nums + [x]` inside the function rebinds the local name only.",
        "`return value` ends the call and hands back value; the frame's locals are discarded.",
        "Nested `def dfs(...)` can read outer variables; use `nonlocal best` before `best = ...` to update an outer variable.",
      ],
      code: py`
def add_in_place(nums, x):
    nums.append(x)          # mutates the caller's list
    # implicitly returns None

def add_copy(nums, x):
    return nums + [x]       # new list; caller's list untouched

a = [1]
assert add_in_place(a, 2) is None and a == [1, 2]
b = add_copy(a, 3)
assert a == [1, 2] and b == [1, 2, 3]

def rebind(nums):
    nums = [99]             # only rebinds the local name
r = [1]
rebind(r)
assert r == [1]

# sorted() returns new; .sort() is in-place and returns None
data = [3, 1, 2]
assert sorted(data) == [1, 2, 3] and data == [3, 1, 2]
assert data.sort() is None and data == [1, 2, 3]

# Enclosing scope + nonlocal (pattern used by DFS helpers)
def longest_run(xs):
    best = 0
    def visit(i, run):
        nonlocal best             # we rebind best below
        best = max(best, run)
        if i < len(xs) and xs[i] == 1:
            visit(i + 1, run + 1)
    for start in range(len(xs)):
        visit(start, 0)
    return best

assert longest_run([1, 1, 0, 1]) == 2
`,
      codeNotes: [
        "`nonlocal best` tells Python `best` refers to the enclosing function's variable. Without it, `best = …` would create a new local and raise UnboundLocalError on the read inside `max`.",
        "Mutating an enclosing list (`res.append(...)`) does NOT need `nonlocal` — you are not rebinding the name.",
        "LeetCode's \"Do not return anything, modify nums1 in-place instead\" signature means: mutate, and return None.",
      ],
      complexity: {
        time: 'A call itself is O(1) overhead; the body determines the cost',
        space: 'Each active call holds one stack frame — matters for recursion depth',
        derivation: [
          "Passing an argument copies a reference, not the object: O(1) regardless of size.",
          "`nums + [x]` copies n items → O(n) time and space; `nums.append(x)` is amortized O(1).",
          "Each active (not yet returned) call keeps its frame alive, so recursion depth d costs O(d) stack space.",
        ],
      },
      whenToUse: [
        "In-place: when the prompt says so, or to achieve O(1) extra space.",
        "Return new: when the input must stay unchanged or the output has a different shape.",
        "Nested helpers: recursive DFS/backtracking that share a result list or best-so-far value.",
      ],
      mistakes: [
        "Writing `nums = sorted(nums)` inside an in-place function — rebinds locally; the caller's list is unchanged.",
        "Returning `data.sort()` — that returns None.",
        "Forgetting `nonlocal` when updating an outer counter inside a nested function.",
      ],
      checks: [
        { q: "What does `[3, 1].sort()` evaluate to?", options: ['[1, 3]', 'None', '[3, 1]', 'Error'], answer: 1, explain: ".sort() sorts in place and returns None. Use sorted() if you need the new list as a value." },
        { q: "In a nested DFS helper, which line needs `nonlocal count`?", options: ['res.append(x)', 'count += 1', 'print(count)', 'return count'], answer: 1, explain: "`count += 1` rebinds the name. Reading or mutating via methods does not need nonlocal." },
        { q: "A function receives a list and executes `lst = lst[::-1]`. Does the caller's list change?", options: ['Yes, reversed', 'No — the local name is rebound to a new list', 'Yes, emptied', 'It raises an error'], answer: 1, explain: "Slicing creates a new list and rebinding a parameter never affects the caller. `lst.reverse()` or `lst[:] = lst[::-1]` would mutate it." },
      ],
      problems: [88, 206],
      terms: ['in-place', 'mutable', 'reference', 'state'],
      verbal: "\"The prompt asks for in-place, so I'll mutate nums1 directly and not return anything; extra space stays O(1).\"",
    },
    {
      id: 'builtins',
      title: 'sorted() vs .sort(), ord()/chr(), dict.get() and setdefault()',
      summary: 'Small built-ins that show up in nearly every hashing and string solution.',
      what: "- `sorted(iterable, key=..., reverse=...)` — returns a **new** sorted list from any iterable (even a string). O(n log n).\n- `list.sort(key=..., reverse=...)` — sorts a list **in place**, returns None. Same O(n log n), avoids an extra copy of the output.\n- `ord(ch)` — the integer code point of a character (`ord('a') == 97`). `chr(i)` — the reverse.\n- `d.get(key, default)` — value for key, or default if missing; never raises KeyError and never inserts.\n- `d.setdefault(key, default)` — returns `d[key]`, inserting `default` first if key is missing.",
      why: "`ord(c) - ord('a')` maps 'a'…'z' to 0…25 so a fixed list of 26 counters can replace a dictionary. `get`/`setdefault` remove the \"if key not in d\" boilerplate. Sorting with a `key` function is how you sort intervals by start or words by length.",
      how: [
        "Letter → slot: `idx = ord(ch) - ord('a')` (0 for 'a', 25 for 'z').",
        "Digit character → value: `int(ch)` or `ord(ch) - ord('0')`. Digit of a number: `n % 10`, then `n //= 10`.",
        "Count with get: `counts[x] = counts.get(x, 0) + 1`.",
        "Group with setdefault: `groups.setdefault(key, []).append(word)`.",
        "Sort with a key: `intervals.sort(key=lambda iv: iv[0])` sorts by start.",
      ],
      code: py`
# sorted() works on any iterable and returns a NEW list
assert sorted("bca") == ["a", "b", "c"]
assert "".join(sorted("bca")) == "abc"           # canonical form of a word
words = ["ccc", "a", "bb"]
assert sorted(words, key=len) == ["a", "bb", "ccc"]
assert sorted([3, 1, 2], reverse=True) == [3, 2, 1]

# ord/chr: letters to 0..25 slots
assert ord("a") == 97 and chr(98) == "b"
assert ord("c") - ord("a") == 2

def letter_counts(word):
    counts = [0] * 26
    for ch in word:
        counts[ord(ch) - ord("a")] += 1
    return counts

assert letter_counts("abca")[:3] == [2, 1, 1]

# dict.get: read with a default, no insertion
counts = {}
for x in [5, 5, 7]:
    counts[x] = counts.get(x, 0) + 1
assert counts == {5: 2, 7: 1} and counts.get(9) is None and 9 not in counts

# dict.setdefault: insert-if-missing, then use the stored value
groups = {}
for w in ["eat", "tea", "tan"]:
    groups.setdefault("".join(sorted(w)), []).append(w)
assert groups == {"aet": ["eat", "tea"], "ant": ["tan"]}

# Sorting intervals by start time
intervals = [[5, 6], [1, 3], [2, 4]]
intervals.sort(key=lambda iv: iv[0])
assert intervals == [[1, 3], [2, 4], [5, 6]]
`,
      codeNotes: [
        "`lambda iv: iv[0]` is a tiny anonymous function: \"given iv, return iv[0]\".",
        "`''.join(list_of_strings)` concatenates in O(total length) — the right way to build strings.",
        "`setdefault(key, [])` creates a new empty list object on every call even when the key exists (it's just discarded). `defaultdict(list)` avoids that and reads more cleanly.",
      ],
      complexity: {
        time: 'sorted/.sort O(n log n); ord/chr O(1); get/setdefault average O(1)',
        space: 'sorted O(n) new list; .sort O(n) worst-case auxiliary (Timsort merge buffer)',
        derivation: [
          "Python uses Timsort: O(n log n) comparisons worst case, O(n) when data is already sorted.",
          "sorted() must allocate the output list (O(n)); .sort() reuses the list but Timsort may still use up to n/2 temporary slots.",
          "Sorting a word of length k costs O(k log k); joining it back is O(k).",
          "get/setdefault perform one hash lookup: average O(1) for small keys like ints or short strings.",
        ],
      },
      whenToUse: [
        "`sorted(word)` as a canonical key when you need \"same letters in any order\" (O(k log k) per word).",
        "26-slot counts via `ord` when input is guaranteed lowercase English letters (O(k) per word).",
        "`.sort()` when you own the list and don't need the original order.",
      ],
      mistakes: [
        "`ord(ch) - ord('a')` on uppercase or non-letters gives an out-of-range or negative index — check the constraints.",
        "Assuming `sorted()` is O(n). Comparison sorting is Ω(n log n) in general.",
        "Using `d[key]` on a missing key (KeyError) when you meant `d.get(key, 0)`.",
      ],
      checks: [
        { q: "What does `''.join(sorted('tea'))` return?", options: ["'tea'", "'aet'", "['a','e','t']", "'eat'"], answer: 1, explain: "sorted('tea') → ['a','e','t']; join glues them into 'aet' — the canonical key for its anagram group." },
        { q: "`ord('z') - ord('a')` equals…", options: ['26', '25', '122', '97'], answer: 1, explain: "Letters are consecutive code points, so 'z' is 25 positions after 'a'. That's why 26 slots (0–25) suffice." },
        { q: "Which call reads a missing key WITHOUT inserting it?", options: ['d.setdefault(k, 0)', 'd.get(k, 0)', 'd[k]', 'd.update({k: 0})'], answer: 1, explain: "get returns the default without modifying the dict. setdefault inserts; d[k] raises KeyError if missing." },
      ],
      problems: [242, 49, 56, 1200],
      terms: ['canonical-key', 'sorted', 'stable-ordering', 'lexicographical-order'],
      verbal: "\"I'll map each letter to an index with ord(c) - ord('a'), which assumes lowercase input — I'd confirm that constraint first.\"",
    },
    {
      id: 'collections-module',
      title: 'Counter, defaultdict, deque, and heapq',
      summary: 'Four library tools that turn common patterns into one line — and when each is the right choice.',
      what: "From `collections` and `heapq`:\n\n- **Counter(iterable)** — dict subclass mapping item → count. Missing keys read as 0.\n- **defaultdict(factory)** — dict that creates `factory()` for a missing key on first access: `defaultdict(int)` for counts, `defaultdict(list)` for grouping.\n- **deque** — double-ended queue: O(1) `append`, `appendleft`, `pop`, `popleft`.\n- **heapq** — functions that treat a plain list as a **min-heap**: `heappush`, `heappop` O(log n), `heapq.heapify(list)` O(n), smallest at `h[0]`.",
      why: "These replace hand-written boilerplate with tested, efficient code. The critical performance fact: `list.pop(0)` shifts every element (O(n)), while `deque.popleft()` is O(1) — that difference decides whether BFS is O(V + E) or quadratic.",
      how: [
        "Count: `Counter(s)`; compare multisets with `Counter(a) == Counter(b)`; top items with `.most_common(k)`.",
        "Group: `g = defaultdict(list)`; `g[key].append(item)` — no existence check needed.",
        "Queue: `q = deque([start])`; `while q: node = q.popleft()`.",
        "Heap: `heapq.heappush(h, x)`; `heapq.heappop(h)` returns the smallest. For a max-heap, push `-x`.",
        "Tuples in heaps compare element by element: `(priority, item)` pops the lowest priority first.",
      ],
      code: py`
from collections import Counter, defaultdict, deque
import heapq

# Counter: frequency map in one line
c = Counter("banana")
assert c["a"] == 3 and c["z"] == 0            # missing keys read as 0
assert Counter("listen") == Counter("silent")  # same multiset of letters
assert c.most_common(1) == [("a", 3)]

# defaultdict(list): grouping without "if key not in d"
groups = defaultdict(list)
for word in ["eat", "tea", "ate", "bat"]:
    groups["".join(sorted(word))].append(word)
assert dict(groups) == {"aet": ["eat", "tea", "ate"], "abt": ["bat"]}

# defaultdict(int): counting
freq = defaultdict(int)
for d in [1, 1, 2]:
    freq[d] += 1
assert freq == {1: 2, 2: 1}

# deque: O(1) at both ends
q = deque([1, 2])
q.append(3)          # right end
q.appendleft(0)      # left end
assert q.popleft() == 0 and q.pop() == 3 and list(q) == [1, 2]

# heapq: min-heap on a plain list
h = []
for x in [5, 1, 4]:
    heapq.heappush(h, x)
assert h[0] == 1                               # smallest is always h[0]
assert [heapq.heappop(h) for _ in range(3)] == [1, 4, 5]

# max-heap by negation
mx = [-x for x in [5, 1, 4]]
heapq.heapify(mx)                              # O(n)
assert -heapq.heappop(mx) == 5
`,
      codeNotes: [
        "`Counter` equality ignores order — exactly the definition of an anagram check.",
        "Reading a missing key from a `defaultdict` INSERTS it. Use `key in d` when you only want to test existence.",
        "`heapq` has no max-heap; negate numbers on the way in and out.",
      ],
      complexity: {
        time: 'Counter(n items) O(n); defaultdict ops avg O(1); deque ends O(1); heappush/heappop O(log n); heapify O(n)',
        space: 'Proportional to the number of stored items',
        derivation: [
          "Counter does one average-O(1) dict update per item → O(n).",
          "deque is a linked block structure, so removing from the left does not shift elements: O(1).",
          "A heap is a complete binary tree of height ⌊log₂ n⌋; push/pop move one item along one root-to-leaf path → O(log n).",
          "heapify sifts down from the bottom; the total work sums to O(n), cheaper than n pushes (O(n log n)).",
        ],
      },
      whenToUse: [
        "Counter: anagram checks, majority element, \"most frequent\" questions.",
        "defaultdict(list): grouping (Group Anagrams, adjacency lists).",
        "deque: BFS, sliding windows of timestamps (Number of Recent Calls).",
        "heapq: top-K, k-th largest, always-process-the-smallest-next (Dijkstra, scheduling).",
      ],
      mistakes: [
        "Using `list.pop(0)` for a queue — O(n) per pop.",
        "Expecting `heapq` to keep the whole list sorted — only `h[0]` is guaranteed smallest.",
        "Accidentally creating keys by reading `dd[key]` in an `if` check on a defaultdict.",
      ],
      checks: [
        { q: "Why prefer `deque.popleft()` over `list.pop(0)` in BFS?", options: ['It returns the last item', 'It is O(1) instead of O(n)', 'Lists cannot hold nodes', 'deque sorts items'], answer: 1, explain: "list.pop(0) shifts every remaining element left; deque removes from the left end in constant time." },
        { q: "After `h = [5, 2, 8]; heapq.heapify(h)`, what is guaranteed?", options: ['h == [2, 5, 8]', 'h[0] == 2', 'h[-1] == 8', 'h is unchanged'], answer: 1, explain: "heapify only guarantees the heap property; the smallest item is at index 0. The rest is not necessarily sorted." },
        { q: "What does `Counter('aab') == Counter('aba')` return?", options: ['True', 'False', 'Error', "Counter({'a': 2})"], answer: 0, explain: "Both contain two a's and one b. Counter comparison ignores order." },
      ],
      problems: [242, 49, 933, 215],
      terms: ['frequency', 'queue', 'heap', 'priority-queue', 'multiset'],
      verbal: "\"I'll use a deque because I'm popping from the front repeatedly; popleft is O(1), whereas list.pop(0) would make this quadratic.\"",
    },
  ],
};
