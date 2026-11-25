import type { BlindItem } from './types';

const py = String.raw;

/**
 * Blind assessments (scope correction §3): the statement never names the pattern, the data
 * structure or the difficulty. Reported / historical questions are reworded so that recognising a
 * LeetCode title does not give the approach away. Every `solution` runs under tests.
 *
 * `unlock` = the day the needed concepts are taught. Daily selection (lib/plan.ts) only serves an
 * item on a LATER day, so it is retrieval practice, not a repeat of that day's lesson.
 */

/** The approach choices shown to the learner. `answer.structure` must be one of these. */
export const BLIND_APPROACHES = [
  'Hash map (dict)',
  'Hash set',
  'Two pointers',
  'Sliding window',
  'Stack',
  'Queue / deque',
  'Linked-list pointer rewiring',
  'Recursion / tree DFS',
  'Backtracking',
  'Sorting first',
  'Binary search',
  'Prefix sums + hash map',
  'Heap',
  'Plain loop / math (no extra structure)',
] as const;

/** Generic characteristic prompts — they never reveal the answer, they only make you look. */
export const CHARACTERISTIC_PROMPTS = [
  'Is the input sorted, or would sorting help (and is it allowed)?',
  'Am I asked whether something exists, how many, which one, all of them, or the longest/shortest?',
  'Is the relationship about pairs, contiguous runs, matching open/close, arrival order, or neighbours?',
  'What does each element need to know about the elements before it?',
  'Constraints: size of n, extra space allowed, in-place, must keep order, value range?',
  'Is the input linked (lists, trees) so that I move by references, not indices?',
];

