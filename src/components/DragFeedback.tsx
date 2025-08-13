'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface DragFeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

interface DragFeedbackProps {
  messages: DragFeedbackMessage[];
  onRemoveMessage: (id: string) => void;
}

export default function DragFeedback({ messages, onRemoveMessage }: DragFeedbackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {messages.map((msg) => (
        <FeedbackMessage
          key={msg.id}
          message={msg}
          onRemove={() => onRemoveMessage(msg.id)}
        />
      ))}
    </div>
  );
}

function FeedbackMessage({ 
  message, 
  onRemove 
}: { 
  message: DragFeedbackMessage; 
  onRemove: () => void; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-remove after duration
    const duration = message.duration || 4000;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [message.duration, onRemove]);

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-900/90 border-green-700';
      case 'error':
        return 'bg-red-900/90 border-red-700';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-700';
      default:
        return 'bg-slate-900/90 border-slate-700';
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        transform transition-all duration-300 ease-in-out max-w-sm
        ${getBackgroundColor()}
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      onClick={onRemove}
    >
      {getIcon()}
      <p className="text-sm text-white font-medium flex-1">
        {message.message}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExiting(true);
          setTimeout(onRemove, 300);
        }}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}