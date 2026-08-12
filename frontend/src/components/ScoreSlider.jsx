import React from 'react';

const ScoreSlider = ({ label, value, onChange, min = 1, max = 10, isThreat = false }) => {
  
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Threat color logic
  let gradient = 'from-primary-container/20 to-primary-container';
  let shadow = 'rgba(0, 242, 255, 0.5)';
  let thumbColor = '#00f2ff';
  let thumbShadow = 'rgba(0, 242, 255, 0.8)';
  let valueColor = 'text-primary-fixed';

  if (isThreat) {
    if (value >= 8) {
      gradient = 'from-rose-500/20 to-rose-500';
      shadow = 'rgba(244, 63, 94, 0.5)';
      thumbColor = '#f43f5e';
      thumbShadow = 'rgba(244, 63, 94, 0.8)';
      valueColor = 'text-rose-500';
    } else if (value >= 4) {
      gradient = 'from-amber-400/20 to-amber-400';
      shadow = 'rgba(251, 191, 36, 0.5)';
      thumbColor = '#fbbf24';
      thumbShadow = 'rgba(251, 191, 36, 0.8)';
      valueColor = 'text-amber-400';
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{label}</label>
        <span className={`font-data-md text-data-md font-bold tracking-wider ${valueColor}`}>{value}</span>
      </div>
      
      <div className="flex items-center gap-4 relative py-2">
        <span className="font-data-md text-data-md text-outline">{min}</span>
        
        <div className="relative w-full flex items-center">
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full relative z-10 score-slider"
            style={{ '--thumb-color': thumbColor, '--thumb-shadow': thumbShadow }}
          />
          <div 
            className={`absolute h-[4px] rounded-[2px] pointer-events-none top-1/2 -translate-y-1/2 z-0 bg-gradient-to-r ${gradient}`}
            style={{ width: `${percentage}%`, boxShadow: `0 0 8px ${shadow}` }}
          ></div>
        </div>
        
        <span className="font-data-md text-data-md text-outline">{max}</span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input[type=range].score-slider::-webkit-slider-thumb {
            background: var(--thumb-color, #00f2ff);
            box-shadow: 0 0 10px var(--thumb-shadow, rgba(0, 242, 255, 0.8)), 0 0 4px rgba(255, 255, 255, 0.8) inset;
        }
      `}} />
    </div>
  );
};

export default ScoreSlider;
