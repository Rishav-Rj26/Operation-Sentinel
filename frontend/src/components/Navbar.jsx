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
    <nav className="relative z-40 border-b border-slate-800/50 bg-[#050a18]/80 backdrop-blur-2xl sticky top-0">
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Left */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#050a18]" />
              </div>
              <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight hidden sm:block">
                Sentinel
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`
                }>
                  {createElement(item.icon, { className: 'w-4 h-4' })}{item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/30">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
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

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400" aria-label="Toggle navigation menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-800/50 space-y-1 animate-fade-in">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
