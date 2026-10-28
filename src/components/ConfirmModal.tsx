'use client';

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button, IconBadge, Modal, ModalActions } from '@/components/ui';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Generic confirmation dialog.
 *
 * The three variants previously differed only by button fill (red / yellow /
 * teal), so a destructive confirm and an informational one looked the same at a
 * glance. The tone now shows in an icon badge as well, which is the cue people
 * actually scan — and the warning/info buttons use the standard secondary shape
 * instead of a yellow fill that failed contrast against white text.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const tones = {
    danger: { badge: 'danger' as const, icon: <ShieldAlert size={20} aria-hidden="true" />, button: 'danger' as const },
    warning: { badge: 'warning' as const, icon: <AlertTriangle size={20} aria-hidden="true" />, button: 'primary' as const },
    info: { badge: 'brand' as const, icon: <Info size={20} aria-hidden="true" />, button: 'primary' as const },
  };

  const tone = tones[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mb-6 flex gap-3.5">
        <IconBadge tone={tone.badge} size="md">
          {tone.icon}
        </IconBadge>
        <p className="pt-1 text-sm leading-relaxed text-[#DBDEE1]">{message}</p>
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={tone.button}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </ModalActions>
    </Modal>
  );
}
