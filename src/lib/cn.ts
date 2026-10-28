/**
 * Minimal className joiner. Kept dependency-free because the app has no
 * clsx/tailwind-merge and the UI kit only needs conditional joining, not
 * conflict resolution (our primitives own their own class order).
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(' ');
}
