export interface PatternGroup {
  topic: string;
  patterns: string[];
}

export const PATTERN_GROUPS: PatternGroup[] = [
  {
    topic: "Arrays",
    patterns: [
      "Two Pointers",
      "Sliding Window",
      "Prefix Sum",
      "Difference Array",
      "Kadane's Algorithm",
      "Monotonic Stack",
      "Monotonic Queue",
      "Sorting",
      "Simulation",
    ],
  },
  {
    topic: "Searching",
    patterns: ["Binary Search", "Binary Search on Answer"],
  },
  {
    topic: "Hashing",
    patterns: ["HashMap", "HashSet", "Frequency Counting"],
  },
  {
    topic: "Linked List",
    patterns: ["Fast & Slow Pointer", "Dummy Node", "List Reversal"],
  },
  {
    topic: "Stack / Queue",
    patterns: ["Stack", "Queue", "Monotonic Stack", "Monotonic Queue"],
  },
  {
    topic: "Trees",
    patterns: ["DFS", "BFS", "Level Order", "Tree Traversal", "BST"],
  },
  {
    topic: "Graphs",
    patterns: [
      "DFS",
      "BFS",
      "Topological Sort",
      "Union Find",
      "Dijkstra",
      "Bellman Ford",
      "Floyd Warshall",
      "MST",
      "Backtracking",
    ],
  },
  {
    topic: "Dynamic Programming",
    patterns: ["1D DP", "2D DP", "Knapsack", "LIS", "State Machine"],
  },
  {
    topic: "Greedy",
    patterns: ["Greedy"],
  },
  {
    topic: "Backtracking",
    patterns: ["Backtracking"],
  },
  {
    topic: "Recursion",
    patterns: ["Recursion"],
  },
  {
    topic: "Bit Manipulation",
    patterns: ["Bit Manipulation"],
  },
  {
    topic: "Heap / Priority Queue",
    patterns: ["Heap / Priority Queue"],
  },
  {
    topic: "Trie",
    patterns: ["Trie"],
  },
  {
    topic: "Segment Tree",
    patterns: ["Segment Tree"],
  },
  {
    topic: "Fenwick Tree",
    patterns: ["Fenwick Tree"],
  },
  {
    topic: "Math",
    patterns: ["Math"],
  },
  {
    topic: "String Matching",
    patterns: ["KMP", "Rabin Karp", "Z Algorithm"],
  },
];

// Dynamically generate flat array of all unique patterns sorted alphabetically
export const ALL_PATTERNS = Array.from(
  new Set(PATTERN_GROUPS.flatMap((group) => group.patterns)),
).sort();
