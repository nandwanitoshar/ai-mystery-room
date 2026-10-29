import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import caseApi from '../api/caseApi';

export default function Navbar() {
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    caseApi
      .checkHealth()
      .then((data) => {
        if (isMounted) {
          setDbStatus(data.database === 'connected' ? 'connected' : 'degraded');
        }
      })
      .catch(() => {
        if (isMounted) {
          setDbStatus('offline');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xs font-mono font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            M
          </div>
          <span className="font-mono font-bold tracking-wider text-slate-100 text-base group-hover:text-amber-400 transition-colors">
            AI MYSTERY ROOM
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-xs font-mono">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              Case Bureau
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              + Open Case
            </NavLink>
          </nav>

          {/* Database indicator pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : dbStatus === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            ></span>
            <span className="text-slate-400 uppercase">
              {dbStatus === 'connected' ? 'DB Active' : dbStatus === 'degraded' ? 'DB Alert' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
