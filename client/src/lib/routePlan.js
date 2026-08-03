/**
 * Builds the single source of truth for a route displayed and replayed by the
 * dispatcher. Coordinates use GeoJSON order: [longitude, latitude].
 */
export function createRoutePlan({ depotCoordinates, orderedStops, roadPath, roadStopIndexes }) {
  const fallbackWaypoints = [
    depotCoordinates,
    ...orderedStops.map((stop) => stop.coordinates),
  ];
  const waypoints = Array.isArray(roadPath) && roadPath.length > 1
    ? roadPath
    : fallbackWaypoints;

  return {
    // This field is intentionally shared by MapView and the simulator. Do not
    // add separate display/movement path fields again.
    waypoints,
    stopWaypointIndexes: Array.isArray(roadStopIndexes)
      ? roadStopIndexes
      : orderedStops.map((_, index) => index + 1),
  };
}

export function routePolylineCoordinates(route) {
  return route.waypoints;
}

export function routeSimulationWaypoints(route) {
  return route.waypoints;
}
