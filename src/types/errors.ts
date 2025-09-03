// Error types for better type safety

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

export function getErrorMessage(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}