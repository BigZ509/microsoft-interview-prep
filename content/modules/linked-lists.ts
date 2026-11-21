import type { Module } from '../types';

const py = String.raw;

const NODE = py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out
`;

export const linkedListsModule: Module = {
  id: 'linked-lists',
  number: 7,
  title: 'Linked Lists',
  priority: 'P0',
  phase: 1,
  blurb: 'Nodes and references, traversal, insertion and deletion, reversal, dummy nodes, merging, and cycles — with pointer-by-pointer diagrams.',
  prerequisites: ['python', 'two-pointers'],
  lessons: [
    {
      id: 'nodes',
      title: 'Nodes, references, head/tail, traversal, insertion and deletion',
      summary: 'A linked list is a chain of objects, each holding a value and a reference to the next.',
      what: "A **node** is an object with a value and a **reference** (pointer) to the next node: `node.val`, `node.next`. The **head** is the first node; the **tail** is the last, whose `next` is `None`.\n\n- **Singly linked**: each node knows only `next`.\n- **Doubly linked**: each node also has `prev`, allowing backward traversal and O(1) removal given a node.\n\nUnlike arrays, nodes are scattered in memory: no O(1) indexing, but O(1) insertion/removal **once you hold a reference to the right node**.",
      why: "Linked lists test whether you can reason about references precisely. They also underlie queues, LRU caches, and adjacency lists. Interviewers use them because every bug is a pointer bug you could have caught by drawing boxes and arrows.",
      how: [
        "Traverse: `curr = head; while curr: … ; curr = curr.next`.",
        "Insert after node p: `new.next = p.next; p.next = new` (order matters!).",
        "Delete the node after p: `p.next = p.next.next`.",
        "Deleting the head is a special case — unless you use a dummy node (later lesson).",
        "Finding the k-th node or a value is O(n): you must walk from the head.",
      ],
      visual: {
        kind: 'list',
        title: 'Insert 9 after node 2 in 1 → 2 → 3',
        steps: [
          { nodes: ['1', '2', '3', '9'], next: [1, 2, null, null], pointers: { head: 0, p: 1, new: 3 }, note: 'Create the new node 9. It is not linked yet.' },
          { nodes: ['1', '2', '3', '9'], next: [1, 2, null, 2], pointers: { head: 0, p: 1, new: 3 }, note: 'Step 1: new.next = p.next (9 → 3). Do this FIRST so we don’t lose node 3.' },
          { nodes: ['1', '2', '3', '9'], next: [1, 3, null, 2], pointers: { head: 0, p: 1, new: 3 }, note: 'Step 2: p.next = new (2 → 9). List is now 1 → 2 → 9 → 3.' },
        ],
      },
      code: NODE + py`
head = build([1, 2, 3])
assert to_list(head) == [1, 2, 3]

# Insert 9 after the node with value 2
p = head.next
new = ListNode(9)
new.next = p.next      # keep a handle on the rest of the list first
p.next = new
assert to_list(head) == [1, 2, 9, 3]

# Delete the node after p (the 9)
p.next = p.next.next
assert to_list(head) == [1, 2, 3]

# Delete the head: just move head forward
head = head.next
assert to_list(head) == [2, 3]

def length(head):
    n = 0
    while head:
        n += 1
        head = head.next
    return n

