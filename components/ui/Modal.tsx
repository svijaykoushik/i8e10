import React, { useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  footer?: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children, title, footer }) => {
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }
  }, [isOpen]);

  // This function is called when the fade-out transition ends
  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsRendered(false);
    }
  };

  const overlayClasses = isOpen ? 'opacity-100' : 'opacity-0';
  const modalClasses = isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95';

  if (!isRendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${overlayClasses}`}
      onTransitionEnd={handleAnimationEnd}
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70" aria-hidden="true" />
      <div 
        className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${modalClasses} flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full p-1 -mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;