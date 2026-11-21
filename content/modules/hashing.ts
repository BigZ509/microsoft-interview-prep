import type { Module } from '../types';

const py = String.raw;

export const hashingModule: Module = {
  id: 'hashing',
  number: 4,
  title: 'Hash Maps and Hash Sets',
  priority: 'P0',
  phase: 1,
  blurb: 'How hashing gives average O(1) lookups, what can be a key, and how canonical keys group equivalent objects — the core of Group Anagrams and the reported digit-grouping question.',
  prerequisites: ['python', 'big-o', 'arrays'],
  lessons: [
    {
      id: 'how-hashing-works',
      title: 'Hash functions, buckets, collisions, and average O(1)',
      summary: 'A hash function turns a key into a bucket number so you can jump straight to it.',
      what: "A **hash map** (Python `dict`) stores **key-value pairs**; a **hash set** (`set`) stores keys only. Internally there is an array of **buckets** (slots). A **hash function** turns a key into an integer; `hash(key) % number_of_slots` picks the slot.\n\nA **collision** happens when two different keys map to the same slot. Python resolves collisions by probing other slots (open addressing); other languages chain items in a list per bucket. Either way, as long as keys spread out evenly and the table is resized as it fills, lookups take **average O(1)**.",
      why: "Without hashing, \"have I seen x?\" requires scanning everything (O(n)). Hashing turns it into compute-the-slot-and-check (average O(1)), which is why so many O(n²) brute-force solutions become O(n).",
      how: [
        "Insert `d[key] = value`: compute `hash(key)`, find a slot, store (key, value).",
        "Lookup `d[key]`: compute the same hash, go to the slot, compare keys with `==` until found or an empty slot is hit.",
        "Collisions mean extra comparisons. With a good hash and load factor kept below a threshold (Python resizes at ~2/3 full), the expected number of probes is constant.",
        "Worst case: if every key collided, each lookup would scan O(n) entries.",
        "Hashing a key costs time proportional to the key's size — O(k) for a string of length k (Python caches string hashes after the first time).",
      ],
      visual: {
        kind: 'buckets',
        title: 'Inserting into an 8-slot table (toy hash = length of word % 8)',
        steps: [
          { buckets: [{ key: '0', items: [] }, { key: '1', items: [] }, { key: '2', items: [] }, { key: '3', items: [] }, { key: '4', items: [] }, { key: '5', items: [] }, { key: '6', items: [] }, { key: '7', items: [] }], note: 'An empty table of 8 buckets.' },
          { incoming: 'cat', buckets: [{ key: '3', items: ['cat'] }], note: "toy_hash('cat') = 3 % 8 = 3 → slot 3." },
          { incoming: 'lion', buckets: [{ key: '3', items: ['cat'] }, { key: '4', items: ['lion'] }], note: "toy_hash('lion') = 4 → slot 4." },
          { incoming: 'dog', buckets: [{ key: '3', items: ['cat', 'dog'] }, { key: '4', items: ['lion'] }], note: "'dog' also hashes to 3 → COLLISION. The table must compare keys to tell them apart. A bad hash like this (length) causes many collisions; real hash functions mix every character." },
        ],
      },
      code: py`
def toy_hash(word, slots=8):
    return len(word) % slots          # deliberately bad: many collisions

class ChainedHashSet:
    """Minimal hash set using separate chaining — for intuition only."""
    def __init__(self, slots=8):
        self.buckets = [[] for _ in range(slots)]

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def add(self, key):
        b = self._bucket(key)
        if key not in b:              # scan only this bucket
            b.append(key)

    def contains(self, key):
        return key in self._bucket(key)

s = ChainedHashSet()
for w in ["cat", "dog", "lion"]:
    s.add(w)
assert s.contains("dog") and not s.contains("eel")
assert toy_hash("cat") == toy_hash("dog") == 3    # a collision

# Python's built-in dict and set do this (with probing) for you
d = {"cat": 1}
d["dog"] = 2
assert d.get("dog") == 2 and "eel" not in d
`,
      codeNotes: [
        "`hash(key)` is Python's built-in hash; for strings it is randomized per process, so don't rely on exact values.",
        "The class is for intuition; always use `dict`/`set` in interviews.",
        "`key not in b` scans only one bucket, which is short on average.",
      ],
      complexity: {
        time: 'Insert / lookup / delete: average O(1), worst O(n); plus O(k) to hash a key of size k',
        space: 'O(n) for n stored keys',
        derivation: [
          "With n keys spread across m buckets, the average bucket holds n/m keys (the load factor α).",
          "Resizing keeps α bounded by a constant, so a lookup inspects O(1 + α) = O(1) entries on average.",
          "Resizing copies all n keys (O(n)) but happens geometrically rarely → amortized O(1) per insert.",
          "If all keys land in one bucket, a lookup compares against up to n keys → O(n) worst case.",
        ],
      },
      whenToUse: [
        "Membership tests inside loops.",
        "Mapping values to indices, counts, or groups.",
        "Caching computed results (memoization).",
      ],
      mistakes: [
        "Claiming O(1) worst case — say \"average\".",
        "Ignoring key cost: hashing tuples of length 26 is constant, but hashing a length-k string key is O(k).",
        "Assuming dicts are unordered — Python 3.7+ preserves insertion order (but don't rely on order to define correctness).",
      ],
      checks: [
        { q: "What is a collision?", options: ['Two equal keys', 'Two different keys mapping to the same bucket', 'A KeyError', 'A full table'], answer: 1, explain: "Collisions are inevitable; the table resolves them by probing or chaining." },
        { q: "Why are dict lookups O(1) only on average?", options: ['Python is slow', 'Many colliding keys can force O(n) comparisons in one lookup', 'Keys are sorted', 'Dicts are trees'], answer: 1, explain: "Average-case analysis assumes keys spread evenly across buckets." },
        { q: "Roughly what does Python do when a dict becomes ~2/3 full?", options: ['Raises an error', 'Resizes to a larger table and rehashes keys', 'Sorts the keys', 'Starts chaining'], answer: 1, explain: "Resizing keeps the load factor low, preserving average O(1) operations (amortized)." },
      ],
      problems: [1, 217],
      terms: ['hashing', 'collision', 'bucket', 'key-value-pair', 'set'],
      verbal: "\"A hash map gives average O(1) lookups because the key's hash jumps directly to a bucket; worst case is O(n) with heavy collisions, which is unlikely with integer keys.\"",
    },
    {
      id: 'hashable-keys',
      title: 'Hashable vs. unhashable types, and tuples as keys',
      summary: 'Only values that cannot change can be dictionary keys.',
      what: "An object is **hashable** if it has a hash that never changes during its lifetime and can be compared with `==`. Immutable built-ins are hashable: `int`, `float`, `str`, `bool`, `None`, `frozenset`, and **tuples whose items are all hashable**. Mutable built-ins — `list`, `dict`, `set` — are **unhashable** and raise `TypeError: unhashable type`.\n\nTuples are the standard way to build multi-part keys: `(row, col)`, `(start, end)`, or a 26-element count tuple.",
      why: "If a key could change after insertion, its hash would change and the table could never find it again. So Python forbids mutable keys. In grouping problems you'll compute a list (like counts) and must convert it to a tuple before using it as a key.",
      how: [
        "Compute your key — maybe as a list.",
        "Freeze it: `tuple(counts)`, `''.join(sorted(word))`, or `frozenset(items)`.",
        "Use it: `groups[key].append(item)` or `seen.add(key)`.",
        "Nested tuples are fine as long as every element inside is hashable: `((1, 2), 'a')` yes; `([1], 'a')` no.",
      ],
      code: py`
# Hashable keys
d = {}
d[(2, 3)] = "grid cell"
d["abc"] = 1
d[frozenset({1, 2})] = "unordered pair"
assert d[(2, 3)] == "grid cell" and d[frozenset({2, 1})] == "unordered pair"

# Unhashable keys raise TypeError
try:
    d[[1, 2]] = "list key"
    raised = False
except TypeError:
    raised = True
assert raised

try:
    hash(([1], "a"))              # tuple containing a list is unhashable
    raised = False
except TypeError:
    raised = True
assert raised

# Count list -> tuple key
counts = [0] * 26
for ch in "bob":
    counts[ord(ch) - ord("a")] += 1
key = tuple(counts)
groups = {key: ["bob"]}
assert groups[tuple(counts)] == ["bob"]
`,
      codeNotes: [
        "`try / except TypeError` catches the error so we can assert it happened.",
        "`frozenset` is an immutable set — useful when the key is an unordered collection without duplicates.",
        "A frozenset would be WRONG for anagram keys: frozenset('aab') == frozenset('ab') loses counts. Use a count tuple or a sorted string.",
      ],
      complexity: {
        time: 'tuple(counts) of size 26 is O(1); hashing a tuple/str of length k is O(k)',
        space: 'Each key costs O(size of key)',
        derivation: [
          "Converting a list of length L to a tuple copies L references → O(L).",
          "For a 26-slot alphabet, L = 26 is constant → O(1) per key.",
          "Hashing combines every element → O(L) again, constant when L = 26.",
        ],
      },
      whenToUse: [
        "Grid coordinates as set members: `visited.add((r, c))`.",
        "Composite memo keys: `memo[(i, remaining)]`.",
        "Canonical grouping keys from counts.",
      ],
      mistakes: [
        "`d[counts] = …` with a list — TypeError.",
        "Using `set(word)` or `frozenset(word)` as an anagram key — drops repeated letters.",
        "Mutating an object inside a tuple key (if it were allowed) — which is exactly why it's not.",
      ],
      checks: [
        { q: "Which can be a dict key?", options: ['[1, 2]', '{1: 2}', '(1, (2, 3))', '{1, 2}'], answer: 2, explain: "A tuple of hashable items (including nested tuples) is hashable." },
        { q: "Why is frozenset(word) a bad anagram key?", options: ['It is unhashable', 'It ignores how many times each letter appears', 'It is slow', 'It keeps order'], answer: 1, explain: "'aab' and 'ab' would get the same key even though they are not anagrams." },
        { q: "Are `tuple(sorted(word))` and `''.join(sorted(word))` both valid dictionary keys?", options: ['Only the tuple', 'Only the string', 'Both — a tuple of strings and a string are hashable', 'Neither'], answer: 2, explain: "Both are immutable. The joined string is more compact and is the usual choice." },
      ],
      problems: [49, 200],
      terms: ['hashable', 'immutable', 'canonical-key', 'multiset'],
      verbal: "\"Lists aren't hashable, so I'll convert the 26-slot count list to a tuple before using it as the dictionary key.\"",
    },
    {
      id: 'frequency-maps',
      title: 'Frequency maps, duplicate detection, and hash maps vs. brute force',
      summary: 'Remember what you have seen so you never look for it twice.',
      what: "Three core hash-based moves:\n\n- **Seen set** — `if x in seen` → duplicate detection.\n- **Value → index map** — find a complement in O(1) (Two Sum: `target - x`).\n- **Value → count map** — frequency questions (majority, anagram, top-K).\n\n**Counting arrays vs dictionaries**: arrays are faster and O(1) space for small fixed ranges; dictionaries handle arbitrary keys (negative numbers, large ints, strings).",
      why: "Brute force usually has an inner loop that searches for something. A hash structure answers that search in average O(1), removing the inner loop. Explaining this transformation is the most common optimization story in interviews.",
      how: [
        "Write brute force: \"for each x, scan the rest for what I need.\" Usually O(n²).",
        "Ask: what exactly is the inner loop looking for? (a duplicate, a complement, a count)",
        "Store that in a set/dict as you go.",
        "Check BEFORE inserting when the current element must not pair with itself (Two Sum).",
      ],
      visual: {
        kind: 'array',
        title: 'Two Sum with a complement map: nums = [2, 7, 11, 15], target = 9',
        steps: [
          { cells: [2, 7, 11, 15], pointers: { i: 0 }, vars: { need: '9 - 2 = 7', seen: '{}' }, note: '7 is not in seen. Record 2 → index 0.' },
          { cells: [2, 7, 11, 15], pointers: { i: 1 }, highlight: [0, 1], vars: { need: '9 - 7 = 2', seen: '{2: 0}' }, note: '2 IS in seen at index 0 → answer [0, 1]. One pass.' },
        ],
      },
      code: py`
def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]

def two_sum(nums, target):
    seen = {}                        # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:             # check BEFORE inserting x
            return [seen[need], i]
        seen[x] = i

for f in (two_sum_brute, two_sum):
    assert f([2, 7, 11, 15], 9) == [0, 1]
    assert f([3, 3], 6) == [0, 1]           # duplicates handled
    assert f([3, 2, 4], 6) == [1, 2]        # 3 must not pair with itself

def contains_duplicate(nums):
    return len(set(nums)) != len(nums)

assert contains_duplicate([1, 2, 1]) and not contains_duplicate([1, 2, 3])

# Counting array vs dict: values in 0..9 vs arbitrary values
def counts_small(nums):          # assumes 0 <= x <= 9
    c = [0] * 10
    for x in nums:
        c[x] += 1
    return c

assert counts_small([3, 3, 9])[3] == 2
`,
      codeNotes: [
        "Checking `need in seen` before `seen[x] = i` prevents using the same element twice (e.g. target 6, x = 3 alone).",
        "`len(set(nums)) != len(nums)` is a compact duplicate check, but the explicit loop can stop early.",
      ],
      complexity: {
        time: 'Brute force O(n²); hash map O(n) average',
        space: 'Brute force O(1); hash map O(n)',
        derivation: [
          "Brute force examines n(n-1)/2 pairs → O(n²) time, no extra memory.",
          "Hash version: one pass; each step does one average-O(1) lookup and one insert → O(n).",
          "The map may store up to n - 1 entries before finding the answer → O(n) space.",
          "This is a time-space trade-off: O(n) memory buys an O(n) speed-up factor.",
        ],
      },
      whenToUse: [
        "\"Find two elements that sum to …\" (unsorted) → complement map.",
        "\"Contains duplicate / first repeated\" → seen set.",
        "\"Most frequent / appears more than …\" → count map.",
      ],
      mistakes: [
        "Inserting before checking — pairs an element with itself.",
        "Storing value → index when values repeat and you need ALL indices (store a list).",
        "Using a dict when the problem guarantees sorted input (two pointers give O(1) space).",
      ],
      checks: [
        { q: "In one-pass Two Sum, why check `need in seen` before inserting x?", options: ['Speed', 'To avoid pairing an element with itself', 'Dicts require it', 'To sort the output'], answer: 1, explain: "If target = 2x, inserting first would make x find itself." },
        { q: "Two Sum with a hash map trades…", options: ['O(n) space for O(n) time', 'O(1) space for O(n log n) time', 'correctness for speed', 'nothing'], answer: 0, explain: "The map stores up to n entries, eliminating the inner loop." },
        { q: "When is a counting array better than a dict?", options: ['Always', 'When values are from a small known range', 'For negative numbers', 'For strings of any alphabet'], answer: 1, explain: "Indexes must be small non-negative integers; otherwise use a dict." },
      ],
      problems: [1, 217, 169, 141],
      terms: ['duplicate', 'frequency', 'brute-force', 'target', 'set'],
      verbal: "\"Brute force checks all pairs in O(n²). Instead, for each number I look up its complement in a hash map of values seen so far — O(n) time, O(n) space.\"",
    },
    {
      id: 'canonical-keys',
      title: 'Grouping with canonical keys: Group Anagrams and digit-permutation grouping',
      summary: 'Map every member of an equivalence class to the same key; group by that key.',
      what: "A **canonical representation** (canonical key) is one agreed-upon form that every equivalent object converts to. Two objects are equivalent **if and only if** their canonical keys are equal.\n\nFor anagrams (\"same letters, any order\"), two canonical keys work:\n\n- **Sorted string** — `''.join(sorted(word))`: 'eat', 'tea', 'ate' → 'aet'.\n- **Frequency tuple** — 26 counts: all three → (1, 0, 0, 0, 1, 0, …, 1, …).\n\nBoth capture the word's **multiset** of letters and discard order. The same idea groups **numbers whose digits are permutations of each other** — use 10 digit slots instead of 26 letters.",
      why: "Grouping by pairwise comparison is O(n²) comparisons. A canonical key lets a hash map do the grouping in one pass. The candidate-reported Explore question (grouping numbers by digit permutation) is this exact pattern.",
      how: [
        "Define equivalence precisely: \"same characters with the same counts\".",
        "Pick a canonical key that is equal exactly for equivalent items, and hashable.",
        "For each item: key = canon(item); groups[key].append(item).",
        "Return `list(groups.values())`.",
        "Analyze: n items × cost(canon). Sorted key: O(k log k) each. Count key: O(k + alphabet) each.",
      ],
      visual: {
        kind: 'buckets',
        title: 'Grouping [112, 121, 211, 123, 321, 101, 110] by digit counts',
        steps: [
          { incoming: '112', buckets: [{ key: '0:0 1:2 2:1', items: ['112'] }], note: '112 → counts: two 1s, one 2. New bucket.' },
          { incoming: '121, 211', buckets: [{ key: '0:0 1:2 2:1', items: ['112', '121', '211'] }], note: '121 and 211 produce the SAME count key → same bucket.' },
          { incoming: '123, 321', buckets: [{ key: '0:0 1:2 2:1', items: ['112', '121', '211'] }, { key: '1:1 2:1 3:1', items: ['123', '321'] }], note: 'One each of 1, 2, 3 → a new bucket for 123 and 321.' },
          { incoming: '101, 110', buckets: [{ key: '0:0 1:2 2:1', items: ['112', '121', '211'] }, { key: '1:1 2:1 3:1', items: ['123', '321'] }, { key: '0:1 1:2', items: ['101', '110'] }], note: 'Zeros count as digits: 101 and 110 both have {0, 1, 1}. (011 is not a valid three-digit integer.)' },
        ],
      },
      code: py`
from collections import defaultdict

def group_anagrams_sorted(strs):
    groups = defaultdict(list)
    for w in strs:
        groups["".join(sorted(w))].append(w)        # O(k log k) key
    return list(groups.values())

def group_anagrams_counts(strs):
    groups = defaultdict(list)
    for w in strs:
        counts = [0] * 26
        for ch in w:
            counts[ord(ch) - ord("a")] += 1
        groups[tuple(counts)].append(w)              # O(k) key
    return list(groups.values())

def normalize(groups):
    return sorted(sorted(g) for g in groups)

words = ["eat", "tea", "tan", "ate", "nat", "bat"]
expected = [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]
assert normalize(group_anagrams_sorted(words)) == expected
assert normalize(group_anagrams_counts(words)) == expected
assert normalize(group_anagrams_counts([""])) == [[""]]

# Digit-permutation grouping (candidate-reported style; reconstruction)
def digit_key(n):
    counts = [0] * 10
    for ch in str(n):                 # assumes non-negative integers
        counts[int(ch)] += 1
    return tuple(counts)

def group_by_digits(nums):
    groups = defaultdict(list)
    for n in nums:
        groups[digit_key(n)].append(n)
    return list(groups.values())

result = group_by_digits([112, 121, 211, 123, 321, 101, 110])
assert sorted(sorted(g) for g in result) == [[101, 110], [112, 121, 211], [123, 321]]
`,
      codeNotes: [
        "`str(n)` turns the number into its digit characters; `int(ch)` maps '7' → 7 (the slot index).",
        "Negative numbers would need a decision (ignore the sign? separate groups?) — clarify with the interviewer.",
        "The digit version could also use the sorted string: `''.join(sorted(str(n)))`.",
      ],
      complexity: {
        time: 'Sorted key O(n · k log k); count key O(n · k) (alphabet 26 or 10 is constant)',
        space: 'O(n · k): keys plus the grouped output',
        derivation: [
          "Let n = number of items, k = maximum length (letters or digits).",
          "Sorted key: sorting k characters is O(k log k), joining is O(k) → O(k log k) per item → O(n · k log k) total.",
          "Count key: zero 26 slots O(26), count k characters O(k), tuple O(26) → O(k + 26) = O(k) per item → O(n · k).",
          "For three-digit numbers k = 3 is a constant, so either key makes the whole thing O(n).",
          "Space: n keys (each O(k) for sorted strings or O(26)/O(10) for tuples) + n items in the output → O(n · k).",
          "The count key only wins asymptotically when k is large relative to the alphabet size; for short words the sorted key is often just as fast in practice.",
        ],
      },
      whenToUse: [
        "\"Group items that are equivalent under reordering / some transformation\".",
        "\"Same characters in any order\", \"digits are a permutation of each other\".",
        "Also: grouping shifted strings, grouping by pattern — always ask \"what stays the same within a group?\"",
      ],
      mistakes: [
        "Using `set(word)` as the key (loses counts).",
        "Using a list as the key (unhashable).",
        "Confusing GENERATING permutations (exponential) with GROUPING items that are permutations (linear-ish). You never need to enumerate arrangements to group them.",
        "Forgetting zeros and repeated digits in digit problems (101 vs 110).",
      ],
      checks: [
        { q: "What is the canonical sorted key of 'listen'?", options: ["'listen'", "'eilnst'", "'silent'", "'nstlie'"], answer: 1, explain: "Sorting the letters gives e, i, l, n, s, t." },
        { q: "Group Anagrams with count-tuple keys runs in…", options: ['O(n)', 'O(n · k)', 'O(n · k log k)', 'O(n²)'], answer: 1, explain: "Each word costs O(k) to count; the 26-slot work is constant." },
        { q: "To group numbers whose digits are permutations, do you need to generate permutations?", options: ['Yes, all of them', 'No — compute a canonical digit-count key per number', 'Only for duplicates', 'Yes, with backtracking'], answer: 1, explain: "Equivalence under reordering is captured by the multiset of digits; generating arrangements would be exponential and unnecessary." },
      ],
      problems: [49, 242, 46],
      terms: ['canonical-key', 'anagram', 'multiset', 'permutation', 'bucket'],
      verbal: "\"Two numbers belong together exactly when they have the same digit counts, so I'll map each number to a 10-slot count tuple and group in a hash map. That's O(n · d) for d digits, and O(n) for three-digit numbers.\"",
    },
  ],
};
