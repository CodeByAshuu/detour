import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const CORE_URL = import.meta.env.VITE_CORE_URL || 'http://localhost:5002';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Live agent positions map: { agentId -> { coordinates, ts } }
  const [agentPositions, setAgentPositions] = useState({});

  // Latest order update events received over socket
  const [orderEvents, setOrderEvents] = useState([]);

  useEffect(() => {
    if (!user) return; // only connect when logged in

    const socket = io(CORE_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join the appropriate room based on role
      if (user.role === 'dispatcher' || user.role === 'admin') {
        socket.emit('dispatcher:join');
      } else if (user.role === 'agent' && user.agentId) {
        socket.emit('agent:join', { agentId: user.agentId });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    // Live agent location updates
    socket.on('agent:location', ({ agentId, coordinates, ts }) => {
      setAgentPositions((prev) => ({ ...prev, [agentId]: { coordinates, ts } }));
    });

    // Order status change events
    socket.on('order:updated', (event) => {
      setOrderEvents((prev) => [event, ...prev].slice(0, 50)); // keep last 50
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  /** Send agent location ping to server (used by AgentView simulation) */
  const emitAgentLocation = (agentId, coordinates) => {
    socketRef.current?.emit('agent:location', { agentId, coordinates });
  };

  return (
    <SocketContext.Provider value={{ connected, agentPositions, orderEvents, emitAgentLocation }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
