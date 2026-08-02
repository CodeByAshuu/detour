const dijkstra = require('../algorithms/dijkstra');
const astar = require('../algorithms/astar');
const { solveHeldKarpTSP } = require('../algorithms/heldKarpTSP');
const { buildCompleteGraph, Graph } = require('../graph/buildGraph');
const { addRoutingJob } = require('../queue/bullQueue');

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

    const result = solveHeldKarpTSP(depotLocation, stops, { maxStops });
    res.status(200).json(result);
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
