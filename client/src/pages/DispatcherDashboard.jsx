import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DispatcherDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-space text-text-primary">Dispatcher Console</h1>
        <button onClick={handleLogout} className="text-alert-coral font-plex-mono hover:underline">LOGOUT</button>
      </header>
      <div className="bg-panel border border-hairline rounded p-6">
        <p className="text-text-muted">Welcome to the dispatcher console. Order creation and routing will go here.</p>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
