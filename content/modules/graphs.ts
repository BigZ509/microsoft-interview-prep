import type { Module } from '../types';

const py = String.raw;

export const graphsModule: Module = {
  id: 'graphs',
  number: 12,
  title: 'Graphs and Grids',
  priority: 'P1',
  phase: 3,
  blurb: 'Vertices and edges, adjacency lists and matrices, BFS/DFS with visited sets, connected components, grid traversal, unweighted shortest paths, and basic cycle detection.',
  prerequisites: ['trees', 'hashing', 'stacks-queues'],
  lessons: [
    {
      id: 'representation',
      title: 'Vertices, edges, directed vs. undirected, adjacency lists vs. matrices',
      summary: 'A graph is things (vertices) plus connections (edges). How you store it decides the cost of every traversal.',
      what: "A **graph** G = (V, E) has **vertices** (nodes) and **edges** (connections).\n\n- **Undirected**: edge u—v can be traveled both ways (friendship).\n- **Directed**: edge u → v goes one way (prerequisite, follows).\n- **Weighted**: edges carry costs.\n\nRepresentations:\n\n- **Adjacency list** — `graph[u] = [neighbors]`. Space O(V + E). Iterating neighbors of u costs O(deg(u)).\n- **Adjacency matrix** — `M[u][v] = 1` if an edge exists. Space O(V²). Edge check O(1), but iterating neighbors costs O(V).\n- **Grid** — an implicit graph: each cell is a vertex; neighbors are up/down/left/right.\n\nTrees are connected, acyclic graphs; linked lists are graphs where each vertex has ≤ 1 outgoing edge.",
      why: "Interview inputs usually arrive as an edge list (`[[a, b], …]`) or a grid. Your first step is converting the edge list into an adjacency list so that BFS/DFS run in O(V + E).",
      how: [
        "`graph = defaultdict(list)`.",
        "For each edge (u, v): `graph[u].append(v)`; if undirected, also `graph[v].append(u)`.",
        "Include isolated vertices if the problem numbers vertices 0…n-1: `graph = [[] for _ in range(n)]`.",
        "Grid neighbors: `for dr, dc in ((1,0),(-1,0),(0,1),(0,-1))`, then bounds-check `0 <= r < rows and 0 <= c < cols`.",
      ],
      code: py`
from collections import defaultdict

edges = [(0, 1), (0, 2), (1, 2), (2, 3)]
n = 4

# Undirected adjacency list
adj = [[] for _ in range(n)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)
assert adj == [[1, 2], [0, 2], [0, 1, 3], [2]]
assert sum(len(nbrs) for nbrs in adj) == 2 * len(edges)   # each edge stored twice

# Directed adjacency list (prerequisite b -> a for [a, b] style input)
prereqs = [[1, 0], [2, 1]]
directed = defaultdict(list)
for course, pre in prereqs:
    directed[pre].append(course)
assert dict(directed) == {0: [1], 1: [2]}

# Adjacency matrix
matrix = [[0] * n for _ in range(n)]
for u, v in edges:
    matrix[u][v] = matrix[v][u] = 1
assert matrix[2][3] == 1 and matrix[0][3] == 0

# Grid as an implicit graph
grid = ["11", "01"]
def neighbors(r, c, rows=2, cols=2):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            yield nr, nc
assert sorted(neighbors(0, 0)) == [(0, 1), (1, 0)]
`,
      codeNotes: [
        "`matrix[u][v] = matrix[v][u] = 1` is chained assignment.",
        "`yield` makes `neighbors` a generator: it produces values lazily, one per loop iteration.",
        "In an undirected list, the total length of all neighbor lists is 2E.",
      ],
      complexity: {
        time: 'Build adjacency list O(V + E); matrix O(V²) to allocate',
        space: 'List O(V + E); matrix O(V²)',
        derivation: [
          "Allocating V empty lists is O(V); each edge appends once (twice if undirected) → O(E).",
          "A matrix has V × V cells regardless of how many edges exist → O(V²), wasteful for sparse graphs.",
          "Grids: V = rows · cols cells and E ≤ 4V edges, so O(V + E) = O(rows · cols).",
        ],
      },
      whenToUse: [
        "Adjacency list: almost always (sparse graphs, BFS/DFS).",
        "Matrix: dense graphs or when you need O(1) \"is there an edge u-v?\" checks.",
        "Grid: treat cells as vertices without building anything.",
      ],
      mistakes: [
        "Adding only one direction for an undirected graph.",
        "Reversing edge direction in prerequisite problems — read [a, b] carefully.",
        "Missing isolated vertices (they still count as components).",
      ],
      checks: [
        { q: "Space for an adjacency list?", options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V²)'], answer: 2, explain: "One list per vertex plus one entry per edge (two if undirected)." },
        { q: "For \"course a requires course b\", which edge models it?", options: ['a → b or b → a — either, as long as you are consistent about what the direction means', 'Only undirected', 'No edge', 'A self-loop'], answer: 0, explain: "The convention b → a means \"b must come before a\". Pick one and stay consistent." },
      ],
      problems: [207, 200],
      terms: ['directed-graph', 'undirected-graph', 'node', 'path'],
      verbal: "\"First I'll build an adjacency list from the edges — O(V + E) — so each traversal step only looks at real neighbors.\"",
    },
    {
      id: 'traversal',
      title: 'BFS, DFS, visited sets, connected components, grid traversal, shortest paths, and cycles',
      summary: 'The same traversals as trees — plus a visited set, because graphs can loop back.',
      what: "Graph BFS/DFS are tree traversals plus a **visited** set: graphs may have cycles and multiple paths to a vertex, so without marking you'd loop forever or repeat work.\n\n- **Connected component**: a maximal set of vertices all reachable from each other. Count components by starting a traversal from every unvisited vertex.\n- **Shortest path in an unweighted graph**: BFS — the first time you reach a vertex is via the fewest edges.\n- **Multi-source BFS**: start with several sources in the queue at once (Rotting Oranges).\n- **Cycle detection**: undirected — reaching a visited vertex that isn't your parent. Directed — reaching a vertex still on the current DFS path (\"visiting\" state), or Kahn's algorithm failing to process every vertex.",
      why: "Number of Islands, Flood Fill, Rotting Oranges, and Course Schedule are all this lesson. One template, small variations.",
      how: [
        "Grid DFS: if out of bounds or not land or visited → return; mark visited; recurse on 4 neighbors.",
        "Components: `for each cell: if land and not visited: count += 1; dfs(cell)`.",
        "BFS shortest steps: queue of (node, dist); mark visited when enqueuing.",
        "Kahn's topological sort: compute indegrees, queue all indegree-0 vertices, pop and decrement neighbors; if processed < V → cycle.",
      ],
      visual: {
        kind: 'grid',
        title: 'Counting islands: each unvisited land cell starts a flood fill',
        steps: [
          { grid: [['1', '1', '0', '0'], ['1', '0', '0', '1'], ['0', '0', '1', '1']], note: 'How many islands? Scan row by row, left to right.' },
          { grid: [['A', 'A', '0', '0'], ['A', '0', '0', '1'], ['0', '0', '1', '1']], highlight: [[0, 0], [0, 1], [1, 0]], vars: { islands: '1' }, note: '(0,0) is unvisited land → island #1. DFS marks its whole component (A).' },
          { grid: [['A', 'A', '0', '0'], ['A', '0', '0', 'B'], ['0', '0', 'B', 'B']], highlight: [[1, 3], [2, 3], [2, 2]], vars: { islands: '2' }, note: '(1,3) is unvisited land → island #2; DFS marks (2,3) and (2,2). Diagonals do not count — only 4 directions.' },
          { grid: [['A', 'A', '0', '0'], ['A', '0', '0', 'B'], ['0', '0', 'B', 'B']], vars: { islands: '2' }, note: 'The scan continues but finds no unvisited land: total 2 islands. Each cell is visited a constant number of times → O(rows · cols).' },
        ],
      },
      code: py`
from collections import deque

def num_islands(grid):
    grid = [list(row) for row in grid]           # copy so we can mark visited
    rows, cols = len(grid), len(grid[0])
    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "#"                        # mark visited
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
    return count

assert num_islands(["1100", "1001", "0011"]) == 2
assert num_islands(["11000", "11000", "00100", "00011"]) == 3

def flood_fill(image, sr, sc, color):
    old = image[sr][sc]
    if old == color:
        return image                            # guard against infinite loop
    stack = [(sr, sc)]
    while stack:
        r, c = stack.pop()
        if 0 <= r < len(image) and 0 <= c < len(image[0]) and image[r][c] == old:
            image[r][c] = color
            stack.extend([(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)])
    return image

assert flood_fill([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2) == [[2, 2, 2], [2, 2, 0], [2, 0, 1]]

def oranges_rotting(grid):
    rows, cols = len(grid), len(grid[0])
    q, fresh = deque(), 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2: q.append((r, c))
            elif grid[r][c] == 1: fresh += 1
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):                 # one minute = one BFS level
            r, c = q.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1

assert oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) == 4
assert oranges_rotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]]) == -1

def can_finish(num_courses, prerequisites):
    adj = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for course, pre in prerequisites:
        adj[pre].append(course)
        indeg[course] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    taken = 0
    while q:
        u = q.popleft()
        taken += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return taken == num_courses                 # False -> a cycle blocked some courses

assert can_finish(2, [[1, 0]]) and not can_finish(2, [[1, 0], [0, 1]])
`,
      codeNotes: [
        "Marking a cell as '#' doubles as the visited set — mention that it mutates input (copy if not allowed).",
        "Flood Fill's `old == color` guard prevents re-pushing cells forever.",
        "Kahn's algorithm: a vertex enters the queue only when all its prerequisites are done; a cycle keeps some indegrees above 0 forever.",
      ],
      complexity: {
        time: 'Grid problems O(rows · cols); graph BFS/DFS and Kahn O(V + E)',
        space: 'O(rows · cols) worst case for stack/queue; O(V + E) for graph + O(V) visited/queue',
        derivation: [
          "Each cell/vertex is marked once and never processed again → O(V).",
          "Each edge (or each of a cell's 4 neighbor checks) is examined a constant number of times → O(E). Total O(V + E).",
          "Recursive grid DFS can go as deep as the number of land cells (a snake-shaped island) → O(rows · cols) stack.",
          "BFS queue can hold a whole frontier — up to O(V).",
        ],
      },
      whenToUse: [
        "\"Connected\", \"islands\", \"regions\", \"spread\" → BFS/DFS on a grid.",
        "\"Minimum steps / shortest path\" with unweighted moves → BFS.",
        "\"Can all tasks be completed / ordering with dependencies\" → topological sort / cycle detection.",
      ],
      mistakes: [
        "Marking visited when dequeuing instead of enqueuing (duplicates in the queue).",
        "Missing bounds checks or checking them after indexing.",
        "Using DFS for shortest path in an unweighted graph (DFS finds A path, not the shortest).",
      ],
      checks: [
        { q: "Why does BFS find shortest paths in unweighted graphs?", options: ['It uses a stack', 'It reaches vertices in increasing order of edge distance', 'It visits fewer nodes', 'It sorts edges'], answer: 1, explain: "All distance-d vertices are processed before any distance-(d+1) vertex." },
        { q: "Number of Islands on an m × n grid runs in…", options: ['O(m + n)', 'O(m · n)', 'O((m · n)²)', 'O(log(m · n))'], answer: 1, explain: "Each cell is visited a constant number of times." },
        { q: "In Kahn's algorithm, what signals a cycle?", options: ['The queue is empty at the start', 'Fewer than V vertices are processed', 'A vertex has indegree 0', 'The graph is undirected'], answer: 1, explain: "Vertices on a cycle never reach indegree 0." },
      ],
      problems: [200, 733, 994, 207],
      terms: ['bfs', 'dfs', 'visited', 'connected-component', 'shortest-path', 'cycle'],
      verbal: "\"Every unvisited land cell starts a new island; I flood-fill it so it isn't counted again. Each cell is processed once — O(m · n) time, O(m · n) worst-case stack.\"",
    },
  ],
};
