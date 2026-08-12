import React from 'react';

const FatigueBar = ({ score, max = 100 }) => {
  const percentage = Math.max(0, Math.min(100, (score / max) * 100));
  
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 fatigue-gradient shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]">
        <div 
          className="fatigue-marker shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-500 ease-out" 
          style={{ left: `calc(${percentage}% - 2px)` }}
        />
      </div>
      <span className={`font-data-md text-data-md w-8 text-right font-bold ${
        percentage >= 80 ? 'text-crimson drop-shadow-[0_0_8px_#d50000]' : 
        percentage >= 50 ? 'text-amber drop-shadow-[0_0_8px_#ffbf00]' : 
        'text-success drop-shadow-[0_0_8px_#00c853]'
      }`}>
        {Math.round(score)}
      </span>
    </div>
  );
};

export default FatigueBar;
