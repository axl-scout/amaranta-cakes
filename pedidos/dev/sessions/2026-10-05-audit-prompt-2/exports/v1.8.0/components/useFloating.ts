import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Positions a popup with `position: fixed` next to its anchor so it is never clipped by scrolling
 * containers or sticky footers. Opens below by default and flips above when there isn't room.
 */
export function useFloating(
  getAnchor: () => HTMLElement | null | undefined,
  popupRef: RefObject<HTMLElement | null>,
  open: boolean,
  opts: { align?: 'left' | 'right' | 'center'; matchWidth?: boolean; gap?: number } = {},
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' });
  useLayoutEffect(() => {
    if (!open) return;
    const gap = opts.gap ?? 4;
    const update = () => {
      const a = getAnchor()?.getBoundingClientRect();
      const p = popupRef.current;
      if (!a || !p) return;
      const h = p.offsetHeight;
      const w = opts.matchWidth ? a.width : p.offsetWidth;
      const vh = window.innerHeight, vw = window.innerWidth;
      const below = vh - a.bottom - gap - 8;
      const above = a.top - gap - 8;
      let top = below >= h || below >= above ? a.bottom + gap : a.top - gap - h;
      top = Math.max(8, Math.min(top, vh - h - 8));
      let left = opts.align === 'right' ? a.right - w : opts.align === 'center' ? a.left + a.width / 2 - w / 2 : a.left;
      left = Math.max(8, Math.min(left, vw - w - 8));
      setStyle({ position: 'fixed', top, left, width: opts.matchWidth ? a.width : undefined, zIndex: 200 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return style;
}
