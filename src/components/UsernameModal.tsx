'use client'

import { useState } from 'react';

interface UsernameModalProps {
    isOpen: boolean;
    onSave: (username: string) => Promise<void>;
    loading: boolean;
}

export default function UsernameModal({ isOpen, onSave, loading }: UsernameModalProps) {
    const [username, setUsername] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim().length >= 3) {
            onSave(username.trim());
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2 style={styles.header}>Welcome to NeuroNest!</h2>
                <p style={styles.subHeader}>Let's get started by setting up your username.</p>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="username" style={styles.label}>Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            placeholder="e.g., thalia_grace"
                            autoFocus
                        />
                         <p style={styles.inputHelper}>Must be at least 3 characters long.</p>
                    </div>
                    <div style={styles.buttonGroup}>
                        <button type="submit" style={styles.saveButton} disabled={loading || username.trim().length < 3}>
                            {loading ? 'Saving...' : 'Save and Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5000, backdropFilter: 'blur(8px)',
    },
    modal: {
        background: '#1e293b', padding: '2rem', borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        width: '100%', maxWidth: '450px', border: '1px solid #334155',
        textAlign: 'center',
    },
    header: {
        color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 'bold',
        marginBottom: '0.5rem',
    },
    subHeader: {
        color: '#94a3b8',
        marginBottom: '2rem',
    },
    inputGroup: { marginBottom: '1.5rem', textAlign: 'left' },
    label: {
        display: 'block', color: '#cbd5e1',
        marginBottom: '0.5rem', fontSize: '0.875rem',
    },
    input: {
        width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
        backgroundColor: '#334155', border: '1px solid #475569',
        color: '#f1f5f9', fontSize: '1rem', outline: 'none',
        boxSizing: 'border-box', transition: 'border-color 0.2s',
    },
    inputHelper: {
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '0.5rem',
    },
    buttonGroup: {
        display: 'flex', justifyContent: 'center',
    },
    saveButton: {
        width: '100%',
        padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
        backgroundColor: '#4f46e5', color: 'white', fontWeight: '600',
        cursor: 'pointer', transition: 'background-color 0.2s',
    },
};
