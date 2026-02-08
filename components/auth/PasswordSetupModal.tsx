import React, { useState, useEffect, FormEvent, useRef, type FC } from 'react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

// --- Extracted Step 1 Component ---
const WarningStep: FC<{ onNext: () => void }> = ({ onNext }) => (
    <>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">A Quick Note on Security / பாதுகாப்பு குறிப்பு</h2>
        </div>
        <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <p>Your password is the <strong>only</strong> key to your encrypted data.</p>
                <p>We cannot see, store, or recover your password for you.</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">If you forget it, your data will be permanently lost.</p>
            </div>
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
             <button
                type="button"
                onClick={onNext}
                className="w-full flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 btn-press"
            >
                I Understand, Continue / புரிகிறது, தொடர்க
            </button>
        </div>
    </>
);

// --- Extracted Step 2 Component ---
interface PasswordStepProps {
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onBack: () => void;
    passwordInputRef: React.RefObject<HTMLInputElement>;
    password: { value: string; setter: (v: string) => void; };
    confirmPassword: { value: string; setter: (v: string) => void; };
    error: string;
    canSubmit: boolean;
    isProcessing: boolean;
}

const PasswordStep: FC<PasswordStepProps> = ({
    onSubmit, onBack, passwordInputRef, password, confirmPassword, error, canSubmit, isProcessing
}) => {
    const inputBaseClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";
    const labelClasses = "block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100";

    return (
     <>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">Create Your Secure Password / கடவுச்சொல்லை உருவாக்குக</h2>
        </div>
        <form onSubmit={onSubmit} autoComplete="off">
            <div className="p-6 space-y-6">
                <input type="text" name="username" defaultValue="i8e10-user" autoComplete="username" className="hidden" />
                <div>
                    <label htmlFor="new-password" className={labelClasses}>Create Password</label>
                    <div className="mt-2">
                        <input ref={passwordInputRef} type="password" id="new-password" name="new-password" autoComplete="new-password" value={password.value} onChange={e => password.setter(e.target.value)} className={inputBaseClasses} required />
                    </div>
                    <PasswordStrengthIndicator password={password.value} />
                </div>

                <div>
                    <label htmlFor="confirm-password" className={labelClasses}>Confirm Password</label>
                    <div className="mt-2">
                        <input type="password" id="confirm-password" name="confirm-password" autoComplete="new-password" value={confirmPassword.value} onChange={e => confirmPassword.setter(e.target.value)} className={inputBaseClasses} required />
                    </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Using a short password or a PIN is strongly discouraged as it puts your local data file at risk of brute-force attacks.
                </p>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="btn-press bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    &larr; Back
                </button>
                <button
                    type="submit"
                    disabled={!canSubmit || isProcessing}
                    className={`btn-press flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 ${isProcessing ? 'cursor-wait' : 'disabled:cursor-not-allowed'}`}
                >
                    {isProcessing ? 'Securing...' : 'Set Password & Secure Data / கடவுச்சொல்லை அமைத்து தரவைப் பாதுகாக்கவும்'}
                </button>
            </div>
        </form>
     </>
    );
};


// --- Main Component ---
interface PasswordSetupModalProps {
  onPasswordSet: (password: string) => void;
}

const PasswordSetupModal: FC<PasswordSetupModalProps> = ({ onPasswordSet }) => {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const passwordsMatch = password && password === confirmPassword;
  const passwordStrength = PasswordStrengthIndicator.calculateStrength(password);
  const canSubmit = passwordsMatch && passwordStrength.score >= 2;

  useEffect(() => {
    if (step === 2) {
      // The timeout ensures the element is rendered and visible before focusing.
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  }, [step]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!passwordsMatch) setError('Passwords do not match.');
      else setError('Password is too weak.');
      return;
    }
    setError('');
    setIsProcessing(true);
    // Add a small delay to allow the UI to update to the processing state
    setTimeout(() => {
      onPasswordSet(password);
    }, 50);
  };
  
  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
    } else {
      setError('');
    }
  }, [password, confirmPassword]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-50 dark:bg-slate-900 animate-fadeInUp">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all flex flex-col">
        {step === 1 ? (
            <WarningStep onNext={() => setStep(2)} />
        ) : (
            <PasswordStep
                onSubmit={handleSubmit}
                onBack={() => setStep(1)}
                passwordInputRef={passwordInputRef}
                password={{ value: password, setter: setPassword }}
                confirmPassword={{ value: confirmPassword, setter: setConfirmPassword }}
                error={error}
                canSubmit={canSubmit}
                isProcessing={isProcessing}
            />
        )}
      </div>
    </div>
  );
};

export default PasswordSetupModal;