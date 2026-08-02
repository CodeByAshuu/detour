/**
 * MinHeap (Priority Queue) Data Structure for Routing Algorithms (Dijkstra, A*).
 * 0-indexed array representing a complete binary tree.
 */
class MinHeap {
  /**
   * @param {Function} comparator - (a, b) => number. Negative if a higher priority than b.
   */
  constructor(comparator = (a, b) => a - b) {
    this.heap = [];
    this.compare = comparator;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.isEmpty() ? null : this.heap[0];
  }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return top;
  }

  _bubbleUp(index) {
    let current = index;
    while (current > 0) {
      const parentIndex = Math.floor((current - 1) / 2);
      if (this.compare(this.heap[current], this.heap[parentIndex]) < 0) {
        this._swap(current, parentIndex);
        current = parentIndex;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    let current = index;
    const length = this.heap.length;
    while (true) {
      const leftChildIndex = 2 * current + 1;
      const rightChildIndex = 2 * current + 2;
      let smallest = current;

      if (
        leftChildIndex < length &&
        this.compare(this.heap[leftChildIndex], this.heap[smallest]) < 0
      ) {
        smallest = leftChildIndex;
      }

      if (
        rightChildIndex < length &&
        this.compare(this.heap[rightChildIndex], this.heap[smallest]) < 0
      ) {
        smallest = rightChildIndex;
      }

      if (smallest === current) break;
      this._swap(current, smallest);
      current = smallest;
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

module.exports = MinHeap;
