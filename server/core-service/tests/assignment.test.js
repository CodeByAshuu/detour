const { runAgentAssignment } = require('../src/services/assignment.service');
const Order = require('../src/models/Order');
const Agent = require('../src/models/Agent');

jest.mock('../src/models/Order');
jest.mock('../src/models/Agent');

describe('Agent Assignment Integration Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return appropriate message when no pending orders exist', async () => {
    Order.find.mockResolvedValue([]);

    const result = await runAgentAssignment(3.0);
    expect(result.message).toContain('No pending orders');
    expect(result.assignments).toEqual([]);
  });

  it('should return appropriate message when no active agents exist', async () => {
    Order.find.mockResolvedValue([
      { _id: 'ord1', pickupPoint: { coordinates: [77.6, 12.9] } }
    ]);
    Agent.find.mockResolvedValue([]);

    const result = await runAgentAssignment(3.0);
    expect(result.message).toContain('No active agents');
    expect(result.assignments).toEqual([]);
  });

  it('should successfully assign order clusters to least loaded agent using MinHeap priority logic', async () => {
    const mockOrders = [
      { _id: 'ord1', pickupPoint: { coordinates: [77.6245, 12.9352] } },
      { _id: 'ord2', pickupPoint: { coordinates: [77.6270, 12.9380] } },
    ];

    const mockAgent1 = {
      _id: 'agent1',
      shiftStatus: 'active',
      capacity: 10,
      currentLoad: 3, // Higher load
      currentLocation: { coordinates: [77.6250, 12.9360] }, // Very close!
      save: jest.fn().mockResolvedValue(true),
    };

    const mockAgent2 = {
      _id: 'agent2',
      shiftStatus: 'active',
      capacity: 10,
      currentLoad: 0, // Zero load! Should win priority via MinHeap
      currentLocation: { coordinates: [77.6300, 12.9400] }, // Slightly further away
      save: jest.fn().mockResolvedValue(true),
    };

    Order.find.mockResolvedValue(mockOrders);
    Agent.find.mockResolvedValue([mockAgent1, mockAgent2]);
    Order.updateMany.mockResolvedValue({ acknowledged: true, modifiedCount: 2 });

    const result = await runAgentAssignment(3.0);

    expect(result.successfulAssignments).toBe(1);
    expect(result.assignments[0].assignedAgentId).toBe('agent2'); // Agent 2 wins due to lower load!
    expect(mockAgent2.currentLoad).toBe(2); // Load updated from 0 + 2 orders
    expect(mockAgent2.save).toHaveBeenCalled();
  });
});
