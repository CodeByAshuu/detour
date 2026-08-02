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
    // Stamp deliveredAt on the document if transitioning to a terminal state
    const terminalStatuses = ['DELIVERED', 'FAILED'];
    const incomingStatus = req.body.status;

    const updatePayload = { ...req.body };
    if (terminalStatuses.includes(incomingStatus) && !updatePayload.deliveredAt) {
      updatePayload.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Feed completed order into the live SLA sliding window
    if (terminalStatuses.includes(order.status)) {
      recordDelivery(order);
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
