import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AgentView = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-space text-text-primary">Agent Route</h1>
        <button onClick={handleLogout} className="text-alert-coral font-plex-mono text-sm hover:underline">LOGOUT</button>
      </header>
      <div className="bg-panel border border-hairline rounded p-4">
        <p className="text-text-muted text-sm">Assigned stops and live map will go here.</p>
      </div>
    </div>
  );
};

export default AgentView;
