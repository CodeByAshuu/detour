import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

// --- Custom Leaflet Icons ---
const createDotIcon = (colorHex, pulse = false) => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    background-color: ${colorHex};
    width: 12px; height: 12px; border-radius: 50%;
    box-shadow: 0 0 ${pulse ? '12px' : '4px'} ${colorHex};
    border: 2px solid #0B1220;
    ${pulse ? 'animation: pulse 2s infinite;' : ''}
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const icons = {
  depot: createDotIcon('#FFB454', true), // Priority amber
  agent: createDotIcon('#4FC3F7', true), // Radar cyan (live)
  order: createDotIcon('#E7ECF5', false), // Text primary
  delivered: createDotIcon('#33D6A0', false), // Signal green
  failed: createDotIcon('#FF6B5C', false), // Alert coral
};

// Component to dynamically fit bounds if data changes
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({ 
  orders = [], 
  routes = [], 
  depot = [12.97, 77.59] // Default to Bengaluru [lat, lng]
}) {
  const { agentPositions } = useSocket();
  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    // Calculate bounds based on orders and depot
    const pts = [depot];
    orders.forEach(o => {
      if (o.dropPoint && o.dropPoint.coordinates) {
        // Mongo stores [lng, lat], Leaflet wants [lat, lng]
        pts.push([o.dropPoint.coordinates[1], o.dropPoint.coordinates[0]]);
      }
    });
    // Add agent positions
    Object.values(agentPositions).forEach(pos => {
      pts.push([pos.coordinates[1], pos.coordinates[0]]);
    });

    if (pts.length > 1) {
      setBounds(L.latLngBounds(pts));
    }
  }, [orders, depot, agentPositions]);

  // Dark theme map tiles (CartoDB Dark Matter)
  const mapUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="h-full w-full bg-ink relative z-0">
      <MapContainer 
        center={depot} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0B1220' }}
        zoomControl={false}
      >
        <TileLayer
          url={mapUrl}
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />

        {bounds.length > 0 && <MapBounds bounds={bounds} />}

        {/* Depot */}
        <Marker position={depot} icon={icons.depot}>
          <Popup>
            <div className="font-space text-ink font-bold">DEPOT (HQ)</div>
          </Popup>
        </Marker>

        {/* Orders (Drop points) */}
        {orders.map(order => {
          if (!order.dropPoint?.coordinates) return null;
          const pos = [order.dropPoint.coordinates[1], order.dropPoint.coordinates[0]];
          
          let icon = icons.order;
          if (order.status === 'DELIVERED') icon = icons.delivered;
          if (order.status === 'FAILED') icon = icons.failed;

          return (
            <Marker key={order._id} position={pos} icon={icon}>
              <Popup>
                <div className="text-ink">
                  <div className="font-space font-bold uppercase mb-1">{order.status}</div>
                  <div className="font-plex-mono text-xs text-gray-600">ID: {order._id.slice(-6)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Routes (Polylines) */}
        {routes.map((route, idx) => {
          // route.path is array of coordinates [[lng, lat], ...]
          const latLngs = route.path.map(c => [c[1], c[0]]);
          return (
            <Polyline 
              key={`route-${idx}`}
              positions={latLngs}
              pathOptions={{ color: '#4FC3F7', weight: 2, opacity: 0.5, dashArray: '4, 6' }}
            />
          );
        })}

        {/* Live Agents */}
        {Object.entries(agentPositions).map(([agentId, pos]) => (
          <Marker 
            key={`agent-${agentId}`} 
            position={[pos.coordinates[1], pos.coordinates[0]]} 
            icon={icons.agent}
          >
            <Popup>
              <div className="font-space text-ink font-bold">AGENT {agentId.slice(-4)}</div>
              <div className="font-plex-mono text-xs mt-1">Live position</div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* Map legend overlay */}
      <div className="absolute bottom-6 right-6 bg-panel border border-hairline p-3 rounded shadow-lg z-[1000] text-xs font-plex-mono space-y-2">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-priority-amber shadow-[0_0_8px_#FFB454]"></span> Depot</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-radar-cyan shadow-[0_0_8px_#4FC3F7] animate-pulse"></span> Live Agent</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-text-primary"></span> Pending Order</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-signal-green"></span> Delivered</div>
      </div>
    </div>
  );
}
