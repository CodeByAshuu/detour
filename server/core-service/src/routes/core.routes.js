const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const agentController = require('../controllers/agent.controller');
const zoneController = require('../controllers/zone.controller');
const clusteringController = require('../controllers/clustering.controller');
const assignmentController = require('../controllers/assignment.controller');
const slaController = require('../controllers/sla.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

// Apply verifyToken to all routes below
router.use(verifyToken);

// Orders
router.post('/orders', checkRole(['admin', 'dispatcher']), orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id', checkRole(['admin', 'dispatcher', 'agent']), orderController.updateOrder);
router.delete('/orders/:id', checkRole(['admin', 'dispatcher']), orderController.deleteOrder);

// Agents
router.post('/agents', checkRole(['admin']), agentController.createAgent);
router.get('/agents', agentController.getAgents);
router.get('/agents/:id', agentController.getAgentById);
router.put('/agents/:id', agentController.updateAgent);
router.delete('/agents/:id', checkRole(['admin']), agentController.deleteAgent);

// Zones
router.post('/zones', checkRole(['admin']), zoneController.createZone);
router.get('/zones', zoneController.getZones);

// DSA Engine Endpoints (Zone Clustering & MinHeap Agent Assignment)
router.post('/clusters/run', checkRole(['admin', 'dispatcher']), clusteringController.triggerClustering);
router.post('/assignments/run', checkRole(['admin', 'dispatcher']), assignmentController.triggerAssignment);

// SLA Monitor
router.get('/sla/stats',    checkRole(['admin', 'dispatcher']), slaController.getStats);
router.get('/sla/breaches', checkRole(['admin', 'dispatcher']), slaController.getBreaches);

module.exports = router;
