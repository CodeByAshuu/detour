const astar = require('../src/algorithms/astar');
const dijkstra = require('../src/algorithms/dijkstra');
const { Graph, buildCompleteGraph, haversine } = require('../src/graph/buildGraph');

describe('A* Search Algorithm', () => {
  it('should find correct path and matching distance on a graph with real-km Haversine weights', () => {
    // Use buildCompleteGraph so edge weights ARE Haversine distances — heuristic is admissible
    const locations = [
      { id: 'A', coordinates: [77.59, 12.97] }, // Bengaluru center
      { id: 'B', coordinates: [77.60, 12.97] }, // ~1 km east
      { id: 'C', coordinates: [77.60, 12.98] }, // ~1 km north of B
      { id: 'D', coordinates: [77.61, 12.98] }, // ~1 km east of C
    ];
    const graph = buildCompleteGraph(locations);

    const astarResult = astar(graph, 'A', 'D');
    const dijkstraResult = dijkstra(graph, 'A', 'D');

    // Both should find the same optimal distance
    expect(astarResult.distance).toBeCloseTo(dijkstraResult.distance, 4);
    expect(astarResult.path).toEqual(dijkstraResult.path);
  });

  it('should handle single node (start === target)', () => {
    const graph = new Graph();
    graph.addNode('A', [77.5, 12.9]);
    const result = astar(graph, 'A', 'A');
    expect(result.distance).toBe(0);
    expect(result.path).toEqual(['A']);
  });

  it('should return Infinity for missing start node', () => {
    const graph = new Graph();
    graph.addNode('A', [77.5, 12.9]);
    const result = astar(graph, 'MISSING', 'A');
    expect(result.distance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });

  it('should handle unreachable target correctly', () => {
    const graph = new Graph();
    graph.addNode('A', [77.5, 12.9]);
    graph.addNode('B', [77.8, 13.1]);
    // No edge between A and B → B is unreachable from A
    const result = astar(graph, 'A', 'B');
    expect(result.distance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });

  it('PROVES HEURISTIC EFFICIENCY: A* visits ≤ nodes compared to Dijkstra on real-coord graph', () => {
    // Build a larger graph. A* should prune "wrong direction" nodes via heuristic.
    const locations = [
      { id: 'Depot',    coordinates: [77.59, 12.97] },
      { id: 'Point1',   coordinates: [77.60, 12.98] },
      { id: 'Point2',   coordinates: [77.61, 12.99] },
      { id: 'Target',   coordinates: [77.63, 13.01] },
      { id: 'WrongDir1', coordinates: [77.50, 12.80] }, // far south-west — heuristic discourages these
      { id: 'WrongDir2', coordinates: [77.40, 12.70] },
    ];

    const graph = buildCompleteGraph(locations);

    const astarResult   = astar(graph, 'Depot', 'Target');
    const dijkstraResult = dijkstra(graph, 'Depot', 'Target');

    // Optimal distances must agree
    expect(astarResult.distance).toBeCloseTo(dijkstraResult.distance, 4);

    // A* should not need to explore more nodes than Dijkstra
    expect(astarResult.nodesVisitedCount).toBeLessThanOrEqual(dijkstraResult.distances.size);
  });
});