export const blindItems: BlindItem[] = [
  // -------------------------------------------------------------------------------- reported
  {
    id: 'step-goal', codename: 'Step goal',
    statement: 'A fitness app stores the number of steps for each day in a list. Given a daily goal for a two-day challenge, return the positions of two different days whose step counts add up exactly to the goal. Exactly one such pair exists. The list is in the order the days happened.',
    examples: ['steps = [4200, 7100, 2900, 5800], goal = 10000 → [1, 2]', 'steps = [5000, 5000], goal = 10000 → [0, 1]'],
    constraints: ['2 ≤ n ≤ 100,000', 'Step counts can repeat', 'Return positions, not counts'],
    unlock: '2026-11-21', evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: Two Sum (LC 1), reworded',
    answer: {
      pattern: 'Complement lookup in a hash map', difficulty: 'Easy',
      signals: ['"two different days … add up exactly" → a pair with a target sum', 'Unsorted, and positions must be returned → sorting would lose the original positions', 'n up to 100,000 → O(n²) pair checks are too slow', 'Each day only needs to know whether its complement appeared earlier'],
      structure: 'Hash map (dict)',
      brute: { idea: 'Check every pair of days (i < j).', time: 'O(n²)', space: 'O(1)' },
      bottleneck: 'For each day the inner loop searches for one specific value (goal − steps[i]). Repeated search is the bottleneck.',
      optimized: { idea: 'Scan once, storing value → position in a dict. For each day, look up goal − steps[j] before inserting.', time: 'O(n)', space: 'O(n)' },
      edgeCases: ['Equal values ([5000, 5000]) — look up before inserting so a day does not pair with itself', 'Pair uses the first and last days', 'Negative numbers would not break it (not possible here, but the method still works)'],
      solution: py`
def two_days(steps, goal):
    seen = {}
    for j, s in enumerate(steps):
        if goal - s in seen:
            return [seen[goal - s], j]
        seen[s] = j
    return []

assert two_days([4200, 7100, 2900, 5800], 10000) == [1, 2]
assert two_days([5000, 5000], 10000) == [0, 1]
assert two_days([1, 2, 3, 9], 10) == [0, 3]
`,
      problem: 1, lessons: ['hashing/frequency-maps', 'solving/brute-to-optimal'],
    },
    hints: ['What is the simplest correct answer, and what does it cost for 100,000 days?', 'For one particular day, which single value would complete the pair?', 'Could you remember every day you have already seen so that question takes O(1)?'],
    followUp: 'Now the list is sorted by step count and you must use O(1) extra memory. What changes?',
  },
  {
    id: 'budget-tickets', codename: 'Ticket budget',
    statement: 'Concert ticket prices are listed from cheapest to most expensive (equal prices may appear). Given a budget, return the positions of two tickets whose prices add up exactly to the budget, using only a constant amount of extra memory. First explain the approach in words, then code it.',
    examples: ['prices = [15, 20, 35, 50, 80], budget = 70 → [1, 3]', 'prices = [10, 10, 30], budget = 20 → [0, 1]'],
    constraints: ['2 ≤ n ≤ 100,000', 'Prices are in non-decreasing order', 'O(1) extra space', 'Exactly one answer'],
    unlock: '2026-11-23', evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: the Two Sum follow-up ("if the array is sorted…"); the candidate only had to explain it',
    answer: {
      pattern: 'Opposite-direction two pointers on sorted input', difficulty: 'Medium',
      signals: ['Sorted (non-decreasing) input', 'A pair with a target sum', 'O(1) extra space rules out a dict', 'Moving one end changes the sum in a known direction'],
      structure: 'Two pointers',
      brute: { idea: 'Check every pair; or for each price binary-search for budget − price.', time: 'O(n²), or O(n log n) with binary search', space: 'O(1)' },
      bottleneck: 'Brute force re-examines pairs that sorted order already rules out: if the smallest + largest is too big, the largest can never be part of the answer.',
      optimized: { idea: 'lo at the start, hi at the end. Sum too small → lo += 1; too big → hi −= 1; equal → done. Each step discards one ticket permanently.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Equal prices ([10, 10])', 'Answer at both ends', 'Two-element list'],
      solution: py`
def ticket_pair(prices, budget):
    lo, hi = 0, len(prices) - 1
    while lo < hi:
        total = prices[lo] + prices[hi]
        if total == budget:
            return [lo, hi]
        if total < budget:
            lo += 1
        else:
            hi -= 1
    return []

assert ticket_pair([15, 20, 35, 50, 80], 70) == [1, 3]
assert ticket_pair([10, 10, 30], 20) == [0, 1]
assert ticket_pair([1, 2], 3) == [0, 1]
`,
      problem: 167, lessons: ['two-pointers/opposite', 'solving/characteristics'],
    },
    hints: ['A dictionary would work — but what does the memory limit say about it?', 'Look at the cheapest and the most expensive ticket together. If their sum is too large, what do you learn about the most expensive one?', 'Each comparison can safely rule out one ticket for good. Which one, in each case?'],
    followUp: 'Why is it safe to discard the most expensive ticket when the sum is too large? State the invariant.',
  },
  {
    id: 'legacy-years', codename: 'Legacy year codes',
    statement: 'An old archive labels years with the symbols I=1, V=5, X=10, L=50, C=100, D=500, M=1000. Symbols are normally written largest to smallest and added. When a smaller symbol is written immediately before a larger one, it is subtracted instead (IV = 4, XC = 90, CM = 900). Convert a valid label to its number.',
    examples: ['"MCMXCIV" → 1994', '"LVIII" → 58', '"IX" → 9'],
    constraints: ['1 ≤ length ≤ 15', 'The label is always valid', 'Value is between 1 and 3999'],
    unlock: '2026-11-25', evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: Roman to Integer (LC 13), reworded',
    answer: {
      pattern: 'Lookup table + one pass with a look-ahead', difficulty: 'Easy',
      signals: ['A fixed mapping from symbol to value → a small dict', 'The add/subtract decision depends only on the NEXT symbol → one pass with a look-ahead', 'Short input; no search or ordering problem'],
      structure: 'Hash map (dict)',
      brute: { idea: 'Special-case every subtractive pair (IV, IX, XL, XC, CD, CM) with string replacement, then add.', time: 'O(n)', space: 'O(n) for the replaced string' },
      bottleneck: 'Not speed — the special-casing is error-prone. A general rule (compare with the next symbol) replaces six cases.',
      optimized: { idea: 'For each symbol, subtract its value if the next symbol is larger, otherwise add it.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Single symbol ("I")', 'Subtractive pair at the end ("IX")', 'Repeated symbols ("III")', 'Several subtractive pairs ("MCMXCIV")'],
      solution: py`
VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}

def label_to_year(label):
    total = 0
    for i, ch in enumerate(label):
        v = VALUES[ch]
        if i + 1 < len(label) and VALUES[label[i + 1]] > v:
            total -= v
        else:
            total += v
    return total

assert label_to_year("MCMXCIV") == 1994
assert label_to_year("LVIII") == 58
assert label_to_year("IX") == 9
assert label_to_year("I") == 1 and label_to_year("III") == 3
`,
      problem: 13, lessons: ['solving/characteristics', 'hashing/frequency-maps'],
    },
    hints: ['How will you get the value of one symbol without a chain of if-statements?', 'Look at IV and VI. What tells you whether I is added or subtracted?', 'Compare each symbol only with the one right after it.'],
    followUp: 'How would you validate the label (reject "IIII" or "IC")? What extra rules would you need?',
  },
  {
    id: 'playlist-merge', codename: 'Playlist merge',
    statement: 'Two playlists are stored as chains of song objects; each song has a duration and a reference to the next song (or None). Each chain is already ordered from shortest to longest. Combine them into one chain ordered the same way, reusing the existing song objects rather than creating new ones, and return its first song.',
    examples: ['1 → 4 → 9 and 2 → 3 → 10 → 1 → 2 → 3 → 4 → 9 → 10', 'empty and 5 → 6 → 5 → 6'],
    constraints: ['0 ≤ total songs ≤ 1,000', 'Do not allocate new song objects (a single helper object is fine)'],
    unlock: '2026-11-24', evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: Merge Two Sorted Lists (LC 21), reworded',
    answer: {
      pattern: 'Merge with a dummy head and a tail pointer', difficulty: 'Easy',
      signals: ['"chains … reference to the next" → a linked list; move by references', 'Both inputs already ordered → compare only the two current heads', 'Reuse objects → rewire .next instead of copying values', 'Either list may be empty'],
      structure: 'Linked-list pointer rewiring',
      brute: { idea: 'Copy all durations into a Python list, sort it, and build a new chain.', time: 'O((n + m) log(n + m))', space: 'O(n + m) — and it creates new objects, which breaks the constraint' },
      bottleneck: 'Sorting ignores that both chains are already ordered; the smallest remaining song is always one of the two current heads.',
      optimized: { idea: 'A dummy node and a tail pointer. Repeatedly attach the smaller head, advance that list, and finally attach whatever remains.', time: 'O(n + m)', space: 'O(1)' },
      edgeCases: ['One or both lists empty', 'Equal durations', 'One list much longer — attach the remainder in one step'],
      solution: py`
class Song:
    def __init__(self, d, nxt=None):
        self.d, self.next = d, nxt

def chain(values):
    head = None
    for v in reversed(values):
        head = Song(v, head)
    return head

def durations(node):
    out = []
    while node:
        out.append(node.d)
        node = node.next
    return out

def merge(a, b):
    dummy = tail = Song(0)
    while a and b:
        if a.d <= b.d:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next

assert durations(merge(chain([1, 4, 9]), chain([2, 3, 10]))) == [1, 2, 3, 4, 9, 10]
assert durations(merge(None, chain([5, 6]))) == [5, 6]
assert durations(merge(None, None)) == []
x = chain([1])
assert merge(x, chain([2])) is x                     # reused, not copied
`,
      problem: 21, lessons: ['linked-lists/dummy-merge'],
    },
    hints: ['Which two songs could possibly be the shortest one remaining?', 'Building the result needs a place to start before you know the first song. What helper avoids special-casing the first attach?', 'When one chain runs out, how much work is left?'],
    followUp: 'Now merge k playlists. What is the cost of merging them one at a time, and how could a heap help?',
  },
  {
    id: 'detach-cars', codename: 'Train cars',
    statement: 'A train is a chain of car objects; each car has a cargo label and a reference to the next car. Detach every car whose cargo label equals a given label (the engine at the front may be one of them) and return the new front car, or None if no cars remain.',
    examples: ['coal → ore → coal → wood, remove "coal" → ore → wood', 'coal → coal, remove "coal" → None'],
    constraints: ['0 ≤ cars ≤ 10,000', 'O(1) extra memory'],
    unlock: '2026-11-26', evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: "remove a node from a linked list" (variant unspecified) — here, remove by value (LC 203)',
    answer: {
      pattern: 'Dummy node + unlink (prev.next = prev.next.next)', difficulty: 'Easy',
      signals: ['Chain of objects with next references → linked list', 'The front may be removed → the head can change', 'Consecutive matches are possible', 'O(1) memory → rewire, do not rebuild'],
      structure: 'Linked-list pointer rewiring',
      brute: { idea: 'Collect the labels you keep into a Python list and build a new chain.', time: 'O(n)', space: 'O(n) — violates the memory limit' },
      bottleneck: 'The extra list is unnecessary: removal only needs a pointer to the car BEFORE the one being removed.',
      optimized: { idea: 'Put a dummy car before the front. Walk with prev; if prev.next matches, skip it (and stay); otherwise advance. Return dummy.next.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Empty train', 'Front car removed', 'Every car removed', 'Consecutive matches', 'Label not present'],
      solution: py`
class Car:
    def __init__(self, cargo, nxt=None):
        self.cargo, self.next = cargo, nxt

def train(labels):
    head = None
    for c in reversed(labels):
        head = Car(c, head)
    return head

def labels(car):
    out = []
    while car:
        out.append(car.cargo)
        car = car.next
    return out

def detach(front, label):
    dummy = Car(None, front)
    prev = dummy
    while prev.next:
        if prev.next.cargo == label:
            prev.next = prev.next.next
        else:
            prev = prev.next
    return dummy.next

assert labels(detach(train(["coal", "ore", "coal", "wood"]), "coal")) == ["ore", "wood"]
assert detach(train(["coal", "coal"]), "coal") is None
assert labels(detach(train([]), "coal")) == []
assert labels(detach(train(["ore"]), "coal")) == ["ore"]
`,
      problem: 203, lessons: ['linked-lists/remove'],
    },
    hints: ['To remove a car, which car do you need to be standing on?', 'What makes removing the front car awkward, and what helper object removes that special case?', 'After a removal, should prev move forward?'],
    followUp: 'Now you are handed only the car to remove — no front, no previous car. What can you do?',
  },
  {
    id: 'empty-seat', codename: 'Empty seat',
    statement: 'A theater has seats numbered 0 through n. Exactly n people arrive and each takes a different seat, so exactly one seat stays empty. You get the list of occupied seat numbers in arrival order. Return the empty seat number. Then do it with constant extra memory.',
    examples: ['[3, 0, 1] → 2', '[0, 1] → 2', '[1] → 0'],
    constraints: ['1 ≤ n ≤ 10,000', 'All numbers are distinct and in 0..n'],
    unlock: '2026-11-27', evidence: 'github-historical', evidenceNote: 'Historical report: "find a missing number in a sequence" (LC 268), reworded',
    answer: {
      pattern: 'Expected total minus actual total (or XOR)', difficulty: 'Easy',
      signals: ['The full set 0..n is known in advance', 'Exactly one value missing, all others distinct', 'O(1) memory → no set', 'Order does not matter'],
      structure: 'Plain loop / math (no extra structure)',
      brute: { idea: 'For each seat 0..n, check whether it is in the list.', time: 'O(n²) with list membership', space: 'O(1)' },
      bottleneck: 'Each membership check rescans the list. You can replace the search with a set (O(n) space) — or notice you already know what the total should be.',
      optimized: { idea: 'Expected sum 0 + 1 + … + n = n(n + 1)/2. Subtract the actual sum; the difference is the empty seat. (XOR of indices and values also works.)', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Empty seat is n (nothing missing inside)', 'Empty seat is 0', 'Single person'],
      solution: py`
def empty_seat(seats):
    n = len(seats)
    return n * (n + 1) // 2 - sum(seats)

def empty_seat_set(seats):
    present = set(seats)
    return next(s for s in range(len(seats) + 1) if s not in present)

for case, want in (([3, 0, 1], 2), ([0, 1], 2), ([1], 0), ([0], 1)):
    assert empty_seat(case) == want == empty_seat_set(case)
`,
      problem: 268, lessons: ['solving/testing-hints', 'solving/brute-to-optimal'],
    },
    hints: ['What do you know about the seat numbers before you read the list?', 'If every seat were taken, what would the seat numbers add up to?', 'How does the real total differ from that?'],
    followUp: 'Compare the sum, set, XOR and sorting approaches: time, space, and which you would choose in a language where integers can overflow.',
  },
  {
    id: 'badge-compact', codename: 'Badge compaction',
    statement: 'A list of employee badge IDs is in ascending order but contains repeats. Rearrange the list in place so that each distinct ID appears once at the front, in the same ascending order, and return how many distinct IDs there are. What is left after that position does not matter.',
    examples: ['[1, 1, 2] → 2, list starts with [1, 2]', '[0, 0, 1, 1, 1, 2, 3, 3] → 4, list starts with [0, 1, 2, 3]'],
    constraints: ['1 ≤ n ≤ 30,000', 'Modify the list in place with O(1) extra memory'],
    unlock: '2026-11-27', evidence: 'github-historical', evidenceNote: 'Historical report: "remove duplicates from a list"; ColorStack-recommended LC 26',
    answer: {
      pattern: 'Same-direction read/write pointers', difficulty: 'Easy',
      signals: ['Sorted → duplicates are adjacent', 'In place + O(1) → no set, no new list', 'Keep order → only move values forward', 'Return a count'],
      structure: 'Two pointers',
      brute: { idea: 'Build a new list of distinct values (or use a set and sort), then copy back.', time: 'O(n) / O(n log n)', space: 'O(n)' },
      bottleneck: 'The extra list is the problem, not time: because duplicates are adjacent, you only need to compare with the last value written.',
      optimized: { idea: 'write = 1. For each read index from 1, if nums[read] differs from nums[write − 1], copy it to nums[write] and increment write. Return write.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Single element', 'All the same', 'No duplicates'],
      solution: py`
def compact(nums):
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write

a = [0, 0, 1, 1, 1, 2, 3, 3]
k = compact(a)
assert k == 4 and a[:k] == [0, 1, 2, 3]
b = [1, 1, 2]
assert compact(b) == 2 and b[:2] == [1, 2]
assert compact([7]) == 1
c = [5, 5, 5]
assert compact(c) == 1 and c[:1] == [5]
`,
      problem: 26, lessons: ['two-pointers/same-direction'],
    },
    hints: ['Where must equal IDs be, given the order?', 'Keep one index for where the next distinct ID should go.', 'Compare the value you are reading with the last value you wrote.'],
    followUp: 'Now each ID may appear at most twice. What single comparison changes?',
  },
  // -------------------------------------------------------------------------------- recommended / variations
  {
    id: 'sign-check', codename: 'Shop sign',
    statement: 'A shop owner wants signs that read the same forwards and backwards once you ignore capital letters, spaces and punctuation (only letters and digits count). Given the sign text, return whether it qualifies.',
    examples: ['"Was it a car, or a cat I saw?" → True', '"race a car" → False', '" " → True'],
    constraints: ['1 ≤ length ≤ 200,000', 'Printable ASCII'],
    unlock: '2026-11-25', evidence: 'colorstack-recommended', evidenceNote: 'ColorStack-recommended: Valid Palindrome (LC 125), reworded',
    answer: {
      pattern: 'Opposite-direction two pointers with skipping', difficulty: 'Easy',
      signals: ['"same forwards and backwards" → compare mirrored positions', 'Some characters must be ignored → skip them', 'Large input → avoid unnecessary copies if asked'],
      structure: 'Two pointers',
      brute: { idea: 'Build a cleaned lowercase string and compare it with its reverse.', time: 'O(n)', space: 'O(n)' },
      bottleneck: 'Time is already linear; the cost is the O(n) copy. Two pointers compare in place.',
      optimized: { idea: 'i from the left, j from the right; skip characters that are not alphanumeric; compare lowercased characters; move inward.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Only punctuation/spaces → True', 'Digits count ("0P" is False)', 'Single character'],
      solution: py`
def qualifies(text):
    i, j = 0, len(text) - 1
    while i < j:
        if not text[i].isalnum():
            i += 1
        elif not text[j].isalnum():
            j -= 1
        elif text[i].lower() != text[j].lower():
            return False
        else:
            i, j = i + 1, j - 1
    return True

assert qualifies("Was it a car, or a cat I saw?")
assert not qualifies("race a car")
assert qualifies(" ") and qualifies("a")
assert not qualifies("0P")
`,
      problem: 125, lessons: ['two-pointers/opposite', 'arrays/strings'],
    },
    hints: ['What is the simplest correct version, even if it uses extra memory?', 'Which two characters must match first?', 'How do you handle a character that should be ignored on one side only?'],
    followUp: 'Now you may delete at most one character. How do you decide which side to skip?',
  },
  {
    id: 'song-streak', codename: 'Song streak',
    statement: 'A radio station logs the ID of the song played each hour as a string of characters (one character per song). Find the length of the longest run of consecutive hours in which no song was played twice.',
    examples: ['"abcabcbb" → 3', '"bbbbb" → 1', '"pwwkew" → 3', '"" → 0'],
    constraints: ['0 ≤ length ≤ 50,000'],
    unlock: '2026-11-25',
    answer: {
      pattern: 'Variable sliding window with last-seen positions', difficulty: 'Medium',
      signals: ['"consecutive hours" → contiguous', '"longest" → maximise a window', 'Once a repeat is inside, the run stays invalid until its left end moves past the earlier copy → shrinking from the left is safe'],
      structure: 'Sliding window',
      brute: { idea: 'For every start, extend while no repeat (using a set).', time: 'O(n²) (or O(n³) if each run is re-checked)', space: 'O(k) for k distinct songs' },
      bottleneck: 'After a repeat, brute force restarts from the next start and re-scans characters it already knows are unique.',
      optimized: { idea: 'Keep left and a dict of last positions. For each right, if the song was seen at or after left, jump left past it. Track the best width.', time: 'O(n)', space: 'O(k)' },
      edgeCases: ['Empty string', 'All the same', 'All distinct', 'A repeat far to the left of the window ("abba")'],
      solution: py`
def longest_run(log):
    last, left, best = {}, 0, 0
    for right, song in enumerate(log):
        if song in last and last[song] >= left:
            left = last[song] + 1
        last[song] = right
        best = max(best, right - left + 1)
    return best

for s, want in (("abcabcbb", 3), ("bbbbb", 1), ("pwwkew", 3), ("", 0), ("abba", 2), ("abcd", 4)):
    assert longest_run(s) == want, s
`,
      problem: 3, lessons: ['sliding-window/variable'],
    },
    hints: ['Is the answer about any subset of hours, or neighbouring hours only?', 'When you meet a repeat, where is the earliest start that could still be valid?', 'What do you need to remember about each song to jump the start there directly?'],
    followUp: 'Why is the check `last[song] >= left` needed? Give an input that fails without it.',
  },
  {
    id: 'config-nesting', codename: 'Config nesting',
    statement: 'A configuration format uses three kinds of brackets: (), [] and {}. A file is well formed if every opening bracket is closed by the same kind, and brackets close in the correct order. Given the bracket characters of a file, return whether it is well formed.',
    examples: ['"{[()]}" → True', '"([)]" → False', '"((" → False', '"" → True'],
    constraints: ['0 ≤ length ≤ 10,000', 'Only bracket characters'],
    unlock: '2026-11-26', evidence: 'colorstack-recommended', evidenceNote: 'ColorStack-recommended: Valid Parentheses (LC 20), reworded',
    answer: {
      pattern: 'Stack of open brackets', difficulty: 'Easy',
      signals: ['Matching open/close pairs', 'The most recently opened bracket must close first → last in, first out', 'Counting alone fails on "([)]"'],
      structure: 'Stack',
      brute: { idea: 'Repeatedly delete adjacent pairs "()", "[]", "{}" until nothing changes.', time: 'O(n²)', space: 'O(n)' },
      bottleneck: 'Each deletion pass rescans the whole string; a stack remembers exactly the brackets still waiting to close.',
      optimized: { idea: 'Push opening brackets. On a closing bracket, the stack top must be its partner — pop it; otherwise fail. At the end the stack must be empty.', time: 'O(n)', space: 'O(n)' },
      edgeCases: ['Empty string', 'Starts with a closing bracket', 'Only opening brackets', 'Odd length'],
      solution: py`
PAIRS = {")": "(", "]": "[", "}": "{"}

def well_formed(s):
    stack = []
    for ch in s:
        if ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False
        else:
            stack.append(ch)
    return not stack

for s, want in (("{[()]}", True), ("([)]", False), ("((", False), ("", True), (")(", False), ("()[]{}", True)):
    assert well_formed(s) == want, s
`,
      problem: 20, lessons: ['stacks-queues/stacks'],
    },
    hints: ['Would counting each kind of bracket be enough? Try "([)]".', 'When you meet a closing bracket, which opening bracket must it match?', 'What structure gives you "the most recent unmatched opener" instantly?'],
    followUp: 'If there were only one kind of bracket, can you do it in O(1) space?',
  },
  {
    id: 'product-codes', codename: 'Product codes',
    statement: 'A warehouse finds that some product codes are the same letters in a different order (a data-entry problem). Group the codes so that codes made of exactly the same letters, with the same counts, end up together. Return the groups in any order.',
    examples: ['["tab", "bat", "eat", "tea", "ate", "x"] → [["tab", "bat"], ["eat", "tea", "ate"], ["x"]]'],
    constraints: ['1 ≤ number of codes ≤ 10,000', 'Each code has 1–100 lowercase letters'],
    unlock: '2026-11-21', evidenceNote: 'Group Anagrams (LC 49) — also the shape of the candidate-reported digit-grouping question',
    answer: {
      pattern: 'Canonical key → group in a dict', difficulty: 'Medium',
      signals: ['"same letters, same counts, any order" → a multiset', 'Grouping → every code needs a key that is identical for its whole group', 'Many codes → avoid comparing all pairs'],
      structure: 'Hash map (dict)',
      brute: { idea: 'Compare every pair of codes with sorted() or Counter and merge groups.', time: 'O(n² · k log k)', space: 'O(n · k)' },
      bottleneck: 'The same per-code "letter signature" is recomputed for every pair. Compute it once per code and use it as a dict key.',
      optimized: { idea: 'Key = "".join(sorted(code)) (or a tuple of 26 counts); defaultdict(list) groups codes by key.', time: 'O(n · k log k) (O(n · k) with count keys)', space: 'O(n · k)' },
      edgeCases: ['Single code', 'Codes of different lengths can never match', 'Repeated identical codes'],
      solution: py`
from collections import defaultdict

def group_codes(codes):
    groups = defaultdict(list)
    for code in codes:
        groups["".join(sorted(code))].append(code)
    return list(groups.values())

got = group_codes(["tab", "bat", "eat", "tea", "ate", "x"])
assert sorted(sorted(g) for g in got) == [["ate", "eat", "tea"], ["bat", "tab"], ["x"]]
assert group_codes(["a", "a"]) == [["a", "a"]]
`,
      problem: 49, lessons: ['hashing/canonical-keys'],
    },
    hints: ['When exactly do two codes belong in the same group?', 'Can you turn each code into one value that is the same for its whole group?', 'Which structure groups items by such a value in one pass?'],
    followUp: 'Do the same for numbers whose digits are rearrangements of each other (e.g. 112, 121, 211). What changes?',
  },
  {
    id: 'first-solo', codename: 'First solo character',
    statement: 'Given a username, return the position of the first character that appears exactly once in the whole username, or -1 if every character repeats.',
    examples: ['"leetcode" → 0', '"loveleetcode" → 2', '"aabb" → -1'],
    constraints: ['1 ≤ length ≤ 100,000', 'Lowercase letters'],
    unlock: '2026-11-22', evidenceNote: 'Original variation (similar to LC 387) — counting practice in disguise',
    answer: {
      pattern: 'Frequency count, then a second pass', difficulty: 'Easy',
      signals: ['"appears exactly once in the whole" → need global counts before deciding', '"first" → a left-to-right pass after counting', 'Large n → no nested count() calls'],
      structure: 'Hash map (dict)',
      brute: { idea: 'For each position, count that character with s.count(ch).', time: 'O(n²)', space: 'O(1)' },
      bottleneck: 's.count() rescans the whole string for every position.',
      optimized: { idea: 'Count every character once (Counter), then return the first position whose count is 1.', time: 'O(n)', space: 'O(1) — at most 26 keys' },
      edgeCases: ['No unique character → -1', 'Single character → 0', 'Unique character at the end'],
      solution: py`
from collections import Counter

def first_solo(name):
    counts = Counter(name)
    for i, ch in enumerate(name):
        if counts[ch] == 1:
            return i
    return -1

assert first_solo("leetcode") == 0
assert first_solo("loveleetcode") == 2
assert first_solo("aabb") == -1
assert first_solo("z") == 0 and first_solo("aab") == 2
`,
      lessons: ['hashing/frequency-maps', 'arrays/frequency'],
    },
    hints: ['Can you decide whether a character is unique by looking only to its left?', 'What would you need to know about every character before the final scan?', 'Two passes are fine. What does the first one compute?'],
    followUp: 'Now the characters arrive as a stream and you must answer after each one. What would you store?',
  },
  {
    id: 'gadget-trade', codename: 'Gadget resale',
    statement: 'You track the price of a gadget for n days. You may buy it on one day and sell it on a later day, once. Return the largest profit possible, or 0 if no profit is possible.',
    examples: ['[7, 1, 5, 3, 6, 4] → 5', '[7, 6, 4, 3, 1] → 0'],
    constraints: ['1 ≤ n ≤ 100,000'],
    unlock: '2026-11-22', evidence: 'colorstack-recommended', evidenceNote: 'ColorStack-recommended: Best Time to Buy and Sell Stock (LC 121), reworded',
    answer: {
      pattern: 'Running minimum in one pass', difficulty: 'Easy',
      signals: ['"buy … later sell" → order matters, pairs (i < j)', 'For each sell day you only need the cheapest earlier day', 'Large n → no pair loop'],
      structure: 'Plain loop / math (no extra structure)',
      brute: { idea: 'Try every buy day with every later sell day.', time: 'O(n²)', space: 'O(1)' },
      bottleneck: 'For each sell day, the inner loop re-finds the minimum of the prices before it.',
      optimized: { idea: 'Carry the lowest price so far; at each day the best sale today is price − lowest. Track the maximum.', time: 'O(n)', space: 'O(1)' },
      edgeCases: ['Prices only fall → 0', 'Single day → 0', 'Minimum appears after the maximum'],
      solution: py`
def best_profit(prices):
    lowest, best = float("inf"), 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best

assert best_profit([7, 1, 5, 3, 6, 4]) == 5
assert best_profit([7, 6, 4, 3, 1]) == 0
assert best_profit([3]) == 0 and best_profit([2, 9, 1, 3]) == 7
`,
      problem: 121, lessons: ['arrays/traversal', 'solving/brute-to-optimal'],
    },
    hints: ['For one fixed sell day, which buy day is best?', 'Do you need to search for it, or can you remember it as you go?', 'What two values do you update each day?'],
    followUp: 'What if you could buy and sell as many times as you like (one gadget at a time)?',
  },
  {
    id: 'mirror-tree', codename: 'Mirror image',
    statement: 'An org chart is stored as a binary tree: each node has a value and optional left and right children. Produce its mirror image — every node’s left and right children swapped, all the way down — and return the root.',
    examples: ['4(2(1, 3), 7(6, 9)) → 4(7(9, 6), 2(3, 1))', 'empty tree → empty tree'],
    constraints: ['0 ≤ nodes ≤ 100', 'Modify the tree in place'],
    unlock: '2026-11-28', evidence: 'github-historical', evidenceNote: 'Historical report: "invert a binary search tree" (LC 226), reworded',
    answer: {
      pattern: 'Recursive tree DFS (swap children)', difficulty: 'Easy',
      signals: ['Tree input → think recursively: solve for subtrees, combine at the root', '"all the way down" → the same operation at every node', 'The empty tree is the natural base case'],
      structure: 'Recursion / tree DFS',
      brute: { idea: 'Copy the values level by level into lists, reverse each level, rebuild a new tree.', time: 'O(n)', space: 'O(n) — and it rebuilds instead of modifying in place' },
      bottleneck: 'No speed problem — the brute force is just much more code than the recursive definition.',
      optimized: { idea: 'invert(node): if node is None return None; swap node.left and node.right after inverting each; return node.', time: 'O(n)', space: 'O(h) recursion stack' },
      edgeCases: ['Empty tree', 'Single node', 'Skewed tree (recursion depth = n)'],
      solution: py`
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def mirror(node):
    if node is None:
        return None
    node.left, node.right = mirror(node.right), mirror(node.left)
    return node

def preorder(node):
    return [] if node is None else [node.val] + preorder(node.left) + preorder(node.right)

root = Node(4, Node(2, Node(1), Node(3)), Node(7, Node(6), Node(9)))
assert preorder(mirror(root)) == [4, 7, 9, 6, 2, 3, 1]
assert mirror(None) is None
assert preorder(mirror(Node(1))) == [1]
`,
      problem: 226, lessons: ['trees/dfs', 'recursion/basics'],
    },
    hints: ['What should you return for an empty tree?', 'Suppose both subtrees were already mirrored. What is left to do at the root?', 'Write that as a function that calls itself on each child.'],
    followUp: 'Do it without recursion. Which structure replaces the call stack?',
  },
  {
    id: 'store-orders', codename: 'Delivery routes',
    statement: 'A courier must visit each of k different stores exactly once, in any order. Return every possible visiting order.',
    examples: ['["A", "B", "C"] → 6 orders: ABC, ACB, BAC, BCA, CAB, CBA', '["A"] → [["A"]]'],
    constraints: ['1 ≤ k ≤ 7', 'Store names are distinct'],
    unlock: '2026-11-28',
    answer: {
      pattern: 'Backtracking over unused choices (permutations)', difficulty: 'Medium',
      signals: ['"every possible order" → output all arrangements', 'k ≤ 7 → exponential/factorial output is expected (7! = 5040)', 'Build an order one choice at a time and undo it'],
      structure: 'Backtracking',
      brute: { idea: 'Nested loops for each position — only works for a fixed k.', time: 'O(k^k) with filtering', space: 'O(k)' },
      bottleneck: 'Nested loops cannot adapt to k and waste work on orders with repeats.',
      optimized: { idea: 'Recursive choose → explore → unchoose: at each depth pick an unused store, recurse, then remove it.', time: 'O(k · k!)', space: 'O(k) recursion + O(k · k!) output' },
      edgeCases: ['k = 1', 'Copy the path when recording it (path[:])'],
      solution: py`
def all_routes(stores):
    out, path, used = [], [], [False] * len(stores)

    def go():
        if len(path) == len(stores):
            out.append(path[:])
            return
        for i, s in enumerate(stores):
            if not used[i]:
                used[i] = True
                path.append(s)
                go()
                path.pop()
                used[i] = False

    go()
    return out

r = all_routes(["A", "B", "C"])
assert len(r) == 6 and len({tuple(x) for x in r}) == 6
assert all_routes(["A"]) == [["A"]]
`,
      problem: 46, lessons: ['recursion/permutations', 'recursion/backtracking'],
    },
    hints: ['How many orders are there for k stores? Is listing all of them unavoidable?', 'How would you build ONE order one store at a time?', 'After exploring with a store in position i, what must you undo before trying the next store?'],
    followUp: 'What changes if two stores have the same name and duplicate orders must not appear?',
  },
  {
    id: 'booked-ranges', codename: 'Room bookings',
    statement: 'A meeting room has a list of bookings, each a [start, end] pair, in no particular order. Bookings that overlap or touch should be shown as one combined block. Return the combined blocks sorted by start.',
    examples: ['[[1, 3], [8, 10], [2, 6], [15, 18]] → [[1, 6], [8, 10], [15, 18]]', '[[1, 4], [4, 5]] → [[1, 5]]'],
    constraints: ['1 ≤ bookings ≤ 10,000', 'start ≤ end'],
    unlock: '2026-11-27',
    answer: {
      pattern: 'Sort by start, then merge in one scan', difficulty: 'Medium',
      signals: ['Ranges that may overlap → intervals', '"no particular order" → sort first so overlaps become neighbours', 'Output sorted by start'],
      structure: 'Sorting first',
      brute: { idea: 'Repeatedly find any two overlapping bookings and combine them until none overlap.', time: 'O(n²) or worse', space: 'O(n)' },
      bottleneck: 'Without order, any booking may overlap any other, so every pass compares many pairs. After sorting, a booking can only overlap the block just before it.',
      optimized: { idea: 'Sort by start. Keep the last merged block; if the next start ≤ its end, extend the end to max(end, next end); otherwise start a new block.', time: 'O(n log n)', space: 'O(n) for the output' },
      edgeCases: ['Touching intervals ([1, 4], [4, 5])', 'One booking inside another ([1, 10], [2, 3])', 'Single booking'],
      solution: py`
def combine(bookings):
    merged = []
    for start, end in sorted(bookings):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

assert combine([[1, 3], [8, 10], [2, 6], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]
assert combine([[1, 4], [4, 5]]) == [[1, 5]]
assert combine([[1, 10], [2, 3]]) == [[1, 10]]
assert combine([[5, 5]]) == [[5, 5]]
`,
      problem: 56, lessons: ['patterns/intervals', 'search-sort/sorting'],
    },
    hints: ['If the bookings were in order of start time, which bookings could overlap the current one?', 'What is the cost of putting them in that order?', 'When extending a block, why do you need max() for the new end?'],
    followUp: 'Given one new booking and an already merged, sorted list, insert it in O(n) without re-sorting.',
  },
  {
    id: 'sensor-repeat', codename: 'Sensor repeat',
    statement: 'A sensor records one reading per second. Return True if the same reading ever appears twice within k seconds of itself (positions i and j with i ≠ j and |i − j| ≤ k), otherwise False.',
    examples: ['readings = [1, 2, 3, 1], k = 3 → True', 'readings = [1, 2, 3, 1, 2, 3], k = 2 → False', 'readings = [1, 0, 1, 1], k = 1 → True'],
    constraints: ['1 ≤ n ≤ 100,000', '0 ≤ k ≤ 100,000'],
    unlock: '2026-11-25', evidenceNote: 'Original variation (similar to LC 219) — "duplicates" plus a distance limit',
    answer: {
      pattern: 'Last-seen index in a dict (or a size-k window set)', difficulty: 'Easy',
      signals: ['"same reading twice" → duplicate detection', '"within k" → only recent positions matter', 'Large n and k → no pair loop'],
      structure: 'Hash map (dict)',
      brute: { idea: 'For each i, check the next k positions.', time: 'O(n · k)', space: 'O(1)' },
      bottleneck: 'Each position rescans up to k neighbours. You only need the most recent position of each value.',
      optimized: { idea: 'Dict value → last index. At each i, if the value was seen and i − last ≤ k, return True; then update last.', time: 'O(n)', space: 'O(min(n, distinct values))' },
      edgeCases: ['k = 0 → always False', 'Duplicates exactly k apart', 'Several duplicates where only a later pair is close'],
      solution: py`
def repeats_within(readings, k):
    last = {}
    for i, r in enumerate(readings):
        if r in last and i - last[r] <= k:
            return True
        last[r] = i
    return False

assert repeats_within([1, 2, 3, 1], 3) is True
assert repeats_within([1, 2, 3, 1, 2, 3], 2) is False
assert repeats_within([1, 0, 1, 1], 1) is True
assert repeats_within([1, 1], 0) is False
`,
      lessons: ['hashing/frequency-maps', 'sliding-window/fixed'],
    },
    hints: ['Without the distance limit, how would you detect any repeat?', 'For a reading at position i, which earlier occurrence is the only one worth checking?', 'What do you store per value?'],
    followUp: 'Solve it with a set that never holds more than k readings. Which version uses less memory when k is small?',
  },
  {
    id: 'clock-hands', codename: 'Clock face',
    statement: 'Given a time as an hour (1–12) and minutes (0–59), return the smaller angle in degrees between the hour hand and the minute hand of an analog clock.',
    examples: ['12:30 → 165', '3:30 → 75', '3:15 → 7.5', '12:00 → 0'],
    constraints: ['1 ≤ hour ≤ 12', '0 ≤ minutes ≤ 59', 'Answers within 1e-5 are accepted'],
    unlock: '2026-11-29', evidence: 'github-historical', evidenceNote: 'Historical report: "calculate the acute angle between two hands on a clock" (LC 1344), reworded',
    answer: {
      pattern: 'Model the physical rule, then compute', difficulty: 'Medium',
      signals: ['No collection at all — a fixed formula problem', 'Both hands move: the hour hand drifts with the minutes', '"smaller angle" → compare with 360 − angle'],
      structure: 'Plain loop / math (no extra structure)',
      brute: { idea: 'Simulate the clock minute by minute from 12:00, tracking both angles.', time: 'O(minutes since 12:00)', space: 'O(1)' },
      bottleneck: 'Simulation repeats a constant step; the positions have a closed form.',
      optimized: { idea: 'minute = 6·m; hour = 30·(h mod 12) + 0.5·m; d = |hour − minute|; return min(d, 360 − d).', time: 'O(1)', space: 'O(1)' },
      edgeCases: ['12 o’clock (h mod 12 = 0)', 'Angle exactly 180 (6:00)', 'Hands overlapping'],
      solution: py`
def hand_angle(hour, minutes):
    minute = 6 * minutes
    hour_pos = 30 * (hour % 12) + 0.5 * minutes
    d = abs(hour_pos - minute)
    return min(d, 360 - d)

for h, m, want in ((12, 30, 165), (3, 30, 75), (3, 15, 7.5), (12, 0, 0), (6, 0, 180), (4, 50, 155)):
    assert abs(hand_angle(h, m) - want) < 1e-9, (h, m)
`,
      problem: 1344, lessons: ['solving/math-simulation'],
    },
    hints: ['How many degrees does the minute hand move per minute?', 'At 3:30, is the hour hand exactly on the 3?', 'After computing the difference, how do you make sure it is the smaller angle?'],
    followUp: 'At what times between 12:00 and 1:00 do the hands overlap?',
  },
  {
    id: 'long-digits', codename: 'Long totals',
    statement: 'An accounting system stores two non-negative amounts as strings of digits that can be thousands of digits long. Return their sum as a string, without converting either whole string into a number.',
    examples: ['"11" + "123" → "134"', '"456" + "77" → "533"', '"999" + "1" → "1000"'],
    constraints: ['1 ≤ length ≤ 10,000', 'No leading zeros except "0" itself'],
    unlock: '2026-11-29', evidence: 'colorstack-recommended', evidenceNote: 'ColorStack-recommended: Add Strings (LC 415), reworded',
    answer: {
      pattern: 'Digit-by-digit simulation with a carry', difficulty: 'Easy',
      signals: ['Numbers too long for built-in conversion → simulate arithmetic', 'Addition works from the least significant digit → process right to left', 'Different lengths and a possible final carry'],
      structure: 'Plain loop / math (no extra structure)',
      brute: { idea: 'int(a) + int(b) — forbidden by the statement.', time: '—', space: '—' },
      bottleneck: 'Not applicable: the constraint forces the simulation.',
      optimized: { idea: 'Two indices from the right and a carry; while either index ≥ 0 or carry: add digits, append total % 10, carry total // 10. Reverse and join.', time: 'O(max(n, m))', space: 'O(max(n, m))' },
      edgeCases: ['Final carry ("999" + "1")', 'Different lengths', '"0" + "0"'],
      solution: py`
def add_amounts(a, b):
    i, j, carry, out = len(a) - 1, len(b) - 1, 0, []
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += ord(a[i]) - 48
            i -= 1
        if j >= 0:
            total += ord(b[j]) - 48
            j -= 1
        out.append(chr(48 + total % 10))
        carry = total // 10
    return "".join(reversed(out))

for a, b, want in (("11", "123", "134"), ("456", "77", "533"), ("999", "1", "1000"), ("0", "0", "0")):
    assert add_amounts(a, b) == want
`,
      problem: 415, lessons: ['solving/math-simulation'],
    },
    hints: ['How do you add two long numbers on paper?', 'Which digits do you add first?', 'When are you done — when both strings run out, or is there something else?'],
    followUp: 'Now the digits are stored in linked lists in reverse order. What changes?',
  },
  {
    id: 'ledger-runs', codename: 'Ledger runs',
    statement: 'A ledger lists daily balance changes; changes can be negative. Count how many runs of consecutive days have changes that add up to exactly k.',
    examples: ['changes = [1, 1, 1], k = 2 → 2', 'changes = [1, 2, 3], k = 3 → 2', 'changes = [3, -3, 3], k = 3 → 3'],
    constraints: ['1 ≤ n ≤ 20,000', '−1000 ≤ change ≤ 1000'],
    unlock: '2026-11-29',
    answer: {
      pattern: 'Prefix sums + counts of earlier prefixes', difficulty: 'Medium',
      signals: ['"consecutive days" → contiguous subarrays', '"how many" → count, not longest', 'Negative values → a sliding window cannot shrink safely (a trap)'],
      structure: 'Prefix sums + hash map',
      brute: { idea: 'For every start, extend and keep a running sum; count sums equal to k.', time: 'O(n²)', space: 'O(1)' },
      bottleneck: 'For each end day, brute force tries every start. A run (i, j] sums to k exactly when prefix[j] − prefix[i] = k, so you only need to know how many earlier prefixes equal prefix[j] − k.',
      optimized: { idea: 'Running prefix sum; a dict counts how many times each prefix has appeared (start with {0: 1}). Add counts[prefix − k] at each step.', time: 'O(n)', space: 'O(n)' },
      edgeCases: ['k = 0', 'Negative changes', 'The whole ledger is one run', 'Start the dict with {0: 1} for runs that begin on day 0'],
      solution: py`
def runs_with_total(changes, k):
    counts, prefix, total = {0: 1}, 0, 0
    for c in changes:
        prefix += c
        total += counts.get(prefix - k, 0)
        counts[prefix] = counts.get(prefix, 0) + 1
    return total

def brute(changes, k):
    n = len(changes)
    return sum(1 for i in range(n) for j in range(i, n) if sum(changes[i:j + 1]) == k)

for ch, k in (([1, 1, 1], 2), ([1, 2, 3], 3), ([3, -3, 3], 3), ([0, 0], 0), ([-1, -1, 1], 0)):
    assert runs_with_total(ch, k) == brute(ch, k), (ch, k)
`,
      problem: 560, lessons: ['patterns/prefix-sums'],
    },
    hints: ['Would a sliding window work if some changes are negative? Try [3, −3, 3] with k = 3.', 'How do you get the sum of days i+1..j from running totals?', 'For the current running total, which earlier running totals would complete a run of exactly k?'],
    followUp: 'If every change were positive, what simpler approach would work, and why?',
  },
];

export function getBlindItem(id: string): BlindItem | undefined {
  return blindItems.find((b) => b.id === id);
}
