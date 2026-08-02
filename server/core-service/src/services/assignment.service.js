const Order = require('../models/Order');
const Agent = require('../models/Agent');
const MinHeap = require('../algorithms/minHeap');
const { clusterOrders, haversineDistance } = require('../algorithms/unionFind');

/**
 * Assigns pending order clusters to active delivery agents using MinHeap.
 * Primary optimization key: agent.currentLoad (least loaded agent prioritized).
 * Secondary optimization key: distance from agent to cluster centroid.
 * 
 * @param {number} thresholdKm - Distance threshold for clustering
 * @returns {Promise<Object>} Assignment results
 */
async function runAgentAssignment(thresholdKm = 3.0) {
  // Fetch pending orders and active agents
  const pendingOrders = await Order.find({ status: 'PENDING' });
  const activeAgents = await Agent.find({ shiftStatus: 'active' });

  if (pendingOrders.length === 0) {
    return { message: 'No pending orders available for assignment', assignments: [] };
  }

  if (activeAgents.length === 0) {
    return { message: 'No active agents available for assignment', assignments: [] };
  }

  // Step 1: Cluster pending orders into geographic zones using Union-Find
  const clusters = clusterOrders(pendingOrders, thresholdKm);

  const assignments = [];

  // Step 2: Assign each cluster to the best available agent
  for (const cluster of clusters) {
    // Custom MinHeap comparator: Sort agents by current load (asc), then distance to cluster (asc)
    const agentHeap = new MinHeap((agentA, agentB) => {
      if (agentA.currentLoad !== agentB.currentLoad) {
        return agentA.currentLoad - agentB.currentLoad;
      }
      return agentA.distanceToCluster - agentB.distanceToCluster;
    });

    // Calculate proximity distance from each agent to cluster centroid and insert into MinHeap
    for (const agent of activeAgents) {
      // Check if agent has capacity left to take this cluster's orders
      if (agent.currentLoad + cluster.orderCount <= agent.capacity) {
        const dist = haversineDistance(
          agent.currentLocation.coordinates,
          cluster.centroid
        );

        agentHeap.push({
          agentDoc: agent,
          currentLoad: agent.currentLoad,
          distanceToCluster: dist,
        });
      }
    }

    // Pick top priority agent from MinHeap
    const bestMatch = agentHeap.pop();

    if (bestMatch) {
      const assignedAgent = bestMatch.agentDoc;

      // Update orders in DB to ASSIGNED status with assignedAgent ID
      const orderIds = cluster.orders.map((o) => o._id);
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { status: 'ASSIGNED', assignedAgent: assignedAgent._id }
      );

      // Update agent's current load in DB and in memory
      assignedAgent.currentLoad += cluster.orderCount;
      await assignedAgent.save();

      assignments.push({
        clusterId: cluster.clusterId,
        assignedAgentId: assignedAgent._id,
        orderCount: cluster.orderCount,
        ordersAssigned: orderIds,
        distanceKm: Number(bestMatch.distanceToCluster.toFixed(2)),
      });
    }
  }

  return {
    totalClustersProcessed: clusters.length,
    successfulAssignments: assignments.length,
    assignments,
  };
}

module.exports = {
  runAgentAssignment,
};
