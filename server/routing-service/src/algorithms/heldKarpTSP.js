const { haversine } = require('../graph/buildGraph');

// Default maximum allowed stops to prevent exponential memory/CPU state-space explosion
const DEFAULT_MAX_STOPS = 12;

/**
 * Held-Karp Dynamic Programming algorithm for Traveling Salesman Problem (TSP).
 * Computes optimal stop ordering for multi-stop delivery routes.
 * 
 * Uses Bitmask DP state representation:
 * - Running Time: O(N^2 * 2^N)
 * - Space Complexity: O(N * 2^N)
 * 
 * Bound Explanation:
 * For N = 12 stops: 2^12 = 4,096 states, running in <10ms.
 * For N = 20 stops: 2^20 = 1,048,576 states, causing JS event-loop blocking & heap overflow.
 * 
 * @param {Object} depotLocation - { id: string, coordinates: [number, number] }
 * @param {Array<Object>} stops - Array of { id: string, coordinates: [number, number] }
 * @param {Object} [options] - Configuration options
 * @param {number} [options.maxStops=12] - Maximum allowed stops
 * @param {boolean} [options.returnToDepot=true] - Whether route must end back at depot
 * @returns {Object} { totalDistance, orderedStops, pathNodeIds }
 */
function solveHeldKarpTSP(depotLocation, stops = [], options = {}) {
  const maxStops = options.maxStops || DEFAULT_MAX_STOPS;
  const returnToDepot = options.returnToDepot !== undefined ? options.returnToDepot : true;

  // Edge Case 1: Empty stops array
  if (!stops || stops.length === 0) {
    return {
      totalDistance: 0,
      orderedStops: [],
      pathNodeIds: [depotLocation.id],
    };
  }

  // Edge Case 2: Single stop
  if (stops.length === 1) {
    const distToStop = haversine(depotLocation.coordinates, stops[0].coordinates);
    const distBack = returnToDepot ? haversine(stops[0].coordinates, depotLocation.coordinates) : 0;
    return {
      totalDistance: distToStop + distBack,
      orderedStops: stops,
      pathNodeIds: returnToDepot
        ? [depotLocation.id, stops[0].id, depotLocation.id]
        : [depotLocation.id, stops[0].id],
    };
  }

  // BOUND ENFORCEMENT: Reject inputs exceeding maxStops to prevent O(N^2 * 2^N) state-space explosion!
  if (stops.length > maxStops) {
    throw new Error(
      `Held-Karp DP bounded to maximum ${maxStops} stops (received ${stops.length}). State-space size grows as O(N^2 * 2^N).`
    );
  }

  // Combine depot (index 0) and stops (indices 1..N) into a unified nodes array
  const nodes = [depotLocation, ...stops];
  const N = nodes.length; // Total nodes including depot (N = stops.length + 1)

  // Precompute pairwise distance matrix distMatrix[i][j]
  const distMatrix = Array.from({ length: N }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j) {
        distMatrix[i][j] = haversine(nodes[i].coordinates, nodes[j].coordinates);
      }
    }
  }

  // DP table: dp[mask][u] stores min distance to visit subset represented by bitmask 'mask', ending at node 'u'
  // mask is an integer from 0 to (1 << N) - 1
  const TOTAL_STATES = 1 << N;
  const dp = Array.from({ length: TOTAL_STATES }, () => Array(N).fill(Infinity));

  // Parent table for path reconstruction: parentTrack[mask][u] stores previous node before 'u'
  const parentTrack = Array.from({ length: TOTAL_STATES }, () => Array(N).fill(-1));

  // Base Case: Starting at depot (index 0) with mask = 1 (binary 000...001)
  dp[1][0] = 0;

  // Iterate over all possible subset bitmasks from 1 to TOTAL_STATES - 1
  for (let mask = 1; mask < TOTAL_STATES; mask++) {
    // Only process masks where depot (bit 0) is visited
    if ((mask & 1) === 0) continue;

    // Try extending current visited set 'mask' from ending node 'u'
    for (let u = 0; u < N; u++) {
      // Skip if node u is not in current bitmask
      if ((mask & (1 << u)) === 0) continue;

      // Skip unreachable states
      if (dp[mask][u] === Infinity) continue;

      // Try visiting next unvisited node 'v'
      for (let v = 0; v < N; v++) {
        // Check if node v is already visited in current mask (bit v is 1)
        if ((mask & (1 << v)) !== 0) continue;

        // Create new bitmask including node v
        const nextMask = mask | (1 << v);

        // Compute candidate distance cost
        const newCost = dp[mask][u] + distMatrix[u][v];

        // DP Relaxation step
        if (newCost < dp[nextMask][v]) {
          dp[nextMask][v] = newCost;
          parentTrack[nextMask][v] = u;
        }
      }
    }
  }

  // Final Step: Find best ending node when all nodes are visited (fullMask = (1 << N) - 1)
  const fullMask = (1 << N) - 1;
  let minTotalDist = Infinity;
  let lastNode = -1;

  for (let u = 1; u < N; u++) {
    const cost = dp[fullMask][u] + (returnToDepot ? distMatrix[u][0] : 0);
    if (cost < minTotalDist) {
      minTotalDist = cost;
      lastNode = u;
    }
  }

  // Path Reconstruction: Trace back from fullMask and lastNode
  const nodeIndexSequence = [];
  let currentMask = fullMask;
  let currentU = lastNode;

  while (currentU !== -1) {
    nodeIndexSequence.unshift(currentU);
    const prevU = parentTrack[currentMask][currentU];
    currentMask = currentMask ^ (1 << currentU); // Remove currentU bit from mask
    currentU = prevU;
  }

  // Map node indices back to original stop objects
  const orderedStops = [];
  const pathNodeIds = nodeIndexSequence.map((idx) => nodes[idx].id);

  if (returnToDepot) {
    pathNodeIds.push(depotLocation.id);
  }

  // Populate orderedStops (excluding starting depot)
  for (let i = 1; i < nodeIndexSequence.length; i++) {
    const stopIdx = nodeIndexSequence[i];
    orderedStops.push(nodes[stopIdx]);
  }

  return {
    totalDistance: minTotalDist,
    orderedStops,
    pathNodeIds,
  };
}

module.exports = {
  solveHeldKarpTSP,
  DEFAULT_MAX_STOPS,
};
