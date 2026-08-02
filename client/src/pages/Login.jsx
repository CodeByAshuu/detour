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

  const [showPassword, setShowPassword] = useState(false);

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
      login(res.data.token, res.data.role, res.data.userId);

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
              className="w-full bg-ink border border-hairline text-text-primary font-plex-mono px-4 py-2 pr-12 rounded focus:outline-none focus:border-radar-cyan transition-colors"
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-8 relative">
            <label className="block text-text-muted font-plex-mono text-xs mb-2">Password</label>
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-hairline text-text-primary font-plex-mono px-4 py-2 rounded focus:outline-none focus:border-radar-cyan transition-colors"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.3 5.1 10 8-0.3 1.2-1.2 2.8-2.6 4.2" />
                  <path d="M6.2 6.2C4.3 7.7 2.8 10.1 2 12c0.8 2.9 4.6 8 10 8 1.4 0 2.7-0.3 3.9-0.9" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
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
