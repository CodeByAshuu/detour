import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { CORE_URL } from '../lib/serviceUrls';

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

    // Do not force WebSocket-only transport. Socket.IO starts with HTTP polling
    // when necessary and upgrades to WebSocket, avoiding a hard failure while
    // the server/proxy is starting or does not expose WebSocket upgrades.
    const socket = io(CORE_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
    });
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
  const emitAgentLocation = useCallback((agentId, coordinates) => {
    socketRef.current?.emit('agent:location', { agentId, coordinates });
  }, []);

  const joinAgent = useCallback((agentId) => {
    socketRef.current?.emit('agent:join', { agentId });
  }, []);

  return (
    <SocketContext.Provider value={{ connected, agentPositions, orderEvents, emitAgentLocation, joinAgent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
