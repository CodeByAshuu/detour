import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dispatcher');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await authApi.register({ email, password, role });
        setSuccess('Account created. Sign in to open your workspace.');
        setMode('login');
        return;
      }

      const response = await authApi.login({ email, password });
      login(response.data.token, response.data.role, response.data.userId);
      navigate(response.data.role === 'admin' ? '/admin' : response.data.role === 'dispatcher' ? '/dispatcher' : '/agent');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Something went wrong. Is the auth service running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#070d19] px-3 py-3 text-text-primary sm:p-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:gap-5 lg:p-6">
      <section className="relative hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0d1930] p-6 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(79,195,247,.2),transparent_28%),radial-gradient(circle_at_82%_84%,rgba(51,214,160,.12),transparent_24%)]" />
        <div className="relative flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-radar-cyan/60 bg-radar-cyan/10 text-radar-cyan shadow-[0_0_20px_rgba(79,195,247,.18)]">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19 20 5M8 5h12v12" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 7v12h12" strokeLinecap="round" strokeLinejoin="round" opacity=".55" /></svg>
          </div>
          <span className="font-space text-base font-bold tracking-wide">DETOUR</span>
        </div>

        <div className="relative mt-6 shrink-0">
          <p className="font-plex-mono text-[10px] tracking-[.24em] text-radar-cyan">FLEET OPERATIONS, CONNECTED</p>
          <h1 className="mt-2 font-space text-2xl font-semibold leading-tight tracking-tight text-white xl:text-3xl">Every delivery,<br />on the right path.</h1>
          <p className="mt-2 max-w-md text-xs leading-5 text-slate-300">Plan road-aware routes, coordinate your fleet, and keep every delivery visible from depot to doorstep.</p>
        </div>

        <div className="relative mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-600/70 bg-[#091323]/70 p-3 backdrop-blur-sm">
          <div className="mb-2 flex shrink-0 items-center justify-between font-plex-mono text-[9px] tracking-wider text-slate-400"><span>LIVE ROUTE REPLAY</span><span className="text-signal-green">● IN MOTION</span></div>
          <div className="min-h-0 flex-1">
            <svg viewBox="0 0 560 140" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated delivery route illustration">
              <defs><linearGradient id="routeGlow" x1="0" x2="1"><stop stopColor="#4FC3F7" /><stop offset="1" stopColor="#33D6A0" /></linearGradient><filter id="softGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
              <path d="M42 101 C91 45 156 116 213 77 S310 27 353 64 S445 115 514 35" fill="none" stroke="#26314A" strokeWidth="9" strokeLinecap="round" />
              <path d="M42 101 C91 45 156 116 213 77 S310 27 353 64 S445 115 514 35" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="4 10" strokeLinecap="round" />
              <circle cx="42" cy="101" r="10" fill="#FFB454" stroke="#0B1220" strokeWidth="4" /><circle cx="213" cy="77" r="7" fill="#E7ECF5" stroke="#0B1220" strokeWidth="3" /><circle cx="353" cy="64" r="7" fill="#E7ECF5" stroke="#0B1220" strokeWidth="3" /><circle cx="514" cy="35" r="8" fill="#33D6A0" stroke="#0B1220" strokeWidth="3" />
              <circle r="6" fill="#4FC3F7" filter="url(#softGlow)"><animateMotion dur="7s" repeatCount="indefinite" path="M42 101 C91 45 156 116 213 77 S310 27 353 64 S445 115 514 35" /></circle>
              <text x="25" y="122" fill="#FFB454" fontSize="10" fontFamily="monospace">DEPOT</text><text x="470" y="18" fill="#33D6A0" fontSize="10" fontFamily="monospace">DELIVERED</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="mx-auto flex min-h-0 w-full max-w-xl items-center justify-center lg:max-w-none">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-panel/95 p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden"><div className="grid h-7 w-7 place-items-center rounded-lg bg-radar-cyan/10 text-radar-cyan"><span className="font-space text-sm font-bold">D</span></div><span className="font-space text-sm font-bold">DETOUR</span></div>
            <p className="ml-auto font-plex-mono text-[9px] tracking-[.2em] text-text-muted">SECURE ACCESS</p>
          </div>
          <div className="mb-4">
            <div className="mb-3 grid grid-cols-2 rounded-lg border border-hairline bg-ink/50 p-1">
              {['login', 'register'].map((tab) => <button key={tab} type="button" onClick={() => switchMode(tab)} className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${mode === tab ? 'bg-radar-cyan text-ink shadow-md' : 'text-text-muted hover:text-text-primary'}`}>{tab === 'login' ? 'Sign in' : 'Create account'}</button>)}
            </div>
            <h2 className="font-space text-xl font-semibold tracking-tight">{mode === 'login' ? 'Welcome back.' : 'Join the fleet.'}</h2>
            <p className="mt-1 text-xs text-text-muted">{mode === 'login' ? 'Sign in to manage deliveries and live routes.' : 'Create your workspace access in a few seconds.'}</p>
          </div>

          {error && <p role="alert" className="mb-3 rounded-lg border border-alert-coral/30 bg-alert-coral/10 px-3 py-1.5 text-xs text-alert-coral">{error}</p>}
          {success && <p role="status" className="mb-3 rounded-lg border border-signal-green/30 bg-signal-green/10 px-3 py-1.5 text-xs text-signal-green">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block font-plex-mono text-[10px] text-text-muted">EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@detour.in" className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-slate-600 focus:border-radar-cyan focus:ring-4 focus:ring-radar-cyan/10" required autoComplete="username" />
            </div>
            <div className="relative">
              <label className="mb-1 block font-plex-mono text-[10px] text-text-muted">PASSWORD</label>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 pr-10 text-sm text-text-primary outline-none transition placeholder:text-slate-600 focus:border-radar-cyan focus:ring-4 focus:ring-radar-cyan/10" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-[27px] rounded p-1 text-text-muted transition hover:bg-white/5 hover:text-radar-cyan focus:outline-none focus:ring-2 focus:ring-radar-cyan" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.3 5.1 10 8-0.3 1.2-1.2 2.8-2.6 4.2" /><path d="M6.2 6.2C4.3 7.7 2.8 10.1 2 12c0.8 2.9 4.6 8 10 8 1.4 0 2.7-0.3 3.9-0.9" /></svg> : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
            {mode === 'register' && (
              <div>
                <label className="mb-1 block font-plex-mono text-[10px] text-text-muted">CHOOSE A ROLE</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['admin', 'dispatcher', 'agent'].map((option) => <button key={option} type="button" onClick={() => setRole(option)} aria-pressed={role === option} className={`rounded-lg border px-2 py-2 text-[11px] font-medium capitalize transition ${role === option ? 'border-radar-cyan bg-radar-cyan/10 text-radar-cyan' : 'border-hairline bg-ink text-text-muted hover:border-slate-500 hover:text-text-primary'}`}>{option}</button>)}
                </div>
              </div>
            )}
            <button id="submit-btn" type="submit" disabled={isSubmitting} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-radar-cyan py-2.5 font-space text-sm font-bold text-ink transition hover:bg-[#8ddaff] disabled:cursor-wait disabled:opacity-70">
              {isSubmitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />}
              {isSubmitting ? 'PLEASE WAIT' : mode === 'login' ? 'SIGN IN TO DETOUR' : 'CREATE ACCOUNT'}
            </button>
          </form>
          <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3 text-[11px] text-text-muted">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-signal-green" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            <span>Protected access for your dispatch operations.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
