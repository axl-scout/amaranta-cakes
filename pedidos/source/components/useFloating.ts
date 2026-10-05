import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Positions a popup with `position: fixed` next to its anchor so it is never clipped by scrolling
 * containers or sticky footers. Opens below by default and flips above when there isn't room.
 */
export function useFloating(
  getAnchor: () => HTMLElement | null | undefined,
  popupRef: RefObject<HTMLElement | null>,
  open: boolean,
  opts: { align?: 'left' | 'right' | 'center'; matchWidth?: boolean; gap?: number; maxHeight?: number; minWidth?: number } = {},
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' });
  useLayoutEffect(() => {
    if (!open) return;
    const gap = opts.gap ?? 4;
    const update = () => {
      const a = getAnchor()?.getBoundingClientRect();
      const p = popupRef.current;
      if (!a || !p) return;
      // Natural height (ignoring any limit we applied before), capped by the caller's own maximum.
      const prev = p.style.maxHeight; p.style.maxHeight = 'none';
      const h = Math.min(p.offsetHeight, opts.maxHeight ?? Infinity);
      p.style.maxHeight = prev;
      const w = opts.matchWidth ? Math.max(a.width, opts.minWidth ?? 0) : p.offsetWidth;
      const vh = window.innerHeight, vw = window.innerWidth;
      const below = vh - a.bottom - gap - 8;
      const above = a.top - gap - 8;
      // Fits below -> below. Else fits above -> above. Else the side with more room, with a limited height (inner scroll).
      const side = below >= h ? 'below' : above >= h ? 'above' : below >= above ? 'below' : 'above';
      const room = side === 'below' ? below : above;
      const limited = h > room;
      const height = limited ? Math.max(80, room) : h;
      const top = side === 'below' ? a.bottom + gap : Math.max(8, a.top - gap - height);
      let left = opts.align === 'right' ? a.right - w : opts.align === 'center' ? a.left + a.width / 2 - w / 2 : a.left;
      left = Math.max(8, Math.min(left, vw - w - 8));
      setStyle({ position: 'fixed', top, left, width: opts.matchWidth ? w : undefined, zIndex: 200, maxHeight: limited ? height : opts.maxHeight, overflowY: limited || opts.maxHeight ? 'auto' : undefined });
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' && popupRef.current ? new ResizeObserver(update) : null;
    if (ro && popupRef.current) ro.observe(popupRef.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { ro?.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return style;
}
