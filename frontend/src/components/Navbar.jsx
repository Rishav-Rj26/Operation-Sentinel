import { createElement, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Radio, LayoutDashboard, AlertTriangle, Car, LogOut, Menu, X, Map, BarChart3, Activity, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/units', label: 'Units', icon: Car },
  { to: '/officers', label: 'Officers', icon: Shield },
  { to: '/zones', label: 'Zones', icon: Map },
  { to: '/roster', label: 'Roster', icon: LayoutDashboard },
  { to: '/fatigue', label: 'Fatigue', icon: Activity },
  { to: '/audit', label: 'Audit Log', icon: FileText },
];

const Navbar = ({ status, incidents = [] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="relative z-40 border-b border-slate-800 bg-[#0b1220]/95 backdrop-blur-xl sticky top-0">
      <div className="w-full max-w-[1600px] mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center border border-sky-400/30">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0b1220]" />
              </div>
              <span className="text-base font-bold text-slate-100 tracking-tight hidden sm:block">
                Sentinel
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }>
                  {createElement(item.icon, { className: 'w-4 h-4' })}{item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${
                status && status.includes('disconnected') ? 'bg-red-500 animate-pulse' : 'bg-emerald-400 badge-active'
              }`} />
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {status === 'Optimal' ? 'Online' : status && status.includes('disconnected') ? 'Offline' : '...'}
              </span>
            </div>

            {/* Notification Bell */}
            <NotificationPanel incidents={incidents} />

            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all ml-1" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden p-2 rounded-md hover:bg-slate-800 text-slate-400" aria-label="Toggle navigation menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="xl:hidden pb-4 pt-2 border-t border-slate-800 space-y-1 animate-fade-in">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }>
                {createElement(item.icon, { className: 'w-4 h-4' })}{item.label}
              </NavLink>
            ))}
            {user && (
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" />Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
