export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isSafeLink(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'www.neuronest.work' || url.hostname === 'neuronest.work' || url.hostname === 'localhost');
  } catch { return false; }
}
