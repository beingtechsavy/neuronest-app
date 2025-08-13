/**
 * Comprehensive error handling utilities for drag-and-drop operations and general application errors
 * Addresses requirements 1.4, 3.4, 3.6, 4.5, 4.7 for proper error handling and user feedback
 */

import { CalendarTask, UserPreferences, TimeBlock } from '../app/calendar/page';

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  userId?: string;
  taskId?: number;
  additionalData?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResult {
  success: boolean;
  error?: string;
  validationErrors?: ValidationError[];
  canRetry: boolean;
  userMessage: string;
}

/**
 * Error types for categorizing different kinds of errors
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  DRAG_DROP = 'drag_drop',
  TIME_CALCULATION = 'time_calculation',
  USER_INPUT = 'user_input',
  SYSTEM = 'system'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Comprehensive error class for application errors
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly canRetry: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    canRetry: boolean = false,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.canRetry = canRetry;
    this.userMessage = userMessage || this.generateUserMessage();
    this.context = {
      operation: 'unknown',
      timestamp: new Date(),
      ...context
    };
  }

  private generateUserMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorType.DATABASE:
        return 'Unable to save changes. Please try again in a moment.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication required. Please log in and try again.';
      case ErrorType.DRAG_DROP:
        return 'Unable to move the task to this location. Please try a different time slot.';
      case ErrorType.TIME_CALCULATION:
        return 'Invalid time format. Please check the time and try again.';
      case ErrorType.USER_INPUT:
        return 'Invalid input provided. Please check your entries and try again.';
      case ErrorType.SYSTEM:
        return 'An unexpected error occurred. Please refresh the page and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

/**
 * Error handler for drag-and-drop operations
 */
export class DragDropErrorHandler {
  /**
   * Handle drag start errors
   */
  static handleDragStartError(error: Error, task: CalendarTask): ErrorResult {
    console.error('Drag start error:', error, { taskId: task.task_id, title: task.title });

    if (!task.start_time || !task.end_time) {
      return {
        success: false,
        error: 'Task has no time information',
        canRetry: false,
        userMessage: 'This task cannot be moved because it has no scheduled time.'
      };
    }

    if (error.message.includes('permission')) {
      return {
        success: false,
        error: 'Permission denied',
        canRetry: false,
        userMessage: 'You do not have permission to move this task.'
      };
    }

    return {
      success: false,
      error: 'Failed to start drag operation',
      canRetry: true,
      userMessage: 'Unable to start moving the task. Please try again.'
    };
  }

  /**
   * Handle drag end errors with detailed validation
   */
  static handleDragEndError(
    error: Error, 
    task: CalendarTask, 
    targetDate?: Date,
    newStartTime?: Date,
    newEndTime?: Date
  ): ErrorResult {
    const context: ErrorContext = {
      operation: 'drag_end',
      timestamp: new Date(),
      taskId: task.task_id,
      additionalData: {
        targetDate: targetDate?.toISOString(),
        newStartTime: newStartTime?.toISOString(),
        newEndTime: newEndTime?.toISOString()
      }
    };

    console.error('Drag end error:', error, context);

    // Handle specific error types
    if (error.message.includes('conflicts with')) {
      return {
        success: false,
        error: error.message,
        canRetry: true,
        userMessage: `Cannot move task: ${error.message}. Please choose a different time slot.`
      };
    }

    if (error.message.includes('span multiple days')) {
      return {
        success: false,
        error: 'Task spans multiple days',
        canRetry: true,
        userMessage: 'Tasks cannot span multiple days. Please choose a shorter time slot.'
      };
    }

    if (error.message.includes('invalid time')) {
      return {
        success: false,
        error: 'Invalid time calculation',
        canRetry: true,
        userMessage: 'Invalid time detected. Please try moving to a different time slot.'
      };
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error during drag operation',
        canRetry: true,
        userMessage: 'Network error. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: 'Drag operation failed',
      canRetry: true,
      userMessage: 'Unable to move the task. Please try again or refresh the page.'
    };
  }

