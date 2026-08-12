import React from 'react';

const SEVERITY_CONFIG = {
  critical: { color: 'text-crimson', bg: 'bg-crimson', ring: 'ring-crimson/30', border: 'border-crimson', shadow: 'shadow-[0_0_15px_rgba(213,0,0,0.6)]' },
  high: { color: 'text-amber', bg: 'bg-amber', ring: 'ring-amber/30', border: 'border-amber', shadow: 'shadow-[0_0_15px_rgba(255,191,0,0.6)]' },
  medium: { color: 'text-surface-tint', bg: 'bg-surface-tint', ring: 'ring-surface-tint/30', border: 'border-surface-tint', shadow: 'shadow-[0_0_10px_rgba(0,219,231,0.4)]' },
  low: { color: 'text-success', bg: 'bg-success', ring: 'ring-success/30', border: 'border-success', shadow: 'shadow-[0_0_10px_rgba(0,200,83,0.4)]' },
};

const ResolutionCascade = ({ status }) => {
  const steps = ['reported', 'responding', 'resolved', 'closed'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <React.Fragment key={step}>
            <div className={`h-1.5 flex-1 rounded-sm ${isCompleted ? 'bg-primary shadow-[0_0_5px_rgba(0,242,255,0.5)]' : 'bg-surface-variant'}`} />
            {idx < steps.length - 1 && <div className="w-0.5 h-2 bg-outline-variant/30 rotate-12" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const IncidentTimeline = ({ incidents = [], onEdit }) => {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center sentinel-panel border border-outline-variant/30 rounded-lg">
        <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">gpp_maybe</span>
        <p className="font-headline-md text-headline-md text-on-surface">NO ACTIVE INCIDENTS</p>
        <p className="font-data-md text-data-md text-on-surface-variant mt-1">System monitoring is nominal.</p>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Central timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant/30 -translate-x-1/2 hidden lg:block" />
      <div className="absolute left-6 top-0 bottom-0 w-px bg-outline-variant/30 lg:hidden" />

      <div className="space-y-6 lg:space-y-8">
        {incidents.map((inc, idx) => {
          const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.low;
          const isLeft = idx % 2 === 0;

          return (
            <div key={inc._id} className="relative">
              {/* Timeline Node — Desktop */}
              <div className="hidden lg:flex absolute left-1/2 top-5 -translate-x-1/2 z-10">
                <div className={`w-3 h-3 rounded-full ${sev.bg} ring-4 ${sev.ring} ${sev.shadow} ${inc.severity === 'critical' ? 'animate-pulse' : ''}`} />
              </div>

              {/* Timeline Node — Mobile */}
              <div className="lg:hidden absolute left-6 top-5 -translate-x-1/2 z-10">
                <div className={`w-3 h-3 rounded-full ${sev.bg} ring-4 ${sev.ring} ${sev.shadow} ${inc.severity === 'critical' ? 'animate-pulse' : ''}`} />
              </div>

              {/* Content Card */}
              <div className={`lg:w-[calc(50%-2rem)] ${isLeft ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'} ml-12 lg:ml-0`}>
                <div className={`sentinel-card rounded-lg p-4 border-l-4 ${sev.border} hover:bg-surface-container-low transition-colors cursor-default group`}>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`font-label-caps text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${sev.color} ${sev.border} bg-surface-container-highest/50`}>
                          {inc.severity}
                        </span>
                        <span className="font-data-md text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {new Date(inc.createdAt).toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-data-lg text-data-lg text-on-surface uppercase tracking-wider">{inc.title}</h4>
                    </div>
                  </div>

                  {/* Description */}
                  {inc.description && (
                    <p className="font-data-md text-[13px] text-on-surface-variant mb-4 opacity-80 leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                      {inc.description}
                    </p>
                  )}

                  {/* Resolution Cascade */}
                  <div className="mb-4">
                    <div className="flex justify-between font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">
                      <span>Cascade Status</span>
                      <span className="text-primary">{inc.status}</span>
                    </div>
                    <ResolutionCascade status={inc.status} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 font-data-md text-[11px] text-outline-variant">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {inc.location || 'UNKNOWN VECTOR'}
                    </div>

                    {onEdit && (
                      <button onClick={() => onEdit(inc)} className="opacity-0 group-hover:opacity-100 p-1.5 border border-primary/30 rounded text-primary hover:bg-primary hover:text-on-primary transition-all">
                        <span className="material-symbols-outlined text-[14px]">terminal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
