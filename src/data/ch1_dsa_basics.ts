import type { Lesson } from '../types/course';

export const CH1_DSA_BASICS: Lesson[] = [
  {
    id: 'dsa-bigo-memory',
    moduleId: 'dsa-basics',
    num: 1,
    title: 'Memory, Stack vs Heap & Big-O Math',
    subtitle: 'How variables live in RAM — and why O(1), O(log n), O(n), and O(n²) behave radically differently at scale.',
    duration: '10 min',
    level: 'Beginner',
    goals: [
      'Stack (fast fixed frames) vs Heap (dynamic objects + GC)',
      'Why contiguous arrays get CPU cache-line speedups',
      'Comparing O(1), O(log n), O(n), and O(n²) as N grows 1,000×',
    ],
    controls: [
      { id: 'n', label: 'Input N', type: 'slider', min: 100, max: 10000, step: 100, defaultValue: 1000 },
      {
        id: 'curve',
        label: 'Big-O',
        type: 'segmented',
        options: [
          { label: 'O(log n)', value: 'log' },
          { label: 'O(n)', value: 'linear' },
          { label: 'O(n²)', value: 'quad' },
        ],
        defaultValue: 'log',
      },
    ],
    codeTrace: {
      title: 'Stack Frame vs Heap Allocation & Big-O Growth',
      ts: [
        'function inspectScale(arr: number[]) {',
        '  const first = arr[0];           // O(1) direct RAM offset',
        '  const found = binarySearch(arr); // O(log n) halves each step',
        '  for (const x of arr) { /* O(n) */ }',
        '  // Nested loop => O(n²): 10k items = 100,000,000 ops!',
        '}',
      ],
      py: [
        'def inspect_scale(arr: list[int]):',
        '    first = arr[0]              # O(1) pointer math',
        '    idx = bisect_left(arr, 42)  # O(log n) halving',
        '    total = sum(arr)            # O(n) single pass',
        '    # Nested loop => O(n²): explodes on large payloads',
      ],
    },
    feynman: {
      prompt: 'Explain the difference between Stack and Heap memory, and why O(log n) scales vastly better than O(n²).',
      checkpoints: [
        { label: 'Stack holds local frames / primitives (LIFO)', keywords: ['stack', 'frame', 'local', 'lifo', 'fast'] },
        { label: 'Heap stores dynamic objects / arrays via references', keywords: ['heap', 'object', 'dynamic', 'gc', 'pointer', 'reference'] },
        { label: 'O(log n) halves problem vs O(n²) squaring input', keywords: ['halv', 'log', 'square', 'n²', 'n^2', 'nested'] },
      ],
      sampleAnswer:
        'The Stack stores fast fixed-size function frames in LIFO order, while the Heap stores dynamic objects and arrays accessed by reference. In complexity, O(log n) cuts the work in half every step (10k items takes ~14 steps), whereas O(n²) squares the work (100 million steps).',
    },
    steps: [
      {
        id: 'mem-1',
        short: 'Stack vs Heap',
        chapter: 'setup',
        title: 'Where your code actually lives in RAM',
        paragraphs: [
          'Every running function gets a fast <span class="term">Call Stack</span> frame for numbers and pointers, while objects, arrays, and strings live in the <span class="term">Heap</span>.',
          'Contiguous arrays sit side-by-side in RAM so the CPU pre-fetches them into L1 cache—making sequential loops blazingly fast.',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 2], py: [1, 2] },
        evaluate: (p) => {
          const n = Number(p.n ?? 1000);
          return {
            metrics: [
              { id: 'st', label: 'Stack Frame', value: '64 B (LIFO)', level: 'good' },
              { id: 'hp', label: 'Heap Array', value: `${Math.round((n * 8) / 1024)} KB`, level: 'neutral' },
              { id: 'idx', label: 'arr[0] Access', value: 'O(1) · 1 ns', level: 'good' },
            ],
            scene: {
              nodes: [
                { id: 'stack', kind: 'box', x: 185, y: 210, label: 'Call Stack', sublabel: 'ptr → 0x4A00', tone: 'green', icon: 'code', glow: 'good' },
                { id: 'heap', kind: 'arrayViz', x: 560, y: 225, label: 'Contiguous Heap Array', arrayData: { cells: [10, 24, 38, 52, 71, 89], pointers: [{ index: 0, label: 'ptr', color: '#cfe3b2' }], highlights: [0], summary: 'base + i×8 bytes' } },
              ],
              links: [{ id: 'l1', from: 'stack', to: 'heap', label: 'O(1) offset', flow: { kind: 'response', rate: 1, speed: 1.6 } }],
              legend: [{ kind: 'response', label: 'direct RAM offset' }],
            },
          };
        },
      },
      {
        id: 'mem-2',
        short: 'Growth Curves',
        chapter: 'tradeoff',
        title: 'Big-O decides if your server survives 10× traffic',
        paragraphs: [
          'Drag <b>Input N</b> up and switch <b>Big-O</b> between <code class="inline-code">O(log n)</code>, <code class="inline-code">O(n)</code>, and <code class="inline-code">O(n²)</code> to see how operation counts explode.',
        ],
        compare: {
          headers: ['N = 10,000', 'Complexity', 'Operations'],
          rows: [
            ['Binary Search', 'O(log n)', '~14 ops'],
            ['Single Pass', 'O(n)', '10,000 ops'],
            ['Nested Loop', 'O(n²)', '100,000,000 ops'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [3, 5], py: [3, 5] },
        evaluate: (p) => {
          const n = Number(p.n ?? 1000);
          const curve = String(p.curve || 'log');
          const ops = curve === 'log' ? Math.ceil(Math.log2(n)) : curve === 'linear' ? n : n * n;
          const cpu = curve === 'log' ? 5 : curve === 'linear' ? Math.min(45, 10 + Math.round(n / 300)) : Math.min(100, 30 + Math.round(n / 80));
          return {
            metrics: [
              { id: 'n', label: 'Input N', value: n.toLocaleString(), level: 'neutral' },
              { id: 'ops', label: 'Operations', value: ops.toLocaleString(), level: curve === 'quad' ? 'bad' : curve === 'linear' ? 'warn' : 'good' },
              { id: 'cpu', label: 'CPU Stress', value: `${cpu}%`, level: cpu > 80 ? 'bad' : cpu > 40 ? 'warn' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'in', kind: 'device', x: 185, y: 230, label: `Input N=${n}`, icon: 'laptop' },
                { id: 'cpu', kind: 'box', x: 520, y: 220, label: curve === 'log' ? 'O(log n) Engine' : curve === 'linear' ? 'O(n) Loop' : 'O(n²) Bottleneck', tone: curve === 'quad' ? 'red' : curve === 'linear' ? 'orange' : 'green', icon: 'server', load: cpu, glow: curve === 'quad' ? 'bad' : curve === 'log' ? 'good' : undefined, tag: curve === 'quad' ? { text: `${(ops / 1e6).toFixed(1)}M ops!`, tone: 'red' } : undefined },
              ],
              links: [{ id: 'l1', from: 'in', to: 'cpu', label: `${ops.toLocaleString()} ops`, flow: { kind: curve === 'quad' ? 'heavy' : 'response', rate: 1.5, speed: curve === 'quad' ? 0.6 : 1.6 } }],
              legend: [{ kind: curve === 'quad' ? 'heavy' : 'response', label: curve === 'quad' ? 'quadratic stall' : 'scalable work' }],
            },
          };
        },
      },
      {
        id: 'mem-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Think in Cache Lines & Orders of Magnitude',
        paragraphs: [
          '✓ Arrays give <code class="inline-code">O(1)</code> index access and CPU cache friendliness.',
          '✓ Keep hot backend & AI paths in <b>O(1)</b>, <b>O(log n)</b>, or <b>O(n)</b>—ban nested <b>O(n²)</b> loops on unbounded inputs.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 5] },
        evaluate: () => ({
          metrics: [
            { id: 'goal', label: 'Safe Target', value: '≤ O(n log n)', level: 'good' },
            { id: 'ram', label: 'Cache Friendly', value: 'Contiguous RAM', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 's', kind: 'box', x: 265, y: 220, label: 'Stack (LIFO)', tone: 'green', icon: 'code', glow: 'good' },
              { id: 'h', kind: 'box', x: 545, y: 220, label: 'Heap Objects', tone: 'blue', icon: 'db' },
            ],
            links: [{ id: 'l1', from: 's', to: 'h', label: 'fast ref', flow: { kind: 'response', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'response', label: 'O(1) ref' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-sliding-window',
    moduleId: 'dsa-basics',
    num: 2,
    title: 'Arrays & Sliding Window',
    subtitle: 'Shrink nested O(n²) subarray scans down to O(n) with moving Left & Right pointers.',
    duration: '10 min',
    level: 'Beginner',
    goals: [
      'Why nested O(n²) subarray scans explode as arrays grow',
      'Reusing the running window sum in O(1) per pointer move',
      'Shrinking the Left pointer when constraints overflow',
      'Using Sliding Windows inside real API rate limiters',
    ],
    controls: [
      { id: 'n', label: 'Array N', type: 'slider', min: 100, max: 5000, step: 100, defaultValue: 500 },
      {
        id: 'algo',
        label: 'Strategy',
        type: 'segmented',
        options: [
          { label: 'Brute O(n²)', value: 'brute' },
          { label: 'Window O(n)', value: 'window' },
        ],
        defaultValue: 'window',
      },
    ],
    codeTrace: {
      title: 'Longest Subarray Sum <= K',
      ts: [
        'let left = 0, sum = 0, best = 0;',
        'for (let right = 0; right < nums.length; right++) {',
        '  sum += nums[right];',
        '  while (sum > k) {',
        '    sum -= nums[left++];',
        '  }',
        '  best = Math.max(best, right - left + 1);',
        '}',
      ],
      py: [
        'left = cur_sum = best = 0',
        'for right, val in enumerate(nums):',
        '    cur_sum += val',
        '    while cur_sum > k:',
        '        cur_sum -= nums[left]; left += 1',
        '    best = max(best, right - left + 1)',
      ],
    },
    feynman: {
      prompt: 'Explain why Sliding Window beats nested loops for contiguous window queries and rate limiters.',
      checkpoints: [
        { label: 'Maintains Left and Right pointers moving forward only', keywords: ['left', 'right', 'pointer', 'window'] },
        { label: 'Reuses previous running sum/count in O(1)', keywords: ['reuse', 'subtract', 'add', 'previous', 'running'] },
        { label: 'Achieves O(n) linear complexity', keywords: ['o(n)', 'linear', 'twice'] },
      ],
      sampleAnswer:
        'Two pointers (left and right) slide across the array once. Expanding right adds one element, and shrinking left subtracts old elements—avoiding recomputing the whole range so total work stays O(n).',
    },
    steps: [
      {
        id: 'sw-1',
        short: 'Expand R',
        chapter: 'solution',
        title: 'Expand Right and keep the running sum',
        paragraphs: [
          'Instead of re-summing subarrays from scratch, track a live <code class="inline-code">sum</code> between <span class="term">L</span> and <span class="term">R</span>.',
          'Each step forward adds just one number: <code class="inline-code">sum += nums[right]</code>.',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 3], py: [1, 3] },
        evaluate: (p) => {
          const n = Number(p.n ?? 500);
          const brute = p.algo === 'brute';
          const ops = brute ? Math.round((n * n) / 2) : n * 2;
          const cpu = brute ? Math.min(99, Math.round(ops / 220000)) : 12;
          return {
            metrics: [
              { id: 'ops', label: 'Operations', value: ops.toLocaleString(), level: brute ? 'bad' : 'good' },
              { id: 'cpu', label: 'Worker CPU', value: `${cpu}%`, level: brute ? 'bad' : 'good' },
              { id: 'sum', label: 'Window Sum', value: '8 > 7', level: 'warn' },
            ],
            scene: {
              nodes: [
                { id: 'cpu', kind: 'box', x: 400, y: 125, label: 'Worker CPU', sublabel: brute ? 'Brute O(n²)' : 'Window O(n)', tone: brute ? 'red' : 'green', icon: 'server', load: cpu, glow: brute ? 'bad' : 'good' },
                { id: 'arr', kind: 'arrayViz', x: 400, y: 295, label: 'Expanding Right Pointer', arrayData: { cells: [2, 1, 5, 1, 3, 2, 4, 1], pointers: [{ index: 0, label: 'L', color: '#cfe3b2' }, { index: 2, label: 'R', color: '#d6e5f6' }], highlights: [0, 1, 2], summary: 'sum = 2+1+5 = 8' } },
              ],
              links: [{ id: 'l1', from: 'cpu', to: 'arr', dashed: true }],
              legend: [{ kind: 'response', label: 'O(n) pointer slide' }],
            },
          };
        },
      },
      {
        id: 'sw-2',
        short: 'Shrink L',
        chapter: 'technique',
        title: 'Constraint exceeded? Slide Left forward',
        paragraphs: [
          'Because <code class="inline-code">sum = 8 &gt; 7</code>, we subtract <code class="inline-code">nums[0]</code> and increment <span class="term">L</span>.',
          'Now <code class="inline-code">sum = 6 ≤ 7</code> in O(1) time—and <code class="inline-code">best = 2</code>.',
        ],
        goalHits: [0, 1, 2, 3],
        activeCodeLines: { ts: [4, 7], py: [4, 6] },
        evaluate: () => ({
          metrics: [
            { id: 'win', label: 'Window [L..R]', value: '[1..2]', level: 'good' },
            { id: 'sum', label: 'Valid Sum', value: '6 ≤ 7', level: 'good' },
            { id: 'best', label: 'Best Length', value: '2', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'arr', kind: 'arrayViz', x: 400, y: 200, label: 'Valid Window Restored', arrayData: { cells: [2, 1, 5, 1, 3, 2, 4, 1], pointers: [{ index: 1, label: 'L', color: '#cfe3b2' }, { index: 2, label: 'R', color: '#d6e5f6' }], highlights: [1, 2], summary: '8 - 2 = 6 ≤ 7' } },
              { id: 'rl', kind: 'box', x: 400, y: 350, label: 'API Rate Limiter', sublabel: 'same sliding log!', tone: 'sand', icon: 'shield' },
            ],
            links: [{ id: 'l1', from: 'arr', to: 'rl', dashed: true }],
            legend: [{ kind: 'response', label: 'O(1) shrink' }],
          },
        }),
      },
      {
        id: 'sw-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Sliding Window Pattern',
        paragraphs: [
          '✓ Anytime a problem asks for a contiguous subarray, substring, or time-window, think <b>Two Pointers (L, R)</b>.',
          '✓ Both pointers move right-only across N elements → strict <b>O(n)</b> time.',
        ],
        goalHits: [0, 1, 2, 3],
        activeCodeLines: { ts: [1, 8], py: [1, 6] },
        evaluate: () => ({
          metrics: [
            { id: 't', label: 'Time', value: 'O(n)', level: 'good' },
            { id: 's', label: 'Space', value: 'O(1)', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'arr', kind: 'arrayViz', x: 400, y: 230, label: 'Single Linear Pass', arrayData: { cells: [2, 1, 5, 1, 3, 2], pointers: [{ index: 2, label: 'L', color: '#cfe3b2' }, { index: 4, label: 'R', color: '#cfe3b2' }], highlights: [2, 3, 4], summary: 'O(n) verified' } },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'linear time' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-binary-search',
    moduleId: 'dsa-basics',
    num: 3,
    title: 'Two Pointers & Binary Search',
    subtitle: 'Cut 1,000,000 sorted items down to 1 answer in just 20 comparisons.',
    duration: '10 min',
    level: 'Beginner',
    goals: [
      'Why sorted data enables O(log n) search space halving',
      'Converging Left & Right pointers safely without off-by-one bugs',
      'Applying Binary Search on answers (rate limits, capacity sizing)',
    ],
    controls: [
      { id: 'items', label: 'Sorted N', type: 'slider', min: 100, max: 1000000, step: 50000, defaultValue: 100000 },
      { id: 'stepMode', label: 'Search', type: 'segmented', options: [{ label: 'Linear O(n)', value: 'lin' }, { label: 'Binary O(log n)', value: 'bin' }], defaultValue: 'bin' },
    ],
    codeTrace: {
      title: 'Bug-Free Binary Search',
      ts: [
        'let lo = 0, hi = nums.length - 1;',
        'while (lo <= hi) {',
        '  const mid = lo + Math.floor((hi - lo) / 2);',
        '  if (nums[mid] === target) return mid;',
        '  if (nums[mid] < target) lo = mid + 1;',
        '  else hi = mid - 1;',
        '}',
      ],
      py: [
        'lo, hi = 0, len(nums) - 1',
        'while lo <= hi:',
        '    mid = lo + (hi - lo) // 2',
        '    if nums[mid] == target: return mid',
        '    if nums[mid] < target: lo = mid + 1',
        '    else: hi = mid - 1',
      ],
    },
    feynman: {
      prompt: 'Why does Binary Search find an item among 1,000,000 sorted items in ~20 steps, and when does it fail?',
      checkpoints: [
        { label: 'Discards half of remaining range every comparison', keywords: ['half', 'halv', 'mid', 'divide', 'log'] },
        { label: 'Requires sorted or monotonic search space', keywords: ['sort', 'monotonic', 'order'] },
      ],
      sampleAnswer:
        'Each check compares against the midpoint and throws away half the array, so 2^20 > 1,000,000 means at most 20 steps. It only works when the data or predicate is sorted / monotonic.',
    },
    steps: [
      {
        id: 'bs-1',
        short: 'Midpoint',
        chapter: 'technique',
        title: 'Throw away half the world on every check',
        paragraphs: [
          'Looking for <code class="inline-code">42</code> in a sorted array? Check the middle index <span class="term">mid</span>.',
          'Because <code class="inline-code">27 &lt; 42</code>, everything to the left of <code class="inline-code">mid</code> is guaranteed too small—move <code class="inline-code">lo = mid + 1</code>!',
        ],
        goalHits: [0, 1],
        activeCodeLines: { ts: [1, 6], py: [1, 6] },
        evaluate: (p) => {
          const n = Number(p.items ?? 100000);
          const isBin = p.stepMode === 'bin';
          const steps = isBin ? Math.ceil(Math.log2(n)) : Math.round(n / 2);
          return {
            metrics: [
              { id: 'n', label: 'Sorted N', value: n.toLocaleString(), level: 'neutral' },
              { id: 'ops', label: 'Comparisons', value: steps.toLocaleString(), level: isBin ? 'good' : 'bad' },
              { id: 'cplx', label: 'Complexity', value: isBin ? 'O(log n)' : 'O(n)', level: isBin ? 'good' : 'bad' },
            ],
            scene: {
              nodes: [
                { id: 'arr', kind: 'arrayViz', x: 400, y: 205, label: 'Target = 42 · Eliminating Left Half', arrayData: { cells: [4, 9, 15, 27, 35, 42, 68, 91], pointers: [{ index: 0, label: 'lo', color: '#f8d5cf' }, { index: 3, label: 'mid', color: '#fbe5bd' }, { index: 7, label: 'hi', color: '#d6e5f6' }], highlights: [4, 5, 6, 7], summary: '27 < 42 → jump right!' } },
                { id: 'srv', kind: 'box', x: 400, y: 345, label: isBin ? `Found in ${steps} hops` : `Scanned ${steps.toLocaleString()} items`, tone: isBin ? 'green' : 'red', icon: 'search', glow: isBin ? 'good' : 'bad' },
              ],
              links: [{ id: 'l1', from: 'arr', to: 'srv', dashed: true }],
              legend: [{ kind: 'response', label: 'remaining active half' }],
            },
          };
        },
      },
      {
        id: 'bs-2',
        short: 'On Answers',
        chapter: 'insight',
        title: 'Pro Pattern: Binary Search on Answers',
        paragraphs: [
          'Binary search isn’t only for arrays! Any time a question asks <i>“What is the minimum worker count / batch size to finish within X ms?”</i>, you can binary-search the numeric answer space.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [2, 6], py: [2, 6] },
        evaluate: () => ({
          metrics: [
            { id: 'ans', label: 'Optimal Workers', value: '12 nodes', level: 'good' },
            { id: 'steps', label: 'Trials Needed', value: '7 checks', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'g1', kind: 'graphNode', x: 200, y: 225, label: '1', sublabel: 'too slow', graphState: { status: 'unvisited' } },
              { id: 'g2', kind: 'graphNode', x: 340, y: 225, label: '8', sublabel: 'fails SLA', graphState: { status: 'visited' } },
              { id: 'g3', kind: 'graphNode', x: 480, y: 225, label: '12', sublabel: 'MIN OK!', graphState: { status: 'path', badge: '✓' } },
              { id: 'g4', kind: 'graphNode', x: 620, y: 225, label: '16', sublabel: 'over-prov', graphState: { status: 'visited' } },
            ],
            links: [
              { id: 'a', from: 'g2', to: 'g3', label: 'lo=mid+1', flow: { kind: 'response', rate: 1, speed: 1.4 } },
              { id: 'b', from: 'g4', to: 'g3', label: 'hi=mid', flow: { kind: 'request', rate: 1, speed: 1.4 } },
            ],
            legend: [{ kind: 'response', label: 'converges on answer' }],
          },
        }),
      },
      {
        id: 'bs-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Think Monotonic Before Writing Loops',
        paragraphs: [
          '✓ Whenever data is sorted—or a predicate flips monotonically from <code class="inline-code">false</code> to <code class="inline-code">true</code>—Binary Search slashes <code class="inline-code">O(n)</code> to <code class="inline-code">O(log n)</code>.',
          '✓ Always write <code class="inline-code">lo + Math.floor((hi - lo) / 2)</code> to prevent integer overflow.',
        ],
        callout: { kind: 'tip', title: 'INTERVIEW GOLD', text: 'Sorted + find target? Binary search. Unsorted + find pair? Hash Map. Contiguous range? Sliding Window.' },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 7], py: [1, 6] },
        evaluate: () => ({
          metrics: [
            { id: 't', label: 'Search Time', value: 'O(log n)', level: 'good' },
            { id: 's', label: 'Extra Space', value: 'O(1)', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'b', kind: 'box', x: 400, y: 220, label: 'Binary Search', sublabel: '1M items → 20 steps', tone: 'green', icon: 'search', glow: 'good' },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'O(log n) halving' }],
          },
        }),
      },
    ],
  },

  {
    id: 'dsa-hashmaps',
    moduleId: 'dsa-basics',
    num: 4,
    title: 'Hash Maps, Sets & Frequency Counters',
    subtitle: 'Instant O(1) lookups, collision buckets, and why Hash Maps eliminate half of coding bottlenecks.',
    duration: '9 min',
    level: 'Beginner',
    goals: [
      'How a hash function maps arbitrary keys into fixed array buckets',
      'Handling hash collisions via chaining & load-factor resizing',
      'Solving Two-Sum, deduplication & counting in single O(n) passes',
    ],
    controls: [
      { id: 'loadFactor', label: 'Load Factor', type: 'slider', min: 20, max: 95, step: 5, unit: '%', defaultValue: 55 },
    ],
    codeTrace: {
      title: 'Two-Sum / Dedup in O(n)',
      ts: [
        'const seen = new Map<number, number>();',
        'for (let i = 0; i < nums.length; i++) {',
        '  const need = target - nums[i];',
        '  if (seen.has(need)) return [seen.get(need)!, i];',
        '  seen.set(nums[i], i);',
        '}',
      ],
      py: [
        'seen = {}',
        'for i, x in enumerate(nums):',
        '    need = target - x',
        '    if need in seen:',
        '        return [seen[need], i]',
        '    seen[x] = i',
      ],
    },
    feynman: {
      prompt: 'How does a Hash Map stay O(1) on average, and what happens when the load factor gets too high?',
      checkpoints: [
        { label: 'Hash function turns key into bucket index', keywords: ['hash', 'bucket', 'index', 'modulo', 'array'] },
        { label: 'High load causes collisions -> resizes / rehashes', keywords: ['collision', 'load', 'resiz', 'rehash', 'chain'] },
      ],
      sampleAnswer:
        'A hash function converts a key into an array bucket index for instant O(1) jumps. If too many keys land in the same bucket (high load factor), lookup degrades toward O(n)—so the map automatically allocates a 2× larger array and rehashes keys.',
    },
    steps: [
      {
        id: 'hm-1',
        short: 'Buckets',
        chapter: 'technique',
        title: 'From key string to memory slot in O(1)',
        paragraphs: [
          'A <span class="term">Hash Function</span> turns <code class="inline-code">"user_ada"</code> into a deterministic integer, then <code class="inline-code">mod size</code> picks the exact bucket.',
          'Drag <b>Load Factor</b> above 75% to trigger bucket collisions and automatic table resizing!',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 6] },
        evaluate: (p) => {
          const lf = Number(p.loadFactor ?? 55);
          const crowded = lf > 75;
          return {
            metrics: [
              { id: 'lf', label: 'Load Factor', value: `${lf}%`, level: crowded ? 'bad' : 'good' },
              { id: 'col', label: 'Collisions', value: crowded ? 'High (Chain >3)' : 'Rare (0–1)', level: crowded ? 'warn' : 'good' },
              { id: 'avg', label: 'Avg Lookup', value: crowded ? 'Degrading' : 'O(1)', level: crowded ? 'warn' : 'good' },
            ],
            scene: {
              nodes: [
                { id: 'key', kind: 'box', x: 185, y: 220, label: 'hash("ada")', sublabel: '→ bucket #3', tone: 'sand', icon: 'code' },
                { id: 'arr', kind: 'arrayViz', x: 525, y: 225, label: crowded ? 'Crowded Buckets → Rehash Needed' : 'Hash Buckets Array', arrayData: { cells: ['—', 'k9', '—', 'ada', 'k2', '—'], pointers: [{ index: 3, label: 'hit', color: crowded ? '#f8d5cf' : '#cfe3b2' }], highlights: [3], summary: crowded ? 'chain length 4!' : 'O(1) direct slot', hashEntries: [['ada', 'idx 3'], ['k9', 'idx 1'], ['k2', 'idx 4']] } },
              ],
              links: [{ id: 'l1', from: 'key', to: 'arr', label: crowded ? 'collision chain' : 'O(1) jump', flow: { kind: crowded ? 'heavy' : 'response', rate: 1.2, speed: 1.5 } }],
              legend: [{ kind: crowded ? 'heavy' : 'response', label: crowded ? 'collision slowdown' : 'O(1) hash hit' }],
            },
          };
        },
      },
      {
        id: 'hm-2',
        short: 'Two-Sum O(n)',
        chapter: 'solution',
        title: 'Frequency counters & complement lookups in one pass',
        paragraphs: [
          'Instead of checking every pair <code class="inline-code">(i, j)</code> in <code class="inline-code">O(n²)</code>, ask the Hash Map: <i>“Have I already seen <code class="inline-code">target - nums[i]</code>?”</i>',
        ],
        compare: {
          headers: ['Pattern', 'Brute Force', 'Hash Map / Set'],
          rows: [
            ['Two-Sum / Pair', 'O(n²)', 'O(n) time, O(n) space'],
            ['Deduplicate IDs', 'O(n log n) sort', 'O(n) via Set'],
            ['Word Frequency', 'O(n²)', 'O(n) counter'],
          ],
        },
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 6] },
        evaluate: () => ({
          metrics: [
            { id: 'pass', label: 'Array Passes', value: '1 Pass O(n)', level: 'good' },
            { id: 'hit', label: 'Complement Check', value: 'O(1)', level: 'good' },
          ],
          scene: {
            nodes: [
              { id: 'arr', kind: 'arrayViz', x: 245, y: 220, label: 'Target = 9 · nums[2] = 7', arrayData: { cells: [2, 11, 7, 15], pointers: [{ index: 2, label: 'need 2!', color: '#cfe3b2' }], highlights: [0, 2], summary: '9 - 7 = 2 → seen.get(2) = 0!' } },
              { id: 'mp', kind: 'box', x: 595, y: 220, label: 'seen.has(2) === true!', sublabel: 'return [0, 2]', tone: 'green', icon: 'cache', glow: 'good' },
            ],
            links: [{ id: 'l1', from: 'arr', to: 'mp', label: 'O(1) hit', flow: { kind: 'response', rate: 1, speed: 1.5 } }],
            legend: [{ kind: 'response', label: 'single-pass O(n)' }],
          },
        }),
      },
      {
        id: 'hm-3',
        short: 'Recap',
        chapter: 'recap',
        title: 'Recap: Your First Weapon for Backend & DSA Speed',
        paragraphs: [
          '✓ Whenever you see a nested loop searching for a matching pair, complement, or duplicate—drop in a <b>Hash Map / Set</b> to cut O(n²) down to <b>O(n)</b>.',
        ],
        goalHits: [0, 1, 2],
        activeCodeLines: { ts: [1, 6], py: [1, 6] },
        evaluate: () => ({
          metrics: [
            { id: 'l', label: 'Lookup', value: 'O(1) avg', level: 'good' },
            { id: 'sp', label: 'Space', value: 'O(n)', level: 'neutral' },
          ],
          scene: {
            nodes: [
              { id: 'm', kind: 'box', x: 400, y: 225, label: 'Hash Map / Redis', sublabel: 'O(1) state memory', tone: 'green', icon: 'cache', glow: 'good' },
            ],
            links: [],
            legend: [{ kind: 'response', label: 'O(1) lookup' }],
          },
        }),
      },
    ],
  },
];
