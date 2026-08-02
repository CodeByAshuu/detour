/**
 * Graph Data Structure represented as an Adjacency List.
 * Stores nodes and weighted directed/undirected edges.
 */
class Graph {
  constructor() {
    // Map of nodeId -> Array of { node: targetNodeId, weight: edgeWeight, coordinates: [lng, lat] }
    this.adjacencyList = new Map();
    // Map of nodeId -> [longitude, latitude] for coordinate lookups (e.g. A* heuristic)
    this.coordinates = new Map();
  }

  /**
   * Adds a node to the graph.
   * @param {string} id - Unique identifier for the node
   * @param {number[]} [coords] - [longitude, latitude] coordinates
   */
  addNode(id, coords = null) {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
    if (coords) {
      this.coordinates.set(id, coords);
    }
  }

  /**
   * Adds a weighted edge between fromNode and toNode.
   * @param {string} fromNode 
   * @param {string} toNode 
   * @param {number} weight - Travel distance / time cost
   * @param {boolean} [bidirectional=true] - If true, adds edge in both directions
   */
  addEdge(fromNode, toNode, weight, bidirectional = true) {
    this.addNode(fromNode);
    this.addNode(toNode);

    this.adjacencyList.get(fromNode).push({ node: toNode, weight });

    if (bidirectional) {
      this.adjacencyList.get(toNode).push({ node: fromNode, weight });
    }
  }

  /**
   * Retrieves neighbors for a given node.
   * @param {string} nodeId 
   * @returns {Array<{ node: string, weight: number }>}
   */
  getNeighbors(nodeId) {
    return this.adjacencyList.get(nodeId) || [];
  }

  /**
   * Checks if node exists in graph.
   * @param {string} nodeId 
   * @returns {boolean}
   */
  hasNode(nodeId) {
    return this.adjacencyList.has(nodeId);
  }

  /**
   * Returns array of all node IDs in graph.
   * @returns {Array<string>}
   */
  getAllNodes() {
    return Array.from(this.adjacencyList.keys());
  }
}

/**
 * Calculates Haversine distance in km between two [lng, lat] pairs.
 */
function haversine(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Builds a complete weighted graph where every location is connected to every other location.
 * Edge weights are Haversine distances in kilometers.
 * 
 * @param {Array<{ id: string, coordinates: [number, number] }>} locations 
 * @returns {Graph}
 */
function buildCompleteGraph(locations = []) {
  const graph = new Graph();

  locations.forEach((loc) => {
    graph.addNode(String(loc.id), loc.coordinates);
  });

  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const locA = locations[i];
      const locB = locations[j];
      const dist = haversine(locA.coordinates, locB.coordinates);
      graph.addEdge(String(locA.id), String(locB.id), dist, true);
    }
  }

  return graph;
}

module.exports = {
  Graph,
  haversine,
  buildCompleteGraph,
};
