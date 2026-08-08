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
      gradient: 'from-red-500 to-orange-500',
      glow: 'shadow-red-500/20',
    },
    {
      label: 'Units Deployed',
      value: stats?.unitsDeployed ?? '—',
      trend: stats ? `${stats.availableUnits} avail` : null,
      trendDir: 'down',
      trendGood: true,
      icon: Car,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Resolved Today',
      value: stats?.resolvedToday ?? '—',
      trend: resolvedTrend != null ? `${resolvedTrend > 0 ? '+' : ''}${resolvedTrend}%` : null,
      trendDir: resolvedTrend > 0 ? 'up' : 'down',
      trendGood: resolvedTrend >= 0, // more resolved is good
      icon: Users,
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
    },
    {
      label: 'Avg Response',
      value: stats?.responseTime ?? '—',
      trend: null,
      trendDir: 'down',
      trendGood: true,
      icon: Clock,
      gradient: 'from-violet-500 to-purple-500',
      glow: 'shadow-violet-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="glass-card rounded-2xl p-5 group hover:-translate-y-1 transition-all duration-300 card-lift animate-slide-up"
          style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.glow} group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-5 h-5 text-white" />
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
