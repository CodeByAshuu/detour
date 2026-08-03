const Order = require('../models/Order');
const Agent = require('../models/Agent');
const MinHeap = require('../algorithms/minHeap');
const { clusterOrders, haversineDistance } = require('../algorithms/unionFind');

function splitOversizedClusters(clusters, maxOrdersPerBatch) {
  return clusters.flatMap((cluster) => {
    if (cluster.orderCount <= maxOrdersPerBatch) return [cluster];

    const batches = [];
    for (let start = 0; start < cluster.orders.length; start += maxOrdersPerBatch) {
      const orders = cluster.orders.slice(start, start + maxOrdersPerBatch);
      const centroid = orders.reduce(
        ([lng, lat], order) => {
          const [orderLng, orderLat] = order.dropPoint?.coordinates || order.pickupPoint.coordinates;
          return [lng + orderLng, lat + orderLat];
        },
        [0, 0]
      ).map((total) => total / orders.length);
      batches.push({
        ...cluster,
        clusterId: `${cluster.clusterId}-B${batches.length + 1}`,
        orders,
        orderCount: orders.length,
        centroid,
      });
    }
    return batches;
  });
}

/**
 * Assigns pending order clusters to active delivery agents using MinHeap.
 * Primary optimization key: agent.currentLoad (least loaded agent prioritized).
 * Secondary optimization key: distance from agent to cluster centroid.
 * 
 * @param {number} thresholdKm - Distance threshold for clustering
 * @returns {Promise<Object>} Assignment results
 */
async function runAgentAssignment(thresholdKm = 3.0) {
  // Fetch pending orders and agents currently available for dispatch.
  // Include unstarted assignments so a dispatcher can rebalance a previously
  // skewed queue. Orders already in transit retain their current driver.
  const pendingOrders = await Order.find({ status: { $in: ['PENDING', 'ASSIGNED'] } });
  let activeAgents = await Agent.find({ shiftStatus: 'active' });
  let activatedIdleAgents = false;

  if (pendingOrders.length === 0) {
    return { message: 'No pending orders available for assignment', assignments: [] };
  }

  if (activeAgents.length === 0) {
    // Older records were created with the schema's `offline` default, while
    // the UI had no way to activate them. Treat those idle agents as available
    // for the dispatcher, but never assign an agent explicitly on break.
    activeAgents = await Agent.find({ shiftStatus: 'offline' });
    if (activeAgents.length === 0) {
      return { message: 'No active agents or idle agents available for assignment', assignments: [] };
    }
    activatedIdleAgents = true;
    await Agent.updateMany(
      { _id: { $in: activeAgents.map((agent) => agent._id) } },
      { shiftStatus: 'active' }
    );
    activeAgents.forEach((agent) => { agent.shiftStatus = 'active'; });
  }

  // Step 1: Cluster pending orders into geographic zones using Union-Find
  const geographicClusters = clusterOrders(pendingOrders, thresholdKm);
  // A connected zone may contain many nearby stops. Split it into fair batches
  // so a single depot-side agent cannot monopolize the complete zone.
  const fairBatchSize = Math.max(1, Math.ceil(pendingOrders.length / activeAgents.length));
  const clusters = splitOversizedClusters(geographicClusters, fairBatchSize);

  const deliveredStats = (await Order.aggregate([
    { $match: { status: 'DELIVERED', assignedAgent: { $ne: null } } },
    { $group: { _id: '$assignedAgent', completedCount: { $sum: 1 } } },
  ])) || [];
  const completedByAgent = new Map(
    deliveredStats.map((stat) => [String(stat._id), stat.completedCount])
  );

  // Remove old, not-yet-started assignments from the in-memory load before
  // selecting new owners. This makes re-running assignment a true rebalance.
  const agentsById = new Map(activeAgents.map((agent) => [String(agent._id), agent]));
  pendingOrders.forEach((order) => {
    if (order.status !== 'ASSIGNED' || !order.assignedAgent) return;
    const previousAgent = agentsById.get(String(order.assignedAgent._id || order.assignedAgent));
    if (previousAgent) previousAgent.currentLoad = Math.max(0, previousAgent.currentLoad - 1);
  });

  const assignments = [];
  const batchesAssignedThisRun = new Map(activeAgents.map((agent) => [String(agent._id), 0]));

  // Step 2: Assign each cluster to the best available agent
  for (const cluster of clusters) {
    // Fairness comes first: every eligible agent gets one nearby batch before
    // any agent receives a second. Load and distance remain the tie-breakers.
    const agentHeap = new MinHeap((agentA, agentB) => {
      if (agentA.batchesAssigned !== agentB.batchesAssigned) {
        return agentA.batchesAssigned - agentB.batchesAssigned;
      }
      if (agentA.currentLoad !== agentB.currentLoad) {
        return agentA.currentLoad - agentB.currentLoad;
      }
      if (agentA.distanceToCluster !== agentB.distanceToCluster) {
        return agentA.distanceToCluster - agentB.distanceToCluster;
      }
      if (agentA.completedCount !== agentB.completedCount) {
        return agentA.completedCount - agentB.completedCount;
      }
      return agentA.lastAssignedAt - agentB.lastAssignedAt;
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
          batchesAssigned: batchesAssignedThisRun.get(String(agent._id)),
          currentLoad: agent.currentLoad,
          distanceToCluster: dist,
          completedCount: completedByAgent.get(String(agent._id)) || 0,
          lastAssignedAt: agent.lastAssignedAt ? new Date(agent.lastAssignedAt).getTime() : 0,
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
        { status: 'ASSIGNED', assignedAgent: assignedAgent._id, assignedAt: new Date() }
      );

      // Update load in memory; all active agents are saved once after the
      // complete pass so rebalancing also persists agents that lost a stop.
      assignedAgent.currentLoad += cluster.orderCount;
      assignedAgent.lastAssignedAt = new Date();
      batchesAssignedThisRun.set(
        String(assignedAgent._id),
        batchesAssignedThisRun.get(String(assignedAgent._id)) + 1
      );

      assignments.push({
        clusterId: cluster.clusterId,
        assignedAgentId: assignedAgent._id,
        orderCount: cluster.orderCount,
        ordersAssigned: orderIds,
        distanceKm: Number(bestMatch.distanceToCluster.toFixed(2)),
      });
    }
  }

  await Promise.all(activeAgents.map((agent) => agent.save()));

  return {
    totalClustersProcessed: clusters.length,
    successfulAssignments: assignments.length,
    activatedIdleAgents,
    assignments,
  };
}

module.exports = {
  runAgentAssignment,
};
