import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLORS = {
  success: 'border-success/50 bg-success/10 text-success shadow-[0_0_15px_rgba(0,200,83,0.3)]',
  error: 'border-crimson/50 bg-crimson/10 text-crimson shadow-[0_0_15px_rgba(213,0,0,0.3)]',
  warning: 'border-amber/50 bg-amber/10 text-amber shadow-[0_0_15px_rgba(255,191,0,0.3)]',
  info: 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,242,255,0.3)]',
};

const Toast = ({ id, message, type = 'info', onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded border backdrop-blur-md animate-slide-in-right ${COLORS[type]}`}>
      <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
        {ICONS[type]}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-label-caps text-[10px] uppercase tracking-widest opacity-80 mb-0.5">{type}</p>
        <p className="font-data-md text-[13px] text-white leading-snug">{message}</p>
      </div>
      <button onClick={() => onDismiss(id)} className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0 mt-1">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-20 right-6 z-[2000] flex flex-col gap-3 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
