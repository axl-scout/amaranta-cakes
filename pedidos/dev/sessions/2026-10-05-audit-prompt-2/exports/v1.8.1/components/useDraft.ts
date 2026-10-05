import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Form state that survives closing the pop-up (and reloading the page): each value is kept in
 * localStorage under `draft:<formKey>:<field>` until the form is submitted and clearDraft(formKey) runs.
 * Pass formKey = null to behave like a normal useState (no persistence).
 */
export function useDraft<T>(formKey: string | null, field: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = formKey ? `draft:${formKey}:${field}` : null;
  const [value, setValue] = useState<T>(() => {
    if (!storageKey) return initial;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  const keyRef = useRef(storageKey);
  keyRef.current = storageKey;
  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
  }, [storageKey, value]);
  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v as any), []);
  return [value, set];
}

/** Forget every saved field of a form (call after a successful submit). */
export function clearDraft(formKey: string): void {
  try {
    const prefix = `draft:${formKey}:`;
    Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
