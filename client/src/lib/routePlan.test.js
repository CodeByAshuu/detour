import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoutePlan,
  routePolylineCoordinates,
  routeSimulationWaypoints,
} from './routePlan.js';

test('a multi-stop route renders and simulates the identical road waypoint sequence', () => {
  const roadPath = [
    [77.59, 12.97],
    [77.591, 12.971],
    [77.592, 12.972],
    [77.594, 12.976],
    [77.598, 12.978],
    [77.601, 12.98],
  ];
  const route = createRoutePlan({
    depotCoordinates: [77.59, 12.97],
    orderedStops: [
      { id: 'stop-1', coordinates: [77.594, 12.976] },
      { id: 'stop-2', coordinates: [77.601, 12.98] },
    ],
    roadPath,
    roadStopIndexes: [3, 5],
  });

  const polylineCoordinates = routePolylineCoordinates(route);
  const simulationWaypoints = routeSimulationWaypoints(route);

  assert.equal(polylineCoordinates.length, simulationWaypoints.length);
  assert.deepEqual(polylineCoordinates, simulationWaypoints);
  assert.strictEqual(polylineCoordinates, simulationWaypoints);
  assert.deepEqual(route.stopWaypointIndexes, [3, 5]);
});