assert length(head) == 2 and length(None) == 0
`,
      codeNotes: [
        "`build` uses a dummy node so every append is the same operation (see the dummy-node lesson).",
        "`while head:` is False when head is None — the end of the list.",
        "Reassigning the local `head` inside `length` doesn't affect the caller's `head` variable.",
      ],
      complexity: {
        time: 'Traverse/search O(n); insert/delete after a known node O(1)',
        space: 'O(1) extra for these operations',
        derivation: [
          "Traversal follows n next-pointers → O(n).",
          "Insert/delete after p changes one or two references — no shifting like arrays → O(1).",
          "But reaching p by value or position first costs O(n), so \"insert at position k\" is O(k) overall.",
        ],
      },
      whenToUse: [
        "When the problem gives you a ListNode.",
        "When you need O(1) splicing at a known position (queues, LRU caches with a hash map of nodes).",
      ],
      mistakes: [
        "Changing `p.next = new` before `new.next = p.next` — loses the rest of the list.",
        "Dereferencing None: `curr.next.val` when `curr.next` is None.",
        "Forgetting the empty-list (head is None) and single-node cases.",
      ],
      checks: [
        { q: "Insert after p: which assignment must come first?", options: ['p.next = new', 'new.next = p.next', 'Order does not matter', 'head = new'], answer: 1, explain: "Saving p.next into new.next first preserves the link to the rest of the list." },
        { q: "Cost to access the k-th node of a singly linked list?", options: ['O(1)', 'O(k) — walk from the head', 'O(log n)', 'O(n²)'], answer: 1, explain: "No random access; you walk k steps." },
        { q: "What can a doubly linked list do in O(1) that a singly linked list can't?", options: ['Search by value', 'Remove a node given only a reference to that node', 'Sort', 'Index'], answer: 1, explain: "With prev available, you can link prev and next around the node directly." },
      ],
      problems: [206, 21, 141],
      terms: ['node', 'pointer', 'reference', 'traversal', 'edge-case'],
      verbal: "\"To insert after p, I first point the new node at p.next so I don't lose the rest of the list, then point p at the new node — O(1).\"",
    },
    {
      id: 'reverse',
      title: 'Reversing pointers',
      summary: 'Walk the list once, flipping each next pointer backward, with three variables.',
      what: "Reversing a singly linked list means making every `next` point to the previous node. You keep three references: `prev` (already-reversed part), `curr` (node being flipped), and `nxt` (saved so you don't lose the rest).\n\nWhy not copy the values into a list and rebuild? That works but costs O(n) extra space. Rewiring reuses the same nodes with O(1) extra space — the version interviewers expect, and the building block for reversing a sub-range or k-groups.",
      why: "Reversal is the foundation for many list problems (palindrome list, reverse in k-groups, add two numbers). It's also the cleanest test of careful pointer ordering.",
      how: [
        "Start: `prev = None`, `curr = head`.",
        "Save: `nxt = curr.next`.",
        "Flip: `curr.next = prev`.",
        "Advance: `prev = curr`, `curr = nxt`.",
        "When `curr` is None, `prev` is the new head.",
        "**Invariant**: `prev` is the head of a correctly reversed list of all nodes visited so far; `curr` is the head of the untouched remainder.",
      ],
      visual: {
        kind: 'list',
        title: 'Reverse 1 → 2 → 3',
        steps: [
          { nodes: ['1', '2', '3'], next: [1, 2, null], pointers: { prev: null, curr: 0 }, note: 'Start: prev = None, curr = node 1.' },
          { nodes: ['1', '2', '3'], next: [null, 2, null], pointers: { prev: 0, curr: 1 }, note: 'Saved nxt = 2, flipped 1.next = None, advanced. Reversed part: 1.' },
          { nodes: ['1', '2', '3'], next: [null, 0, null], pointers: { prev: 1, curr: 2 }, note: 'Saved nxt = 3, flipped 2.next = 1. Reversed part: 2 → 1.' },
          { nodes: ['1', '2', '3'], next: [null, 0, 1], pointers: { prev: 2, curr: null }, note: 'Flipped 3.next = 2. curr is None → return prev (node 3). Result 3 → 2 → 1.' },
        ],
      },
      code: NODE + py`
def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next     # 1. save the rest
        curr.next = prev    # 2. flip the pointer
        prev = curr         # 3. advance prev
        curr = nxt          # 4. advance curr
    return prev

assert to_list(reverse_list(build([1, 2, 3]))) == [3, 2, 1]
assert reverse_list(None) is None
assert to_list(reverse_list(build([7]))) == [7]

def reverse_recursive(head):
    if head is None or head.next is None:
        return head                    # base case: 0 or 1 node
    new_head = reverse_recursive(head.next)
    head.next.next = head              # the node after head now points back
    head.next = None
    return new_head

