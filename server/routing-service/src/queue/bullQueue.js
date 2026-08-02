const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse host and port from REDIS_URL
function parseRedisConfig(urlStr) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname || 'localhost',
      port: Number(url.port) || 6379,
    };
  } catch (e) {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = parseRedisConfig(REDIS_URL);

// Initialize BullMQ Routing Queue
const routingQueue = new Queue('routingQueue', { connection });

/**
 * Enqueues a heavy routing optimization job into Redis/BullMQ queue.
 * @param {Object} jobData - { depotLocation, stops, algorithm: 'heldKarp' | 'dijkstra' | 'astar' }
 * @returns {Promise<Object>} Created job reference
 */
async function addRoutingJob(jobData) {
  const job = await routingQueue.add('computeRoute', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  });
  return { jobId: job.id, status: 'QUEUED' };
}

module.exports = {
  routingQueue,
  addRoutingJob,
  connection,
};
