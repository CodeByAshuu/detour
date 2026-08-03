const Order = require('../models/Order');
const Agent = require('../models/Agent');
const { recordDelivery } = require('../services/sla.service');

exports.createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.userRole === 'agent') {
      const agent = await Agent.findOne({ userId: req.userId });
      if (!agent) return res.status(200).json([]);
      filter.assignedAgent = agent._id;
    }
    const orders = await Order.find(filter).populate('assignedAgent');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.userRole === 'agent') {
      const agent = await Agent.findOne({ userId: req.userId });
      if (!agent) return res.status(404).json({ error: 'Agent profile not found' });
      filter.assignedAgent = agent._id;
    }
    const order = await Order.findOne(filter).populate('assignedAgent');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const terminalStatuses = ['DELIVERED', 'FAILED'];
    const incomingStatus = req.body.status;
    const previousOrder = await Order.findById(req.params.id);
    if (!previousOrder) return res.status(404).json({ error: 'Order not found' });

    if (req.userRole === 'agent') {
      const agent = await Agent.findOne({ userId: req.userId });
      if (!agent || String(previousOrder.assignedAgent) !== String(agent._id)) {
        return res.status(403).json({ error: 'You can only update orders assigned to you' });
      }
    }

    const updatePayload = { ...req.body };
    if (terminalStatuses.includes(incomingStatus) && !updatePayload.deliveredAt) {
      updatePayload.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

    // Release capacity exactly once when an assigned order reaches a terminal
    // state; otherwise completed work permanently blocks later assignments.
    if (
      terminalStatuses.includes(order.status) &&
      !terminalStatuses.includes(previousOrder.status) &&
      order.assignedAgent
    ) {
      await Agent.findByIdAndUpdate(order.assignedAgent, {
        $inc: { currentLoad: -1 },
      });
    }

    // Feed completed order into live SLA sliding window
    if (terminalStatuses.includes(order.status)) {
      recordDelivery(order);
    }

    // Emit real-time event to all connected dispatchers
    const io = req.app.get('io');
    if (io) {
      io.to('dispatchers').emit('order:updated', {
        orderId: order._id,
        status:  order.status,
        ts:      Date.now(),
      });
      // If an agent is assigned, also notify their room
      if (order.assignedAgent) {
        io.to(`agent:${order.assignedAgent}`).emit('order:updated', {
          orderId: order._id,
          status:  order.status,
        });
      }
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
