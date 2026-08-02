const { UnionFind, haversineDistance, clusterOrders } = require('../src/algorithms/unionFind');

describe('Haversine Distance Helper', () => {
  it('should return 0 for identical coordinates', () => {
    const point = [77.5946, 12.9716]; // Bengaluru coordinates [lng, lat]
    expect(haversineDistance(point, point)).toBeCloseTo(0, 5);
  });

  it('should correctly calculate distance between two known cities (Bengaluru to Mysuru ~140km)', () => {
    const blr = [77.5946, 12.9716];
    const mys = [76.6394, 12.2958];
    const dist = haversineDistance(blr, mys);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(140);
  });
});

describe('UnionFind Data Structure', () => {
  it('should initialize correctly with single node edge case', () => {
    const uf = new UnionFind(['order1']);
    expect(uf.find('order1')).toBe('order1');
  });

  it('should handle dynamic element addition gracefully', () => {
    const uf = new UnionFind();
    expect(uf.find('A')).toBe('A');
    expect(uf.find('B')).toBe('B');
    expect(uf.find('A')).not.toBe(uf.find('B'));
  });

  it('should union two disjoint sets correctly', () => {
    const uf = new UnionFind(['A', 'B', 'C']);
    uf.union('A', 'B');
    expect(uf.find('A')).toBe(uf.find('B'));
    expect(uf.find('A')).not.toBe(uf.find('C'));
  });

  it('PROVES PATH COMPRESSION: flattens tree pointers directly to root after find()', () => {
    const uf = new UnionFind(['A', 'B', 'C', 'D']);
    // Manually construct a linear chain A -> B -> C -> D without path compression initially
    uf.parent.set('A', 'B');
    uf.parent.set('B', 'C');
    uf.parent.set('C', 'D');
    uf.parent.set('D', 'D');

    // Before find('A'), parent of A is B
    expect(uf.parent.get('A')).toBe('B');

    // Executing find('A') should compress the path so parent of A becomes D directly
    const root = uf.find('A');
    expect(root).toBe('D');
    expect(uf.parent.get('A')).toBe('D'); // Proves Path Compression works!
    expect(uf.parent.get('B')).toBe('D'); // Proves intermediate node compressed too!
  });

  it('PROVES UNION BY RANK: attaches smaller depth tree under higher depth root', () => {
    const uf = new UnionFind();
    // Build tree 1 with rank 1 (Root R1 -> Child C1)
    uf.union('C1', 'R1'); // R1 is parent of C1
    
    // Build tree 2 with rank 0 (Root R2)
    uf.add('R2');

    // Currently rank of R1 is 1, rank of R2 is 0
    expect(uf.rank.get(uf.find('R1'))).toBe(1);
    expect(uf.rank.get(uf.find('R2'))).toBe(0);

    // Union R1 and R2 -> R2 (smaller rank) should attach under R1 (higher rank)
    uf.union('R1', 'R2');

    // Parent of R2 should now be R1
    expect(uf.parent.get('R2')).toBe(uf.find('R1'));
  });

  it('should correctly group elements using getGroups()', () => {
    const uf = new UnionFind(['1', '2', '3', '4', '5']);
    uf.union('1', '2');
    uf.union('2', '3');
    uf.union('4', '5');

    const groups = uf.getGroups();
    expect(groups.size).toBe(2); // Two disconnected components: {1,2,3} and {4,5}
  });

  it('fails with naive implementation that does not track connected components', () => {
    // Transitive closure test: if A-B and B-C are linked, A and C must share the same component
    const uf = new UnionFind(['A', 'B', 'C']);
    uf.union('A', 'B');
    uf.union('B', 'C');

    // Naive direct check (A === B) would fail for A and C without find() recursion
    expect(uf.find('A')).toBe(uf.find('C'));
  });
});

describe('clusterOrders Function (Geographical Zone Clustering)', () => {
  it('should handle empty input edge case', () => {
    expect(clusterOrders([])).toEqual([]);
    expect(clusterOrders(null)).toEqual([]);
  });

  it('should handle single order edge case', () => {
    const orders = [
      { _id: 'ord1', pickupPoint: { type: 'Point', coordinates: [77.5946, 12.9716] } }
    ];
    const clusters = clusterOrders(orders, 3.0);
    expect(clusters.length).toBe(1);
    expect(clusters[0].orderCount).toBe(1);
    expect(clusters[0].orders[0]._id).toBe('ord1');
  });

  it('should cluster nearby orders and separate distant orders', () => {
    const orders = [
      // Cluster 1 (Koramangala, Bengaluru - close to each other < 1km)
      { _id: 'ord1', pickupPoint: { type: 'Point', coordinates: [77.6245, 12.9352] } },
      { _id: 'ord2', pickupPoint: { type: 'Point', coordinates: [77.6270, 12.9380] } },
      
      // Cluster 2 (Whitefield, Bengaluru - ~15km away from Koramangala)
      { _id: 'ord3', pickupPoint: { type: 'Point', coordinates: [77.7499, 12.9698] } },
      { _id: 'ord4', pickupPoint: { type: 'Point', coordinates: [77.7520, 12.9710] } },
    ];

    const clusters = clusterOrders(orders, 3.0); // 3km threshold

    expect(clusters.length).toBe(2);

    const cluster1 = clusters.find((c) => c.orders.some((o) => o._id === 'ord1'));
    const cluster2 = clusters.find((c) => c.orders.some((o) => o._id === 'ord3'));

    expect(cluster1.orderCount).toBe(2);
    expect(cluster1.orders.map((o) => o._id)).toContain('ord2');

    expect(cluster2.orderCount).toBe(2);
    expect(cluster2.orders.map((o) => o._id)).toContain('ord4');
  });

  it('should correctly merge transitively linked clusters (A-B within 3km, B-C within 3km, but A-C > 3km)', () => {
    const orders = [
      { _id: 'ordA', pickupPoint: { type: 'Point', coordinates: [77.6000, 12.9000] } },
      { _id: 'ordB', pickupPoint: { type: 'Point', coordinates: [77.6150, 12.9100] } }, // ~2km from A
      { _id: 'ordC', pickupPoint: { type: 'Point', coordinates: [77.6300, 12.9200] } }, // ~2km from B, ~4km from A
    ];

    const clusters = clusterOrders(orders, 3.0);

    // All 3 should be merged into 1 cluster due to transitive Union-Find connectivity!
    expect(clusters.length).toBe(1);
    expect(clusters[0].orderCount).toBe(3);
  });
});
