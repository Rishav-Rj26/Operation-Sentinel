import { Activity, Car, Users, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const StatsGrid = ({ stats }) => {
  // Use real trends from the backend
  const incidentTrend = stats?.incidentTrend;
  const resolvedTrend = stats?.resolvedTrend;

  const cards = [
    {
      label: 'Active Incidents',
      value: stats?.activeIncidents ?? '—',
      trend: incidentTrend != null ? `${incidentTrend > 0 ? '+' : ''}${incidentTrend}%` : null,
      trendDir: incidentTrend > 0 ? 'up' : 'down',
      trendGood: incidentTrend <= 0, // fewer incidents is good
      icon: Activity,
      gradient: 'bg-red-500/15 text-red-400',
      glow: '',
    },
    {
      label: 'Units Deployed',
      value: stats?.unitsDeployed ?? '—',
      trend: stats ? `${stats.availableUnits} avail` : null,
      trendDir: 'down',
      trendGood: true,
      icon: Car,
      gradient: 'bg-sky-500/15 text-sky-400',
      glow: '',
    },
    {
      label: 'Resolved Today',
      value: stats?.resolvedToday ?? '—',
      trend: resolvedTrend != null ? `${resolvedTrend > 0 ? '+' : ''}${resolvedTrend}%` : null,
      trendDir: resolvedTrend > 0 ? 'up' : 'down',
      trendGood: resolvedTrend >= 0, // more resolved is good
      icon: Users,
      gradient: 'bg-emerald-500/15 text-emerald-400',
      glow: '',
    },
    {
      label: 'Avg Response',
      value: stats?.responseTime ?? '—',
      trend: null,
      trendDir: 'down',
      trendGood: true,
      icon: Clock,
      gradient: 'bg-violet-500/15 text-violet-400',
      glow: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="glass-card rounded-xl p-5 group transition-colors duration-200 animate-slide-up"
          style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-lg ${card.gradient} flex items-center justify-center ${card.glow} transition-transform duration-200`}>
              <card.icon className="w-5 h-5" />
            </div>
            {card.trend && (
              <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                card.trendGood
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {card.trendDir === 'up'
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                {card.trend}
              </div>
            )}
          </div>
          <p className="text-3xl font-black text-white tracking-tight">
            {typeof card.value === 'number' ? (
              <AnimatedCounter value={card.value} duration={1400 + idx * 200} />
            ) : (
              card.value
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{card.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
