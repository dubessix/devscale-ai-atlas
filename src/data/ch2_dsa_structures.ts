import type { Lesson } from '../types/course';

export const CH2_DSA_STRUCTURES: Lesson[] = [
  {
    id: 'dsa-stacks-queues',
    moduleId: 'dsa-structures',
    num: 1,
    title: 'Stacks, Queues & Monotonic Patterns',
    subtitle: 'LIFO recursion stacks, FIFO job buffers, and O(n) Monotonic Stacks for span/stock problems.',
    duration: '11 min',
    level: 'Beginner',
    goals: [
      'Stack (LIFO) for brackets, undo history, and function call frames',
      'Queue / Deque (FIFO) for BFS, task buffers, and streaming backpressure',
      'Monotonic Stack to find next-greater elements in O(n)',
    ],
    controls: [
      { id: 'order', label: 'Structure', type: 'segmented', options: [{ label: 'Stack (LIFO)', value: 'stack' }, { label: 'Queue (FIFO)', value: 'queue' }], defaultValue: 'stack' },
    ],
    codeTrace: {
      title: 'Monotonic Decreasing Stack (Next Greater)',
      ts: [
        'const stack: number[] = []; // stores indices',
        'for (let i = 0; i < temps.length; i++) {',
        '  while (stack.length && temps[i] > temps[stack.at(-1)!]) {',
        '    const prevIdx = stack.pop()!;',
        '    ans[prevIdx] = i - prevIdx;',
        '  }',
        '  stack.push(i);',
        '}',
      ],
      py: [
        'stack = []  # monotonic indices',
        'for i, t in enumerate(temps):',
        '    while stack and t > temps[stack[-1]]:',
        '        prev = stack.pop()',
        '        ans[prev] = i - prev',
        '    stack.append(i)',
      ],
    },
    feynman: {
      prompt: 'When do you use a Stack vs a Queue in real systems, and why does a Monotonic Stack stay O(n)?',
      checkpoints: [
        { label: 'Stack is LIFO (last-in first-out: calls, parsing, undo)', keywords: ['lifo', 'stack', 'last', 'top', 'pop', 'undo', 'call'] },
        { label: 'Queue is FIFO (first-in first-out: jobs, BFS, buffering)', keywords: ['fifo', 'queue', 'first', 'bfs', 'job', 'order'] },
        { label: 'Each element pushed and popped at most once -> O(n)', keywords: ['once', 'o(n)', 'push', 'pop', 'monotonic'] },
      ],
      sampleAnswer:
        'A Stack processes the newest item first (LIFO)—great for call frames, DFS, and bracket matching. A Queue processes oldest first (FIFO)—ideal for fair job queues and BFS. A Monotonic Stack stays O(n) because every element is pushed once and popped at most once.',
    },
    steps: [
      {
        id: 'sq-1',
        short: 'LIFO vs FIFO',
        chapter: 'setup',
        title: 'Two opposite ordering rules in computer science',
        paragraphs: [
          'A <span class="term">Stack</span> pops from the top (LIFO)—perfect for parsing JSON brackets and function call stacks.',
          'A <span class="term">Queue</span> dequeues from the front (FIFO)—powering RabbitMQ, Redis lists, and BFS shortest hops.',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: (p) => {
          const isStack = p.order !== 'queue';
          return {
            metrics: [
              { id: 'rule', label: 'Order', value: isStack ? 'LIFO (Top)' : 'FIFO (Front)', level: 'good' },
              { id: 'push', label: 'Push / Pop', value: 'O(1)', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'in', kind: 'box', x: 185, y: 225, label: isStack ? 'Push → [4]' : 'Enqueue → [4]', tone: 'sand', icon: 'code' },
                { id: 'buf', kind: 'arrayViz', x: 515, y: 225, label: isStack ? 'Stack (Top on Right)' : 'Queue (Front on Left)', arrayData: { cells: [1, 2, 3, 4], pointers: [{ index: isStack ? 3 : 0, label: isStack ? 'TOP' : 'HEAD', color: '#cfe3b2' }], highlights: [isStack ? 3 : 0], summary: isStack ? 'pop() => 4' : 'shift() => 1' } },
              ],
              links: [{ id: 'l1', from: 'in', to: 'buf', flow: { kind: 'request', rate: 1.1, speed: 1.4 } }],
              legend: [{ kind: 'request', label: isStack ? 'LIFO push/pop' : 'FIFO enqueue' }],
            },
          };
        },
      },
      {
        id: 'sq-2',
        short: 'Monotonic',
        chapter: 'technique',
        title: 'Monotonic Stack: next warmer day in O(n)',
        paragraphs: [
          'By keeping stack values sorted downward, any larger incoming value pops all smaller waiting indices at once—solving <i>Next Greater Element</i> in a single O(n) pass.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [2, 8], py: [2, 6] },
        evaluate: () => ({
          metrics: [
            { id: 'ops', label: 'Pushes + Pops', value: '≤ 2N (O(n))', level: 'good' },
            { id: 'cur', label: 'Triggered Pops', value: '75° > 71°', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'arr', kind: 'arrayViz', x: 400, y: 225, label: 'Temperatures Monotonic Stack', arrayData: { cells: [73, 74, 75, 71, 69, 72, 76], pointers: [{ index: 5, label: '72°', color: '#cfe3b2' }], highlights: [3, 4, 5], summary: '72° resolves 69° & 71°!' } },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'resolved in O(1) pop' }],
          },
        }),
      },
      {
        id: 'sq-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Choosing Stack, Queue, or Deque',
        paragraphs: [
          '✓ Need nested state, undo, or DFS? Reach for a <b>Stack</b>.',
          '✓ Need fair ordering, rate smoothing, or BFS? Use a <b>Queue / Ring Buffer</b>. Need Sliding-Window Max? Use a <b>Monotonic Deque</b>.',
        ],
        compare: {
          headers: ['Pattern', 'Structure', 'Complexity'],
          rows: [
            ['Bracket / AST Parser', 'Stack (LIFO)', 'O(n)'],
            ['BFS / Job Buffer', 'Queue / Deque', 'O(1) push/pop'],
            ['Next Greater / Span', 'Monotonic Stack', 'O(n) amortized'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 6] },
        evaluate: () => ({
          metrics: [{ id: 'c', label: 'Amortized Op', value: 'O(1) per item', level: 'good' }],
          scene: {
            nodes: [
              { id: 'st', kind: 'box', x: 265, y: 220, label: 'Stack (LIFO)', tone: 'green', icon: 'code', glow: 'good' },
              { id: 'qu', kind: 'box', x: 545, y: 220, label: 'Queue / Deque', tone: 'blue', icon: 'queue', glow: 'good' },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'O(n) total work' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-lru-linked',
    moduleId: 'dsa-structures',
    num: 2,
    title: 'Linked Lists & LRU Cache',
    subtitle: 'How a Doubly Linked List + Hash Map gives O(1) gets, O(1) puts, and instant eviction.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'Why arrays shift O(n) on middle delete while Linked Lists relink in O(1)',
      'Combining Hash Map + Doubly Linked List to build an LRU Cache',
      'How Redis & browser caches evict cold items in O(1)',
    ],
    controls: [
      { id: 'cap', label: 'Cache Cap', type: 'slider', min: 3, max: 6, step: 1, defaultValue: 4 },
      { id: 'hitKey', label: 'Access Key', type: 'segmented', options: [{ label: 'get("B")', value: 'B' }, { label: 'put("E")', value: 'E' }], defaultValue: 'B' },
    ],
    codeTrace: {
      title: 'O(1) LRU Cache Core',
      ts: [
        'get(key: string) {',
        '  const node = this.map.get(key);',
        '  if (!node) return -1;',
        '  this.moveToFront(node); // O(1) pointer unlink + attach',
        '  return node.val;',
        '}',
      ],
      py: [
        'def get(self, key: str):',
        '    if key not in self.map: return -1',
        '    node = self.map[key]',
        '    self._move_to_front(node)  # O(1) unlink + link',
        '    return node.val',
      ],
    },
    feynman: {
      prompt: 'Why does an LRU Cache need BOTH a Hash Map and a Doubly Linked List?',
      checkpoints: [
        { label: 'Hash Map provides O(1) lookup by key', keywords: ['hash', 'map', 'o(1)', 'lookup', 'find'] },
        { label: 'Doubly Linked List moves / evicts nodes in O(1)', keywords: ['doubly', 'linked', 'unlink', 'evict', 'front', 'tail', 'order'] },
      ],
      sampleAnswer:
        'A Hash Map alone finds keys in O(1) but doesn’t track recency order. A Doubly Linked List tracks recency order and lets us unlink a middle node and move it to the head (or evict the tail) in O(1) pointer swaps once the map hands us the node reference.',
    },
    steps: [
      {
        id: 'lru-1',
        short: 'Why Linked List',
        chapter: 'problem',
        title: 'Why arrays choke when reordering middle cache items',
        paragraphs: [
          'If you keep recency order inside a plain array, promoting a middle key forces <code class="inline-code">O(n)</code> element shifting on every single cache hit.',
          'With a <span class="term">Doubly Linked List</span>, flipping 4 <code class="inline-code">prev/next</code> pointers moves any node to Head in <code class="inline-code">O(1)</code>!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'arr', label: 'Array Reorder', value: 'O(n) Shift', level: 'bad' },
            { id: 'dll', label: 'DLL Pointer Swap', value: 'O(1) Instant', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'a', kind: 'graphNode', x: 205, y: 225, label: 'Head', sublabel: 'MRU', graphState: { status: 'path' } },
              { id: 'b', kind: 'graphNode', x: 395, y: 225, label: 'Node B', sublabel: 'prev↔next', graphState: { status: 'frontier', badge: 'O(1)' } },
              { id: 'c', kind: 'graphNode', x: 585, y: 225, label: 'Tail', sublabel: 'LRU evict', graphState: { status: 'visited' } },
            ],
            links: [
              { id: 'e1', from: 'a', to: 'b', bidirectional: true, flow: { kind: 'response', rate: 1, speed: 1.3 } },
              { id: 'e2', from: 'b', to: 'c', bidirectional: true, flow: { kind: 'request', rate: 1, speed: 1.3 } },
            ],
            legend: [{ kind: 'response', label: 'O(1) pointer relink' }],
          },
        }),
      },
      {
        id: 'lru-2',
        short: 'Map + DLL',
        chapter: 'solution',
        title: 'Two structures, one O(1) powerhouse',
        paragraphs: [
          'Toggle <b>Access Key</b> between <code class="inline-code">get("B")</code> (promotes B to Head!) and <code class="inline-code">put("E")</code> (evicts Tail!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: (p) => {
          const isPut = p.hitKey === 'E';
          return {
            metrics: [
              { id: 'get', label: 'get / put', value: 'O(1)', level: 'good' },
              { id: 'cap', label: 'Capacity', value: `${p.cap} / ${p.cap}`, level: isPut ? 'warn' : 'good' },
              { id: 'ev', label: 'Evicted', value: isPut ? 'Key "D" (LRU)' : 'None', level: isPut ? 'warn' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'hm', kind: 'box', x: 185, y: 225, label: 'Hash Map', sublabel: isPut ? 'add E, del D' : 'ptr → node B', tone: 'violet', icon: 'cache' },
                { id: 'dll', kind: 'arrayViz', x: 535, y: 225, label: 'Doubly Linked List (MRU → LRU)', arrayData: { cells: isPut ? ['E', 'A', 'B', 'C'] : ['B', 'A', 'C', 'D'], pointers: [{ index: 0, label: 'MRU', color: '#cfe3b2' }, { index: 3, label: 'LRU', color: '#f8d5cf' }], highlights: [0], summary: isPut ? 'evicted D from tail!' : 'B promoted to head!' } },
              ],
              links: [{ id: 'l1', from: 'hm', to: 'dll', label: 'O(1) node ref', flow: { kind: 'response', rate: 1.1, speed: 1.5 } }],
              legend: [{ kind: 'response', label: 'O(1) relink' }],
            },
          };
        },
      },
      {
        id: 'lru-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Real-World LRU & Fast/Slow Pointers',
        paragraphs: [
          '✓ In JS, <code class="inline-code">Map</code> preserves insertion order—or use a Hash Map + Doubly Linked List in Python (<code class="inline-code">OrderedDict</code>), Go, and Redis.',
          '✓ Also remember <b>Floyd’s Fast/Slow Pointers</b> for Linked List middle-finding & cycle detection in <code class="inline-code">O(1)</code> space!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'ops', label: 'All Ops', value: 'O(1)', level: 'good' }],
          scene: {
            nodes: [{ id: 'lru', kind: 'box', x: 400, y: 225, label: 'LRU Cache', sublabel: 'Map + Doubly Linked List', tone: 'green', icon: 'cache', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'O(1) eviction' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-trees-tries',
    moduleId: 'dsa-structures',
    num: 3,
    title: 'Trees, BSTs & Autocomplete Tries',
    subtitle: 'Hierarchical recursion, sorted Binary Search Trees, and prefix Tries for instant search.',
    duration: '12 min',
    level: 'Intermediate',
    goals: [
      'DFS (Pre/In/Post-order) vs Level-Order BFS on trees',
      'Balanced BSTs keeping search/insert at O(log n)',
      'Prefix Tries matching autocomplete queries in O(word length)',
    ],
    controls: [
      { id: 'view', label: 'Tree Type', type: 'segmented', options: [{ label: 'BST (Sorted)', value: 'bst' }, { label: 'Trie ("app")', value: 'trie' }], defaultValue: 'bst' },
    ],
    codeTrace: {
      title: 'Trie Prefix Lookup O(L)',
      ts: [
        'startsWith(prefix: string): boolean {',
        '  let node = this.root;',
        '  for (const ch of prefix) {',
        '    if (!node.children[ch]) return false;',
        '    node = node.children[ch];',
        '  }',
        '  return true; // O(prefix.length) regardless of 10M words!',
        '}',
      ],
      py: [
        'def starts_with(self, prefix: str) -> bool:',
        '    node = self.root',
        '    for ch in prefix:',
        '        if ch not in node.children: return False',
        '        node = node.children[ch]',
        '    return True',
      ],
    },
    feynman: {
      prompt: 'Why is a Trie faster than scanning a list for autocomplete, and what keeps a BST at O(log n)?',
      checkpoints: [
        { label: 'Trie shares prefix characters -> O(prefix length)', keywords: ['trie', 'prefix', 'char', 'length', 'shared'] },
        { label: 'BST places smaller keys left, larger right (balanced)', keywords: ['bst', 'left', 'right', 'smaller', 'larger', 'balanc'] },
      ],
      sampleAnswer:
        'A Trie walks one character per edge, so searching a prefix takes O(L) time regardless of whether the dictionary holds 1,000 or 10 million words. A BST puts smaller values left and larger values right—when balanced, every hop halves remaining nodes for O(log n) search.',
    },
    steps: [
      {
        id: 'tt-1',
        short: 'DFS Orders',
        chapter: 'setup',
        title: 'Every tree traversal is Pre, In, Post, or Level-Order',
        paragraphs: [
          '<b>Pre-order</b> processes root first (cloning trees); <b>In-order</b> visits a BST in sorted ascending order; <b>Post-order</b> aggregates children bottom-up (directory disk sizes); <b>BFS</b> scans level by level.',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 4], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'dfs', label: 'DFS Stack Space', value: 'O(height)', level: 'good' },
            { id: 'in', label: 'BST In-Order', value: '10, 20, 25, 50, 75', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'n50', kind: 'graphNode', x: 400, y: 100, label: '50', graphState: { status: 'visited', badge: 'root' } },
              { id: 'n20', kind: 'graphNode', x: 265, y: 215, label: '20', graphState: { status: 'frontier' } },
              { id: 'n75', kind: 'graphNode', x: 535, y: 215, label: '75', graphState: { status: 'unvisited' } },
              { id: 'n10', kind: 'graphNode', x: 185, y: 330, label: '10', graphState: { status: 'path' } },
              { id: 'n25', kind: 'graphNode', x: 345, y: 330, label: '25', graphState: { status: 'visited' } },
            ],
            links: [
              { id: 'e1', from: 'n50', to: 'n20', flow: { kind: 'request', rate: 1, speed: 1.4 } },
              { id: 'e2', from: 'n50', to: 'n75', dashed: true },
              { id: 'e3', from: 'n20', to: 'n10', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e4', from: 'n20', to: 'n25', dashed: true },
            ],
            legend: [{ kind: 'response', label: 'sorted DFS traversal' }],
          },
        }),
      },
      {
        id: 'tt-2',
        short: 'BST vs Trie',
        chapter: 'technique',
        title: 'Branching structures cut search space fast',
        paragraphs: [
          'Toggle <b>Tree Type</b> between <span class="term">BST</span> (<code class="inline-code">O(log n)</code>) and <span class="term">Trie</span> (shared prefix nodes <code class="inline-code">"a → p → p"</code> powering autocomplete & URL routers!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 6] },
        evaluate: (p) => {
          const isTrie = p.view === 'trie';
          if (isTrie) {
            return {
              metrics: [
                { id: 't', label: 'Trie Lookup', value: 'O(L) = 3 hops', level: 'good' },
                { id: 'dict', label: 'Dictionary', value: '1M words', level: 'neutral' },
              ],
              scene: {
                nodes: [
                  { id: 'r', kind: 'graphNode', x: 400, y: 95, label: 'root', graphState: { status: 'visited' } },
                  { id: 'a', kind: 'graphNode', x: 400, y: 185, label: 'a', graphState: { status: 'path' } },
                  { id: 'p1', kind: 'graphNode', x: 400, y: 275, label: 'p', graphState: { status: 'path' } },
                  { id: 'p2', kind: 'graphNode', x: 315, y: 365, label: 'p', sublabel: 'app / apple', graphState: { status: 'path', badge: 'end' } },
                  { id: 'i', kind: 'graphNode', x: 495, y: 365, label: 'i', sublabel: 'api', graphState: { status: 'unvisited' } },
                ],
                links: [
                  { id: 'e1', from: 'r', to: 'a', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                  { id: 'e2', from: 'a', to: 'p1', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                  { id: 'e3', from: 'p1', to: 'p2', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                  { id: 'e4', from: 'p1', to: 'i', dashed: true },
                ],
                legend: [{ kind: 'response', label: 'prefix path "app"' }],
              },
            };
          }
          return {
            metrics: [
              { id: 't', label: 'BST Search', value: 'O(log n)', level: 'good' },
              { id: 'tgt', label: 'Target', value: '25', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'n50', kind: 'graphNode', x: 400, y: 95, label: '50', graphState: { status: 'visited' } },
                { id: 'n20', kind: 'graphNode', x: 265, y: 205, label: '20', graphState: { status: 'path' } },
                { id: 'n75', kind: 'graphNode', x: 535, y: 205, label: '75', graphState: { status: 'unvisited' } },
                { id: 'n10', kind: 'graphNode', x: 185, y: 325, label: '10', graphState: { status: 'unvisited' } },
                { id: 'n25', kind: 'graphNode', x: 345, y: 325, label: '25', sublabel: 'FOUND!', graphState: { status: 'path', badge: 'hit' } },
              ],
              links: [
                { id: 'e1', from: 'n50', to: 'n20', label: '25 < 50', flow: { kind: 'response', rate: 1, speed: 1.4 } },
                { id: 'e2', from: 'n50', to: 'n75', dashed: true, dimmed: true },
                { id: 'e3', from: 'n20', to: 'n10', dashed: true, dimmed: true },
                { id: 'e4', from: 'n20', to: 'n25', label: '25 > 20', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              ],
              legend: [{ kind: 'response', label: 'O(log n) search path' }],
            },
          };
        },
      },
      {
        id: 'tt-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Watch Out for Skewed Trees!',
        paragraphs: [
          '✓ Inserting <code class="inline-code">1, 2, 3, 4...</code> into an unbalanced BST degrades it into an <code class="inline-code">O(n)</code> linked list—which is why databases use self-balancing <b>AVL / Red-Black / B-Trees</b>.',
        ],
        callout: { kind: 'warn', title: 'SKEW TRAP', text: 'Always check tree balance! Production DBs keep B-Tree depth ≤ 4 even at 100M rows.' },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 6] },
        evaluate: () => ({
          metrics: [{ id: 'bal', label: 'Balanced Height', value: 'O(log n)', level: 'good' }],
          scene: {
            nodes: [{ id: 'b', kind: 'box', x: 400, y: 225, label: 'Balanced Tree / Trie', sublabel: 'Predictable O(log n) / O(L)', tone: 'green', icon: 'search', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'balanced hierarchy' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-heaps-topk',
    moduleId: 'dsa-structures',
    num: 4,
    title: 'Heaps, Priority Queues & Top-K Streams',
    subtitle: 'Find the top K scores, merge sorted logs, or schedule urgent jobs in O(n log k) without full sorting.',
    duration: '11 min',
    level: 'Intermediate',
    goals: [
      'How a Min-Heap maintains the smallest element at index 0 inside a flat array',
      'Solving Streaming Top-K with a size-K Min-Heap in O(n log k)',
      'Using Priority Queues for Dijkstra, AI beam search, and task queues',
    ],
    controls: [
      { id: 'k', label: 'Top-K Window', type: 'slider', min: 3, max: 10, step: 1, defaultValue: 3 },
      { id: 'method', label: 'Method', type: 'segmented', options: [{ label: 'Full Sort O(n log n)', value: 'sort' }, { label: 'Min-Heap O(n log k)', value: 'heap' }], defaultValue: 'heap' },
    ],
    codeTrace: {
      title: 'Top-K Largest Elements with Size-K Min-Heap',
      ts: [
        'const minHeap = new MinPriorityQueue<number>();',
        'for (const score of stream) {',
        '  minHeap.enqueue(score);',
        '  if (minHeap.size() > k) minHeap.dequeue(); // kick out smallest!',
        '}',
        'return minHeap.toArray(); // exact Top-K in O(n log k)!',
      ],
      py: [
        'heap = []',
        'for score in stream:',
        '    heapq.heappush(heap, score)',
        '    if len(heap) > k:',
        '        heapq.heappop(heap)  # evict smallest; keep top k!',
        'return heap',
      ],
    },
    feynman: {
      prompt: 'Why do we use a Min-Heap (instead of a Max-Heap) of size K to keep the Top-K largest elements in a stream?',
      checkpoints: [
        { label: 'Root holds the K-th largest threshold so weak elements pop in O(log k)', keywords: ['min', 'smallest', 'root', 'pop', 'evict', 'threshold'] },
        { label: 'Saves RAM & time: O(k) space and O(n log k) vs O(n log n)', keywords: ['o(k)', 'o(n log k)', 'stream', 'memory', 'sort'] },
      ],
      sampleAnswer:
        'A Min-Heap of size K keeps the smallest of the top-K candidates right at the root. Whenever a new item arrives, we push it and pop the root if size exceeds K—evicting the weakest item in O(log k) while storing only K items in RAM.',
    },
    steps: [
      {
        id: 'hp-1',
        short: 'Array Tree',
        chapter: 'setup',
        title: 'A binary tree packed tightly into a plain array',
        paragraphs: [
          'A <span class="term">Binary Heap</span> stores no node pointers—parent <code class="inline-code">i</code> reaches left child at <code class="inline-code">2i+1</code> and right child at <code class="inline-code">2i+2</code> inside a cache-friendly array!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: () => ({
          metrics: [
            { id: 'peek', label: 'peekMin()', value: 'O(1) · arr[0]', level: 'good' },
            { id: 'push', label: 'push / pop', value: 'O(log k)', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'r', kind: 'graphNode', x: 400, y: 110, label: '42', sublabel: 'idx 0 (MIN)', graphState: { status: 'path', badge: 'root' } },
              { id: 'c1', kind: 'graphNode', x: 270, y: 230, label: '87', sublabel: 'idx 1', graphState: { status: 'visited' } },
              { id: 'c2', kind: 'graphNode', x: 530, y: 230, label: '91', sublabel: 'idx 2', graphState: { status: 'visited' } },
              { id: 'arr', kind: 'arrayViz', x: 400, y: 345, label: 'Underlying Heap Array', arrayData: { cells: [42, 87, 91, 95], pointers: [{ index: 0, label: 'min', color: '#cfe3b2' }], highlights: [0], summary: 'children of i = 2i+1, 2i+2' } },
            ],
            links: [
              { id: 'e1', from: 'r', to: 'c1', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e2', from: 'r', to: 'c2', flow: { kind: 'response', rate: 1, speed: 1.4 } },
            ],
            legend: [{ kind: 'response', label: 'heap invariant: parent ≤ children' }],
          },
        }),
      },
      {
        id: 'hp-2',
        short: 'Top-K Stream',
        chapter: 'solution',
        title: 'Evict weak scores in O(log k) as millions stream past',
        paragraphs: [
          'Compare sorting 1,000,000 RAG/search scores (<code class="inline-code">O(n log n)</code>, 20M ops + giant RAM) against a size-<code class="inline-code">K</code> Min-Heap (<code class="inline-code">O(n log k)</code>, tiny RAM!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [2, 6], py: [2, 6] },
        evaluate: (p) => {
          const isHeap = p.method === 'heap';
          const k = Number(p.k ?? 3);
          return {
            metrics: [
              { id: 'mem', label: 'RAM Held', value: isHeap ? `${k} items O(k)` : '1,000,000 items O(n)', level: isHeap ? 'good' : 'bad' },
              { id: 'cmp', label: 'Time (N=1M)', value: isHeap ? `O(n log ${k})` : 'O(n log n) Slow', level: isHeap ? 'good' : 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'st', kind: 'users', x: 155, y: 220, label: '1M Score Stream' },
                { id: 'hp', kind: 'box', x: 485, y: 220, label: isHeap ? `Size-${k} Min-Heap` : 'Full Array Sort', sublabel: isHeap ? 'pop min > k' : 'holds all 1M rows!', tone: isHeap ? 'green' : 'red', icon: 'filter', glow: isHeap ? 'good' : 'bad' },
              ],
              links: [{ id: 'l1', from: 'st', to: 'hp', flow: { kind: isHeap ? 'response' : 'heavy', rate: 1.5, speed: 1.5 } }],
              legend: [{ kind: isHeap ? 'response' : 'heavy', label: isHeap ? 'O(n log k) bounded' : 'O(n) memory spike' }],
            },
          };
        },
      },
      {
        id: 'hp-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: When to Reach for a Priority Queue',
        paragraphs: [
          '✓ Top-K leaderboard / K closest vector candidates / Merge K sorted streams / Dijkstra shortest path / LLM beam search.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 6] },
        evaluate: () => ({
          metrics: [{ id: 't', label: 'Top-K', value: 'O(n log k)', level: 'good' }],
          scene: {
            nodes: [{ id: 'pq', kind: 'box', x: 400, y: 225, label: 'Priority Queue / Heap', sublabel: 'O(1) peek · O(log k) push/pop', tone: 'green', icon: 'queue', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'priority heap' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-graphs-bfs-dijkstra',
    moduleId: 'dsa-structures',
    num: 5,
    title: 'Graphs: BFS, DFS & Shortest Paths',
    subtitle: 'Traversing networks, dependency DAGs, and weighted shortest paths with Dijkstra.',
    duration: '13 min',
    level: 'Intermediate',
    goals: [
      'BFS (Queue) for shortest unweighted hops vs DFS (Stack) for deep paths',
      'Avoiding infinite cycles with a Visited Set',
      'Weighted shortest path with Dijkstra + Min-Heap Priority Queue',
    ],
    controls: [
      { id: 'algo', label: 'Traversal', type: 'segmented', options: [{ label: 'BFS (Queue)', value: 'bfs' }, { label: 'Dijkstra (Heap)', value: 'dijk' }], defaultValue: 'bfs' },
    ],
    codeTrace: {
      title: 'BFS Shortest Hops O(V + E)',
      ts: [
        'const q = [start]; const seen = new Set([start]);',
        'while (q.length) {',
        '  const node = q.shift()!;',
        '  if (node === target) return dist[node];',
        '  for (const nxt of graph[node]) {',
        '    if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }',
        '  }',
        '}',
      ],
      py: [
        'q, seen = deque([start]), {start}',
        'while q:',
        '    node = q.popleft()',
        '    if node == target: return dist[node]',
        '    for nxt in graph[node]:',
        '        if nxt not in seen:',
        '            seen.add(nxt); q.append(nxt)',
      ],
    },
    feynman: {
      prompt: 'When does BFS guarantee the shortest path, and when do you have to upgrade to Dijkstra?',
      checkpoints: [
        { label: 'BFS finds fewest hops on unweighted graphs via Queue', keywords: ['bfs', 'queue', 'unweighted', 'hop', 'level'] },
        { label: 'Dijkstra handles weighted edge costs using a Min-Heap', keywords: ['dijkstra', 'weight', 'cost', 'heap', 'priority'] },
      ],
      sampleAnswer:
        'BFS explores outward level by level with a Queue, so it guarantees the shortest path when every edge has equal weight (1 hop). When edges have varying weights (like network latency ms), Dijkstra uses a Min-Heap to always expand the cheapest total path first.',
    },
    steps: [
      {
        id: 'gr-1',
        short: 'Cycles & Seen',
        chapter: 'problem',
        title: 'Why Graphs need a Visited Set (unlike Trees)',
        paragraphs: [
          'Trees flow strictly downward, so you can’t loop back. Graphs contain <span class="term">Cycles</span> (`A → B → C → A`), so without a <code class="inline-code">seen</code> Set your traversal loops forever!',
        ],
        goalHits: [1],
        activeCodeLines: { ts: [1, 6], py: [1, 7] },
        evaluate: () => ({
          metrics: [
            { id: 'c', label: 'Without Seen Set', value: 'Infinite Loop!', level: 'bad' },
            { id: 'w', label: 'With Seen Set', value: 'O(V + E) Exact', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'A', kind: 'graphNode', x: 245, y: 225, label: 'A', sublabel: 'in seen', graphState: { status: 'visited', badge: '✓' } },
              { id: 'B', kind: 'graphNode', x: 400, y: 120, label: 'B', sublabel: 'in seen', graphState: { status: 'visited', badge: '✓' } },
              { id: 'C', kind: 'graphNode', x: 555, y: 225, label: 'C', sublabel: 'blocks A cycle', graphState: { status: 'frontier' } },
            ],
            links: [
              { id: 'e1', from: 'A', to: 'B', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e2', from: 'B', to: 'C', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e3', from: 'C', to: 'A', label: 'seen! skip', dashed: true },
            ],
            legend: [{ kind: 'response', label: 'cycle-guarded graph' }],
          },
        }),
      },
      {
        id: 'gr-2',
        short: 'BFS vs Dijkstra',
        chapter: 'technique',
        title: 'Explore waves with BFS — or cheapest latency with Dijkstra',
        paragraphs: [
          'Switch between <b>BFS (Queue)</b> for fewest hops and <b>Dijkstra (Heap)</b> when edge weights matter (like finding the lowest-latency route across data centers!).',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 7] },
        evaluate: (p) => {
          const isDijk = p.algo === 'dijk';
          return {
            metrics: [
              { id: 'al', label: 'Algorithm', value: isDijk ? 'Dijkstra Heap' : 'Level-Order BFS', level: 'good' },
              { id: 'cost', label: 'Best Path A→D', value: isDijk ? '14 ms (A→C→D)' : '2 hops (A→B→D)', level: 'good' },
              { id: 'cplx', label: 'Time', value: isDijk ? 'O((V+E) log V)' : 'O(V + E)', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'A', kind: 'graphNode', x: 165, y: 225, label: 'A', sublabel: 'start', graphState: { status: 'path', badge: '0' } },
                { id: 'B', kind: 'graphNode', x: 395, y: 120, label: 'B', graphState: { status: isDijk ? 'visited' : 'path', badge: isDijk ? '12ms' : '1 hop' } },
                { id: 'C', kind: 'graphNode', x: 395, y: 330, label: 'C', graphState: { status: isDijk ? 'path' : 'frontier', badge: isDijk ? '4ms' : '1 hop' } },
                { id: 'D', kind: 'graphNode', x: 625, y: 225, label: 'D', sublabel: 'target', graphState: { status: 'path', badge: isDijk ? '14ms' : '2 hops' } },
              ],
              links: [
                { id: 'ab', from: 'A', to: 'B', label: isDijk ? '12 ms' : '1', flow: !isDijk ? { kind: 'response', rate: 1, speed: 1.4 } : undefined },
                { id: 'ac', from: 'A', to: 'C', label: isDijk ? '4 ms' : '1', flow: isDijk ? { kind: 'response', rate: 1, speed: 1.5 } : undefined },
                { id: 'bd', from: 'B', to: 'D', label: isDijk ? '15 ms' : '1', flow: !isDijk ? { kind: 'response', rate: 1, speed: 1.4 } : undefined },
                { id: 'cd', from: 'C', to: 'D', label: isDijk ? '10 ms' : '1', flow: isDijk ? { kind: 'response', rate: 1, speed: 1.5 } : undefined },
              ],
              legend: [{ kind: 'response', label: isDijk ? 'lowest weighted cost' : 'fewest hops' }],
            },
          };
        },
      },
      {
        id: 'gr-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Graph Algorithm Selector',
        paragraphs: [
          '✓ Unweighted shortest path → <b>BFS</b>. Weighted non-negative path → <b>Dijkstra</b>. Build/task order in a DAG → <b>Topological Sort (Kahn’s Queue)</b>.',
        ],
        compare: {
          headers: ['Goal', 'Algorithm', 'Time'],
          rows: [
            ['Fewest Hops', 'BFS (Queue)', 'O(V + E)'],
            ['Cheapest Weighted Route', 'Dijkstra (Min-Heap)', 'O((V+E) log V)'],
            ['Dependency Ordering', 'Topological Sort', 'O(V + E)'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 7] },
        evaluate: () => ({
          metrics: [{ id: 'g', label: 'Graph Ready', value: 'BFS · DFS · Dijkstra', level: 'good' }],
          scene: {
            nodes: [{ id: 'g', kind: 'box', x: 400, y: 225, label: 'Graph Toolkit', sublabel: 'O(V+E) / O((V+E) log V)', tone: 'green', icon: 'vector', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'optimal graph path' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-backtracking-unionfind',
    moduleId: 'dsa-structures',
    num: 6,
    title: 'Backtracking & Union-Find (DSU)',
    subtitle: 'Prune combinatorial decision trees with Backtracking and merge connected groups in ~O(1) with Union-Find.',
    duration: '12 min',
    level: 'Mastery',
    goals: [
      'Choose → Explore → Unchoose (Undo) recursion template for Backtracking',
      'Pruning invalid branches early instead of generating dead permutations',
      'Disjoint Set Union (Union-Find) with Path Compression for O(α(n)) ≈ O(1) connectivity',
    ],
    controls: [
      { id: 'pattern', label: 'Pattern', type: 'segmented', options: [{ label: 'Backtracking Tree', value: 'bt' }, { label: 'Union-Find (DSU)', value: 'dsu' }], defaultValue: 'bt' },
    ],
    codeTrace: {
      title: 'Backtracking Template + DSU find()',
      ts: [
        'function backtrack(path: number[], start: number) {',
        '  if (path.length === k) return res.push([...path]);',
        '  for (let i = start; i < nums.length; i++) {',
        '    path.push(nums[i]);   // 1. Choose',
        '    backtrack(path, i+1); // 2. Explore',
        '    path.pop();           // 3. Unchoose (Backtrack!)',
        '  }',
        '}',
      ],
      py: [
        'def find(x: int) -> int:',
        '    if parent[x] != x:',
        '        parent[x] = find(parent[x])  # Path compression!',
        '    return parent[x]',
      ],
    },
    feynman: {
      prompt: 'How do Choose-Explore-Unchoose in Backtracking and Path Compression in Union-Find work?',
      checkpoints: [
        { label: 'Backtracking tries a choice, recurses, then pops/undoes to reuse state', keywords: ['choose', 'pop', 'undo', 'prun', 'backtrack', 'state'] },
        { label: 'Union-Find flattens parent pointers on find() for near-O(1) connectivity checks', keywords: ['parent', 'compress', 'root', 'union', 'find', 'connect'] },
      ],
      sampleAnswer:
        'Backtracking walks a decision tree using Choose → Explore → Unchoose (popping the last choice so the next branch starts clean, and pruning invalid branches immediately). Union-Find tracks connected groups via parent pointers and flattens trees directly to the root on find() (Path Compression) so `connected(u, v)` runs in near-O(1) time.',
    },
    steps: [
      {
        id: 'bt-1',
        short: 'Choose & Undo',
        chapter: 'technique',
        title: 'Explore decision trees cleanly without copying arrays',
        paragraphs: [
          'Every backtracking solver follows 3 lines: <span class="term">Choose</span> (<code class="inline-code">path.push</code>), <span class="term">Explore</span> (recurse), and <span class="term">Unchoose</span> (<code class="inline-code">path.pop</code>).',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 8], py: [1, 4] },
        evaluate: (p) => {
          const isDsu = p.pattern === 'dsu';
          if (isDsu) {
            return {
              metrics: [
                { id: 'op', label: 'find() / union()', value: 'O(α(n)) ≈ O(1)', level: 'good' },
                { id: 'comp', label: 'Components', value: '2 Merged Groups', level: 'good' },
              ],
              scene: {
                nodes: [
                  { id: 'r1', kind: 'graphNode', x: 285, y: 120, label: 'Root 1', graphState: { status: 'path', badge: 'rep' } },
                  { id: 'n2', kind: 'graphNode', x: 205, y: 255, label: '2', sublabel: 'path-compressed', graphState: { status: 'visited' } },
                  { id: 'n3', kind: 'graphNode', x: 365, y: 255, label: '3', graphState: { status: 'visited' } },
                  { id: 'r4', kind: 'graphNode', x: 565, y: 185, label: 'Root 4', graphState: { status: 'frontier', badge: 'rep' } },
                ],
                links: [
                  { id: 'e1', from: 'n2', to: 'r1', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                  { id: 'e2', from: 'n3', to: 'r1', flow: { kind: 'response', rate: 1, speed: 1.5 } },
                ],
                legend: [{ kind: 'response', label: 'path-compressed parent link' }],
              },
            };
          }
          return {
            metrics: [
              { id: 'pat', label: 'Pattern', value: 'Choose → Explore → Pop', level: 'good' },
              { id: 'prune', label: 'Pruned Dead Paths', value: 'Saved 75% Search', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'root', kind: 'graphNode', x: 400, y: 100, label: '[]', graphState: { status: 'visited' } },
                { id: 'a', kind: 'graphNode', x: 245, y: 215, label: '[1]', graphState: { status: 'path' } },
                { id: 'b', kind: 'graphNode', x: 555, y: 215, label: '[2]', sublabel: 'pruned!', graphState: { status: 'unvisited' } },
                { id: 'a1', kind: 'graphNode', x: 165, y: 335, label: '[1,2]', sublabel: 'VALID', graphState: { status: 'path', badge: '✓' } },
                { id: 'a2', kind: 'graphNode', x: 325, y: 335, label: '[1,3]', sublabel: 'VALID', graphState: { status: 'path', badge: '✓' } },
              ],
              links: [
                { id: 'e1', from: 'root', to: 'a', flow: { kind: 'response', rate: 1, speed: 1.4 } },
                { id: 'e2', from: 'root', to: 'b', dashed: true, dimmed: true },
                { id: 'e3', from: 'a', to: 'a1', flow: { kind: 'response', rate: 1, speed: 1.4 } },
                { id: 'e4', from: 'a', to: 'a2', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              ],
              legend: [{ kind: 'response', label: 'valid recursion branch' }],
            },
          };
        },
      },
      {
        id: 'bt-2',
        short: 'Union-Find',
        chapter: 'solution',
        title: 'Dynamic grouping & cycle detection with DSU',
        paragraphs: [
          'When edges arrive one by one (social friend circles, Kruskal MST, network outages), <span class="term">Union-Find</span> answers <i>“Are A and B connected?”</i> in practically <code class="inline-code">O(1)</code> time.',
        ],
        goalHits: [2],
        activeCodeLines: { ts: [1, 4], py: [1, 4] },
        evaluate: () => ({
          metrics: [
            { id: 'find', label: 'Path Compression', value: 'Depth → 1 hop', level: 'good' },
            { id: 'rank', label: 'Union by Rank', value: 'Balanced Merge', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'r1', kind: 'graphNode', x: 265, y: 120, label: 'Root A', sublabel: 'rank 2', graphState: { status: 'path', badge: 'rep' } },
              { id: 'b', kind: 'graphNode', x: 175, y: 260, label: 'Node B', sublabel: 'find→A', graphState: { status: 'visited' } },
              { id: 'c', kind: 'graphNode', x: 355, y: 260, label: 'Node C', sublabel: 'find→A', graphState: { status: 'visited' } },
              { id: 'd', kind: 'graphNode', x: 585, y: 190, label: 'Root D', sublabel: 'union(A,D)', graphState: { status: 'frontier', badge: 'merge' } },
            ],
            links: [
              { id: 'e1', from: 'b', to: 'r1', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e2', from: 'c', to: 'r1', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'e3', from: 'd', to: 'r1', label: 'O(α(n)) link', dashed: true, flow: { kind: 'ai', rate: 0.9, speed: 1.5 } },
            ],
            legend: [{ kind: 'response', label: 'path-compressed root' }, { kind: 'ai', label: 'union-by-rank merge' }],
          },
        }),
      },
      {
        id: 'bt-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Combinatorics vs Dynamic Connectivity',
        paragraphs: [
          '✓ Need all valid subsets/permutations/boards? <b>Backtracking + Early Pruning</b>.',
          '✓ Need fast dynamic group merges or undirected cycle checks? <b>Union-Find (Path Compression + Union by Rank)</b>.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 8], py: [1, 4] },
        evaluate: () => ({
          metrics: [{ id: 'ok', label: 'Mastered', value: 'Backtrack + DSU', level: 'good' }],
          scene: {
            nodes: [
              { id: 'bt', kind: 'box', x: 255, y: 220, label: 'Backtracking', tone: 'green', icon: 'code' },
              { id: 'ds', kind: 'box', x: 545, y: 220, label: 'Union-Find', tone: 'violet', icon: 'vector' },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'recursion & sets' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-dp-memo',
    moduleId: 'dsa-structures',
    num: 7,
    title: 'Dynamic Programming & Memoization',
    subtitle: 'Eliminate exponential O(2ⁿ) recursion trees by caching subproblems inside a DP table.',
    duration: '13 min',
    level: 'Mastery',
    goals: [
      'Spotting overlapping subproblems in naive recursion',
      'Top-down Memoization vs Bottom-up DP Table filling',
      'Visualizing state transitions inside a 2D DP grid',
    ],
    controls: [
      { id: 'mode', label: 'Approach', type: 'segmented', options: [{ label: 'Naive O(2ⁿ)', value: 'exp' }, { label: 'DP Table O(n·W)', value: 'dp' }], defaultValue: 'dp' },
    ],
    codeTrace: {
      title: 'Bottom-Up 2D DP Grid (Knapsack / Coin Change)',
      ts: [
        'for (let i = 1; i <= items.length; i++) {',
        '  for (let w = 1; w <= cap; w++) {',
        '    const skip = dp[i - 1][w];',
        '    const take = w >= wt ? val + dp[i - 1][w - wt] : 0;',
        '    dp[i][w] = Math.max(skip, take);',
        '  }',
        '}',
      ],
      py: [
        'for i in range(1, len(items) + 1):',
        '    for w in range(1, cap + 1):',
        '        skip = dp[i - 1][w]',
        '        take = val + dp[i - 1][w - wt] if w >= wt else 0',
        '        dp[i][w] = max(skip, take)',
      ],
    },
    feynman: {
      prompt: 'What two properties tell you a problem fits Dynamic Programming, and how does a DP table collapse O(2ⁿ)?',
      checkpoints: [
        { label: 'Mentions overlapping subproblems & optimal substructure', keywords: ['overlap', 'subproblem', 'optimal', 'repeat', 'reuse'] },
        { label: 'Stores solved answers in memo / dp table so each state runs once', keywords: ['memo', 'table', 'cache', 'once', 'dp'] },
      ],
      sampleAnswer:
        'Dynamic Programming applies when a problem has optimal substructure and overlapping subproblems that get recomputed thousands of times in recursion. Storing each state in a memo cache or bottom-up DP table ensures each cell computes only once, shrinking O(2ⁿ) to polynomial time.',
    },
    steps: [
      {
        id: 'dp-1',
        short: 'The Trap',
        chapter: 'problem',
        title: 'Why naive recursion explodes to 1 Billion calls at N=30',
        paragraphs: [
          'Without caching, computing <code class="inline-code">solve(i, w)</code> recalculates the exact same smaller states millions of times—growing <code class="inline-code">O(2ⁿ)</code>!',
        ],
        goalHits: [0],
        activeCodeLines: { ts: [3, 5], py: [3, 5] },
        evaluate: () => ({
          metrics: [
            { id: 'c', label: 'Naive Tree', value: 'O(2ⁿ) Blowup', level: 'bad' },
            { id: 'dup', label: 'Duplicate Calls', value: '> 99.9% Wasted!', level: 'bad' },
          ],
          scene: {
            nodes: [
              { id: 'f4', kind: 'graphNode', x: 400, y: 95, label: 'f(4)', graphState: { status: 'frontier' } },
              { id: 'f3', kind: 'graphNode', x: 265, y: 205, label: 'f(3)', graphState: { status: 'visited' } },
              { id: 'f2a', kind: 'graphNode', x: 535, y: 205, label: 'f(2)', sublabel: 'REPEATED!', graphState: { status: 'frontier', badge: 'dup' } },
              { id: 'f2b', kind: 'graphNode', x: 195, y: 325, label: 'f(2)', sublabel: 'REPEATED!', graphState: { status: 'frontier', badge: 'dup' } },
              { id: 'f1', kind: 'graphNode', x: 335, y: 325, label: 'f(1)', graphState: { status: 'visited' } },
            ],
            links: [
              { id: 'e1', from: 'f4', to: 'f3', flow: { kind: 'heavy', rate: 1, speed: 1.2 } },
              { id: 'e2', from: 'f4', to: 'f2a', flow: { kind: 'heavy', rate: 1, speed: 1.2 } },
              { id: 'e3', from: 'f3', to: 'f2b', flow: { kind: 'heavy', rate: 1, speed: 1.2 } },
              { id: 'e4', from: 'f3', to: 'f1', flow: { kind: 'heavy', rate: 1, speed: 1.2 } },
            ],
            legend: [{ kind: 'heavy', label: 'redundant exponential calls' }],
          },
        }),
      },
      {
        id: 'dp-2',
        short: 'DP Matrix',
        chapter: 'solution',
        title: 'Read parents instead of repeating exponential work',
        paragraphs: [
          'Every green cell <code class="inline-code">dp[i][w]</code> looks up just two already-solved amber cells above it—turning millions of recursive calls into a tiny grid.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 5] },
        evaluate: (p) => {
          const isExp = p.mode === 'exp';
          return {
            metrics: [
              { id: 'c', label: 'Complexity', value: isExp ? 'O(2ⁿ) Blowup' : 'O(n × W)', level: isExp ? 'bad' : 'good' },
              { id: 'calls', label: 'Subcalls (N=30)', value: isExp ? '1,073,741,824' : '150', level: isExp ? 'bad' : 'good' },
            ],
            scene: {
              nodes: [
                {
                  id: 'dp',
                  kind: 'matrixViz',
                  x: 400,
                  y: 230,
                  label: isExp ? 'Naive Recursion Recomputes Same States!' : '2D DP Table (Amber = Parent Lookups)',
                  matrixData: {
                    rowLabels: ['i=0', 'i=1', 'i=2', 'i=3'],
                    colLabels: ['w=0', 'w=1', 'w=2', 'w=3', 'w=4'],
                    values: [
                      [0, 0, 0, 0, 0],
                      [0, 1, 1, 1, 1],
                      [0, 1, 4, 5, 5],
                      [0, 1, 4, 5, 6],
                    ],
                    active: [3, 4],
                    deps: [
                      [2, 4],
                      [2, 1],
                    ],
                    formula: 'dp[3][4] = max(skip: dp[2][4]=5, take: 5 + dp[2][1]=6) = 6',
                  },
                },
              ],
              links: [],
              legend: [{ kind: 'response', label: 'O(1) cell transition' }],
            },
          };
        },
      },
      {
        id: 'dp-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: 4 Steps to Solve Any DP Problem',
        paragraphs: [
          '1. Define state clearly (<code class="inline-code">dp[i][w]</code>). 2. Write transition (<code class="inline-code">max(skip, take)</code>). 3. Set base cases (<code class="inline-code">i=0</code>). 4. Compress 2D → 1D rolling row if only previous row is needed!',
        ],
        compare: {
          headers: ['Style', 'Direction', 'Best For'],
          rows: [
            ['Memoization', 'Top-Down Recursion + Map', 'Sparse / irregular reachable states'],
            ['Tabulation', 'Bottom-Up For-Loops', 'Dense grids & 1D O(W) space optimization'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 5] },
        evaluate: () => ({
          metrics: [{ id: 'dp', label: 'DP Speedup', value: 'O(2ⁿ) → O(n·W)', level: 'good' }],
          scene: {
            nodes: [{ id: 'dp', kind: 'box', x: 400, y: 225, label: 'Memo + 1D/2D DP', sublabel: 'Every state solved once', tone: 'green', icon: 'code', glow: 'good' }],
            links: [],
            legend: [{ kind: 'response', label: 'polynomial DP' }],
          },
        }),
      },
    ],
  },
];
