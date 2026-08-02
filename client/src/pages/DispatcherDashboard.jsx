import React, { useEffect, useState } from 'react';
import { ordersApi, clusterApi, assignApi } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import MapView from '../components/map/MapView';
import toast from 'react-hot-toast';

export default function DispatcherDashboard() {
  const { orderEvents } = useSocket();
  const [orders, setOrders] = useState([]);
  
  // Dummy routes for the map (in a real scenario, this comes from the assignment engine result)
  const [routes, setRoutes] = useState([]); 

  const fetchOrders = async () => {
    try {
      const res = await ordersApi.list();
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Refresh when sockets tell us about order updates
  useEffect(() => {
    if (orderEvents.length > 0) {
      fetchOrders();
    }
  }, [orderEvents]);

  const handleCreateRandomOrder = async () => {
    // Generate a random drop point near Bengaluru
    const lat = 12.9 + Math.random() * 0.1;
    const lng = 77.5 + Math.random() * 0.1;
    const deadline = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    try {
      await ordersApi.create({
        pickupPoint: { type: 'Point', coordinates: [77.59, 12.97] }, // Depot
        dropPoint: { type: 'Point', coordinates: [lng, lat] },
        timeWindow: { end: deadline },
        priority: Math.random() > 0.8 ? 'high' : 'normal',
      });
      toast.success('Random order injected');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to create order');
    }
  };

  const handleRunClustering = async () => {
    const loadingId = toast.loading('Running DSU Clustering...');
    try {
      await clusterApi.run(3); // 3km threshold
      toast.success('Clusters formed successfully', { id: loadingId });
    } catch (err) {
      toast.error('Clustering failed', { id: loadingId });
    }
  };

  const handleRunAssignment = async () => {
    const loadingId = toast.loading('Running Agent Assignment (MinHeap)...');
    try {
      const res = await assignApi.run(3); // 3km threshold
      toast.success(`Assigned ${res.data.assignmentsMade} orders`, { id: loadingId });
      fetchOrders();
    } catch (err) {
      toast.error('Assignment failed', { id: loadingId });
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapView orders={orders} routes={routes} />
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-panel border-l border-hairline flex flex-col shrink-0">
        <div className="p-4 border-b border-hairline">
          <h2 className="font-space text-lg uppercase tracking-wide">Dispatch Controls</h2>
        </div>

        <div className="p-4 flex flex-col gap-3 border-b border-hairline">
          <button onClick={handleCreateRandomOrder} className="btn-secondary w-full text-sm">
            Inject Random Order
          </button>
          <button onClick={handleRunClustering} className="btn-secondary w-full text-sm">
            Run DSU Clustering
          </button>
          <button onClick={handleRunAssignment} className="btn-primary w-full text-sm">
            Execute Assignment
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <div className="px-4 py-3 bg-ink/30 font-space text-xs text-text-muted uppercase tracking-wide border-b border-hairline sticky top-0">
            Pending Deliveries ({orders.filter(o => o.status === 'PENDING').length})
          </div>
          <table className="data-table">
            <tbody>
              {orders.filter(o => o.status === 'PENDING').map(o => (
                <tr key={o._id}>
                  <td>
                    <div className="font-plex-mono text-xs">{o._id.slice(-6)}</div>
                    <div className={`text-[10px] uppercase font-bold mt-1 ${o.priority === 'high' ? 'text-priority-amber' : 'text-text-muted'}`}>
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
        </div>
      </div>
    </div>
  );
}
