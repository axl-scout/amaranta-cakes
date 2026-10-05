import { useEffect, useRef, useState } from 'react';
import { useEscClose } from './escStack';

/**
 * Shared keyboard behavior for every dropdown: ArrowUp/Down moves the highlight (wraps), Enter picks it,
 * Escape closes (only this layer). The highlight also follows the mouse and the list keeps it visible.
 * Mark each option with data-idx={i}; attach `onKeyDown` to a wrapper that contains the trigger/search input.
 */
export function useListNav({ open, count, initial = 0, onPick, onClose }: {
  open: boolean; count: number; initial?: number; onPick: (i: number) => void; onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const listRef = useRef<any>(null);
  useEscClose(onClose, open);
  useEffect(() => { if (open) setActive(Math.max(0, Math.min(initial, count - 1))); }, [open]); // eslint-disable-line
  useEffect(() => { if (active >= count) setActive(Math.max(0, count - 1)); }, [count]); // eslint-disable-line
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);
  const onKeyDown = (e: any) => {
    if (!open) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (count === 0) return;
      e.preventDefault();
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % count : (a - 1 + count) % count));
    } else if (e.key === 'Enter') {
      if (count === 0) return;
      e.preventDefault();
      onPick(Math.min(active, count - 1));
    }
  };
  return { active, setActive, listRef, onKeyDown };
}

export const ACTIVE_ROW = 'bg-gray-50 dark:bg-white/5';
