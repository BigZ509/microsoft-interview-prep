import type { Module } from '../types';

const py = String.raw;

export const stacksQueuesModule: Module = {
  id: 'stacks-queues',
  number: 8,
  title: 'Stacks and Queues',
  priority: 'P0',
  phase: 2,
  blurb: 'LIFO and FIFO processing, bracket matching, deque-based queues, queues from stacks, and an introduction to monotonic stacks.',
  prerequisites: ['python', 'big-o'],
  lessons: [
    {
      id: 'stacks',
      title: 'Stacks (LIFO) and parentheses matching',
      summary: 'Last in, first out: the most recent unfinished thing is handled first.',
      what: "A **stack** supports `push` (add to top), `pop` (remove from top), and `peek` (look at top) — all O(1). It is **LIFO**: last in, first out. In Python, a list is a stack: `append` pushes, `pop()` pops, `stack[-1]` peeks.\n\nStacks can be built on arrays (Python list — amortized O(1) push) or linked lists (push/pop at the head, O(1)).",
      why: "Whenever the most recent item must be resolved first — matching brackets, undo history, recursion (the call stack), evaluating expressions — a stack models it directly.",
      how: [
        "Scan the input left to right.",
        "Opening bracket → push it.",
        "Closing bracket → the stack must be non-empty and its top must be the matching opener; pop it. Otherwise invalid.",
        "At the end, the stack must be empty (no unmatched openers).",
      ],
      visual: {
        kind: 'stack',
        title: "Validating '([]{})'",
        steps: [
          { input: '(', items: ['('], note: "Push '('." },
          { input: '[', items: ['(', '['], note: "Push '['." },
          { input: ']', items: ['('], note: "']' matches top '[' → pop." },
          { input: '{', items: ['(', '{'], note: "Push '{'." },
          { input: '}', items: ['('], note: "'}' matches '{' → pop." },
          { input: ')', items: [], note: "')' matches '(' → pop. Stack empty at the end → valid." },
        ],
      },
      code: py`
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:                       # closing bracket
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:                                 # opening bracket
            stack.append(ch)
    return not stack                          # leftovers -> invalid

assert is_valid("()[]{}") and is_valid("([]{})")
assert not is_valid("(]") and not is_valid("([)]")
assert not is_valid("(") and not is_valid(")") and is_valid("")

# Evaluate Reverse Polish Notation: stack-based expression processing
def eval_rpn(tokens):
    stack = []
    for t in tokens:
        if t in "+-*/" and len(t) == 1:
            b, a = stack.pop(), stack.pop()   # note the order!
            if t == "+": stack.append(a + b)
            elif t == "-": stack.append(a - b)
            elif t == "*": stack.append(a * b)
            else: stack.append(int(a / b))    # truncate toward zero
        else:
            stack.append(int(t))
    return stack[0]

assert eval_rpn(["2", "1", "+", "3", "*"]) == 9
assert eval_rpn(["4", "13", "5", "/", "+"]) == 6
`,
      codeNotes: [
        "`pairs` maps each CLOSER to its opener, so `ch in pairs` detects closers.",
        "`return not stack` is True only when the stack is empty.",
        "In RPN the first pop is the RIGHT operand: for `a - b`, b is popped first.",
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(n) worst case (all openers)',
        derivation: [
          "Each character is pushed at most once and popped at most once → O(n).",
          "Input like '((((' pushes all n characters → O(n) space.",
        ],
      },
      whenToUse: [
        "Matching / nesting structure: brackets, tags, nested expressions.",
        "\"Most recent\" or undo semantics.",
        "Converting recursion to iteration (explicit stack DFS).",
      ],
      mistakes: [
        "Popping from an empty stack on input like ')'.",
        "Forgetting to check the stack is empty at the end ('((' would pass).",
        "Mixing operand order in RPN subtraction/division.",
      ],
      checks: [
        { q: "Why does '([)]' fail?", options: ['Odd length', "When ')' arrives, the top is '[' not '('", 'Too many brackets', 'It passes'], answer: 1, explain: "The most recent unmatched opener is '[', which must close first." },
        { q: "Push/pop on a Python list used as a stack cost…", options: ['O(n)', 'Amortized O(1)', 'O(log n)', 'O(1) push, O(n) pop'], answer: 1, explain: "append and pop() at the end are amortized O(1)." },
      ],
      problems: [20, 155],
      terms: ['stack', 'edge-case'],
      verbal: "\"The most recently opened bracket must close first, which is exactly LIFO, so I'll push openers and pop on matching closers. O(n) time and O(n) space.\"",
    },
    {
      id: 'queues',
      title: 'Queues (FIFO), deque, and a queue built from two stacks',
      summary: 'First in, first out: process items in arrival order.',
      what: "A **queue** supports `enqueue` (add to back) and `dequeue` (remove from front). It is **FIFO**: first in, first out.\n\nIn Python, use `collections.deque`: `append` enqueues, `popleft` dequeues, both O(1). A list is a bad queue because `pop(0)` shifts every element (O(n)).\n\nYou can also build a queue from two stacks: push onto `inbox`; when you need the front and `outbox` is empty, pour all of `inbox` into `outbox` (reversing the order), then pop from `outbox`.",
      why: "Queues model arrival-order processing: BFS (explore nearest first), task scheduling, rate limiting by time windows. The two-stack queue is a favorite amortized-analysis question.",
      how: [
        "BFS skeleton: `q = deque([start])`; `while q: x = q.popleft(); for nb in neighbors(x): q.append(nb)`.",
        "Two-stack queue push: `inbox.append(x)` O(1).",
        "Two-stack queue pop/peek: if `outbox` is empty, move everything from inbox → outbox; then pop/peek `outbox[-1]`.",
        "Amortized: each element is moved from inbox to outbox at most once, so n operations cost O(n) total.",
      ],
      visual: {
        kind: 'stack',
        title: 'Queue from two stacks: push 1, 2, 3, then pop',
        steps: [
          { items: ['1', '2', '3'], vars: { inbox: '[1, 2, 3]', outbox: '[]' }, note: 'Three pushes go onto inbox.' },
          { items: ['3', '2', '1'], vars: { inbox: '[]', outbox: '[3, 2, 1]' }, note: 'pop() finds outbox empty → pour inbox into outbox. The oldest element (1) is now on top of outbox.' },
          { items: ['3', '2'], vars: { inbox: '[]', outbox: '[3, 2]', returned: '1' }, note: 'Pop outbox → 1 (FIFO). The next pops are O(1) until outbox is empty again.' },
        ],
      },
      code: py`
from collections import deque

class MyQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x):
        self.inbox.append(x)

    def _shift(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())

    def pop(self):
        self._shift()
        return self.outbox.pop()

    def peek(self):
        self._shift()
        return self.outbox[-1]

    def empty(self):
        return not self.inbox and not self.outbox

q = MyQueue()
q.push(1); q.push(2)
assert q.peek() == 1 and q.pop() == 1
q.push(3)
assert q.pop() == 2 and q.pop() == 3 and q.empty()

# deque-based BFS order on a tiny graph
graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
order, seen, dq = [], {"A"}, deque(["A"])
while dq:
    node = dq.popleft()
    order.append(node)
    for nb in graph[node]:
        if nb not in seen:
            seen.add(nb)
            dq.append(nb)
assert order == ["A", "B", "C", "D"]
`,
      codeNotes: [
        "Pouring only when outbox is empty is essential: pouring every time would break the FIFO order and the amortized bound.",
        "Mark nodes as seen when ENQUEUING in BFS, not when dequeuing, to avoid adding duplicates.",
        "`q.push(1); q.push(2)` — semicolons put two statements on one line (fine for tests, avoid in interviews).",
      ],
      complexity: {
        time: 'deque ops O(1); two-stack queue amortized O(1) per operation',
        space: 'O(n)',
        derivation: [
          "Each element is pushed to inbox once, moved to outbox once, and popped once — 3 O(1) actions per element.",
          "So any sequence of n operations costs O(n) total → amortized O(1) each, even though a single pop that triggers a pour is O(n).",
        ],
      },
      whenToUse: [
        "BFS, level-order traversal, shortest paths in unweighted graphs.",
        "\"Process in arrival order\", sliding time windows.",
        "Design questions that restrict you to stack operations.",
      ],
      mistakes: [
        "`list.pop(0)` in BFS → O(n²).",
        "Pouring inbox → outbox when outbox is not empty (breaks order).",
        "Calling the two-stack queue worst-case O(1) per op.",
      ],
      checks: [
        { q: "Which Python call dequeues in O(1)?", options: ['list.pop(0)', 'deque.popleft()', 'list.pop()', 'deque.pop()'], answer: 1, explain: "popleft removes from the front of a deque in constant time. list.pop() and deque.pop() remove from the BACK." },
        { q: "In the two-stack queue, how many times can a single element be moved inbox → outbox?", options: ['Once', 'Twice', 'n times', 'log n times'], answer: 0, explain: "Once it's in outbox it leaves only by being popped. That bounds the total work." },
      ],
      problems: [232, 933, 994],
      terms: ['queue', 'stack', 'amortized', 'bfs'],
      verbal: "\"I push onto an inbox stack and pop from an outbox stack, pouring only when outbox is empty. Every element moves at most once, so operations are amortized O(1).\"",
    },
    {
      id: 'monotonic',
      title: 'Tracking previous elements: Min Stack and monotonic stacks (extension)',
      summary: 'Store extra state alongside each element, or keep the stack sorted to answer "previous/next greater" questions.',
      what: "Two stack extensions:\n\n- **Augmented stack** — store extra info with each pushed element, e.g. `(value, min_so_far)`. Then `getMin()` is O(1) at any time (Min Stack).\n- **Monotonic stack** — a stack whose elements stay in increasing (or decreasing) order. Before pushing x, pop every element that would break the order. Each popped element has just found its \"next greater (or smaller)\" element: x.",
      why: "\"Next greater element\", \"daily temperatures\", \"largest rectangle in histogram\" look O(n²) but are O(n) with a monotonic stack. Min Stack is a common design question about storing history so queries stay O(1).",
      how: [
        "Min Stack push: `cur_min = min(x, stack[-1][1]) if stack else x`; push `(x, cur_min)`.",
        "Min Stack pop/top/getMin: read the top tuple — O(1).",
        "Monotonic decreasing stack of indices for next-greater: for each i, while stack and nums[stack[-1]] < nums[i]: answer[stack.pop()] = nums[i]. Then push i.",
        "Every index is pushed once and popped at most once → O(n) total.",
      ],
      visual: {
        kind: 'stack',
        title: 'Next greater element for [2, 1, 3] (stack holds values for clarity)',
        steps: [
          { input: '2', items: ['2'], vars: { answer: '[-1, -1, -1]' }, note: 'Push 2.' },
          { input: '1', items: ['2', '1'], vars: { answer: '[-1, -1, -1]' }, note: '1 < 2, stack stays decreasing → push 1.' },
          { input: '3', items: ['3'], vars: { answer: '[3, 3, -1]' }, note: '3 pops 1 (its next greater is 3) and then 2 (next greater 3). Push 3. Nothing greater follows 3 → -1.' },
        ],
      },
      code: py`
class MinStack:
    def __init__(self):
        self.stack = []                     # (value, min so far)

    def push(self, val):
        cur_min = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, cur_min))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]

ms = MinStack()
for v in [-2, 0, -3]:
    ms.push(v)
assert ms.getMin() == -3
ms.pop()
assert ms.top() == 0 and ms.getMin() == -2

def next_greater(nums):
    ans = [-1] * len(nums)
    stack = []                              # indices; values decreasing
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        stack.append(i)
    return ans

assert next_greater([2, 1, 3]) == [3, 3, -1]
assert next_greater([4, 5, 2, 25]) == [5, 25, 25, -1]
`,
      codeNotes: [
        "`A if cond else B` is Python's conditional expression.",
        "Storing indices (not values) in the monotonic stack lets you write answers to the right positions.",
      ],
      complexity: {
        time: 'MinStack O(1) per operation; next_greater O(n)',
        space: 'O(n)',
        derivation: [
          "MinStack: each operation reads or writes one tuple at the top → O(1).",
          "next_greater: the while loop is nested, but each index is pushed once and popped at most once over the whole run → at most 2n stack operations → O(n) (amortized, like sliding window).",
        ],
      },
      whenToUse: [
        "\"Retrieve the min/max in O(1)\" alongside push/pop.",
        "\"Next/previous greater or smaller element\", spans, temperatures.",
      ],
      mistakes: [
        "Storing a single `min` variable — after popping the min you can't recover the previous min.",
        "Calling the monotonic-stack loop O(n²) because of the nested while.",
      ],
      checks: [
        { q: "Why does Min Stack store the min alongside every element?", options: ['To sort the stack', 'So that after any pop, the previous minimum is still known', 'To save memory', 'It is required by Python'], answer: 1, explain: "Each entry remembers the minimum of the stack up to that point." },
        { q: "The monotonic stack next-greater algorithm runs in…", options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 2, explain: "Every index is pushed and popped at most once." },
      ],
      problems: [155, 20],
      terms: ['stack', 'monotonic', 'state', 'amortized'],
      verbal: "\"I'll store each value with the minimum at the time it was pushed, so getMin is just reading the top — O(1) for every operation, O(n) space.\"",
    },
  ],
};
