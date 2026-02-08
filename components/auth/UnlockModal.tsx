import React, { useState, type FC, type FormEvent, useRef } from 'react';
import ClearDataConfirmationModal from '../ClearDataConfirmationModal';

interface UnlockModalProps {
  onUnlock: (password: string) => Promise<boolean>;
  onReset: () => void;
  onRecoverRequest: () => void;
}

const UnlockModal: FC<UnlockModalProps> = ({ onUnlock, onReset, onRecoverRequest }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    const success = await onUnlock(password);
    if (!success) {
      setError('Incorrect Password. Please try again.');
      setIsProcessing(false);
      // Trigger shake animation
      containerRef.current?.classList.add('animate-shake');
      setTimeout(() => {
        containerRef.current?.classList.remove('animate-shake');
      }, 500);
    }
  };

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    onReset();
  };

  const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";
  
  return (
    <>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-50 dark:bg-slate-900 animate-fadeInUp">
        <div 
          ref={containerRef} 
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm transform flex flex-col"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 id="modal-title" className="text-xl font-bold text-center text-slate-800 dark:text-slate-100">i8·e10 Locked</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <input type="text" name="username" defaultValue="i8e10-user" autoComplete="username" className="hidden" />
              <div>
                <label htmlFor="current-password" className={labelClasses}>Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    id="current-password"
                    name="current-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputBaseClasses}
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              {error && <p className="text-sm text-center text-red-500 mt-4">{error}</p>}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex justify-center py-3 px-4 mt-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait"
              >
                {isProcessing ? 'Unlocking...' : 'Unlock'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={onRecoverRequest} className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                Forgot Password? Use Recovery Phrase
              </button>
            </div>
          </div>
        </div>
      </div>
      <ClearDataConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </>
  );
};

export default UnlockModal;
