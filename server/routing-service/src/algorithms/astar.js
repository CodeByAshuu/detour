const MinHeap = require('./minHeap');
const { haversine } = require('../graph/buildGraph');

/**
 * A* Search Algorithm Implementation.
 * Computes shortest path from startNode to targetNode using Haversine heuristic h(n).
 * Priority Queue priority: f(n) = g(n) + h(n)
 * 
 * @param {Graph} graph - Instance of Graph class containing coordinates Map
 * @param {string} startNode - ID of start node
 * @param {string} targetNode - ID of target node
 * @returns {Object} { distance, path, nodesVisitedCount }
 */
function astar(graph, startNode, targetNode) {
  // Edge Case 1: Start or target node missing
  if (!graph || !graph.hasNode(startNode) || !graph.hasNode(targetNode)) {
    return { distance: Infinity, path: [], nodesVisitedCount: 0 };
  }

  // Edge Case 2: Start is target
  if (startNode === targetNode) {
    return { distance: 0, path: [startNode], nodesVisitedCount: 1 };
  }

  // Target coordinates for heuristic calculation h(n)
  const targetCoords = graph.coordinates.get(targetNode);

  /**
   * Admissible Heuristic Function h(n):
   * Calculates straight-line Haversine distance from node n to targetNode.
   * Since straight-line distance <= road distance, h(n) is admissible and optimal.
   */
  function heuristic(nodeId) {
    if (!targetCoords) return 0; // Fallback to Dijkstra if coordinates absent
    const nodeCoords = graph.coordinates.get(nodeId);
    if (!nodeCoords) return 0;
    return haversine(nodeCoords, targetCoords);
  }

  // gScore[n]: Actual minimum cost from startNode to node n
  const gScore = new Map();

  // fScore[n]: Estimated total cost from startNode to targetNode via node n (f(n) = g(n) + h(n))
  const fScore = new Map();

  // Reconstructing path parent pointers
  const previous = new Map();

  // MinHeap priority queue ordering elements by f(n) value ascending
  const openSet = new MinHeap((a, b) => a.f - b.f);

  // Initialize all nodes gScore to Infinity, except startNode
  for (const node of graph.getAllNodes()) {
    gScore.set(node, Infinity);
    fScore.set(node, Infinity);
    previous.set(node, null);
  }

  // Start node initialization
  gScore.set(startNode, 0);
  const startH = heuristic(startNode);
  fScore.set(startNode, startH);

  // Push startNode to openSet priority queue
  openSet.push({ node: startNode, f: startH, g: 0 });

  const visited = new Set();
  let nodesVisitedCount = 0;

  while (!openSet.isEmpty()) {
    // Extract node with lowest fScore f(n) = g(n) + h(n)
    const { node: current } = openSet.pop();

    if (visited.has(current)) continue;
    visited.add(current);
    nodesVisitedCount++;

    const currentG = gScore.get(current);

    // Target reached! Reconstruct optimal path and return
    if (current === targetNode) {
      const path = [];
      let curr = targetNode;
      while (curr !== null) {
        path.unshift(curr);
        curr = previous.get(curr);
      }
      return {
        distance: gScore.get(targetNode),
        path,
        nodesVisitedCount,
      };
    }

    // Inspect neighbors
    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      const { node: nextNode, weight } = neighbor;

      if (visited.has(nextNode)) continue;

      // Tentative gScore for nextNode
      const tentativeG = currentG + weight;

      // If this path to nextNode is better than any previous path: RELAX EDGE
      if (tentativeG < gScore.get(nextNode)) {
        previous.set(nextNode, current);
        gScore.set(nextNode, tentativeG);

        const h = heuristic(nextNode);
        const f = tentativeG + h;
        fScore.set(nextNode, f);

        // Push to priority queue with new fScore
        openSet.push({ node: nextNode, f, g: tentativeG });
      }
    }
  }

  // Unreachable target
  return { distance: Infinity, path: [], nodesVisitedCount };
}

module.exports = astar;
