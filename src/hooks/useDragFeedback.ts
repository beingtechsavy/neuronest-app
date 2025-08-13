'use client';

import { useState, useCallback } from 'react';
import { DragFeedbackMessage } from '../components/DragFeedback';

export function useDragFeedback() {
  const [messages, setMessages] = useState<DragFeedbackMessage[]>([]);

  const addMessage = useCallback((
    type: 'success' | 'error' | 'warning',
    message: string,
    duration?: number
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newMessage: DragFeedbackMessage = {
      id,
      type,
      message,
      duration: duration || 4000,
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    addMessage('success', message, duration);
  }, [addMessage]);

  const showError = useCallback((message: string, duration?: number) => {
    addMessage('error', message, duration);
  }, [addMessage]);

  const showWarning = useCallback((message: string, duration?: number) => {
    addMessage('warning', message, duration);
  }, [addMessage]);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    removeMessage,
    showSuccess,
    showError,
    showWarning,
    clearAll,
  };
}