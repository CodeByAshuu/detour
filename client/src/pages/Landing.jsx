import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Maps a logged-in user's role to their dashboard route.
// Adjust these paths if your router names them differently.
const ROLE_ROUTES = {
  admin: '/admin',
  dispatcher: '/dispatcher',
  agent: '/agent',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const rootRef = useRef(null);
  const navRef = useRef(null);
  const progressRef = useRef(null);
  const gridBgRef = useRef(null);
  const clusterWrapRef = useRef(null);
  const blobTrackRefs = useRef([]);
  const modulesRef = useRef(null);
  const algorithmsRef = useRef(null);
  const stackRef = useRef(null);

  const isAuthed = Boolean(user);
  const ctaLabel = isAuthed ? 'Go to dashboard' : 'Launch dashboard';
  const navLabel = isAuthed ? 'Dashboard' : 'Login';

  const goToApp = () => {
    if (isAuthed) {
      navigate(ROLE_ROUTES[user.role] || '/dispatcher');
    } else {
      navigate('/login');
    }
  };

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const blobSpeeds = [0.06, 0.12, 0.18, 0.09];
    let requestTick = false;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
      }
      if (navRef.current) {
        navRef.current.classList.toggle('sr-scrolled', scrollY > 10);
      }

      if (!reduceMotion) {
        blobTrackRefs.current.forEach((el, i) => {
          if (el) el.style.transform = `translateY(${scrollY * blobSpeeds[i]}px)`;
        });
        if (gridBgRef.current) {
          gridBgRef.current.style.transform = `translateY(${scrollY * 0.04}px)`;
        }
        if (clusterWrapRef.current) {
          const rect = clusterWrapRef.current.getBoundingClientRect();
          const centerOffset = (rect.top - window.innerHeight / 2) * -0.03;
          clusterWrapRef.current.style.transform = `translateY(${centerOffset}px)`;
        }
      }
      requestTick = false;
    };

    const handleScroll = () => {
      if (!requestTick) {
        requestAnimationFrame(onScroll);
        requestTick = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    onScroll();

    // Reveal section heads on view
    const revealTargets = rootRef.current?.querySelectorAll('.sr-section-head') || [];
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('sr-visible');
        });
      },
      { threshold: 0.2 }
    );
    revealTargets.forEach((t) => revealObserver.observe(t));

    // Light up algorithm nodes as they're scrolled/traced
    const algoNodes = rootRef.current?.querySelectorAll('.sr-algo-node') || [];
    const algoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('sr-is-active');
          else if (e.boundingClientRect.top > window.innerHeight * 0.85) {
            e.target.classList.remove('sr-is-active');
          }
        });
      },
      { threshold: 0.5 }
    );
    algoNodes.forEach((n) => algoObserver.observe(n));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
      algoObserver.disconnect();
    };
  }, []);

  return (
    <div className="sr-landing" ref={rootRef}>
      <svg className="sr-filters" aria-hidden="true">
        <filter id="sr-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
        <filter id="sr-goo2">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div className="sr-progress" ref={progressRef}></div>

      <nav ref={navRef}>
        <div className="sr-logo">
          <span className="sr-logo-dot"></span>
          <span className="sr-display" style={{ fontWeight: 600 }}>SmartRoute</span>
        </div>
        <div className="sr-nav-right">
          <div className="sr-nav-links">
            <span onClick={() => scrollTo(modulesRef)}>Modules</span>
            <span onClick={() => scrollTo(algorithmsRef)}>Algorithms</span>
            <span onClick={() => scrollTo(stackRef)}>Stack</span>
          </div>
          <button className="sr-nav-cta" onClick={goToApp}>
            {navLabel}
          </button>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <header className="sr-hero">
        <div className="sr-grid-bg" ref={gridBgRef}></div>

        <div className="sr-goo-field">
          <div className="sr-blob-track" ref={(el) => (blobTrackRefs.current[0] = el)} style={{ top: '14%', left: '58%' }}>
            <div className="sr-blob sr-cyan" style={{ width: 220, height: 220, animationDuration: '16s' }}></div>
          </div>
          <div className="sr-blob-track" ref={(el) => (blobTrackRefs.current[1] = el)} style={{ top: '52%', left: '72%' }}>
            <div className="sr-blob sr-green" style={{ width: 160, height: 160, animationDuration: '12s', animationDelay: '-4s' }}></div>
          </div>
          <div className="sr-blob-track" ref={(el) => (blobTrackRefs.current[2] = el)} style={{ top: '38%', left: '82%' }}>
            <div className="sr-blob sr-amber" style={{ width: 120, height: 120, animationDuration: '10s', animationDelay: '-2s' }}></div>
          </div>
          <div className="sr-blob-track" ref={(el) => (blobTrackRefs.current[3] = el)} style={{ top: '70%', left: '60%' }}>
            <div className="sr-blob sr-cyan" style={{ width: 100, height: 100, opacity: 0.35, animationDuration: '18s', animationDelay: '-7s' }}></div>
          </div>
        </div>

        <div className="sr-hero-content">
          <div className="sr-eyebrow">Dispatch, routing &amp; fleet ops — built from first principles</div>
          <h1 className="sr-hero-head sr-display">
            Every route,<br />optimi<span className="sr-accent">z</span>ed.
          </h1>
          <p className="sr-hero-sub">
            SmartRoute clusters orders, assigns agents, and computes optimal
            multi-stop deliveries in real time — with the graph algorithms doing
            the actual work, not a third-party API pretending to.
          </p>

          <div className="sr-cta-row">
            <button className="sr-btn-primary" onClick={goToApp}>
              {ctaLabel}
            </button>
            <button className="sr-btn-secondary" onClick={() => scrollTo(algorithmsRef)}>
              View algorithms
            </button>
          </div>

          <div className="sr-chip-row">
            <span className="sr-chip">Dijkstra</span>
            <span className="sr-chip">A* Search</span>
            <span className="sr-chip">Held-Karp DP</span>
            <span className="sr-chip">Union-Find</span>
            <span className="sr-chip">Sliding Window</span>
          </div>
        </div>

        <div className="sr-scroll-cue sr-mono">
          <span className="sr-line"></span>
          <span>scroll to trace the route</span>
        </div>
      </header>

      {/* ══════════════ MODULES / CLUSTER ══════════════ */}
      <section ref={modulesRef}>
        <div className="sr-section-head">
          <span className="sr-section-tag">// zone clustering</span>
          <h2 className="sr-section-title sr-display">One system.<br />Every zone.</h2>
          <p className="sr-section-desc">
            Nearby orders don't stay scattered. A Union-Find pass groups delivery
            points into zones the moment they're created — the same structure
            visualized below, where independent modules merge into a single
            operating picture.
          </p>
        </div>

        <div className="sr-cluster-wrap" ref={clusterWrapRef}>
          <div className="sr-cluster-goo">
            <div className="sr-module-blob" style={{ width: 170, height: 170, top: '38%', left: '30%' }}></div>
            <div className="sr-module-blob" style={{ width: 150, height: 150, top: '30%', left: '48%' }}></div>
            <div className="sr-module-blob" style={{ width: 140, height: 140, top: '55%', left: '44%' }}></div>
            <div className="sr-module-blob" style={{ width: 130, height: 130, top: '60%', left: '62%' }}></div>
            <div className="sr-module-blob" style={{ width: 120, height: 120, top: '35%', left: '66%' }}></div>
            <div className="sr-module-blob" style={{ width: 110, height: 110, top: '60%', left: '24%' }}></div>
          </div>
          <div className="sr-module-labels">
            <div className="sr-module-label" style={{ top: '38%', left: '30%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-cyan)' }}></span>Order Mgmt
            </div>
            <div className="sr-module-label" style={{ top: '30%', left: '48%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-green)' }}></span>Routing Engine
            </div>
            <div className="sr-module-label" style={{ top: '55%', left: '44%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-amber)' }}></span>Assignment
            </div>
            <div className="sr-module-label" style={{ top: '60%', left: '62%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-coral)' }}></span>SLA Monitor
            </div>
            <div className="sr-module-label" style={{ top: '35%', left: '66%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-cyan)' }}></span>Live Tracking
            </div>
            <div className="sr-module-label" style={{ top: '60%', left: '24%' }}>
              <span className="sr-dot" style={{ background: 'var(--sr-green)' }}></span>Analytics
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ ALGORITHMS / ROUTE ══════════════ */}
      <section ref={algorithmsRef}>
        <div className="sr-section-head">
          <span className="sr-section-tag">// route computation</span>
          <h2 className="sr-section-title sr-display">Five algorithms.<br />Zero shortcuts.</h2>
          <p className="sr-section-desc">
            No pathfinding library, no TSP solver package. Every node below is
            implemented from the graph up, tested, and traced — the way it'll be
            explained in the room, not just in the repo.
          </p>
        </div>

        <div className="sr-route-wrap">
          <div className="sr-algo-list">
            <div className="sr-algo-node">
              <div className="sr-node-marker"></div>
              <div>
                <div className="sr-algo-name sr-display">Dijkstra's Algorithm</div>
                <p className="sr-algo-desc">
                  Shortest path from depot to every delivery point, using a
                  min-heap priority queue to always expand the closest
                  unvisited node next.
                </p>
                <span className="sr-algo-tag sr-mono">routing-service / dijkstra.js</span>
              </div>
            </div>

            <div className="sr-algo-node">
              <div className="sr-node-marker"></div>
              <div>
                <div className="sr-algo-name sr-display">A* Search</div>
                <p className="sr-algo-desc">
                  A Haversine-distance heuristic narrows the search for single
                  point-to-point queries — same guarantee as Dijkstra, fewer
                  nodes explored.
                </p>
                <span className="sr-algo-tag sr-mono">routing-service / astar.js</span>
              </div>
            </div>

            <div className="sr-algo-node">
              <div className="sr-node-marker"></div>
              <div>
                <div className="sr-algo-name sr-display">Held-Karp DP (TSP)</div>
                <p className="sr-algo-desc">
                  Bitmask dynamic programming finds the optimal stop order for
                  a multi-delivery route — bounded to 12 stops, since state
                  space grows as O(n²·2ⁿ).
                </p>
                <span className="sr-algo-tag sr-mono">routing-service / heldKarpTSP.js</span>
              </div>
            </div>

            <div className="sr-algo-node">
              <div className="sr-node-marker"></div>
              <div>
                <div className="sr-algo-name sr-display">Union-Find</div>
                <p className="sr-algo-desc">
                  Path compression and union by rank cluster delivery points
                  into zones in near-constant time per operation.
                </p>
                <span className="sr-algo-tag sr-mono">core-service / unionFind.js</span>
              </div>
            </div>

            <div className="sr-algo-node">
              <div className="sr-node-marker"></div>
              <div>
                <div className="sr-algo-name sr-display">Sliding Window</div>
                <p className="sr-algo-desc">
                  A rolling window over recent deliveries powers live
                  SLA-breach detection without rescanning full order history.
                </p>
                <span className="sr-algo-tag sr-mono">routing-service / slidingWindowSLA.js</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ STACK MARQUEE ══════════════ */}
      <section className="sr-marquee-section" style={{ padding: 0 }}>
        <div className="sr-marquee-track">
          {Array(2).fill(0).map((_, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span>React</span><span>Node.js</span><span>Express</span><span>MongoDB</span>
              <span>Redis</span><span>BullMQ</span><span>Socket.io</span><span>Docker</span>
              <span>GitHub Actions</span><span>Jenkins</span><span>Nginx</span><span>Leaflet</span>
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer>
        <div className="sr-footer-mark">Smart<span className="sr-fill">Route</span></div>

        <div className="sr-footer-grid">
          <div className="sr-footer-col">
            <b>Project</b>
            <span onClick={() => scrollTo(modulesRef)} style={{ cursor: 'pointer' }}>Modules</span>
            <span onClick={() => scrollTo(algorithmsRef)} style={{ cursor: 'pointer' }}>Algorithms</span>
            <span onClick={() => scrollTo(stackRef)} style={{ cursor: 'pointer' }}>Tech stack</span>
          </div>
          <div className="sr-footer-col">
            <b>Repository</b>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a href="#">API docs</a>
            <a href="#">CI/CD pipeline</a>
          </div>
          <div className="sr-footer-col">
            <b>Status</b>
            <span style={{ color: 'var(--sr-green)' }}>● routing-service — live</span>
            <span style={{ color: 'var(--sr-green)' }}>● core-service — live</span>
            <span style={{ color: 'var(--sr-muted)' }}>○ auth-service — idle</span>
          </div>
          <div className="sr-footer-col">
            <b>Get started</b>
            <span onClick={goToApp} style={{ cursor: 'pointer', color: 'var(--sr-cyan)' }}>
              {ctaLabel} →
            </span>
            <span>© 2026 SmartRoute</span>
          </div>
        </div>
      </footer>

      <style>{`
        .sr-landing{
          --sr-ink:#0B1220;
          --sr-panel:#131B2E;
          --sr-panel-2:#0F1729;
          --sr-hairline:#26314A;
          --sr-text:#E7ECF5;
          --sr-muted:#8B93A8;
          --sr-green:#33D6A0;
          --sr-coral:#FF6B5C;
          --sr-cyan:#4FC3F7;
          --sr-amber:#FFB454;
          background:var(--sr-ink);
          color:var(--sr-text);
          font-family:'IBM Plex Sans',sans-serif;
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
          position:relative;
        }
        .sr-landing *{box-sizing:border-box;}
        .sr-landing ::selection{background:var(--sr-cyan);color:var(--sr-ink);}
        .sr-display{font-family:'Space Grotesk',sans-serif;}
        .sr-mono{font-family:'IBM Plex Mono',monospace;}

        .sr-filters{position:absolute;width:0;height:0;}

        .sr-progress{
          position:fixed;top:0;left:0;height:2px;width:0%;
          background:linear-gradient(90deg,var(--sr-cyan),var(--sr-green));
          z-index:200;transition:width .05s linear;
        }

        .sr-landing nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:22px clamp(20px,5vw,64px);
          backdrop-filter:blur(10px);
          background:rgba(11,18,32,0.55);
          border-bottom:0.5px solid transparent;
          transition:border-color .3s ease;
        }
        .sr-landing nav.sr-scrolled{border-bottom-color:var(--sr-hairline);}
        .sr-logo{display:flex;align-items:center;gap:10px;font-size:15px;letter-spacing:0.02em;}
        .sr-logo-dot{width:9px;height:9px;border-radius:50%;background:var(--sr-cyan);box-shadow:0 0 10px var(--sr-cyan);flex-shrink:0;}
        .sr-nav-right{display:flex;align-items:center;gap:32px;}
        .sr-nav-links{display:flex;gap:32px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:var(--sr-muted);}
        .sr-nav-links span{cursor:pointer;transition:color .2s;}
        .sr-nav-links span:hover{color:var(--sr-text);}
        .sr-nav-cta{
          font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.04em;
          background:transparent;color:var(--sr-text);
          border:1px solid var(--sr-hairline);border-radius:100px;
          padding:9px 20px;cursor:pointer;
          transition:border-color .2s, color .2s, box-shadow .2s;
        }
        .sr-nav-cta:hover{border-color:var(--sr-cyan);color:var(--sr-cyan);box-shadow:0 0 14px rgba(79,195,247,0.25);}
        @media(max-width:640px){.sr-nav-links{display:none;}}

        .sr-hero{
          position:relative;min-height:100vh;
          display:flex;flex-direction:column;justify-content:center;
          padding:0 clamp(20px,6vw,80px);overflow:hidden;
        }
        .sr-grid-bg{
          position:absolute;inset:-10% -10%;
          background-image:
            linear-gradient(var(--sr-hairline) 1px, transparent 1px),
            linear-gradient(90deg, var(--sr-hairline) 1px, transparent 1px);
          background-size:56px 56px;opacity:0.28;
          mask-image:radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 75%);
          -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 75%);
          pointer-events:none;
        }
        .sr-goo-field{position:absolute;inset:0;filter:url(#sr-goo);pointer-events:none;z-index:0;}
        .sr-blob-track{position:absolute;will-change:transform;}
        .sr-blob{border-radius:50%;position:absolute;animation:sr-float 14s ease-in-out infinite;}
        .sr-blob.sr-cyan{background:var(--sr-cyan);opacity:.55;}
        .sr-blob.sr-green{background:var(--sr-green);opacity:.5;}
        .sr-blob.sr-amber{background:var(--sr-amber);opacity:.4;}
        @keyframes sr-float{
          0%,100%{transform:translate(0,0) scale(1);}
          33%{transform:translate(24px,-32px) scale(1.08);}
          66%{transform:translate(-18px,20px) scale(0.94);}
        }

        .sr-hero-content{position:relative;z-index:2;max-width:1100px;}
        .sr-eyebrow{
          display:inline-flex;align-items:center;gap:8px;
          font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.08em;
          color:var(--sr-cyan);text-transform:uppercase;margin-bottom:28px;
          opacity:0;animation:sr-reveal .8s ease forwards;animation-delay:.1s;
        }
        .sr-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--sr-cyan);box-shadow:0 0 8px var(--sr-cyan);}

        .sr-hero-head{
          font-size:clamp(48px,9vw,124px);font-weight:600;line-height:0.98;letter-spacing:-0.02em;
          opacity:0;animation:sr-reveal .9s ease forwards;animation-delay:.25s;
        }
        .sr-hero-head .sr-accent{color:var(--sr-cyan);}

        .sr-hero-sub{
          margin-top:28px;max-width:560px;font-size:clamp(15px,1.6vw,18px);
          color:var(--sr-muted);line-height:1.6;
          opacity:0;animation:sr-reveal .9s ease forwards;animation-delay:.4s;
        }

        .sr-cta-row{
          margin-top:36px;display:flex;flex-wrap:wrap;gap:14px;
          opacity:0;animation:sr-reveal .9s ease forwards;animation-delay:.5s;
        }
        .sr-btn-primary{
          font-family:'IBM Plex Mono';font-size:13px;letter-spacing:0.03em;
          background:var(--sr-cyan);color:var(--sr-ink);font-weight:600;
          border:none;border-radius:100px;padding:14px 28px;cursor:pointer;
          box-shadow:0 0 0 rgba(79,195,247,0);
          transition:box-shadow .25s ease, transform .15s ease;
        }
        .sr-btn-primary:hover{box-shadow:0 0 24px rgba(79,195,247,0.45);transform:translateY(-1px);}
        .sr-btn-secondary{
          font-family:'IBM Plex Mono';font-size:13px;letter-spacing:0.03em;
          background:transparent;color:var(--sr-text);
          border:1px solid var(--sr-hairline);border-radius:100px;padding:14px 28px;cursor:pointer;
          transition:border-color .2s, color .2s;
        }
        .sr-btn-secondary:hover{border-color:var(--sr-text);}

        .sr-chip-row{
          margin-top:32px;display:flex;flex-wrap:wrap;gap:10px;
          opacity:0;animation:sr-reveal .9s ease forwards;animation-delay:.62s;
        }
        .sr-chip{
          font-family:'IBM Plex Mono';font-size:12px;
          padding:7px 14px;border:0.5px solid var(--sr-hairline);border-radius:100px;
          color:var(--sr-muted);transition:border-color .25s, color .25s;
        }
        .sr-chip:hover{border-color:var(--sr-cyan);color:var(--sr-text);}

        @keyframes sr-reveal{
          from{opacity:0;transform:translateY(18px);}
          to{opacity:1;transform:translateY(0);}
        }

        .sr-scroll-cue{
          position:absolute;bottom:40px;left:clamp(20px,6vw,80px);
          display:flex;align-items:center;gap:10px;
          font-family:'IBM Plex Mono';font-size:11px;color:var(--sr-muted);z-index:2;
        }
        .sr-scroll-cue .sr-line{width:34px;height:1px;background:var(--sr-hairline);position:relative;overflow:hidden;}
        .sr-scroll-cue .sr-line::after{
          content:'';position:absolute;left:-100%;top:0;width:100%;height:100%;
          background:var(--sr-cyan);animation:sr-travel 2.2s linear infinite;
        }
        @keyframes sr-travel{to{left:100%;}}

        .sr-landing section{position:relative;padding:140px clamp(20px,6vw,80px);}
        .sr-section-head{
          max-width:680px;margin-bottom:80px;
          opacity:0;transform:translateY(24px);
          transition:opacity .8s ease, transform .8s ease;
        }
        .sr-section-head.sr-visible{opacity:1;transform:translateY(0);}
        .sr-section-tag{
          font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.08em;
          color:var(--sr-green);text-transform:uppercase;margin-bottom:16px;display:block;
        }
        .sr-section-title{font-size:clamp(32px,5vw,58px);font-weight:600;line-height:1.05;letter-spacing:-0.015em;}
        .sr-section-desc{margin-top:20px;color:var(--sr-muted);font-size:16px;line-height:1.7;max-width:560px;}

        .sr-cluster-wrap{position:relative;height:560px;display:flex;align-items:center;justify-content:center;}
        .sr-cluster-goo{position:absolute;inset:0;filter:url(#sr-goo2);}
        .sr-module-blob{position:absolute;border-radius:50%;background:var(--sr-panel);border:1px solid var(--sr-hairline);}
        .sr-module-labels{position:absolute;inset:0;z-index:3;}
        .sr-module-label{
          position:absolute;text-align:center;font-family:'IBM Plex Mono';font-size:12px;
          color:var(--sr-text);transform:translate(-50%,-50%);
          display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;
        }
        .sr-dot{width:6px;height:6px;border-radius:50%;}

        .sr-route-wrap{position:relative;padding-top:20px;}
        .sr-algo-list{display:flex;flex-direction:column;gap:2px;margin-top:20px;}
        .sr-algo-node{
          display:grid;grid-template-columns:64px 1fr;gap:24px;align-items:start;
          padding:32px 0;border-top:0.5px solid var(--sr-hairline);
          opacity:0.35;transition:opacity .6s ease;
        }
        .sr-algo-node.sr-is-active{opacity:1;}
        .sr-algo-node:last-child{border-bottom:0.5px solid var(--sr-hairline);}
        .sr-node-marker{
          width:14px;height:14px;border-radius:50%;
          background:var(--sr-panel);border:2px solid var(--sr-hairline);margin-top:6px;
          transition:background .5s ease, border-color .5s ease, box-shadow .5s ease;
        }
        .sr-algo-node.sr-is-active .sr-node-marker{
          background:var(--sr-cyan);border-color:var(--sr-cyan);
          box-shadow:0 0 16px rgba(79,195,247,0.6);
        }
        .sr-algo-name{font-family:'Space Grotesk';font-size:clamp(22px,3vw,32px);font-weight:500;margin-bottom:8px;}
        .sr-algo-desc{color:var(--sr-muted);font-size:15px;line-height:1.6;max-width:620px;}
        .sr-algo-tag{
          font-family:'IBM Plex Mono';font-size:11px;color:var(--sr-muted);
          margin-top:12px;display:inline-block;border:0.5px solid var(--sr-hairline);
          padding:4px 10px;border-radius:6px;
        }

        .sr-marquee-section{
          padding:0;border-top:0.5px solid var(--sr-hairline);border-bottom:0.5px solid var(--sr-hairline);
          overflow:hidden;
        }
        .sr-marquee-track{
          display:flex;white-space:nowrap;animation:sr-scroll-left 32s linear infinite;width:max-content;
        }
        .sr-marquee-track span{
          font-family:'IBM Plex Mono';font-size:15px;color:var(--sr-muted);
          padding:28px 40px;display:flex;align-items:center;gap:40px;
        }
        .sr-marquee-track span:not([style])::after{content:'•';color:var(--sr-hairline);}
        @keyframes sr-scroll-left{from{transform:translateX(0);}to{transform:translateX(-50%);}}

        .sr-landing footer{
          position:relative;background:var(--sr-panel-2);border-top:0.5px solid var(--sr-hairline);
          padding:100px clamp(20px,6vw,80px) 40px;overflow:hidden;
        }
        .sr-footer-mark{
          font-family:'Space Grotesk';font-weight:700;font-size:clamp(64px,16vw,240px);
          line-height:0.85;letter-spacing:-0.03em;color:var(--sr-text);
          -webkit-text-stroke:1px var(--sr-hairline);position:relative;
        }
        .sr-footer-mark .sr-fill{color:var(--sr-cyan);}
        .sr-footer-grid{
          display:flex;flex-wrap:wrap;gap:40px;justify-content:space-between;
          margin-top:56px;padding-top:32px;border-top:0.5px solid var(--sr-hairline);
          font-family:'IBM Plex Mono';font-size:12px;color:var(--sr-muted);
        }
        .sr-footer-col{display:flex;flex-direction:column;gap:10px;}
        .sr-footer-col b{color:var(--sr-text);font-family:'IBM Plex Sans';font-size:13px;font-weight:500;margin-bottom:4px;}
        .sr-footer-col a{color:var(--sr-muted);text-decoration:none;transition:color .2s;}
        .sr-footer-col a:hover{color:var(--sr-cyan);}

        @media(prefers-reduced-motion: reduce){
          .sr-landing *{animation:none !important;transition:none !important;}
        }
      `}</style>
    </div>
  );
}