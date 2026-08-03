import { useEffect, useMemo } from 'react';
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

const createDepotIcon = () => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: #FFB454; color: #0B1220; border: 3px solid #0B1220;
    box-shadow: 0 0 0 2px #FFB454, 0 0 18px rgba(255,180,84,.9);
    font: 700 13px/1 sans-serif;
  ">⌂</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const icons = {
  depot: createDepotIcon(),
  // Live positions update several times per second. A static marker is easier to
  // follow than a CSS pulse, which otherwise reads as a randomly blinking dot.
  agent: createDotIcon('#4FC3F7', false),
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

const DEFAULT_DEPOT = [12.97, 77.59]; // Default to Bengaluru [lat, lng]

export default function MapView({ 
  orders = [], 
  routes = [], 
  agents = [],
  agentIds = null,
  hideDeliveredOrders = false,
  depot = DEFAULT_DEPOT 
}) {
  const { agentPositions } = useSocket();
  const visibleOrders = useMemo(
    () => orders.filter((order) => !hideDeliveredOrders || order.status !== 'DELIVERED'),
    [orders, hideDeliveredOrders]
  );
  const bounds = useMemo(() => {
    // Calculate bounds based on orders and depot
    const pts = [depot];
    visibleOrders.forEach(o => {
      if (o.dropPoint && o.dropPoint.coordinates) {
        // Mongo stores [lng, lat], Leaflet wants [lat, lng]
        pts.push([o.dropPoint.coordinates[1], o.dropPoint.coordinates[0]]);
      }
    });
    agents.forEach((agent) => {
      const coordinates = agent.currentLocation?.coordinates;
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        pts.push([coordinates[1], coordinates[0]]);
      }
    });
    return pts.length > 1 ? L.latLngBounds(pts) : null;
  }, [visibleOrders, agents, depot]);

  // Start with every registered agent's saved location, then replace it with a
  // live socket location as soon as one arrives. This makes the full fleet
  // visible before the simulator has sent its first position update.
  const displayedAgents = useMemo(() => {
    const byId = new Map();
    agents.forEach((agent) => {
      const coordinates = agent.currentLocation?.coordinates;
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        byId.set(String(agent._id), { ...agent, coordinates, isLive: false });
      }
    });
    Object.entries(agentPositions).forEach(([agentId, position]) => {
      if (agentIds && !agentIds.includes(String(agentId))) return;
      if (Array.isArray(position?.coordinates) && position.coordinates.length === 2) {
        byId.set(agentId, { ...byId.get(agentId), coordinates: position.coordinates, isLive: true });
      }
    });
    return [...byId.entries()];
  }, [agents, agentPositions, agentIds]);

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

        {bounds && <MapBounds bounds={bounds} />}

        {/* Depot */}
        <Marker position={depot} icon={icons.depot} zIndexOffset={1000}>
          <Popup>
            <div className="font-space text-ink font-bold">DEPOT (HQ)</div>
          </Popup>
        </Marker>

        {/* Orders (Drop points) */}
        {visibleOrders.map(order => {
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
          // displayPath may contain road geometry; path remains the small set
          // of delivery waypoints used by the fleet simulator.
          const latLngs = (route.displayPath || route.path).map(c => [c[1], c[0]]);
          return (
            <Polyline 
              key={`route-${idx}`}
              positions={latLngs}
              pathOptions={{ color: '#4FC3F7', weight: 2, opacity: 0.5, dashArray: '4, 6' }}
            />
          );
        })}

        {/* Live Agents */}
        {displayedAgents
          .filter(([, agent]) =>
            Number.isFinite(agent.coordinates[0]) && Number.isFinite(agent.coordinates[1])
          )
          .map(([agentId, agent]) => (
            <Marker
              key={`agent-${agentId}`}
              position={[agent.coordinates[1], agent.coordinates[0]]}
              icon={icons.agent}
            >
              <Popup>
                <div className="font-space text-ink font-bold">AGENT {agentId.slice(-4)}</div>
                <div className="font-plex-mono text-xs mt-1">{agent.isLive ? 'Live position' : 'Last known position'}</div>
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
