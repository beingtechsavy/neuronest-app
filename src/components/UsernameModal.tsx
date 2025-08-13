// 'use client'

// import { useState } from 'react';

// interface UsernameModalProps {
//     isOpen: boolean;
//     onSave: (username: string) => Promise<void>;
//     loading: boolean;
// }

// export default function UsernameModal({ isOpen, onSave, loading }: UsernameModalProps) {
//     const [username, setUsername] = useState('');

//     if (!isOpen) return null;

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (username.trim().length >= 3) {
//             onSave(username.trim());
//         }
//     };

//     return (
//         <div style={styles.overlay}>
//             <div style={styles.modal}>
//                 <h2 style={styles.header}>Welcome to NeuroNest!</h2>
//                 {/* ***** FIX: Replaced ' with &apos; to fix linting error ***** */}
//                 <p style={styles.subHeader}>Let&apos;s get started by setting up your username.</p>
//                 <form onSubmit={handleSubmit}>
//                     <div style={styles.inputGroup}>
//                         <label htmlFor="username" style={styles.label}>Username</label>
//                         <input
//                             id="username"
//                             type="text"
//                             value={username}
//                             onChange={(e) => setUsername(e.target.value)}
//                             style={styles.input}
//                             placeholder="e.g., thalia_grace"
//                             autoFocus
//                         />
//                          <p style={styles.inputHelper}>Must be at least 3 characters long.</p>
//                     </div>
//                     <div style={styles.buttonGroup}>
//                         <button type="submit" style={styles.saveButton} disabled={loading || username.trim().length < 3}>
//                             {loading ? 'Saving...' : 'Save and Continue'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//     overlay: {
//         position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
//         backgroundColor: 'rgba(15, 23, 42, 0.9)',
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         zIndex: 5000, backdropFilter: 'blur(8px)',
//     },
//     modal: {
//         background: '#1e293b', padding: '2rem', borderRadius: '16px',
//         boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
//         width: '100%', maxWidth: '450px', border: '1px solid #334155',
//         textAlign: 'center',
//     },
//     header: {
//         color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 'bold',
//         marginBottom: '0.5rem',
//     },
//     subHeader: {
//         color: '#94a3b8',
//         marginBottom: '2rem',
//     },
//     inputGroup: { marginBottom: '1.5rem', textAlign: 'left' },
//     label: {
//         display: 'block', color: '#cbd5e1',
//         marginBottom: '0.5rem', fontSize: '0.875rem',
//     },
//     input: {
//         width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
//         backgroundColor: '#334155', border: '1px solid #475569',
//         color: '#f1f5f9', fontSize: '1rem', outline: 'none',
//         boxSizing: 'border-box', transition: 'border-color 0.2s',
//     },
//     inputHelper: {
//         fontSize: '0.75rem',
//         color: '#64748b',
//         marginTop: '0.5rem',
//     },
//     buttonGroup: {
//         display: 'flex', justifyContent: 'center',
//     },
//     saveButton: {
//         width: '100%',
//         padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
//         backgroundColor: '#4f46e5', color: 'white', fontWeight: '600',
//         cursor: 'pointer', transition: 'background-color 0.2s',
//     },
// };




'use client';

import React, { useState } from 'react';
import { BrainCircuit, User, ArrowRight, Loader2 } from 'lucide-react';

interface UsernameModalProps {
    isOpen: boolean;
    onSave: (username: string) => Promise<any>;
    loading: boolean;
}

export default function UsernameModal({ isOpen, onSave, loading }: UsernameModalProps) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (username.trim().length < 3) {
            setError("Username must be at least 3 characters long.");
            return;
        }
        try {
            await onSave(username.trim());
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md text-center p-8">
                <div className="flex justify-center mb-4">
                    <BrainCircuit size={40} className="text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to NeuroNest!</h2>
                <p className="text-slate-400 mb-8">Let's get started by setting up your username.</p>
                <form onSubmit={handleSubmit}>
                    <div className="relative mb-4 text-left">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="e.g., neuro_ninja"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Must be at least 3 characters long.</p>
                    </div>
                    
                    {error && <p className="text-red-400 text-sm my-4">{error}</p>}

                    <button 
                        type="submit" 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || username.trim().length < 3}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>Save and Continue</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}