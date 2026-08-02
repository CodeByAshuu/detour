import React, { useEffect, useState } from 'react';
import { slaApi, agentsApi, ordersApi } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const { orderEvents } = useSocket(); // Re-render when socket events arrive
  const [slaStats, setSlaStats] = useState(null);
  const [agentStats, setAgentStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [slaRes, agentsRes, ordersRes] = await Promise.all([
        slaApi.stats(),
        agentsApi.list(),
        ordersApi.list()
      ]);

      setSlaStats(slaRes.data);

      // Compute agent load for the bar chart
      const agents = agentsRes.data;
      const orders = ordersRes.data;
      
      const loadMap = agents.map(agent => {
        const myOrders = orders.filter(o => o.assignedAgent?._id === agent._id || o.assignedAgent === agent._id);
        const pending = myOrders.filter(o => !['DELIVERED', 'FAILED'].includes(o.status)).length;
        const completed = myOrders.filter(o => o.status === 'DELIVERED').length;
        return {
          name: `A-${agent._id.slice(-4)}`,
          pending,
          completed,
        };
      });
      setAgentStats(loadMap);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []); // Initial load

  // Re-fetch when a new socket event arrives
  useEffect(() => {
    if (orderEvents.length > 0) {
      fetchStats();
    }
  }, [orderEvents]);

  if (loading) return <div className="p-8 font-plex-mono text-radar-cyan">INITIALIZING TELEMETRY...</div>;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-space text-text-primary uppercase tracking-wider mb-1">System Telemetry</h1>
        <p className="text-sm font-plex-mono text-text-muted">Live view of SLA metrics and fleet utilization</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="panel p-5">
          <div className="text-xs font-space text-text-muted uppercase mb-2">Rolling Avg Delivery</div>
          <div className="text-3xl font-plex-mono text-radar-cyan">
            {(slaStats?.rollingAvgMinutes || 0).toFixed(1)} <span className="text-lg">min</span>
          </div>
        </div>
        
        <div className="panel p-5">
          <div className="text-xs font-space text-text-muted uppercase mb-2">SLA Breach Rate</div>
          <div className={`text-3xl font-plex-mono ${(slaStats?.breachRate || 0) > 0.1 ? 'text-alert-coral' : 'text-signal-green'}`}>
            {((slaStats?.breachRate || 0) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-xs font-space text-text-muted uppercase mb-2">Active Window</div>
          <div className="text-3xl font-plex-mono text-text-primary">
            {slaStats?.count} <span className="text-lg text-text-muted">/ {slaStats?.windowSize} orders</span>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-xs font-space text-text-muted uppercase mb-2">Fleet Size</div>
          <div className="text-3xl font-plex-mono text-text-primary">
            {agentStats.length} <span className="text-lg text-text-muted">active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        {/* Agent Load Chart */}
        <div className="panel flex flex-col">
          <div className="panel-header">Active Agent Load (Pending vs Completed)</div>
          <div className="panel-body flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26314A" vertical={false} />
                <XAxis dataKey="name" stroke="#8B93A8" tick={{ fill: '#8B93A8', fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#8B93A8" tick={{ fill: '#8B93A8', fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131B2E', borderColor: '#26314A', color: '#E7ECF5' }}
                  itemStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}
                />
                <Bar dataKey="pending" stackId="a" fill="#FFB454" name="Pending" />
                <Bar dataKey="completed" stackId="a" fill="#33D6A0" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Breaches Feed */}
        <div className="panel flex flex-col">
          <div className="panel-header flex justify-between items-center">
            <span>Recent SLA Breaches</span>
            <span className="text-xs bg-alert-coral/20 text-alert-coral px-2 py-1 rounded">Live Window</span>
          </div>
          <div className="panel-body flex-1 overflow-y-auto p-0">
            {slaStats?.breaches?.length === 0 ? (
              <div className="h-full flex items-center justify-center font-plex-mono text-text-muted text-sm">
                No active breaches in current window.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {slaStats?.breaches?.map((b) => (
                    <tr key={b.orderId}>
                      <td className="font-plex-mono">{b.orderId.slice(-6)}</td>
                      <td className="font-plex-mono text-alert-coral">{(b.durationMs / 60000).toFixed(1)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