  /**
   * Handle time slot validation errors
   */
  static handleTimeSlotValidationError(
    startTime: Date,
    endTime: Date,
    conflicts: Array<{ start: number; end: number; type: string }>
  ): ErrorResult {
    const validationErrors: ValidationError[] = [];

    // Check for basic time validation
    if (startTime >= endTime) {
      validationErrors.push({
        field: 'time_range',
        message: 'Start time must be before end time',
        code: 'INVALID_TIME_ORDER'
      });
    }

    // Check for conflicts
    if (conflicts.length > 0) {
      const conflictTypes = [...new Set(conflicts.map(c => c.type))];
      const conflictMessage = conflictTypes.length === 1 
        ? `Conflicts with ${conflictTypes[0]}`
        : `Conflicts with ${conflictTypes.join(', ')}`;

      validationErrors.push({
        field: 'time_slot',
        message: conflictMessage,
        code: 'TIME_SLOT_CONFLICT'
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Time slot validation failed',
        validationErrors,
        canRetry: true,
        userMessage: validationErrors.map(e => e.message).join('. ')
      };
    }

    return {
      success: true,
      canRetry: false,
      userMessage: 'Time slot is valid'
    };
  }
}

/**
 * Error handler for stress marking operations
 */
export class StressMarkingErrorHandler {
  /**
   * Handle stress toggle errors
   */
  static handleStressToggleError(
    error: Error,
    taskId: number,
    newStressStatus: boolean
  ): ErrorResult {
    const context: ErrorContext = {
      operation: 'stress_toggle',
      timestamp: new Date(),
      taskId,
      additionalData: { newStressStatus }
    };

    console.error('Stress toggle error:', error, context);

    if (error.message.includes('auth') || error.message.includes('permission')) {
      return {
        success: false,
        error: 'Authentication error',
        canRetry: false,
        userMessage: 'You are not authorized to modify this task. Please log in and try again.'
      };
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error',
        canRetry: true,
        userMessage: 'Network error. Your changes were not saved. Please try again.'
      };
    }

    if (error.message.includes('database') || error.message.includes('constraint')) {
      return {
        success: false,
        error: 'Database error',
        canRetry: true,
        userMessage: 'Unable to save changes to the database. Please try again.'
      };
    }

    return {
      success: false,
      error: 'Stress toggle failed',
      canRetry: true,
      userMessage: 'Unable to update task stress status. Please try again.'
    };
  }
}

/**
 * Error handler for authentication operations
 */
export class AuthErrorHandler {
  /**
   * Handle signup confirmation errors
   */
  static handleSignupConfirmationError(error: Error): ErrorResult {
    console.error('Signup confirmation error:', error);

    if (error.message.includes('invalid_request')) {
      return {
        success: false,
        error: 'Invalid confirmation link',
        canRetry: false,
        userMessage: 'This confirmation link is invalid or has expired. Please request a new confirmation email.'
      };
    }

    if (error.message.includes('expired')) {
      return {
        success: false,
        error: 'Confirmation link expired',
        canRetry: false,
        userMessage: 'This confirmation link has expired. Please request a new confirmation email.'
      };
    }

    if (error.message.includes('already_confirmed')) {
      return {
        success: false,
        error: 'Email already confirmed',
        canRetry: false,
        userMessage: 'Your email has already been confirmed. You can now log in.'
      };
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error',
        canRetry: true,
        userMessage: 'Network error during confirmation. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: 'Confirmation failed',
      canRetry: true,
      userMessage: 'Email confirmation failed. Please try again or contact support.'
    };
  }

