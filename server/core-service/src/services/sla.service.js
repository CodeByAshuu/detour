const Order = require('../models/Order');
const SlidingWindowSLA = require('../algorithms/slidingWindowSLA');

// Module-level singleton so the window persists across requests
// (resets when the service restarts — acceptable for a shift-level monitor)
let slaMonitor = new SlidingWindowSLA(50);

/**
 * Rehydrates the SLA window from the database on service startup
 * or when explicitly called. Queries the most recent `windowSize`
 * DELIVERED / FAILED orders and feeds them into the window in
 * chronological order.
 *
 * @param {number} [windowSize=50]
 */
async function rehydrateSLAWindow(windowSize = 50) {
  slaMonitor = new SlidingWindowSLA(windowSize);

  // Fetch the most recent `windowSize` completed orders, oldest first
  const completedOrders = await Order.find({
    status: { $in: ['DELIVERED', 'FAILED'] },
    assignedAt: { $exists: true },
    deliveredAt: { $exists: true },
  })
    .sort({ deliveredAt: 1 })    // oldest first so the window ends at the most recent
    .limit(windowSize)
    .lean();

  for (const order of completedOrders) {
    slaMonitor.addDelivery({
      orderId:    String(order._id),
      assignedAt: order.assignedAt,
      deliveredAt: order.deliveredAt,
      promisedEnd: order.timeWindow?.end || null,
      status:     order.status,
    });
  }

  return slaMonitor.getStats();
}

/**
 * Records a newly completed order into the live SLA window.
 * Called by order update logic whenever an order transitions to DELIVERED or FAILED.
 *
 * @param {Object} order - Mongoose order document
 */
function recordDelivery(order) {
  if (!order.assignedAt || !order.deliveredAt) return null;

  return slaMonitor.addDelivery({
    orderId:    String(order._id),
    assignedAt: order.assignedAt,
    deliveredAt: order.deliveredAt,
    promisedEnd: order.timeWindow?.end || null,
    status:     order.status,
  });
}

/**
 * Returns current rolling SLA statistics snapshot.
 */
function getSLAStats() {
  return slaMonitor.getStats();
}

/**
 * Returns only the breach entries currently in the window.
 */
function getSLABreaches() {
  return slaMonitor.getBreaches();
}

module.exports = {
  rehydrateSLAWindow,
  recordDelivery,
  getSLAStats,
  getSLABreaches,
};
