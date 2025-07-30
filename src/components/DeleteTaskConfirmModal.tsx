'use client'

interface DeleteTaskConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    taskTitle: string | null;
}

export default function DeleteTaskConfirmModal({ isOpen, onClose, onConfirm, taskTitle }: DeleteTaskConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-2">Confirm Deletion</h2>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to permanently delete the task: <strong className="text-purple-400">{taskTitle || 'this task'}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Delete Task
                    </button>
                </div>
            </div>
        </div>
    );
}
