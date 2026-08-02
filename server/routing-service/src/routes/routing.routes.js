const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routing.controller');

router.post('/shortest-path', routingController.computeShortestPath);
router.post('/optimize-tsp', routingController.optimizeTSP);
router.post('/queue-job', routingController.queueRoutingJob);

module.exports = router;
