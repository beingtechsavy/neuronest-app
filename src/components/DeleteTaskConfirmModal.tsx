'use client'

import { Trash2 } from 'lucide-react'
import { Button, Modal, ModalActions } from '@/components/ui'

interface DeleteTaskConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    taskTitle: string | null;
}

export default function DeleteTaskConfirmModal({ isOpen, onClose, onConfirm, taskTitle }: DeleteTaskConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete this task?" size="sm">
            <p className="mb-6 text-sm leading-relaxed text-[#DBDEE1]">
                <strong className="font-semibold text-[#F2F3F5]">{taskTitle || 'This task'}</strong>{' '}
                will be permanently removed. Your completed history is not affected.
            </p>
            <ModalActions>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>
                    <Trash2 size={16} aria-hidden="true" />
                    Delete task
                </Button>
            </ModalActions>
        </Modal>
    );
}
