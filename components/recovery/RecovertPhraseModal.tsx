import { FC, useState } from "react";

const RecoveryPhraseModal: FC<{ phrase: string; onConfirm: () => void }> = ({ phrase, onConfirm }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const words = phrase.split(' ');

    const handleDownload = () => {
        const content = `i8·e10 Recovery Phrase\n\n${phrase}\n\nPlease store this phrase in a safe and secret place. It is the only way to recover your data if you forget your password.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'i8e10-recovery-phrase.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeInUp">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Recovery Phrase</h2>
                </div>
                <div className="p-6">
                    <p className="text-center text-red-600 dark:text-red-400 font-semibold">This is the ONLY time you will see this phrase. Write it down and keep it safe.</p>
                    <div className="my-4 grid grid-cols-3 gap-2 text-center bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                        {words.map((word, index) => (
                            <div key={index} className="font-mono text-slate-700 dark:text-slate-200">
                                <span className="text-xs text-slate-400">{index + 1}. </span>{word}
                            </div>
                        ))}
                    </div>
                    <label className="flex items-center space-x-3 mt-4 cursor-pointer">
                        <input type="checkbox" checked={isConfirmed} onChange={() => setIsConfirmed(!isConfirmed)} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-slate-700 dark:text-slate-200">I have written down my recovery phrase.</span>
                    </label>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={onConfirm} disabled={!isConfirmed} className="w-full sm:w-auto btn-press py-3 px-4 text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm font-medium disabled:bg-green-400 disabled:cursor-not-allowed">
                        Finish Setup
                    </button>
                    <button onClick={handleDownload} className="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3 px-4 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Phrase
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecoveryPhraseModal;