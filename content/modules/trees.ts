import type { Module } from '../types';

const py = String.raw;

const TREE = py`
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    """Build a tree from level-order values (None = missing), LeetCode style."""
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q, i = deque([root]), 1
    while q and i < len(values):
        node = q.popleft()
        for side in ("left", "right"):
            if i < len(values) and values[i] is not None:
                child = TreeNode(values[i])
                setattr(node, side, child)
                q.append(child)
            i += 1
    return root
`;

const SAMPLE_TREE = {
  id: 'n4', label: '4', children: [
    { id: 'n2', label: '2', children: [{ id: 'n1', label: '1' }, { id: 'n3', label: '3' }] },
    { id: 'n6', label: '6', children: [{ id: 'n5', label: '5' }, { id: 'n7', label: '7' }] },
  ],
};

export const treesModule: Module = {
  id: 'trees',
  number: 11,
  title: 'Trees',
  priority: 'P0',
  phase: 2,
  blurb: 'Tree vocabulary, binary trees vs. BSTs, preorder/inorder/postorder, recursive and iterative DFS, BFS by level, and the invariants behind common questions.',
  prerequisites: ['recursion', 'stacks-queues'],
  lessons: [
    {
      id: 'terminology',
      title: 'Nodes, root, leaves, depth, height; binary trees vs. BSTs',
      summary: 'The vocabulary every tree question assumes you know.',
      what: "A **tree** is a set of nodes connected by edges with no cycles, and a single **root** at the top.\n\n- **Parent / child** — a node directly above / below another.\n- **Leaf** — a node with no children.\n- **Depth** of a node — number of edges from the root to it (root has depth 0).\n- **Height** of a tree — number of edges (or nodes, depending on convention — LeetCode's \"maximum depth\" counts nodes) on the longest root-to-leaf path.\n- **Binary tree** — each node has at most two children, `left` and `right`.\n- **Binary search tree (BST)** — a binary tree where, for every node, ALL values in its left subtree are smaller and ALL in its right subtree are larger.\n- **Balanced** — height is O(log n). **Skewed** — every node has one child; height O(n), like a linked list.",
      why: "Complexities of tree algorithms are stated in terms of n (nodes) and h (height). A BST supports O(h) search/insert, which is O(log n) only when balanced.",
      how: [
        "Every subtree of a tree is itself a tree — this is why recursion fits.",
        "BST search: compare with node.val; go left if smaller, right if larger.",
        "BST invariant applies to the ENTIRE subtree, not just the immediate children.",
        "An inorder traversal (left, node, right) of a BST visits values in sorted order.",
      ],
      visual: {
        kind: 'tree',
        title: 'A balanced BST with 7 nodes',
        root: SAMPLE_TREE,
        steps: [
          { active: ['n4'], note: 'Root 4 (depth 0). Height of this tree = 2 edges (3 levels).' },
          { active: ['n2', 'n6'], note: 'Children of 4. Everything in 4’s left subtree (1, 2, 3) is < 4; right subtree (5, 6, 7) is > 4.' },
          { active: ['n1', 'n3', 'n5', 'n7'], note: 'Leaves at depth 2. Searching for 5: 4 → right → 6 → left → 5. 3 comparisons = O(h).' },
        ],
      },
      code: TREE + py`
def bst_search(root, target):
    node = root
    while node:
        if target == node.val:
            return True
        node = node.left if target < node.val else node.right
    return False

root = build([4, 2, 6, 1, 3, 5, 7])
assert bst_search(root, 5) and not bst_search(root, 8)

def height_edges(node):
    if node is None:
        return -1                     # empty tree: -1 edges by convention
    return 1 + max(height_edges(node.left), height_edges(node.right))

def count_leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)

assert height_edges(root) == 2 and count_leaves(root) == 4

skewed = build([1, None, 2, None, 3])     # 1 -> 2 -> 3 down the right side
assert height_edges(skewed) == 2 and count_leaves(skewed) == 1
`,
      codeNotes: [
        "`build` reads LeetCode's level-order format like [4, 2, 6, 1, 3, 5, 7] or [1, None, 2].",
        "`setattr(node, 'left', child)` is the same as `node.left = child`, chosen dynamically.",
        "Height conventions differ — say which you use (edges vs nodes).",
      ],
      complexity: {
        time: 'BST search O(h); height and leaf count O(n)',
        space: 'BST search O(1) iterative; recursive traversals O(h)',
        derivation: [
          "BST search descends one level per comparison → at most h + 1 comparisons → O(h): O(log n) balanced, O(n) skewed.",
          "height/count_leaves visit every node once → O(n); recursion depth equals the height → O(h) stack.",
        ],
      },
      whenToUse: [
        "Use n and h explicitly when stating tree complexities.",
        "BST properties: sorted order via inorder, O(h) search, range queries.",
      ],
      mistakes: [
        "Checking only `left.val < node.val < right.val` for BST validity.",
        "Assuming BST operations are O(log n) without balance.",
        "Mixing up depth (from the root down) and height (from a node to its deepest leaf).",
      ],
      checks: [
        { q: "What is the height (in edges) of a single-node tree?", options: ['0', '1', '-1', 'Undefined'], answer: 0, explain: "No edges. (LeetCode's maxDepth would return 1 because it counts nodes.)" },
        { q: "BST search worst case on a skewed tree of n nodes?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 2, explain: "A skewed tree has height n - 1." },
      ],
      problems: [104, 98],
      terms: ['node', 'parent', 'child', 'leaf', 'depth', 'height'],
      verbal: "\"Let n be the number of nodes and h the height. This visits each node once — O(n) time — and the recursion depth is O(h), which is O(log n) if balanced and O(n) if skewed.\"",
    },
    {
      id: 'dfs',
      title: 'Depth-first traversal: preorder, inorder, postorder — recursive and iterative',
      summary: 'Go as deep as possible before backing up. The three orders differ only in when you process the node.',
      what: "**Depth-first search (DFS)** explores one branch completely before the next. For binary trees, three orders:\n\n- **Preorder**: node, left, right — copy/serialize a tree.\n- **Inorder**: left, node, right — sorted order for a BST.\n- **Postorder**: left, right, node — compute answers that depend on children (height, subtree sums).\n\nRecursive DFS uses the call stack; iterative DFS uses an explicit stack.",
      why: "Most tree problems are \"do a DFS and compute something on the way down (preorder: pass info to children) or on the way up (postorder: combine children's results).\" Maximum depth is postorder; Same Tree is a parallel preorder; Validate BST passes bounds down.",
      how: [
        "Recursive template: `def dfs(node): if not node: return …; left = dfs(node.left); right = dfs(node.right); return combine(node, left, right)`.",
        "Iterative preorder: stack = [root]; pop node, visit, push right then left (so left is processed first).",
        "Iterative inorder: go left pushing nodes; pop, visit, then move to the right child.",
        "Validate BST: pass `(low, high)` bounds down; each node must satisfy low < val < high.",
      ],
      visual: {
        kind: 'tree',
        title: 'Visit orders on the BST [4, 2, 6, 1, 3, 5, 7]',
        root: SAMPLE_TREE,
        steps: [
          { active: ['n4', 'n2', 'n1'], done: [], note: 'Preorder starts 4, 2, 1 … full order: 4 2 1 3 6 5 7.' },
          { active: ['n1', 'n2', 'n3'], note: 'Inorder starts 1, 2, 3 … full order: 1 2 3 4 5 6 7 — sorted, because it is a BST.' },
          { active: ['n1', 'n3', 'n2'], note: 'Postorder starts 1, 3, 2 … full order: 1 3 2 5 7 6 4. The root comes last: children are finished first.' },
        ],
      },
      code: TREE + py`
def preorder(n):  return [n.val] + preorder(n.left) + preorder(n.right) if n else []
def inorder(n):   return inorder(n.left) + [n.val] + inorder(n.right) if n else []
def postorder(n): return postorder(n.left) + postorder(n.right) + [n.val] if n else []

root = build([4, 2, 6, 1, 3, 5, 7])
assert preorder(root) == [4, 2, 1, 3, 6, 5, 7]
assert inorder(root) == [1, 2, 3, 4, 5, 6, 7]
assert postorder(root) == [1, 3, 2, 5, 7, 6, 4]

def preorder_iterative(root):
    out, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right: stack.append(node.right)   # pushed first, popped later
        if node.left: stack.append(node.left)
    return out

def inorder_iterative(root):
    out, stack, node = [], [], root
    while stack or node:
        while node:                 # go as far left as possible
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)
        node = node.right
    return out

assert preorder_iterative(root) == preorder(root)
assert inorder_iterative(root) == inorder(root)

def max_depth(node):                # postorder: combine children
    if not node:
        return 0
    return 1 + max(max_depth(node.left), max_depth(node.right))

def same_tree(p, q):
    if not p and not q:
        return True
    if not p or not q or p.val != q.val:
        return False
    return same_tree(p.left, q.left) and same_tree(p.right, q.right)

def is_valid_bst(node, low=float("-inf"), high=float("inf")):
    if not node:
        return True
    if not (low < node.val < high):
        return False
    return is_valid_bst(node.left, low, node.val) and is_valid_bst(node.right, node.val, high)

assert max_depth(root) == 3 and max_depth(None) == 0
assert same_tree(root, build([4, 2, 6, 1, 3, 5, 7])) and not same_tree(root, build([4, 2, 6]))
assert is_valid_bst(root)
assert not is_valid_bst(build([5, 1, 6, None, None, 3, 7]))   # 3 is in 5's right subtree
`,
      codeNotes: [
        "The one-line traversals use a conditional expression; list concatenation makes them O(n²) worst case on skewed trees — fine for learning, but the iterative or append-to-result versions are O(n).",
        "`low < node.val < high` is a chained comparison: both must hold.",
        "The last BST test shows why checking only immediate children fails: 3 < 6 locally, but 3 < 5 violates the root's constraint.",
      ],
      complexity: {
        time: 'O(n) for each traversal (with append-to-result), max_depth, same_tree, is_valid_bst',
        space: 'O(h) recursion/explicit stack (+ O(n) output)',
        derivation: [
          "Each node is visited exactly once with O(1) work → O(n).",
          "At any time, the stack holds the nodes on the current root-to-node path → at most h + 1 → O(h).",
          "Balanced: O(log n) space. Skewed: O(n).",
        ],
      },
      whenToUse: [
        "Compute per-subtree values (height, sums, balance) → postorder.",
        "Pass constraints or path info down (BST bounds, path sums) → preorder.",
        "Sorted BST order (k-th smallest, validate) → inorder.",
      ],
      mistakes: [
        "Missing the `if not node` base case.",
        "Validating a BST by comparing only parent and child.",
        "Pushing left before right in iterative preorder (reverses the order).",
      ],
      checks: [
        { q: "Which traversal of a BST yields sorted values?", options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], answer: 1, explain: "Left subtree (smaller) → node → right subtree (larger)." },
        { q: "Max Depth combines children's results. Which order is that?", options: ['Preorder', 'Inorder', 'Postorder', 'BFS'], answer: 2, explain: "You need both children's depths before computing the node's." },
        { q: "Space for recursive DFS on a skewed tree of n nodes?", options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explain: "Height is n - 1, so n frames can be active." },
      ],
      problems: [104, 100, 98, 226],
      terms: ['dfs', 'traversal', 'base-case', 'invariant', 'recursion'],
      verbal: "\"I'll do a DFS passing down the allowed range (low, high). Each node must be strictly inside its range; its left child gets (low, node.val), its right child (node.val, high). O(n) time, O(h) space.\"",
    },
    {
      id: 'bfs',
      title: 'Breadth-first traversal (level order) and BFS vs. DFS',
      summary: 'Visit nodes level by level using a queue.',
      what: "**Breadth-first search (BFS)** visits all nodes at depth 0, then depth 1, then depth 2… using a **queue** (`deque`). To process level by level, record `len(q)` at the start of each level and pop exactly that many.\n\n**BFS vs DFS**:\n\n- BFS finds the **shallowest** target first (min depth, shortest path in unweighted graphs). Memory O(w) where w = max width (up to ~n/2 for a complete tree).\n- DFS goes deep first; memory O(h). Natural for recursion and for computing subtree properties.",
      why: "Level-based questions (level averages, right side view, min depth) are direct BFS. Choosing BFS vs DFS deliberately — and saying why — is a frequent interview discussion point.",
      how: [
        "`q = deque([root])` (if root).",
        "While q: `size = len(q)`; loop size times: popleft, process, append children.",
        "After the inner loop, one full level is done.",
        "For min depth: return the level number at the first leaf found.",
      ],
      visual: {
        kind: 'queue',
        title: 'Level-order traversal of [4, 2, 6, 1, 3, 5, 7]',
        steps: [
          { items: ['4'], vars: { levels: '[]' }, note: 'Queue starts with the root.' },
          { items: ['2', '6'], vars: { levels: '[[4]]' }, note: 'Level 0 processed: pop 4, enqueue 2 and 6.' },
          { items: ['1', '3', '5', '7'], vars: { levels: '[[4], [2, 6]]' }, note: 'Level 1: pop 2 and 6 (size was 2), enqueue their children.' },
          { items: [], vars: { levels: '[[4], [2, 6], [1, 3, 5, 7]]' }, note: 'Level 2: four leaves, nothing to enqueue. Done.' },
        ],
      },
      code: TREE + py`
def level_order(root):
    if not root:
        return []
    levels, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):          # exactly the nodes of this level
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        levels.append(level)
    return levels

root = build([4, 2, 6, 1, 3, 5, 7])
assert level_order(root) == [[4], [2, 6], [1, 3, 5, 7]]
assert level_order(None) == []

def max_depth_bfs(root):
    return len(level_order(root))

def min_depth(root):
    if not root:
        return 0
    q, depth = deque([root]), 1
    while q:
        for _ in range(len(q)):
            node = q.popleft()
            if not node.left and not node.right:
                return depth             # first leaf found = shallowest
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        depth += 1

assert max_depth_bfs(root) == 3
assert min_depth(build([3, 9, 20, None, None, 15, 7])) == 2
`,
      codeNotes: [
        "`range(len(q))` is evaluated once at the start of the for loop, so children appended during the loop wait for the next level.",
        "min_depth can stop early — an advantage of BFS over DFS for \"shallowest\" questions.",
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(w) for the queue, w = maximum width (O(n) worst case)',
        derivation: [
          "Each node is enqueued and dequeued exactly once, O(1) each with deque → O(n).",
          "The queue holds at most one or two levels at a time; the widest level of a complete tree has about n/2 nodes → O(n) worst case.",
        ],
      },
      whenToUse: [
        "\"Level by level\", \"minimum depth\", \"nearest\", \"shortest number of steps\".",
        "Prefer DFS for subtree computations or when the tree is very wide.",
      ],
      mistakes: [
        "Using a list with pop(0).",
        "Reading `len(q)` inside the loop condition as it changes.",
        "Forgetting the empty-tree case.",
      ],
      checks: [
        { q: "Why does BFS find minimum depth faster than DFS on many trees?", options: ['It uses less memory', 'It visits shallow levels first and can stop at the first leaf', 'It is O(log n)', 'It sorts nodes'], answer: 1, explain: "DFS might explore a very deep branch before finding a shallow leaf elsewhere." },
        { q: "BFS queue memory is bounded by…", options: ['Tree height', 'Maximum level width', 'log n always', 'O(1)'], answer: 1, explain: "The queue holds (at most about two) levels at once." },
      ],
      problems: [104, 733, 994],
      terms: ['bfs', 'queue', 'depth', 'traversal'],
      verbal: "\"I'll do BFS with a deque, processing len(q) nodes per level. Each node is enqueued once: O(n) time and O(w) space for the widest level.\"",
    },
  ],
};
