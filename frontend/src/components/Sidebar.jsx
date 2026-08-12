import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'radar' },
    { name: 'Map', path: '/map', icon: 'map' },
    { name: 'Incidents', path: '/incidents', icon: 'warning' },
    { name: 'Zones', path: '/zones', icon: 'grid_view' },
    { name: 'Personnel', path: '/officers', icon: 'group' },
    { name: 'Roster', path: '/roster', icon: 'calendar_month' },
    { name: 'Fatigue', path: '/fatigue', icon: 'monitor_heart' },
    { name: 'Units', path: '/units', icon: 'local_shipping' },
    { name: 'Analytics', path: '/analytics', icon: 'query_stats' },
    { name: 'Audit Log', path: '/audit', icon: 'history' },
  ];

  return (
    <nav className={`bg-surface-container-low/15 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen py-6 transition-all duration-300 z-40 relative shrink-0 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
      
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-surface border border-surface-tint/30 rounded-full flex items-center justify-center text-surface-tint hover:bg-surface-tint/10 transition-colors z-50"
      >
        <span className="material-symbols-outlined text-[14px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      <div className={`px-4 mb-8 flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
        <div className="w-10 h-10 shrink-0 rounded bg-primary-container/10 flex items-center justify-center text-surface-tint border border-surface-tint/30">
          <span className="material-symbols-outlined font-bold text-surface-tint drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">radar</span>
        </div>
        {!isCollapsed && (
          <div className="animate-fade-in whitespace-nowrap overflow-hidden">
            <h1 className="text-primary font-headline-md text-sm uppercase tracking-widest leading-tight">OP_SENTINEL</h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant font-data-md">Sector 7_Alpha</p>
          </div>
        )}
      </div>

      <ul className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 ease-in-out font-label-caps text-label-caps whitespace-nowrap ${
                  isActive 
                  ? 'bg-primary-container/20 text-surface-tint border-l-2 border-surface-tint shadow-[0_0_12px_rgba(0,242,255,0.4)]' 
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-primary border-l-2 border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-4 px-3 border-t border-white/5 pt-4">
        {!isCollapsed && (
          <div className="px-3 pb-3 mb-2 flex items-center gap-3 animate-fade-in whitespace-nowrap overflow-hidden">
            <div className="w-8 h-8 rounded-sm bg-surface-variant flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-on-surface">person</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] text-on-surface">{user?.name || 'Officer'}</span>
              <span className="font-data-md text-[9px] text-surface-tint uppercase">{user?.role || 'operator'} // {user?.badge || '0000'}</span>
            </div>
          </div>
        )}
        
        <div className={`px-3 py-2 mb-2 flex items-center gap-2 rounded bg-surface-variant/30 border ${connected ? 'border-success/30' : 'border-amber/30'} ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success shadow-[0_0_8px_rgba(0,200,83,0.6)]' : 'bg-amber shadow-[0_0_8px_rgba(255,191,0,0.6)] animate-pulse'}`}></div>
          {!isCollapsed && (
            <span className={`font-label-caps text-[9px] tracking-widest uppercase ${connected ? 'text-success' : 'text-amber'}`}>
              {connected ? 'UPLINK ACTIVE' : 'CONNECTING...'}
            </span>
          )}
        </div>

        <button 
          onClick={logout}
          className={`w-full py-2 bg-error/10 border border-error/30 text-error font-label-caps text-label-caps hover:bg-error/20 transition-colors flex items-center justify-center gap-2 ${isCollapsed ? 'px-0' : ''}`}
          title={isCollapsed ? "Secure Logout" : undefined}
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          {!isCollapsed && "LOGOUT"}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
