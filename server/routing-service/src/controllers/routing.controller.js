const dijkstra = require('../algorithms/dijkstra');
const astar = require('../algorithms/astar');
const { solveHeldKarpTSP } = require('../algorithms/heldKarpTSP');
const { buildCompleteGraph, Graph } = require('../graph/buildGraph');
const { addRoutingJob } = require('../queue/bullQueue');
const { getRoadDistanceMatrix, getRoadPath } = require('../services/roadRouting.service');

exports.computeShortestPath = async (req, res) => {
  try {
    const { locations, startNodeId, targetNodeId, algorithm = 'dijkstra' } = req.body;

    if (!locations || !startNodeId) {
      return res.status(400).json({ error: 'locations array and startNodeId are required' });
    }

    const graph = buildCompleteGraph(locations);
    let result;

    if (algorithm === 'astar') {
      result = astar(graph, String(startNodeId), targetNodeId ? String(targetNodeId) : null);
    } else {
      result = dijkstra(graph, String(startNodeId), targetNodeId ? String(targetNodeId) : null);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.optimizeTSP = async (req, res) => {
  try {
    const { depotLocation, stops, maxStops = 12 } = req.body;

    if (!depotLocation || !stops) {
      return res.status(400).json({ error: 'depotLocation and stops array are required' });
    }

    const nodes = [depotLocation, ...stops];
    let distanceMatrix;
    let routingSource = 'road-network';

    try {
      distanceMatrix = await getRoadDistanceMatrix(nodes);
    } catch (error) {
      // The optimization still works offline, but clients can distinguish its
      // straight-line estimate from a true road-network route.
      console.warn('Road distance matrix unavailable; using Haversine fallback:', error.message);
      routingSource = 'straight-line-fallback';
    }

    // The useful route is from the depot through the deliveries. Returning to
    // the depot should not make a delivery slower or alter the chosen order.
    const result = solveHeldKarpTSP(depotLocation, stops, {
      maxStops,
      distanceMatrix,
      returnToDepot: false,
    });
    const orderedNodes = [depotLocation, ...result.orderedStops];
    let roadPath = null;
    let roadStopIndexes = null;
    if (routingSource === 'road-network') {
      try {
        const roadRoute = await getRoadPath(orderedNodes);
        roadPath = roadRoute?.roadPath || null;
        roadStopIndexes = roadRoute?.legEndIndexes || null;
      } catch (error) {
        console.warn('Road geometry unavailable; using straight-line map fallback:', error.message);
        routingSource = 'straight-line-fallback';
      }
    }

    res.status(200).json({ ...result, roadPath, roadStopIndexes, routingSource });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.queueRoutingJob = async (req, res) => {
  try {
    const { depotLocation, stops, algorithm = 'heldKarp' } = req.body;
    const result = await addRoutingJob({ depotLocation, stops, algorithm });
    res.status(202).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
