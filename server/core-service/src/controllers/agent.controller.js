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
    const agents = await Agent.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAgent = async (req, res) => {
  try {
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
