const Agent = require('../models/Agent');
const AuthUser = require('../models/AuthUser');

const DEFAULT_DEPOT_COORDINATES = [77.59, 12.97];

/**
 * Ensures every delivery-agent account has the operational Agent document
 * required by assignment, routing, and map tracking. Older accounts were only
 * present in the auth service, leaving the assignment fleet empty.
 */
async function provisionMissingAgentProfiles() {
  const agentUsers = await AuthUser.find({ role: 'agent' }).select('_id').lean();
  if (agentUsers.length === 0) return 0;

  const userIds = agentUsers.map((user) => user._id);
  const existingAgents = await Agent.find({ userId: { $in: userIds } }).select('userId').lean();
  const existingUserIds = new Set(existingAgents.map((agent) => String(agent.userId)));
  const missingProfiles = agentUsers
    .filter((user) => !existingUserIds.has(String(user._id)))
    .map((user) => ({
      userId: user._id,
      currentLocation: { type: 'Point', coordinates: [...DEFAULT_DEPOT_COORDINATES] },
      capacity: 10,
      currentLoad: 0,
      shiftStatus: 'active',
    }));

  if (missingProfiles.length > 0) await Agent.insertMany(missingProfiles);
  return missingProfiles.length;
}

module.exports = { provisionMissingAgentProfiles };
