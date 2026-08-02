/**
 * MinHeap (Priority Queue) Data Structure implemented from scratch.
 * Operates on a 0-indexed array representing a complete binary tree.
 * 
 * Time Complexities:
 * - push(): O(log N)
 * - pop(): O(log N)
 * - peek(): O(1)
 * - size(): O(1)
 */
class MinHeap {
  /**
   * Initializes MinHeap with an optional custom comparator.
   * @param {Function} comparator - Function `(a, b) => number`. Negative if `a` has higher priority than `b`.
   */
  constructor(comparator = (a, b) => a - b) {
    // Array to store binary heap nodes contiguous in memory
    this.heap = [];

    // Comparator function to determine priority ordering between elements
    this.compare = comparator;
  }

  /**
   * Returns current size of the heap.
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  /**
   * Checks if heap is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Returns top priority element without removing it.
   * @returns {*|null}
   */
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    // Root element is always at index 0 of the complete binary tree array
    return this.heap[0];
  }

  /**
   * Inserts a new element into the heap.
   * Appends element to the end of the array and bubbles it up to restore heap invariant.
   * 
   * @param {*} val - Element to insert
   */
  push(val) {
    // Step 1: Insert new value at the last position of the complete binary tree
    this.heap.push(val);

    // Step 2: Bubble up the newly inserted element from the last index to its correct position
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the top priority (minimum) element from the heap.
   * Replaces root with last element and bubbles it down to restore heap invariant.
   * 
   * @returns {*|null} Top priority element, or null if heap is empty
   */
  pop() {
    // Edge case: Empty heap
    if (this.isEmpty()) {
      return null;
    }

    // Single element edge case: Simply pop and return
    if (this.heap.length === 1) {
      return this.heap.pop();
    }

    // Step 1: Save top priority root element to return at the end
    const top = this.heap[0];

    // Step 2: Move the last element of the tree to the root (index 0)
    this.heap[0] = this.heap.pop();

    // Step 3: Bubble down the new root to restore heap order invariant
    this._bubbleDown(0);

    return top;
  }

  /**
   * Restores heap invariant upwards by comparing child node with parent.
   * @param {number} index - Index of element to bubble up
   * @private
   */
  _bubbleUp(index) {
    let current = index;

    // Continue moving up as long as node is not root (index > 0)
    while (current > 0) {
      // Calculate parent index in 0-indexed complete binary tree
      const parentIndex = Math.floor((current - 1) / 2);

      // Compare current element with parent element
      // If comparator returns < 0, current element has higher priority than parent
      if (this.compare(this.heap[current], this.heap[parentIndex]) < 0) {
        // Swap current element with parent
        this._swap(current, parentIndex);

        // Move target index up to parent index for next iteration
        current = parentIndex;
      } else {
        // Heap invariant satisfied — stop bubbling up
        break;
      }
    }
  }

  /**
   * Restores heap invariant downwards by comparing parent with left and right children.
   * @param {number} index - Index of element to bubble down
   * @private
   */
  _bubbleDown(index) {
    let current = index;
    const length = this.heap.length;

    while (true) {
      // Calculate 0-indexed child indices
      const leftChildIndex = 2 * current + 1;
      const rightChildIndex = 2 * current + 2;

      // Track index of element with highest priority among current, leftChild, rightChild
      let smallest = current;

      // Check if left child exists and has higher priority than current smallest
      if (
        leftChildIndex < length &&
        this.compare(this.heap[leftChildIndex], this.heap[smallest]) < 0
      ) {
        smallest = leftChildIndex;
      }

      // Check if right child exists and has higher priority than current smallest
      if (
        rightChildIndex < length &&
        this.compare(this.heap[rightChildIndex], this.heap[smallest]) < 0
      ) {
        smallest = rightChildIndex;
      }

      // If smallest index is still current, heap property is satisfied — stop
      if (smallest === current) {
        break;
      }

      // Swap current node with higher priority child
      this._swap(current, smallest);

      // Continue bubbling down from child index
      current = smallest;
    }
  }

  /**
   * Helper function to swap elements at indices i and j in heap array.
   * @param {number} i 
   * @param {number} j 
   * @private
   */
  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

module.exports = MinHeap;
