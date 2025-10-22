import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [currentResolve, setCurrentResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentResolve(() => resolve);
      setConfirmState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          setCurrentResolve(null);
        },
      });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    if (currentResolve) {
      currentResolve(false);
      setCurrentResolve(null);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, [currentResolve]);

  return {
    confirm,
    confirmState,
    closeConfirm,
  };
}