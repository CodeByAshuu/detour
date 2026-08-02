import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dispatcher');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        await axios.post(`${AUTH_URL}/api/auth/register`, { email, password, role });
        setSuccess('Account created! You can now log in.');
        setMode('login');
        return;
      }

      const res = await axios.post(`${AUTH_URL}/api/auth/login`, { email, password });
      login(res.data.token, res.data.role);

      if (res.data.role === 'admin') navigate('/admin');
      else if (res.data.role === 'dispatcher') navigate('/dispatcher');
      else if (res.data.role === 'agent') navigate('/agent');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Is the auth service running?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="bg-panel p-8 rounded-lg border border-hairline w-full max-w-md">

        {/* Logo / title */}
        <div className="mb-8">
          <p className="text-radar-cyan font-plex-mono text-xs tracking-widest mb-1">DETOUR PLATFORM</p>
          <h1 className="text-3xl font-space text-text-primary">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
        </div>

        {/* Feedback */}
        {error   && <p className="text-alert-coral text-sm mb-4 font-plex-mono">{error}</p>}
        {success && <p className="text-signal-green text-sm mb-4 font-plex-mono">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-6">
            <label className="block text-text-muted font-plex-mono text-xs mb-2">Email</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-hairline text-text-primary font-plex-mono px-4 py-2 rounded focus:outline-none focus:border-radar-cyan transition-colors"
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-8">
            <label className="block text-text-muted font-plex-mono text-xs mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-hairline text-text-primary font-plex-mono px-4 py-2 rounded focus:outline-none focus:border-radar-cyan transition-colors"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Role selector — only shown on register */}
          {mode === 'register' && (
            <div>
              <label className="block text-text-muted text-xs font-plex-mono tracking-wider mb-1">ROLE</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-ink border border-hairline text-text-primary font-plex-mono px-4 py-2 rounded focus:outline-none focus:border-radar-cyan transition-colors"
              >
                <option value="admin">Admin</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="agent">Agent</option>
              </select>
            </div>
          )}

          <button
            id="submit-btn"
            type="submit"
            className="w-full bg-radar-cyan text-ink font-space font-bold py-2 rounded hover:opacity-90 transition-opacity mt-2"
          >
            {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-text-muted text-sm text-center mt-6 font-plex-sans">
          {mode === 'login' ? (
            <>No account?{' '}
              <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-radar-cyan hover:underline font-plex-mono">
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-radar-cyan hover:underline font-plex-mono">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
