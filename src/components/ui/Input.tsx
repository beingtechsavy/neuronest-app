'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * The one input shape.
 *
 * Exported because the password fields on the auth pages need a trailing
 * show/hide button, which cannot be expressed through `<Input>`'s props. Those
 * four pages previously each kept a private copy of these classes, which is how
 * login ended up with 8px control text while the rest of the app used 12px.
 */
export const fieldClass =
  'w-full px-4 py-3.5 bg-[#1E1F22] border border-[#3F4147] rounded-xl ' +
  'text-[#F2F3F5] placeholder:text-[#6E747B] text-base ' +
  'transition-colors duration-150 ' +
  'focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const field = fieldClass;

type BaseFieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

/**
 * Labelled input. The label is wired to the control by id so screen readers get
 * a real association; previously most inline `styles.input` fields had either
 * an unwired `<label>` or none at all.
 */
export function Input({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  ...rest
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-[#DBDEE1]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(field, error && 'border-[#ED4245] focus:border-[#ED4245] focus:ring-[#ED4245]', className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[#949BA4]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[#FF6B6B]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  ...rest
}: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-[#DBDEE1]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(field, 'resize-y min-h-[120px]', error && 'border-[#ED4245]', className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[#949BA4]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[#FF6B6B]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  children,
  ...rest
}: BaseFieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-[#DBDEE1]">
          {label}
        </label>
      )}
      <select id={inputId} className={cn(field, 'appearance-none', className)} {...rest}>
        {children}
      </select>
      {hint && (
        <p className="mt-1.5 text-sm text-[#949BA4]">{hint}</p>
      )}
    </div>
  );
}