assert to_list(reverse_recursive(build([1, 2, 3, 4]))) == [4, 3, 2, 1]
`,
      codeNotes: [
        "The four lines can be written as one tuple assignment, `curr.next, prev, curr = prev, curr, curr.next`, but the explicit version is easier to explain and debug.",
        "In the recursive version, `head.next.next = head` makes the (already reversed) tail point back to head.",
      ],
      complexity: {
        time: 'O(n)',
        space: 'Iterative O(1); recursive O(n) call stack',
        derivation: [
          "Each node is visited once and its pointer flipped once → O(n).",
          "Iterative uses three references regardless of n → O(1).",
          "Recursive makes one call per node and all n calls are active at the deepest point → O(n) stack.",
        ],
      },
      whenToUse: [
        "\"Reverse the list\" or any sub-part of it.",
        "Comparing the first half with the reversed second half (palindrome linked list).",
      ],
      mistakes: [
        "Flipping before saving `curr.next` — loses the rest of the list.",
        "Returning `head` (now the tail) instead of `prev`.",
        "Forgetting `head.next = None` in the recursive version → creates a 2-node cycle.",
      ],
      checks: [
        { q: "When the loop ends, which variable is the new head?", options: ['head', 'curr', 'prev', 'nxt'], answer: 2, explain: "curr is None; prev points at the last original node, now first." },
        { q: "Space of the recursive reversal?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explain: "One stack frame per node is alive at the deepest point." },
        { q: "What breaks if the loop body is `curr.next = prev; nxt = curr.next; prev = curr; curr = nxt`?", options: ['Nothing', 'nxt now equals prev, so curr walks backward and the rest of the list is lost', 'It reverses the list twice', 'IndexError'], answer: 1, explain: "Saving `curr.next` must happen BEFORE overwriting it." },
      ],
      problems: [206],
      terms: ['pointer', 'in-place', 'invariant', 'node'],
      verbal: "\"I keep prev, curr, and nxt. Save curr.next, flip curr.next to prev, then advance both. When curr is None, prev is the new head. O(n) time, O(1) space.\"",
    },
    {
      id: 'dummy-merge',
      title: 'Dummy nodes and merging sorted lists',
      summary: 'A fake head removes the special case of building or deleting at the front.',
      what: "A **dummy** (sentinel) node is a placeholder placed before the real head: `dummy = ListNode(); tail = dummy`. You build the result by attaching to `tail.next`, then return `dummy.next`.\n\n**Merging two sorted lists** compares the two current heads, attaches the smaller to `tail`, advances that list, and repeats — exactly the merge step of merge sort.",
      why: "Without a dummy you need an `if result_head is None` branch for the very first node, and deletions of the head need their own case. The dummy makes the first node like every other node.",
      how: [
        "`dummy = ListNode(); tail = dummy`.",
        "While both lists are non-empty: attach the smaller head to `tail.next`, advance that list, `tail = tail.next`.",
        "Attach whichever list remains: `tail.next = l1 or l2` (one of them is already None).",
        "Return `dummy.next`.",
      ],
      visual: {
        kind: 'list',
        title: 'Merge 1 → 4 and 2 → 3 (nodes laid out as D, 1, 4, 2, 3)',
        steps: [
          { nodes: ['D', '1', '4', '2', '3'], next: [null, 2, null, 4, null], pointers: { tail: 0, l1: 1, l2: 3 }, note: 'dummy D; l1 at 1, l2 at 2.' },
          { nodes: ['D', '1', '4', '2', '3'], next: [1, 2, null, 4, null], pointers: { tail: 1, l1: 2, l2: 3 }, note: '1 < 2 → D.next = 1; l1 moves to 4; tail = 1.' },
          { nodes: ['D', '1', '4', '2', '3'], next: [1, 3, null, 4, null], pointers: { tail: 3, l1: 2, l2: 4 }, note: '4 > 2 → 1.next = 2; l2 moves to 3; tail = 2.' },
          { nodes: ['D', '1', '4', '2', '3'], next: [1, 3, null, 4, 2], pointers: { tail: 4, l1: 2, l2: null }, note: '4 > 3 → 2.next = 3; l2 = None. Then tail.next = l1 (4). Return D.next: 1 → 2 → 3 → 4.' },
        ],
      },
      code: NODE + py`
