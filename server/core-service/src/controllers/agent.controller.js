const Agent = require('../models/Agent');

exports.createAgent = async (req, res) => {
  try {
    const agent = new Agent(req.body);
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAgents = async (req, res) => {
  try {
    const query = req.userRole === 'agent' ? { userId: req.userId } : {};
    const agents = await Agent.find(query);
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (req.userRole === 'agent' && String(agent.userId) !== String(req.userId)) {
      return res.status(403).json({ error: 'You can only view your own agent profile' });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    if (req.userRole === 'agent') {
      const ownAgent = await Agent.findOne({ _id: req.params.id, userId: req.userId });
      if (!ownAgent) return res.status(403).json({ error: 'You can only update your own agent profile' });
    }
    const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.status(200).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.status(200).json({ message: 'Agent deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
