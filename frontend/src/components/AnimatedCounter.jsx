import { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    if (value === undefined || value === null || value === '—') {
      return;
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) {
      return;
    }

    const startValue = prevValue.current;
    prevValue.current = numericValue;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numericValue - startValue) * eased;

      setDisplay(Number(current.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startRef.current = null;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, decimals]);

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const displayValue = value === undefined || value === null || value === '—' || isNaN(numericValue) ? value : display;

  const formatted = typeof displayValue === 'number'
    ? displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : displayValue;

  return (
    <span className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedCounter;
