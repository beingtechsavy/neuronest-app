'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useTimeouts } from '@/hooks/useTimeout';
import { IconBadge } from '@/components/ui';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

// Toasts used to be fully saturated fills (#1E8E4E, #DA373C, #E8D14F). The
// yellow one put near-white text on a bright field, which fails contrast, and
// all three read as an alarm rather than a note. One surface, one accent edge.
const tone = {
  success: { badge: 'success', edge: 'border-l-[#23A55A]' },
  error: { badge: 'danger', edge: 'border-l-[#ED4245]' },
  warning: { badge: 'warning', edge: 'border-l-[#E8A33D]' },
} as const;

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
} as const;

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addTimeout } = useTimeouts();

  useEffect(() => {
    setIsVisible(true);

    addTimeout(() => {
      setIsVisible(false);
      addTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
  }, [toast.id, toast.duration, onRemove, addTimeout]);

  const Icon = icons[toast.type];

  return (
    <div
      role="status"
      className={[
        'flex w-full max-w-sm items-start gap-3 rounded-xl border border-[#383A40] border-l-4',
        tone[toast.type].edge,
        'bg-[#2B2D31] p-3.5 shadow-xl shadow-black/40',
        'transition-opacity duration-200 ease-out motion-reduce:transition-none',
        isVisible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <IconBadge tone={tone[toast.type].badge} size="sm">
        <Icon size={16} />
      </IconBadge>
      <p className="min-w-0 flex-1 pt-1 text-sm text-[#DBDEE1]">{toast.message}</p>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        aria-label="Dismiss notification"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5]"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed right-4 top-4 z-[2500] flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
