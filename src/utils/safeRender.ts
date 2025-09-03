// Utility functions to prevent crashes during rendering

export function safeMap<T, R>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => R
): R[] {
  if (!Array.isArray(array)) {
    return [];
  }
  
  return array
    .filter(item => item != null) // Remove null/undefined items
    .map(callback);
}

export function safeFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  
  return array.filter(item => item != null && predicate(item));
}

export function safeFind<T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean
): T | undefined {
  if (!Array.isArray(array)) {
    return undefined;
  }
  
  return array.find(item => item != null && predicate(item));
}

export function safeLength(array: unknown[] | null | undefined): number {
  return Array.isArray(array) ? array.length : 0;
}