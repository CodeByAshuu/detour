const Order = require('../models/Order');
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
    const orders = await Order.find().populate('assignedAgent');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('assignedAgent');
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

    const updatePayload = { ...req.body };
    if (terminalStatuses.includes(incomingStatus) && !updatePayload.deliveredAt) {
      updatePayload.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

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
