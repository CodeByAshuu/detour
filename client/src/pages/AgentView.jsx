import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ordersApi } from '../lib/api';
import toast from 'react-hot-toast';

export default function AgentView() {
  const { user } = useAuth();
  const { emitAgentLocation, orderEvents } = useSocket();
  const [assignedOrders, setAssignedOrders] = useState([]);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPos, setCurrentPos] = useState([77.59, 12.97]); // Start at Depot

  const fetchMyOrders = async () => {
    try {
      const res = await ordersApi.list();
      // Filter for orders assigned to this agent that are NOT terminal yet
      const mine = res.data.filter(
        (o) => (o.assignedAgent?._id === user.agentId || o.assignedAgent === user.agentId) 
               && !['DELIVERED', 'FAILED'].includes(o.status)
      );
      setAssignedOrders(mine);
    } catch (err) {
      toast.error('Failed to load route');
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  // Refresh if socket event affects my orders
  useEffect(() => {
    if (orderEvents.length > 0) {
      fetchMyOrders();
    }
  }, [orderEvents]);

  // GPS Simulation Loop
  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        // Jitter the location slightly to simulate movement
        setCurrentPos(prev => {
          const newPos = [
            prev[0] + (Math.random() - 0.5) * 0.002, // lng
            prev[1] + (Math.random() - 0.5) * 0.002  // lat
          ];
          // Emit to dispatchers
          emitAgentLocation(user.agentId, newPos);
          return newPos;
        });
      }, 2000); // Ping every 2s
    }
    return () => clearInterval(interval);
  }, [isSimulating, user.agentId, emitAgentLocation]);

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
    <div className="flex h-full w-full">
      {/* Map Area */}
      <div className="flex-1 relative hidden lg:block">
        <MapView 
          orders={assignedOrders} 
          // Just a visual line connecting depot -> current pos -> stops
          routes={[{ path: [[12.97, 77.59], [currentPos[1], currentPos[0]]] }]} 
        />
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-[450px] bg-ink flex flex-col shrink-0 border-l border-hairline">
        <header className="p-6 border-b border-hairline flex justify-between items-end bg-panel">
          <div>
            <h1 className="text-xl font-space text-text-primary uppercase tracking-wider mb-1">Agent Route</h1>
            <p className="text-xs font-plex-mono text-text-muted">ID: {user.agentId}</p>
          </div>
          
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded text-xs font-plex-mono font-bold uppercase transition-colors ${
              isSimulating 
                ? 'bg-signal-green text-ink shadow-[0_0_12px_rgba(51,214,160,0.5)]' 
                : 'border border-hairline text-text-muted'
            }`}
          >
            {isSimulating ? 'Live (Transmitting)' : 'Start GPS'}
          </button>
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