def merge_two_lists(l1, l2):
    dummy = ListNode()
    tail = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2            # attach the remainder
    return dummy.next

assert to_list(merge_two_lists(build([1, 2, 4]), build([1, 3, 4]))) == [1, 1, 2, 3, 4, 4]
assert to_list(merge_two_lists(None, build([0]))) == [0]
assert merge_two_lists(None, None) is None

def remove_all(head, val):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next:
        if prev.next.val == val:
            prev.next = prev.next.next      # even if it was the head
        else:
            prev = prev.next
    return dummy.next

assert to_list(remove_all(build([7, 7, 1, 7, 2]), 7)) == [1, 2]
`,
      codeNotes: [
        "`tail.next, l1 = l1, l1.next` evaluates the right side first (old l1 and l1.next), then assigns.",
        "`l1 or l2` returns the first truthy value — the non-empty list, or None if both are empty.",
        "Using `<=` keeps the merge stable (equal elements from l1 first).",
      ],
      complexity: {
        time: 'merge O(n + m); remove_all O(n)',
        space: 'O(1) — nodes are re-linked, not copied',
        derivation: [
          "Each loop iteration attaches one node and advances one list; at most n + m iterations → O(n + m).",
          "Attaching the remainder is a single pointer assignment → O(1).",
          "Only dummy, tail, and the two cursors are allocated → O(1) extra space.",
        ],
      },
      whenToUse: [
        "Building a new list node by node.",
        "Any deletion that might remove the head.",
        "Merging sorted sequences; merge sort on linked lists.",
      ],
      mistakes: [
        "Returning `dummy` instead of `dummy.next`.",
        "Forgetting to attach the leftover list.",
        "Forgetting to advance `tail`.",
      ],
      checks: [
        { q: "What does the dummy node eliminate?", options: ['The need for a loop', 'Special-case handling of the first node / head', 'Sorting', 'Recursion'], answer: 1, explain: "The result always starts at dummy.next, so the first attach is like every other." },
        { q: "After the loop, why is `tail.next = l1 or l2` enough?", options: ['Both are None', 'The remaining list is already sorted and all ≥ tail', 'It sorts the rest', 'It is not enough'], answer: 1, explain: "Whatever remains is sorted and larger than everything merged so far." },
        { q: "merge_two_lists(1 → 3, 2 → 4) attaches nodes to tail in which order?", options: ['1, 2, 3, 4', '1, 3, 2, 4', '2, 1, 4, 3', '1, 2, 4, 3'], answer: 0, explain: "Each step takes the smaller current head: 1 (vs 2), 2 (vs 3), 3 (vs 4), then the leftover 4." },
      ],
      problems: [21, 88],
      terms: ['node', 'pointer', 'sorted', 'edge-case', 'stable-ordering'],
      verbal: "\"I'll use a dummy node so I don't special-case the head. Repeatedly attach the smaller head, then attach whatever remains. O(n + m) time, O(1) extra space.\"",
    },
    {
      id: 'cycle',
      title: 'Cycle detection: visited set vs. fast/slow',
      summary: 'Two correct approaches with different space costs — know both.',
      what: "A linked list has a **cycle** if some node's `next` points back to an earlier node, so traversal never ends.\n\n- **Visited set**: store each node object; if you see one twice, there's a cycle. O(n) time, O(n) space.\n- **Floyd's fast/slow**: slow moves 1, fast moves 2; they meet iff there's a cycle. O(n) time, O(1) space.",
      why: "This is the classic \"can you reduce space?\" follow-up. Presenting the set solution first and then the O(1)-space improvement shows structured thinking.",
      how: [
        "Set approach: `seen = set()`; walk; if `node in seen` → True; else add it.",
        "Fast/slow: loop while `fast and fast.next`; move; if `slow is fast` → True.",
        "If the loop exits (fast hit None), there is no cycle.",
        "Store NODE objects in the set, not values (different nodes can share a value).",
      ],
      visual: {
        kind: 'list',
        title: 'Fast/slow on 1 → 2 → 3 → 4 → (back to 2)',
        steps: [
          { nodes: ['1', '2', '3', '4'], next: [1, 2, 3, 1], pointers: { slow: 0, fast: 0 }, note: 'Both start at 1. Node 4 links back to node 2.' },
          { nodes: ['1', '2', '3', '4'], next: [1, 2, 3, 1], pointers: { slow: 1, fast: 2 }, note: 'slow → 2, fast → 3.' },
          { nodes: ['1', '2', '3', '4'], next: [1, 2, 3, 1], pointers: { slow: 2, fast: 1 }, note: 'slow → 3, fast → 4 → 2.' },
          { nodes: ['1', '2', '3', '4'], next: [1, 2, 3, 1], pointers: { slow: 3, fast: 3 }, note: 'slow → 4, fast → 3 → 4. They meet at node 4 → cycle.' },
        ],
      },
      code: NODE + py`