  /**
   * Handle redirect URL errors
   */
  static handleRedirectUrlError(error: Error, url?: string): ErrorResult {
    console.error('Redirect URL error:', error, { url });

    if (error.message.includes('invalid_url')) {
      return {
        success: false,
        error: 'Invalid redirect URL',
        canRetry: false,
        userMessage: 'Invalid redirect URL configuration. Please contact support.'
      };
    }

    if (error.message.includes('localhost') && process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Localhost redirect in production',
        canRetry: false,
        userMessage: 'Configuration error: localhost redirect detected in production environment.'
      };
    }

    return {
      success: false,
      error: 'Redirect configuration error',
      canRetry: false,
      userMessage: 'Redirect configuration error. Please contact support.'
    };
  }
}

/**
 * General error handler for application-wide errors
 */
export class GeneralErrorHandler {
  /**
   * Handle network errors
   */
  static handleNetworkError(error: Error, operation: string): ErrorResult {
    console.error(`Network error during ${operation}:`, error);

    if (error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network request failed',
        canRetry: true,
        userMessage: 'Network connection issue. Please check your internet connection and try again.'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Request timeout',
        canRetry: true,
        userMessage: 'Request timed out. Please try again.'
      };
    }

    if (error.message.includes('CORS')) {
      return {
        success: false,
        error: 'CORS error',
        canRetry: false,
        userMessage: 'Configuration error. Please contact support.'
      };
    }

    return {
      success: false,
      error: 'Network error',
      canRetry: true,
      userMessage: 'Network error occurred. Please try again.'
    };
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: Error, operation: string): ErrorResult {
    console.error(`Database error during ${operation}:`, error);

    if (error.message.includes('constraint')) {
      return {
        success: false,
        error: 'Database constraint violation',
        canRetry: false,
        userMessage: 'Data validation error. Please check your input and try again.'
      };
    }

    if (error.message.includes('permission') || error.message.includes('auth')) {
      return {
        success: false,
        error: 'Database permission error',
        canRetry: false,
        userMessage: 'You do not have permission to perform this action. Please log in and try again.'
      };
    }

    if (error.message.includes('connection')) {
      return {
        success: false,
        error: 'Database connection error',
        canRetry: true,
        userMessage: 'Unable to connect to the database. Please try again in a moment.'
      };
    }

    return {
      success: false,
      error: 'Database error',
      canRetry: true,
      userMessage: 'Database error occurred. Please try again.'
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(
    validationErrors: ValidationError[],
    operation: string
  ): ErrorResult {
    console.error(`Validation error during ${operation}:`, validationErrors);

    const errorMessages = validationErrors.map(err => err.message);
    const userMessage = errorMessages.length === 1 
      ? errorMessages[0]
      : `Multiple validation errors: ${errorMessages.join(', ')}`;

    return {
      success: false,
      error: 'Validation failed',
      validationErrors,
      canRetry: false,
      userMessage
    };
  }
}

/**
 * Error boundary utility functions
 */
export class ErrorBoundaryUtils {
  /**
   * Log error with context for debugging
   */
  static logError(error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: context || {
        operation: 'unknown',
        timestamp: new Date()
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };

    console.error('Error Boundary caught error:', errorData);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureError(errorData);
    }
  }

  /**
   * Generate user-friendly error message based on error type
   */
  static generateUserMessage(error: Error): string {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'The application has been updated. Please refresh the page to continue.';
    }

    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (error.message.includes('drag') || error.message.includes('drop')) {
      return 'An error occurred during the drag and drop operation. Please try again or refresh the page.';
    }

    if (error.message.includes('auth') || error.message.includes('permission')) {
      return 'Authentication error. Please log in and try again.';
    }

    if (error.message.includes('database') || error.message.includes('supabase')) {
      return 'Database connection issue. Please try again in a moment.';
    }

    return 'An unexpected error occurred. Please refresh the page and try again.';
  }

  /**
   * Determine if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    // Non-recoverable errors
    const nonRecoverablePatterns = [
      'ChunkLoadError',
      'Loading chunk',
      'Module not found',
      'Syntax error',
      'ReferenceError',
      'TypeError: Cannot read property'
    ];

    return !nonRecoverablePatterns.some(pattern => 
      error.message.includes(pattern) || error.stack?.includes(pattern)
    );
  }
}

/**
 * Comprehensive error handler that routes errors to appropriate handlers
 */
