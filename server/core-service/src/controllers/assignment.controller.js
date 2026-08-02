const { runAgentAssignment } = require('../services/assignment.service');
const { provisionMissingAgentProfiles } = require('../services/agentProvisioning.service');

exports.triggerAssignment = async (req, res) => {
  try {
    const thresholdKm = req.body.thresholdKm ? Number(req.body.thresholdKm) : 3.0;
    const profilesCreated = await provisionMissingAgentProfiles();
    const result = await runAgentAssignment(thresholdKm);
    res.status(200).json({ ...result, profilesCreated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
