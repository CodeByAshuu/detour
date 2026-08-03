import { useEffect, useState, useRef } from 'react';
import { agentsApi, ordersApi, clusterApi, assignApi, routingApi } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import MapView from '../components/map/MapView';
import toast from 'react-hot-toast';

// Simple haversine distance in km — mirrors backend's buildGraph.haversine,
// duplicated client-side since the simulation loop runs entirely in-browser.
function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SIM_TICK_MS = 400;
const SIM_STEP_KM = 0.08; // distance an agent covers per tick

export default function DispatcherDashboard() {
  const { orderEvents, emitAgentLocation } = useSocket();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationRoutes, setSimulationRoutes] = useState([]);

  // Per-agent simulation progress: { [agentId]: { segIdx, segProgressKm } }
  const simStateRef = useRef({});

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, agentsRes] = await Promise.all([ordersApi.list(), agentsApi.list()]);
      setOrders(ordersRes.data);
      setAgents(agentsRes.data);
    } catch {
      toast.error('Failed to fetch dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (orderEvents.length > 0) {
      fetchDashboardData();
    }
  }, [orderEvents]);

  // Compute routes whenever orders change
  useEffect(() => {
    if (orders.length === 0) {
      setRoutes([]);
      return;
    }

    const computeRoutes = async () => {
      const activeOrders = orders.filter(
        (o) => ['ASSIGNED', 'IN_TRANSIT'].includes(o.status) && o.assignedAgent
      );
      const agentMap = {};
      activeOrders.forEach((o) => {
        const agentId = o.assignedAgent._id || o.assignedAgent;
        if (!agentMap[agentId]) agentMap[agentId] = [];
        agentMap[agentId].push(o);
      });

      const newRoutes = [];
      const depotLocation = { id: 'Depot', coordinates: [77.59, 12.97] };

      for (const [agentId, agentOrders] of Object.entries(agentMap)) {
        try {
          const stops = agentOrders.map((o) => ({
            id: o._id,
            coordinates: o.dropPoint.coordinates,
          }));

          if (stops.length > 0 && stops.length <= 12) {
            const res = await routingApi.optimizeTSP({ depotLocation, stops });
            const pathCoords = [depotLocation.coordinates];
            res.data.orderedStops.forEach((s) => pathCoords.push(s.coordinates));
            pathCoords.push(depotLocation.coordinates);

            newRoutes.push({
              agentId,
              path: pathCoords,
              stops: res.data.orderedStops, // aligned with path[1..N]
              distance: res.data.totalDistance,
            });
          }
        } catch (err) {
          console.error(`Failed to route for agent ${agentId}`, err);
        }
      }
      setRoutes(newRoutes);
    };

    computeRoutes();
  }, [orders]);

  // ── Fleet simulation loop ────────────────────────────────────────────────
  // Moves each agent stepwise along its computed route, emits live position,
  // and flips order status ASSIGNED -> IN_TRANSIT -> DELIVERED as stops are reached.
  useEffect(() => {
    if (!isSimulating || simulationRoutes.length === 0) return;

    // Mark every order on an active route as IN_TRANSIT once, at sim start
    simulationRoutes.forEach((route) => {
      route.stops.forEach((stop) => {
        const order = orders.find((o) => o._id === stop.id);
        if (order && order.status === 'ASSIGNED') {
          ordersApi.update(stop.id, { status: 'IN_TRANSIT' }).catch(() => {});
        }
      });
    });

    const interval = setInterval(() => {
      simulationRoutes.forEach((route) => {
        const { agentId, path, stops } = route;
        if (!path || path.length < 2) return;

        let state = simStateRef.current[agentId];
        if (!state) {
          state = { segIdx: 0, segProgressKm: 0 };
          simStateRef.current[agentId] = state;
        }

        // Already reached the end of this route (back at depot)
        if (state.segIdx >= path.length - 1) return;

        const from = path[state.segIdx];
        const to = path[state.segIdx + 1];
        const segDistKm = haversineKm(from, to) || 0.0001; // avoid div-by-zero

        state.segProgressKm += SIM_STEP_KM;

        if (state.segProgressKm >= segDistKm) {
          // Arrived at node `to`
          state.segIdx += 1;
          state.segProgressKm = 0;
          emitAgentLocation(agentId, to);

          // path[0] is depot; path[1..stops.length] correspond to stops[0..N-1]
          const stopIdx = state.segIdx - 1;
          const arrivedStop = stops[stopIdx];
          if (arrivedStop) {
            ordersApi.update(arrivedStop.id, { status: 'DELIVERED' }).catch(() => {});
          }
        } else {
          const t = state.segProgressKm / segDistKm;
          const lng = from[0] + (to[0] - from[0]) * t;
          const lat = from[1] + (to[1] - from[1]) * t;
          emitAgentLocation(agentId, [lng, lat]);
        }
      });
    }, SIM_TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, simulationRoutes]);

  // Route refreshes happen after each delivery. Never reset the active fleet
  // from those refreshes, otherwise every other agent jumps back to depot.
  // A new run explicitly clears progress in toggleSimulation instead.
  useEffect(() => {
    if (!isSimulating) simStateRef.current = {};
  }, [routes.length, isSimulating]);

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulationRoutes([]);
      return;
    }

    if (routes.length === 0) {
      toast.error('Assign orders before starting the fleet simulation');
      return;
    }

    // Keep one immutable route plan for the run. Delivery updates recompute the
    // dashboard routes, but must not reset agents mid-route.
    simStateRef.current = {};
    setSimulationRoutes(routes.map((route) => ({
      ...route,
      path: [...route.path],
      stops: [...route.stops],
    })));
    setIsSimulating(true);
  };

  const handleCreateRandomOrder = async () => {
    const lat = 12.9 + Math.random() * 0.1;
    const lng = 77.5 + Math.random() * 0.1;
    const deadline = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await ordersApi.create({
        pickupPoint: { type: 'Point', coordinates: [77.59, 12.97] },
        dropPoint: { type: 'Point', coordinates: [lng, lat] },
        timeWindow: { end: deadline },
        priority: Math.random() > 0.8 ? 'high' : 'normal',
      });
      toast.success('Random order injected');
      fetchDashboardData();
    } catch {
      toast.error('Failed to create order');
    }
  };

  const handleRunClustering = async () => {
    const loadingId = toast.loading('Running DSU Clustering...');
    try {
      await clusterApi.run(3);
      toast.success('Clusters formed successfully', { id: loadingId });
    } catch {
      toast.error('Clustering failed', { id: loadingId });
    }
  };

  const handleRunAssignment = async () => {
    const loadingId = toast.loading('Running Agent Assignment (MinHeap)...');
    try {
      const res = await assignApi.run(3);
      const assignmentsMade = res.data.successfulAssignments ?? res.data.assignments?.length ?? 0;
      if (assignmentsMade === 0) {
        toast.error(res.data.message || 'No eligible active agents have capacity for these orders', { id: loadingId });
      } else {
        toast.success(`Assigned ${assignmentsMade} route group${assignmentsMade === 1 ? '' : 's'}`, { id: loadingId });
      }
      await fetchDashboardData();
    } catch {
      toast.error('Assignment failed', { id: loadingId });
    }
  };

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 relative">
        <MapView orders={orders} routes={isSimulating ? simulationRoutes : routes} agents={agents} />
      </div>

      <div className="w-80 bg-panel border-l border-hairline flex flex-col shrink-0">
        <div className="p-4 border-b border-hairline">
          <h2 className="font-space text-lg uppercase tracking-wide">Dispatch Controls</h2>
        </div>

        <div className="p-4 flex flex-col gap-3 border-b border-hairline">
          <button onClick={handleCreateRandomOrder} className="btn-secondary w-full text-sm">
            Inject Random Order
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleRunClustering} className="btn-secondary text-xs p-2">
              DSU Cluster
            </button>
            <button onClick={handleRunAssignment} className="btn-primary text-xs p-2">
              Run Assign
            </button>
          </div>
          <button
            onClick={toggleSimulation}
            className={`w-full text-sm font-bold uppercase transition-colors py-2 rounded ${
              isSimulating
                ? 'bg-signal-green text-ink shadow-[0_0_12px_rgba(51,214,160,0.5)]'
                : 'border border-hairline text-text-muted hover:text-text-primary'
            }`}
          >
            {isSimulating ? 'Stop Fleet Sim' : 'Start Fleet Sim'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <div className="px-4 py-3 bg-ink/30 font-space text-xs text-text-muted uppercase tracking-wide border-b border-hairline sticky top-0">
            Pending Orders ({orders.filter((o) => o.status === 'PENDING').length})
          </div>
          {orders.some((o) => o.status === 'PENDING') ? (
            <table className="data-table">
              <tbody>
                {orders
                  .filter((o) => o.status === 'PENDING')
                  .map((o) => (
                  <tr key={o._id}>
                    <td>
                      <div className="font-plex-mono text-xs">{o._id.slice(-6)}</div>
                      <div
                        className={`text-[10px] uppercase font-bold mt-1 ${
                          o.priority === 'high' ? 'text-priority-amber' : 'text-text-muted'
                        }`}
                      >
                        {o.priority}
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="text-[10px] bg-ink px-2 py-1 border border-hairline rounded text-radar-cyan font-plex-mono">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-sm font-plex-mono text-text-muted">
              No pending orders. Assigned deliveries are visible on the map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
