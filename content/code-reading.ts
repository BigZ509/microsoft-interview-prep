import type { CodeReading } from './types';

const py = String.raw;

/**
 * Code comprehension (ColorStack-reported question types 4–6: "explain a provided function",
 * "identify possible inputs, outputs and edge cases"). Part of the 5% vocabulary/code-reading share.
 * Each `code` block runs under tests; the asserts document the behavior described in `model`.
 */
export const readingPrompts = [
  'In one sentence: what does this function do for its caller?',
  'Inputs: what types and values does it expect? What does it assume?',
  'Outputs: what exactly does it return — including for an empty input?',
  'Edge cases: list at least four inputs and what it returns for each.',
  'Complexity, and anything risky or buggy you notice.',
];

export const codeReadings: CodeReading[] = [
  {
    id: 'sum-evens', title: 'Sum of evens',
    evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: "explain a provided function that calculates the sum of even numbers in an array"',
    code: py`
def mystery(nums):
    total = 0
    for x in nums:
        if x % 2 == 0:
            total += x
    return total

assert mystery([1, 2, 3, 4]) == 6
assert mystery([]) == 0 and mystery([1, 3]) == 0
assert mystery([-2, 0, 5]) == -2
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns the sum of the even numbers in the list.',
      inputs: 'An iterable of integers. Floats also "work" (4.0 % 2 == 0), which may or may not be intended.',
      outputs: 'An int: the sum of evens; 0 when the list is empty or has no even numbers.',
      edgeCases: ['[] → 0', '[1, 3] → 0 (indistinguishable from empty)', '[0] → 0 (zero is even)', '[-2, 0, 5] → -2 (negative evens count)', '[2.0] → 2.0 (float result)', '[None] → TypeError'],
      complexity: 'O(n) time, O(1) extra space — one pass, one accumulator.',
      issues: ['Returns 0 for both "no evens" and "empty", so callers cannot tell them apart.', 'A non-number element raises TypeError; there is no validation.'],
      explain: '"It walks the list once, adds every value divisible by 2, and returns the total — O(n) time and O(1) space. Empty input or no evens both return 0, negative evens are included, and a non-number would raise a TypeError."',
    },
  },
  {
    id: 'has-duplicates', title: 'Duplicate detector',
    evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: "explain a provided function that detects duplicates in an array"',
    code: py`
def mystery(items):
    seen = set()
    for item in items:
        if item in seen:
            return True
        seen.add(item)
    return False

assert mystery([1, 2, 3, 1]) is True
assert mystery([]) is False and mystery([7]) is False
assert mystery(["a", "A"]) is False
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns True if any value appears more than once, otherwise False.',
      inputs: 'An iterable of hashable values (numbers, strings, tuples).',
      outputs: 'A bool. Stops at the first repeat it finds.',
      edgeCases: ['[] → False', '[7] → False', '[1, 1] → True', '["a", "A"] → False (case-sensitive)', '[1, 1.0] → True (1 == 1.0 and they hash the same)', '[[1], [1]] → TypeError (lists are unhashable)'],
      complexity: 'O(n) average time, O(n) space for the set (worst case: no duplicates).',
      issues: ['Unhashable values raise TypeError.', 'Equality is Python equality: 1 and 1.0 count as duplicates, "a" and "A" do not.'],
      explain: '"It keeps a set of values seen so far and returns True at the first repeat. O(n) time with O(1) average lookups, O(n) space. Empty or single-element inputs return False; unhashable items like lists would crash it."',
    },
  },
  {
    id: 'find-max', title: 'Largest value (with a bug)',
    code: py`
def mystery(nums):
    best = 0
    for x in nums:
        if x > best:
            best = x
    return best

assert mystery([3, 9, 2]) == 9
assert mystery([]) == 0
assert mystery([-5, -2]) == 0          # wrong: the largest value is -2
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Intended to return the largest value in the list.',
      inputs: 'A list of numbers.',
      outputs: 'A number — but not always the right one.',
      edgeCases: ['[3, 9, 2] → 9 (correct)', '[] → 0 (should probably raise or return None)', '[-5, -2] → 0 (BUG: should be -2)', '[0] → 0', '[5, 5] → 5'],
      complexity: 'O(n) time, O(1) space.',
      issues: ['Starting best at 0 is wrong for all-negative input. Start with nums[0] (after checking for empty) or float("-inf").', 'Empty input silently returns 0 instead of signalling "no maximum".'],
      explain: '"It tries to find the maximum in one pass, but best starts at 0, so for all-negative lists it returns 0 instead of the true maximum. I would initialise from the first element and decide explicitly what an empty list should do."',
    },
  },
  {
    id: 'is-sorted', title: 'Order check',
    code: py`
def mystery(nums):
    for i in range(len(nums) - 1):
        if nums[i] > nums[i + 1]:
            return False
    return True

assert mystery([1, 2, 2, 5]) is True
assert mystery([3, 1]) is False
assert mystery([]) is True and mystery([4]) is True
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns True if the list is in non-decreasing (ascending, ties allowed) order.',
      inputs: 'A list of mutually comparable values.',
      outputs: 'A bool; True for empty and single-element lists.',
      edgeCases: ['[] → True (range(-1) is empty)', '[4] → True', '[1, 2, 2, 5] → True (ties allowed: non-decreasing, not strictly increasing)', '[3, 1] → False', '[1, "a"] → TypeError'],
      complexity: 'O(n) time, O(1) space; stops at the first out-of-order pair.',
      issues: ['Checks non-decreasing order — if "strictly increasing" was intended, the comparison should be >=.', 'Mixed types raise TypeError.'],
      explain: '"It compares each adjacent pair and fails on the first pair that goes down, so it checks non-decreasing order in O(n). Empty and single-element lists count as sorted, and equal neighbours are allowed."',
    },
  },
  {
    id: 'dedupe-keep-order', title: 'Remove duplicates, keep order',
    evidence: 'github-historical', evidenceNote: 'Related to the historical report "remove duplicates from a list"',
    code: py`
def mystery(items):
    seen = set()
    out = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out

data = [3, 1, 3, 2, 1]
assert mystery(data) == [3, 1, 2]
assert data == [3, 1, 3, 2, 1]          # input is not modified
assert mystery([]) == []
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns a new list with duplicates removed, keeping the first occurrence of each value in its original order.',
      inputs: 'An iterable of hashable values.',
      outputs: 'A new list; the input is not modified.',
      edgeCases: ['[] → []', '[3, 1, 3, 2, 1] → [3, 1, 2]', 'All equal → one element', 'Already unique → same values, new list', 'Unhashable items → TypeError'],
      complexity: 'O(n) time, O(n) space (set + output).',
      issues: ['None for typical inputs. Compare with list(set(items)), which loses order — a common interview follow-up.'],
      explain: '"It builds a new list, adding each value the first time it is seen, tracked with a set. That keeps the original order and runs in O(n) time and O(n) space, without changing the input."',
    },
  },
  {
    id: 'second-largest', title: 'Second largest (with a bug)',
    code: py`
def mystery(nums):
    ordered = sorted(nums)
    return ordered[-2]

assert mystery([4, 1, 9, 7]) == 7
assert mystery([9, 9, 1]) == 9           # questionable: is the "second largest" 9 or 1?
try:
    mystery([5])
    crashed = False
except IndexError:
    crashed = True
assert crashed
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Intended to return the second-largest value.',
      inputs: 'A list of comparable values with at least two elements.',
      outputs: 'The element just before the maximum in sorted order.',
      edgeCases: ['[4, 1, 9, 7] → 7', '[9, 9, 1] → 9 (duplicates: is that the intended answer?)', '[5] → IndexError', '[] → IndexError'],
      complexity: 'O(n log n) time for the sort, O(n) space for the sorted copy.',
      issues: ['Crashes on fewer than two elements.', 'Ambiguous with duplicates — ask whether "second largest" means second distinct value.', 'Sorting is more work than needed: one pass tracking the top two values is O(n), O(1).'],
      explain: '"It sorts a copy and returns the second-to-last element, so it is O(n log n). It crashes on lists shorter than two, and with duplicates of the maximum it returns the maximum again — I would clarify the intended meaning and do it in one O(n) pass."',
    },
  },
  {
    id: 'count-words', title: 'Word counter',
    code: py`
def mystery(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts

assert mystery("The cat the hat") == {"the": 2, "cat": 1, "hat": 1}
assert mystery("") == {}
assert mystery("Hi, hi") == {"hi,": 1, "hi": 1}     # punctuation sticks to words
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns a dictionary mapping each lowercase word to how many times it occurs.',
      inputs: 'A string.',
      outputs: 'A dict word → count; {} for an empty or whitespace-only string.',
      edgeCases: ['"" → {}', '"   " → {} (split() drops extra whitespace)', '"The cat the" → {"the": 2, "cat": 1}', '"Hi, hi" → {"hi,": 1, "hi": 1} (punctuation is part of the word)', 'Non-string input → AttributeError'],
      complexity: 'O(L) time for a text of L characters; O(w) space for w distinct words.',
      issues: ['Punctuation is not stripped, so "hi," and "hi" are different words.'],
      explain: '"It lowercases the text, splits on whitespace and counts each word with dict.get, so it is linear in the text length. Empty text returns an empty dict, case is ignored, but punctuation stays attached to words."',
    },
  },
  {
    id: 'palindrome-check', title: 'Two-index loop',
    code: py`
def mystery(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i += 1
        j -= 1
    return True

assert mystery("racecar") is True and mystery("abba") is True
assert mystery("ab") is False
assert mystery("") is True and mystery("x") is True
assert mystery("Aa") is False                       # case-sensitive
`,
    prompts: readingPrompts,
    model: {
      purpose: 'Returns True if the string reads the same forwards and backwards (a palindrome).',
      inputs: 'A string (or any sequence supporting indexing and len).',
      outputs: 'A bool; True for empty and single-character strings.',
      edgeCases: ['"" → True', '"x" → True', '"abba" → True (even length)', '"racecar" → True (odd length: middle never compared)', '"Aa" → False (case-sensitive)', '"a b a" → True only because spaces happen to mirror'],
      complexity: 'O(n) time (n/2 comparisons), O(1) space.',
      issues: ['Case-sensitive and counts spaces/punctuation — fine if intended, but ask.'],
      explain: '"Two indices start at both ends and move inward, failing at the first mismatch, so it checks for a palindrome in O(n) time and O(1) space. Empty and one-character strings return True, and it is case-sensitive."',
    },
  },
];

export function getCodeReading(id: string): CodeReading | undefined {
  return codeReadings.find((r) => r.id === id);
}
