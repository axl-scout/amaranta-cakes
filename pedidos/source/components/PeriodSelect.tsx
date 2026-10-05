import React, { useEffect, useRef, useState } from 'react';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react';

export type Periodo = 'dia' | 'semana' | 'mes' | 'todos';
const OPCIONES: { v: Periodo; label: string }[] = [
  { v: 'dia', label: 'Día' }, { v: 'semana', label: 'Semana' }, { v: 'mes', label: 'Mes' }, { v: 'todos', label: 'Todos' },
];

/** Selector de periodo: muestra solo la opción elegida; se despliega con hover (escritorio), toque/clic o teclado. */
export function PeriodSelect({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<any>(null);
  const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;
  useEffect(() => {
    if (!open) return;
    const h = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  const pick = (v: Periodo) => { onChange(v); setOpen(false); };
  const cur = OPCIONES.find((o) => o.v === value) ?? OPCIONES[0]!;
  const openIt = () => { setActive(Math.max(0, OPCIONES.findIndex((o) => o.v === value))); setOpen(true); };
  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => { if (canHover()) openIt(); }} onMouseLeave={() => { if (canHover()) setOpen(false); }}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label="Periodo"
        onClick={() => (open ? setOpen(false) : openIt())}
        onKeyDown={(e: any) => {
          if (e.key === 'Escape') { setOpen(false); return; }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) openIt(); else setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : OPCIONES.length - 1)) % OPCIONES.length); }
          else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); pick(OPCIONES[active]!.v); }
        }}
        className="h-10 w-32 flex items-center justify-between gap-2 px-3 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-sans cursor-pointer">
        <span>{cur.label}</span>
        <CaretDownIcon size={13} className={'text-gray-400 transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-1 z-50 w-32">
          <ul role="listbox" className="bg-white border border-[#E9D9D9] rounded-xl shadow-lg overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
            {OPCIONES.map((o, i) => (
              <li key={o.v} role="option" aria-selected={o.v === value}>
                <button type="button" onClick={() => pick(o.v)} onMouseEnter={() => setActive(i)}
                  className={'w-full text-left px-3 h-10 text-sm font-sans cursor-pointer ' + (i === active ? 'bg-rose-50 dark:bg-white/5 ' : '') + (o.v === value ? 'font-semibold text-rose-600' : 'text-gray-700 dark:text-gray-200')}>
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
