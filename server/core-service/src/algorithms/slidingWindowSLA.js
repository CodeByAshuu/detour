/**
 * SLA (Service Level Agreement) Monitor — Sliding Window Implementation.
 *
 * WHAT PROBLEM THIS SOLVES:
 * ----------------------------------------------------------
 * A delivery platform needs to track two metrics in real time:
 *   1. Rolling average delivery duration over the last N completed deliveries.
 *   2. Which of those deliveries breached the promised time window (delivered late).
 *
 * NAIVE APPROACH (and why it fails):
 * ----------------------------------------------------------
 * A naive approach recalculates the average from scratch every time a new
 * delivery event arrives: sum all N durations and divide by N. This is O(N)
 * per new event. Over a stream of M events that is O(M * N), which becomes
 * expensive when N is large (e.g. last 1000 deliveries).
 *
 * SLIDING WINDOW APPROACH:
 * ----------------------------------------------------------
 * We maintain a double-ended queue (Deque / circular buffer) of at most
 * `windowSize` recent delivery entries, plus a running sum. When a new
 * delivery comes in:
 *   1. Add it to the back of the deque. Add its duration to the running sum.
 *   2. If the deque now exceeds `windowSize`, evict the oldest entry from the
 *      front and subtract its duration from the running sum.
 *   3. Rolling average = runningSum / deque.length — O(1) per event.
 *
 * Breach detection is O(1): compare promised end time vs actual delivery time.
 *
 * TIME COMPLEXITY:  O(1) amortized per event (each entry is pushed and popped at most once).
 * SPACE COMPLEXITY: O(windowSize) — only the active window is kept in memory.
 */

/**
 * Represents a single delivery event fed into the SLA monitor.
 * @typedef {Object} DeliveryEvent
 * @property {string}  orderId       - Unique order identifier
 * @property {Date}    assignedAt    - When the order was assigned to an agent
 * @property {Date}    deliveredAt   - When the order was actually delivered (or failed)
 * @property {Date}    [promisedEnd] - Latest acceptable delivery time (SLA deadline)
 * @property {string}  status        - 'DELIVERED' | 'FAILED'
 */

class SlidingWindowSLA {
  /**
   * @param {number} windowSize - Maximum number of recent deliveries to include in the window.
   *                              Older entries are evicted FIFO as new ones arrive.
   */
  constructor(windowSize = 50) {
    if (windowSize < 1) throw new Error('windowSize must be at least 1');

    // The active window: an array used as a FIFO queue.
    // Front = oldest entry, Back = newest entry.
    this.window = [];

    // Maximum capacity of the sliding window.
    this.windowSize = windowSize;

    // Running total of delivery durations (ms) inside the current window.
    // Maintained incrementally so average is O(1), not O(N).
    this.runningSum = 0;

    // Count of breach events currently inside the window.
    this.breachCount = 0;
  }

  /**
   * Adds a new delivery event to the sliding window.
   * Evicts the oldest entry if the window is at capacity.
   *
   * @param {DeliveryEvent} event
   * @returns {Object} Updated SLA stats after this event is ingested.
   */
  addDelivery(event) {
    const { orderId, assignedAt, deliveredAt, promisedEnd, status } = event;

    // --- Step 1: Compute the actual delivery duration for this event ---
    const assignedMs    = new Date(assignedAt).getTime();
    const deliveredMs   = new Date(deliveredAt).getTime();
    const durationMs    = deliveredMs - assignedMs;        // How long the delivery took

    // --- Step 2: Determine if this delivery breached the SLA ---
    // A breach is: delivered AFTER the promised end time.
    const isBreach = promisedEnd
      ? deliveredMs > new Date(promisedEnd).getTime()
      : false;

    // --- Step 3: Build the window entry ---
    const entry = {
      orderId,
      durationMs,
      isBreach,
      status: status || 'DELIVERED',
    };

    // --- Step 4: Evict oldest entry if window is at capacity (SLIDING) ---
    if (this.window.length >= this.windowSize) {
      // Remove from the front — this is the "slide" operation.
      const evicted = this.window.shift();

      // Subtract evicted entry's contribution from running totals.
      this.runningSum  -= evicted.durationMs;
      if (evicted.isBreach) this.breachCount--;
    }

    // --- Step 5: Push new entry onto the back of the window ---
    this.window.push(entry);
    this.runningSum += durationMs;
    if (isBreach) this.breachCount++;

    // --- Step 6: Return current stats snapshot (O(1) — no re-scan needed) ---
    return this.getStats();
  }

  /**
   * Returns the current rolling statistics for the active window.
   * All values are O(1) reads from maintained counters.
   *
   * @returns {Object} { windowSize, count, rollingAvgMs, rollingAvgMinutes, breachCount, breachRate }
   */
  getStats() {
    const count = this.window.length;

    return {
      windowSize:        this.windowSize,
      count,                                                      // Entries currently in window
      rollingAvgMs:      count > 0 ? this.runningSum / count : 0, // O(1) average
      rollingAvgMinutes: count > 0 ? (this.runningSum / count) / 60_000 : 0,
      breachCount:       this.breachCount,
      breachRate:        count > 0 ? this.breachCount / count : 0, // 0.0 – 1.0
      breaches:          this.window.filter((e) => e.isBreach),   // Full breach list
    };
  }

  /**
   * Returns all breach entries currently inside the sliding window.
   * @returns {Array<Object>}
   */
  getBreaches() {
    return this.window.filter((e) => e.isBreach);
  }

  /**
   * Resets the sliding window (useful between shifts / test runs).
   */
  reset() {
    this.window     = [];
    this.runningSum = 0;
    this.breachCount = 0;
  }
}

module.exports = SlidingWindowSLA;
