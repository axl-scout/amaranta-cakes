import { useEffect, useRef } from 'react';

type Entry = { id: number; fn: () => void };
const stack: Entry[] = [];
let nextId = 1;
let attached = false;

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || stack.length === 0) return;
  const top = stack[stack.length - 1]!;
  e.stopImmediatePropagation();
  top.fn();
}

/** Registers a layer that closes with Escape. Only the most recently opened (top) layer reacts to each Escape press. */
export function useEscClose(fn: () => void, enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    if (!attached) { window.addEventListener('keydown', onKey, true); attached = true; }
    const entry: Entry = { id: nextId++, fn: () => ref.current() };
    stack.push(entry);
    return () => { const i = stack.findIndex((x) => x.id === entry.id); if (i >= 0) stack.splice(i, 1); };
  }, [enabled]);
}