def has_cycle_set(head):
    seen = set()
    while head:
        if head in seen:         # node objects are hashable by identity
            return True
        seen.add(head)
        head = head.next
    return False

def has_cycle_floyd(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False

h = build([1, 2, 3, 4])
for f in (has_cycle_set, has_cycle_floyd):
    assert not f(h) and not f(None)

h.next.next.next.next = h.next   # 4 -> 2
for f in (has_cycle_set, has_cycle_floyd):
    assert f(h)

one = ListNode(1)
one.next = one                   # self-loop
assert has_cycle_floyd(one) and has_cycle_set(one)
`,
      codeNotes: [
        "User-defined objects are hashable by identity by default, so `seen.add(node)` works.",
        "A self-loop is the smallest cycle — always test it.",
      ],
      complexity: {
        time: 'Both O(n)',
        space: 'Set O(n); Floyd O(1)',
        derivation: [
          "Set: each node is added once; the first repeat is detected within n + 1 steps → O(n) time, up to n nodes stored → O(n) space.",
          "Floyd: slow takes at most n steps to enter the cycle and at most C ≤ n more for fast to catch it → O(n). Two pointers → O(1).",
        ],
      },
      whenToUse: [
        "Set: simplest to explain; also gives you the cycle entry directly (first repeated node).",
        "Floyd: when asked for O(1) extra space.",
      ],
      mistakes: [
        "Storing values in the set instead of nodes.",
        "Comparing with `==` on nodes that override equality.",
        "Forgetting to test empty list and self-loop.",
      ],
      checks: [
        { q: "Why store nodes, not values, in the visited set?", options: ['Values are unhashable', 'Two distinct nodes can hold equal values without a cycle', 'Sets cannot hold ints', 'For speed'], answer: 1, explain: "1 → 1 → 2 has repeated values but no cycle." },
        { q: "Main advantage of Floyd over the set approach?", options: ['Faster', 'O(1) space', 'Finds the longest cycle', 'Works on arrays only'], answer: 1, explain: "Both are O(n) time; Floyd needs no extra storage." },
        { q: "1 → 2 → 3 → (back to 1). With the visited-set approach, when is the cycle detected?", options: ['When the walk reaches node 1 a second time', 'At node 2', 'At node 3', 'Never'], answer: 0, explain: "Nodes 1, 2, 3 are added; following 3.next returns to node 1, which is already in the set." },
      ],
      problems: [141],
      terms: ['cycle', 'visited', 'pointer', 'trade-off'],
      verbal: "\"The simple approach stores visited nodes in a set: O(n) time and space. To get O(1) space, I'll use fast and slow pointers — they meet if and only if there's a cycle.\"",
    },
  ],
};
