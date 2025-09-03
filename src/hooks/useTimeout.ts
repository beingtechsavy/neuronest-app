import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) return;

    timeoutId.current = setTimeout(() => savedCallback.current(), delay);

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [delay]);

  // Clear timeout manually if needed
  const clearTimeoutManually = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  };

  return clearTimeoutManually;
}

/**
 * Hook for managing multiple timeouts with cleanup
 */
export function useTimeouts() {
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const addTimeout = (callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      callback();
      timeouts.current.delete(id);
    }, delay);
    
    timeouts.current.add(id);
    return id;
  };

  const clearTimeout = (id: NodeJS.Timeout) => {
    global.clearTimeout(id);
    timeouts.current.delete(id);
  };

  const clearAllTimeouts = () => {
    timeouts.current.forEach(id => global.clearTimeout(id));
    timeouts.current.clear();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  return { addTimeout, clearTimeout, clearAllTimeouts };
}