const Order = require('../models/Order');
const Zone = require('../models/Zone');
const { clusterOrders } = require('../algorithms/unionFind');

/**
 * Service to execute Union-Find geographical clustering on unassigned orders.
 * 
 * @param {number} thresholdKm - Proximity threshold in kilometers
 * @returns {Promise<Object>} Summary of created clusters and affected orders
 */
async function runZoneClustering(thresholdKm = 3.0) {
  // Fetch all pending orders from MongoDB
  const pendingOrders = await Order.find({ status: 'PENDING' }).lean();

  if (pendingOrders.length === 0) {
    return { message: 'No pending orders to cluster', clusters: [] };
  }

  // Execute Union-Find clustering algorithm
  const clusters = clusterOrders(pendingOrders, thresholdKm);

  // Persist created clusters into Zone collection for record-keeping
  const createdZones = [];
  for (const cluster of clusters) {
    const zone = new Zone({
      name: `Cluster ${cluster.clusterId}`,
      center: {
        type: 'Point',
        coordinates: cluster.centroid,
      },
      radiusKm: thresholdKm,
    });
    await zone.save();
    createdZones.push({
      zoneId: zone._id,
      name: zone.name,
      centroid: cluster.centroid,
      orderCount: cluster.orderCount,
      orderIds: cluster.orders.map((o) => o._id),
    });
  }

  return {
    totalPendingOrders: pendingOrders.length,
    clustersCreated: createdZones.length,
    clusters: createdZones,
  };
}

module.exports = {
  runZoneClustering,
};
