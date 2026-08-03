const ROUTING_ENGINE_URL = (process.env.ROUTING_ENGINE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.ROUTING_ENGINE_TIMEOUT_MS || 8000);

function coordinateList(locations) {
  return locations.map((location) => location.coordinates.join(',')).join(';');
}

async function requestRoadData(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${ROUTING_ENGINE_URL}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Road-routing provider returned ${response.status}`);
    const payload = await response.json();
    if (payload.code !== 'Ok') throw new Error(payload.message || 'Road-routing provider could not build a route');
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function getRoadDistanceMatrix(locations) {
  const payload = await requestRoadData(`/table/v1/driving/${coordinateList(locations)}?annotations=distance`);
  return payload.distances.map((row) => row.map((meters) => meters === null ? Infinity : meters / 1000));
}

async function getRoadPath(locations) {
  // Request step geometry so we can preserve each leg boundary.  The client
  // uses those boundaries to mark a delivery when an agent reaches that stop,
  // while moving over every road coordinate in between.
  const payload = await requestRoadData(
    `/route/v1/driving/${coordinateList(locations)}?overview=full&steps=true&geometries=geojson`
  );
  const route = payload.routes[0];
  if (!route) return null;

  const path = [];
  const legEndIndexes = [];
  route.legs?.forEach((leg) => {
    leg.steps?.forEach((step) => {
      const coordinates = step.geometry?.coordinates || [];
      coordinates.forEach((coordinate) => {
        const last = path[path.length - 1];
        // Consecutive OSRM steps share an endpoint. Avoid zero-length
        // simulation segments while retaining the complete road geometry.
        if (!last || last[0] !== coordinate[0] || last[1] !== coordinate[1]) {
          path.push(coordinate);
        }
      });
    });
    legEndIndexes.push(Math.max(0, path.length - 1));
  });

  const roadPath = path.length > 1 ? path : route.geometry?.coordinates;
  if (!roadPath?.length) return null;

  return {
    roadPath,
    // One entry per requested road leg. The controller maps these leg ends to
    // delivery stops according to whether a return-to-depot leg was requested.
    legEndIndexes: path.length > 1 ? legEndIndexes : null,
  };
}

module.exports = { getRoadDistanceMatrix, getRoadPath };
