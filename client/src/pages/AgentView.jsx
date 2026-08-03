import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { agentsApi, ordersApi, routingApi } from '../lib/api';
import MapView from '../components/map/MapView';
import toast from 'react-hot-toast';

export default function AgentView() {
  const { user } = useAuth();
  const { orderEvents, joinAgent } = useSocket();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const res = await agentsApi.list();
        const currentAgent = res.data.find((item) => String(item.userId) === String(user.id));
        setAgent(currentAgent || null);
        if (currentAgent) {
          joinAgent(currentAgent._id);
          if (currentAgent.shiftStatus !== 'active') {
            await agentsApi.update(currentAgent._id, { shiftStatus: 'active' });
            setAgent((previous) => previous ? { ...previous, shiftStatus: 'active' } : previous);
          }
        }
      } catch {
        toast.error('Failed to load agent profile');
      }
    };

    if (user?.id) loadAgent();
  }, [user?.id, joinAgent]);

  const fetchMyOrders = async () => {
    try {
      const res = await ordersApi.list();
      // Filter for orders assigned to this agent that are NOT terminal yet
      const mine = res.data.filter(
        (o) => String(o.assignedAgent?._id || o.assignedAgent) === String(agent?._id)
               && !['DELIVERED', 'FAILED'].includes(o.status)
      );
      setAssignedOrders(mine);
    } catch (err) {
      toast.error('Failed to load route');
    }
  };

  useEffect(() => {
    if (agent?._id) fetchMyOrders();
  }, [agent?._id]);

  // Refresh if socket event affects my orders
  useEffect(() => {
    if (agent?._id && orderEvents.length > 0) {
      fetchMyOrders();
    }
  }, [orderEvents, agent?._id]);



  const [route, setRoute] = useState(null);
  useEffect(() => {
    const computeRoute = async () => {
      try {
        const depotLocation = { id: 'Depot', coordinates: [77.59, 12.97] };
        const stops = assignedOrders.map(o => ({
          id: o._id,
          coordinates: o.dropPoint.coordinates
        }));

        if (stops.length > 0 && stops.length <= 12) {
          const res = await routingApi.optimizeTSP({ depotLocation, stops });
          const pathCoords = [depotLocation.coordinates];
          res.data.orderedStops.forEach(s => pathCoords.push(s.coordinates));
          pathCoords.push(depotLocation.coordinates);
          setRoute({ path: pathCoords, stops: res.data.orderedStops });
        } else {
          setRoute(null);
        }
      } catch (err) {
        console.error('Failed to compute route', err);
      }
    };
    if (assignedOrders.length > 0) {
      computeRoute();
    } else {
      setRoute(null);
    }
  }, [assignedOrders]);

  const handleMarkStatus = async (orderId, status) => {
    try {
      await ordersApi.update(orderId, { status });
      toast.success(`Marked as ${status}`);
      fetchMyOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      {/* Map Area */}
      <div className="h-[45vh] min-h-72 flex-1 relative lg:h-auto">
        <MapView 
          orders={assignedOrders} 
          routes={route ? [route] : []} 
          agents={agent ? [agent] : []}
          agentIds={agent ? [String(agent._id)] : []}
        />
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-[450px] bg-ink flex flex-col shrink-0 border-l border-hairline">
        <header className="p-6 border-b border-hairline flex justify-between items-end bg-panel">
          <div>
            <h1 className="text-xl font-space text-text-primary uppercase tracking-wider mb-1">Agent Route</h1>
            <p className="text-xs font-plex-mono text-text-muted">
              Agent ID: {agent?._id || 'Setting up your agent profile…'}
            </p>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 bg-ink/50 border-b border-hairline font-space text-xs text-text-muted uppercase tracking-wide">
            Pending Stops ({assignedOrders.length})
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {assignedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted font-plex-mono text-sm p-6 text-center">
                <span className="text-3xl mb-3 text-hairline">▣</span>
                No stops assigned. Wait for dispatch.
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {assignedOrders.map((order, idx) => (
                  <li key={order._id} className="p-6 flex flex-col gap-4 hover:bg-ink/50 transition-colors">
                    <div>
                      <div className="font-space text-lg mb-2">Stop {idx + 1}</div>
                      <div className="font-plex-mono text-xs text-text-muted space-y-1.5">
                        <div className="flex justify-between"><span>Order ID:</span> <span className="text-text-primary">{order._id.slice(-8)}</span></div>
                        {order.timeWindow?.end && (
                          <div className="flex justify-between"><span>Deliver by:</span> <span className="text-alert-coral">{new Date(order.timeWindow.end).toLocaleTimeString()}</span></div>
                        )}
                        <div className="flex justify-between"><span>Status:</span> <span className="text-radar-cyan uppercase">{order.status}</span></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {order.status === 'ASSIGNED' && (
                        <button 
                          onClick={() => handleMarkStatus(order._id, 'IN_TRANSIT')}
                          className="btn-secondary flex-1 text-xs py-2.5"
                        >
                          Start Route
                        </button>
                      )}
                      {order.status === 'IN_TRANSIT' && (
                        <>
                          <button 
                            onClick={() => handleMarkStatus(order._id, 'DELIVERED')}
                            className="bg-signal-green text-ink font-bold rounded flex-1 text-xs py-2.5 hover:opacity-90 transition-opacity"
                          >
                            Delivered
                          </button>
                          <button 
                            onClick={() => handleMarkStatus(order._id, 'FAILED')}
                            className="bg-alert-coral text-ink font-bold rounded flex-1 text-xs py-2.5 hover:opacity-90 transition-opacity"
                          >
                            Failed
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
