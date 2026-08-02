const MinHeap = require('./minHeap');

/**
 * Dijkstra's Shortest Path Algorithm Implementation.
 * Computes single-source shortest path from startNode to targetNode (or all nodes) on a weighted graph.
 * 
 * Uses MinHeap (Priority Queue) to achieve O((V + E) log V) time complexity.
 * 
 * @param {Graph} graph - Instance of Graph class with getNeighbors(node) method
 * @param {string} startNode - ID of the starting depot/node
 * @param {string} [targetNode=null] - Optional target node ID (stops early when reached)
 * @returns {Object} Object containing distances Map, previous parent pointers Map, and reconstructed path Array
 */
function dijkstra(graph, startNode, targetNode = null) {
  // Edge Case 1: Start node does not exist in graph
  if (!graph || !graph.hasNode(startNode)) {
    return {
      distance: Infinity,
      path: [],
      distances: new Map(),
      previous: new Map(),
    };
  }

  // Edge Case 2: Target node specified but does not exist in graph
  if (targetNode !== null && !graph.hasNode(targetNode)) {
    return {
      distance: Infinity,
      path: [],
      distances: new Map(),
      previous: new Map(),
    };
  }

  // Map to store current shortest known distance from startNode to every other node
  const distances = new Map();

  // Map to store previous parent node for reconstructing the shortest path
  const previous = new Map();

  // MinHeap priority queue storing elements: { node: string, distance: number }
  // Prioritizes node with the smallest cumulative distance from startNode
  const pq = new MinHeap((a, b) => a.distance - b.distance);

  // Initialize all nodes with distance = Infinity, except startNode = 0
  for (const node of graph.getAllNodes()) {
    if (node === startNode) {
      distances.set(node, 0);
      pq.push({ node, distance: 0 });
    } else {
      distances.set(node, Infinity);
    }
    previous.set(node, null);
  }

  // Set to track visited nodes so we don't process a node multiple times
  const visited = new Set();

  // Main Loop: Extract node with smallest tentative distance
  while (!pq.isEmpty()) {
    // Pop node with minimum current distance from priority queue: O(log V)
    const { node: current, distance: currentDist } = pq.pop();

    // Skip if we have already finalized the shortest distance for this node
    if (visited.has(current)) {
      continue;
    }

    // Mark current node as visited / finalized
    visited.add(current);

    // Early termination: If targetNode is reached and finalized, we have found optimal path
    if (targetNode !== null && current === targetNode) {
      break;
    }

    // If current node's distance is Infinity, remaining nodes are unreachable
    if (currentDist === Infinity) {
      break;
    }

    // Edge Relaxation Step: Inspect all outgoing neighbors of current node
    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      const { node: nextNode, weight } = neighbor;

      // Skip already finalized nodes
      if (visited.has(nextNode)) {
        continue;
      }

      // Calculate new candidate total distance to nextNode via current node
      const newDist = currentDist + weight;

      // If new distance is strictly smaller than previously recorded shortest distance: RELAX EDGE
      if (newDist < distances.get(nextNode)) {
        // Update shortest distance map
        distances.set(nextNode, newDist);

        // Record current node as previous parent of nextNode
        previous.set(nextNode, current);

        // Insert updated distance into priority queue for future exploration: O(log V)
        pq.push({ node: nextNode, distance: newDist });
      }
    }
  }

  // Path Reconstruction Step: Trace backward from targetNode to startNode using previous pointers
  const path = [];
  if (targetNode !== null && distances.get(targetNode) !== Infinity) {
    let curr = targetNode;
    while (curr !== null) {
      path.unshift(curr); // Add node to beginning of path array
      curr = previous.get(curr);
    }
  }

  return {
    distance: targetNode !== null ? distances.get(targetNode) : Infinity,
    path,
    distances,
    previous,
  };
}

module.exports = dijkstra;
