const MinHeap = require('../src/algorithms/minHeap');

describe('MinHeap Data Structure', () => {
  it('should return null for peek() and pop() on empty heap', () => {
    const heap = new MinHeap();
    expect(heap.isEmpty()).toBe(true);
    expect(heap.peek()).toBeNull();
    expect(heap.pop()).toBeNull();
  });

  it('should handle single element push and pop correctly', () => {
    const heap = new MinHeap();
    heap.push(42);
    expect(heap.size()).toBe(1);
    expect(heap.peek()).toBe(42);
    expect(heap.pop()).toBe(42);
    expect(heap.isEmpty()).toBe(true);
  });

  it('should extract numbers in ascending order for default min-heap', () => {
    const heap = new MinHeap();
    const numbers = [15, 3, 20, 1, 8, 2];

    numbers.forEach((num) => heap.push(num));

    const result = [];
    while (!heap.isEmpty()) {
      result.push(heap.pop());
    }

    // Expected sorted order: [1, 2, 3, 8, 15, 20]
    expect(result).toEqual([1, 2, 3, 8, 15, 20]);
  });

  it('should correctly prioritize objects using a custom comparator (Agent Load Priority)', () => {
    // Custom comparator prioritizing least-loaded agent first
    const agentComparator = (a, b) => a.currentLoad - b.currentLoad;
    const heap = new MinHeap(agentComparator);

    heap.push({ name: 'Agent A', currentLoad: 5 });
    heap.push({ name: 'Agent B', currentLoad: 1 });
    heap.push({ name: 'Agent C', currentLoad: 3 });

    // Least loaded agent should be popped first
    expect(heap.pop()).toEqual({ name: 'Agent B', currentLoad: 1 });
    expect(heap.pop()).toEqual({ name: 'Agent C', currentLoad: 3 });
    expect(heap.pop()).toEqual({ name: 'Agent A', currentLoad: 5 });
  });

  it('should handle tie-breaking with secondary comparator criteria (Load primary, Distance secondary)', () => {
    // Primary: currentLoad ascending, Secondary: distance ascending
    const complexComparator = (a, b) => {
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad;
      }
      return a.distance - b.distance;
    };

    const heap = new MinHeap(complexComparator);

    heap.push({ id: 'Agent1', currentLoad: 2, distance: 5.0 });
    heap.push({ id: 'Agent2', currentLoad: 1, distance: 10.0 });
    heap.push({ id: 'Agent3', currentLoad: 2, distance: 1.5 }); // Same load as Agent1, but closer!

    // Agent2 has lowest load (1) -> first
    expect(heap.pop().id).toBe('Agent2');

    // Agent3 has load 2, distance 1.5 vs Agent1 load 2, distance 5.0 -> Agent3 second
    expect(heap.pop().id).toBe('Agent3');

    // Agent1 last
    expect(heap.pop().id).toBe('Agent1');
  });

  it('PROVES HEAP INVARIANT: bubbleUp and bubbleDown maintain correct root across interleaved operations', () => {
    const heap = new MinHeap();
    heap.push(50);
    heap.push(30);
    expect(heap.peek()).toBe(30);

    heap.push(10);
    expect(heap.peek()).toBe(10);

    expect(heap.pop()).toBe(10);
    expect(heap.peek()).toBe(30);

    heap.push(20);
    expect(heap.peek()).toBe(20);

    heap.push(5);
    expect(heap.peek()).toBe(5);
  });
});