export function handleError(
  error: Error,
  context: Partial<ErrorContext> = {},
  errorInfo?: React.ErrorInfo
): ErrorResult {
  const fullContext: ErrorContext = {
    operation: 'unknown',
    timestamp: new Date(),
    ...context
  };

  // Log error if it's from an error boundary
  if (errorInfo) {
    ErrorBoundaryUtils.logError(error, errorInfo, fullContext);
  }

  // Route to appropriate handler based on error type and context
  if (fullContext.operation.includes('drag') || fullContext.operation.includes('drop')) {
    return DragDropErrorHandler.handleDragEndError(error, {} as CalendarTask);
  }

  if (fullContext.operation.includes('stress')) {
    return StressMarkingErrorHandler.handleStressToggleError(error, 0, false);
  }

  if (fullContext.operation.includes('auth') || fullContext.operation.includes('signup')) {
    return AuthErrorHandler.handleSignupConfirmationError(error);
  }

  if (error.message.includes('network') || error.message.includes('fetch')) {
    return GeneralErrorHandler.handleNetworkError(error, fullContext.operation);
  }

  if (error.message.includes('database') || error.message.includes('supabase')) {
    return GeneralErrorHandler.handleDatabaseError(error, fullContext.operation);
  }

  // Default error handling
  return {
    success: false,
    error: error.message,
    canRetry: ErrorBoundaryUtils.isRecoverable(error),
    userMessage: ErrorBoundaryUtils.generateUserMessage(error)
  };
}

/**
 * Validation utilities for common input types
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationError | null {
    if (!email || typeof email !== 'string') {
      return {
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'INVALID_FORMAT'
      };
    }

    return null;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationError | null {
    if (!password || typeof password !== 'string') {
      return {
        field: 'password',
        message: 'Password is required',
        code: 'REQUIRED'
      };
    }

    if (password.length < 6) {
      return {
        field: 'password',
        message: 'Password must be at least 6 characters long',
        code: 'TOO_SHORT'
      };
    }

    if (password.length > 128) {
      return {
        field: 'password',
        message: 'Password must be less than 128 characters',
        code: 'TOO_LONG'
      };
    }

    return null;
  }

  /**
   * Validate task title
   */
  static validateTaskTitle(title: string): ValidationError | null {
    if (!title || typeof title !== 'string') {
      return {
        field: 'title',
        message: 'Task title is required',
        code: 'REQUIRED'
      };
    }

    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return {
        field: 'title',
        message: 'Task title cannot be empty',
        code: 'EMPTY'
      };
    }

    if (trimmed.length > 200) {
      return {
        field: 'title',
        message: 'Task title must be less than 200 characters',
        code: 'TOO_LONG'
      };
    }

    return null;
  }

  /**
   * Validate time format
   */
  static validateTimeFormat(time: string): ValidationError | null {
    if (!time || typeof time !== 'string') {
      return {
        field: 'time',
        message: 'Time is required',
        code: 'REQUIRED'
      };
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time.trim())) {
      return {
        field: 'time',
        message: 'Please enter time in HH:MM format (24-hour)',
        code: 'INVALID_FORMAT'
      };
    }

    return null;
  }

  /**
   * Validate date format
   */
  static validateDateFormat(date: string): ValidationError | null {
    if (!date || typeof date !== 'string') {
      return {
        field: 'date',
        message: 'Date is required',
        code: 'REQUIRED'
      };
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return {
        field: 'date',
        message: 'Please enter a valid date',
        code: 'INVALID_FORMAT'
      };
    }

    return null;
  }
}

/**
 * Form validation helper
 */
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, (value: any) => ValidationError | null>
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}