import React from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ title, children, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-2xl sentinel-panel rounded-xl overflow-hidden animate-scale-in border border-outline-variant/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30 bg-surface/50">
          <h2 className="font-headline-md text-headline-md text-primary-container tracking-tight flex items-center gap-2">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-outline-variant hover:text-error transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-8 bg-surface/80">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
