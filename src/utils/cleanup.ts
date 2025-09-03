/**
 * Cleanup utilities for preventing memory leaks and improving performance
 */

/**
 * Safely removes event listeners
 */
export function removeEventListener(
  element: Element | Window | Document,
  event: string,
  handler: EventListener
) {
  try {
    element.removeEventListener(event, handler);
  } catch (error) {
    console.warn('Failed to remove event listener:', error);
  }
}

/**
 * Safely clears timeouts
 */
export function clearTimeoutSafe(timeoutId: NodeJS.Timeout | null) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

/**
 * Safely clears intervals
 */
export function clearIntervalSafe(intervalId: NodeJS.Timeout | null) {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

/**
 * Cleanup function for component unmounting
 */
export function createCleanupFunction(cleanupTasks: (() => void)[]) {
  return () => {
    cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
  };
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}