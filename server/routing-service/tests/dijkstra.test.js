const dijkstra = require('../src/algorithms/dijkstra');
const { Graph } = require('../src/graph/buildGraph');

describe("Dijkstra's Algorithm", () => {
  it('should return empty path and Infinity for non-existent start node', () => {
    const graph = new Graph();
    graph.addNode('A');
    const result = dijkstra(graph, 'NON_EXISTENT', 'A');
    expect(result.distance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });

  it('should return empty path and Infinity for non-existent target node', () => {
    const graph = new Graph();
    graph.addNode('A');
    const result = dijkstra(graph, 'A', 'NON_EXISTENT');
    expect(result.distance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });

  it('should handle single node (start === target) correctly', () => {
    const graph = new Graph();
    graph.addNode('A');
    const result = dijkstra(graph, 'A', 'A');
    expect(result.distance).toBe(0);
    expect(result.path).toEqual(['A']);
  });

  it('should correctly compute shortest path in a weighted graph', () => {
    const graph = new Graph();
    // Graph layout:
    // A - (2) -> B - (3) -> D
    // A - (5) -> C - (1) -> D
    graph.addEdge('A', 'B', 2);
    graph.addEdge('B', 'D', 3);
    graph.addEdge('A', 'C', 5);
    graph.addEdge('C', 'D', 1);

    // Path A -> B -> D costs 2 + 3 = 5
    // Path A -> C -> D costs 5 + 1 = 6
    // Optimal path should be A -> B -> D with cost 5
    const result = dijkstra(graph, 'A', 'D');
    expect(result.distance).toBe(5);
    expect(result.path).toEqual(['A', 'B', 'D']);
  });

  it('PROVES EDGE RELAXATION: prefers multi-hop path with lower weight over direct edge with higher weight', () => {
    const graph = new Graph();
    // Direct edge A -> C has weight 100 (e.g. traffic jam / toll)
    // Multi-hop path A -> B -> C has weight 10 + 10 = 20
    graph.addEdge('A', 'C', 100);
    graph.addEdge('A', 'B', 10);
    graph.addEdge('B', 'C', 10);

    const result = dijkstra(graph, 'A', 'C');
    expect(result.distance).toBe(20); // Not 100!
    expect(result.path).toEqual(['A', 'B', 'C']);
  });

  it('should handle disconnected graph (unreachable target)', () => {
    const graph = new Graph();
    graph.addEdge('A', 'B', 5);
    graph.addNode('C'); // C is completely isolated

    const result = dijkstra(graph, 'A', 'C');
    expect(result.distance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });
});
