const { Worker } = require('bullmq');
const { connection } = require('./bullQueue');
const { solveHeldKarpTSP } = require('../algorithms/heldKarpTSP');
const dijkstra = require('../algorithms/dijkstra');
const astar = require('../algorithms/astar');
const { buildCompleteGraph } = require('../graph/buildGraph');

/**
 * BullMQ Worker Consumer Process.
 * Listens for background routing jobs and executes algorithms asynchronously.
 */
function startWorker() {
  const worker = new Worker(
    'routingQueue',
    async (job) => {
      console.log(`[Worker] Processing routing job #${job.id}: ${job.name}`);
      const { depotLocation, stops, algorithm = 'heldKarp' } = job.data;

      let result;

      if (algorithm === 'heldKarp') {
        result = solveHeldKarpTSP(depotLocation, stops);
      } else if (algorithm === 'dijkstra') {
        const graph = buildCompleteGraph([depotLocation, ...stops]);
        result = dijkstra(graph, depotLocation.id, stops[0]?.id || null);
      } else if (algorithm === 'astar') {
        const graph = buildCompleteGraph([depotLocation, ...stops]);
        result = astar(graph, depotLocation.id, stops[0]?.id || null);
      }

      console.log(`[Worker] Job #${job.id} completed successfully.`);
      return result;
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job #${job?.id} failed:`, err.message);
  });

  return worker;
}

module.exports = {
  startWorker,
};
