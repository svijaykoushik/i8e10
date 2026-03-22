import { FC, useState, FormEvent } from "react";

const RecoverAccountModal: FC<{ onRecover: (phrase: string, newPass: string) => Promise<string | null>; onClose: () => void; onRequestReset: () => void; }> = ({ onRecover, onClose, onRequestReset }) => {
    const [phrase, setPhrase] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        setIsProcessing(true);
        setError('');
        const err = await onRecover(phrase, newPassword);
        if (err) {
            setError(err);
            setIsProcessing(false);
        }
    };

    const inputClasses = "block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-700 py-2.5 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition";

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeInUp">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recover Your Account</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <textarea value={phrase} onChange={e => setPhrase(e.target.value)} rows={3} placeholder="Enter your 12-word recovery phrase..." className={inputClasses} required />
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className={inputClasses} required />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className={inputClasses} required />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <button type="submit" disabled={isProcessing} className="w-full btn-press py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm font-medium disabled:bg-indigo-400">
                            {isProcessing ? 'Recovering...' : 'Recover & Set New Password'}
                        </button>
                        <button type="button" onClick={onRequestReset} className="w-full text-center text-sm text-slate-500 hover:text-red-500">Still can't recover? Reset App</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecoverAccountModal;