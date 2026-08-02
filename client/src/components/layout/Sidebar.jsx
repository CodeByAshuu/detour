import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  RiDashboardLine, RiMapPinLine, RiUserLine,
  RiSettings3Line, RiLogoutBoxLine,
} from 'react-icons/ri';
import { TbTruckDelivery } from 'react-icons/tb';

const adminLinks = [
  { to: '/admin',      icon: <RiDashboardLine />, label: 'Analytics'   },
  { to: '/dispatcher', icon: <TbTruckDelivery />, label: 'Dispatch'    },
];
const dispatcherLinks = [
  { to: '/dispatcher', icon: <TbTruckDelivery />, label: 'Dispatch'    },
];
const agentLinks = [
  { to: '/agent',      icon: <RiMapPinLine />,    label: 'My Route'    },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const links =
    user?.role === 'admin'      ? adminLinks :
    user?.role === 'dispatcher' ? dispatcherLinks :
                                  agentLinks;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-mark">◈</span>
        <span className="logo-text">Detour</span>
      </div>

      {/* Socket status pill */}
      <div className={`socket-pill ${connected ? 'connected' : 'disconnected'}`}>
        <span className="socket-dot" />
        {connected ? 'Live' : 'Offline'}
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <RiUserLine />
          <div>
            <p className="user-role">{user?.role?.toUpperCase()}</p>
          </div>
        </div>
        <button
          className="logout-btn"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <RiLogoutBoxLine />
        </button>
      </div>
    </aside>
  );
}
