'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ValidationError } from '../lib/errorHandling';

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  onDismiss?: () => void;
  className?: string;
  showDismiss?: boolean;
}

/**
 * Component for displaying validation errors in a user-friendly format
 * Addresses requirements for user-friendly error messages
 */
export default function ValidationErrorDisplay({
  errors,
  onDismiss,
  className = '',
  showDismiss = true
}: ValidationErrorDisplayProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-900/20 border border-red-700/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-400 mb-2">
            {errors.length === 1 ? 'Validation Error' : 'Validation Errors'}
          </h3>
          
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={`${error.field}-${error.code}-${index}`} className="text-sm text-red-300">
                {error.field && (
                  <span className="font-medium capitalize">
                    {error.field.replace(/_/g, ' ')}:
                  </span>
                )}{' '}
                {error.message}
              </div>
            ))}
          </div>
        </div>

        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
            aria-label="Dismiss errors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing validation errors
 */
export function useValidationErrors() {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const addError = React.useCallback((error: ValidationError) => {
    setErrors(prev => {
      // Remove existing error for the same field
      const filtered = prev.filter(e => e.field !== error.field || e.code !== error.code);
      return [...filtered, error];
    });
  }, []);

  const addErrors = React.useCallback((newErrors: ValidationError[]) => {
    setErrors(prev => {
      // Remove existing errors for the same fields
      const existingFields = new Set(newErrors.map(e => `${e.field}-${e.code}`));
      const filtered = prev.filter(e => !existingFields.has(`${e.field}-${e.code}`));
      return [...filtered, ...newErrors];
    });
  }, []);

  const removeError = React.useCallback((field: string, code?: string) => {
    setErrors(prev => prev.filter(e => 
      e.field !== field || (code && e.code !== code)
    ));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;
  const getFieldError = React.useCallback((field: string) => {
    return errors.find(e => e.field === field);
  }, [errors]);

  return {
    errors,
    addError,
    addErrors,
    removeError,
    clearErrors,
    hasErrors,
    getFieldError
  };
}