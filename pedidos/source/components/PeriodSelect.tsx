import React, { useEffect, useRef, useState } from 'react';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react';

export type Periodo = 'dia' | 'semana' | 'mes' | 'todos';
const OPCIONES: { v: Periodo; label: string }[] = [
  { v: 'dia', label: 'Día' }, { v: 'semana', label: 'Semana' }, { v: 'mes', label: 'Mes' }, { v: 'todos', label: 'Todos' },
];
const W = 5; // rem por opción

/**
 * Interruptor de periodo: contraído muestra solo la opción elegida; al pasar el cursor (o con un toque / teclado)
 * se expande y muestra el interruptor completo; al elegir una vuelve a contraerse.
 */
function PeriodSwitch({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  const [open, setOpen] = useState(false);
  const idx = Math.max(0, OPCIONES.findIndex((o) => o.v === value));
  const [active, setActive] = useState(idx);
  const ref = useRef<any>(null);
  const canHover = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover)').matches;
  useEffect(() => {
    if (!open) return;
    const h = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  const openIt = () => { setActive(idx); setOpen(true); };
  const pick = (v: Periodo) => { onChange(v); setOpen(false); };

  return (
    <div ref={ref} className="relative h-10" style={{ width: `calc(${W}rem + 6px)` }}
      onMouseEnter={() => { if (canHover()) openIt(); }} onMouseLeave={() => { if (canHover()) setOpen(false); }}>
      <div role="listbox" tabIndex={0} aria-label="Periodo" aria-expanded={open} aria-activedescendant={`periodo-${OPCIONES[open ? active : idx]!.v}`}
        onClick={() => { if (!open) openIt(); }}
        onKeyDown={(e: any) => {
          if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } return; }
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (!open) openIt(); else setActive((i) => Math.min(OPCIONES.length - 1, i + 1)); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) openIt(); else setActive((i) => Math.max(0, i - 1)); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (open) pick(OPCIONES[active]!.v); else openIt(); }
        }}
        className={`absolute top-0 left-0 lg:left-auto lg:right-0 h-10 overflow-hidden rounded-xl border border-gray-300 dark:border-[#2E352C] p-0.5 bg-white dark:bg-[#251D1F] transition-[width] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${open ? 'z-50 shadow-lg' : ''}`}
        style={{ width: open ? `calc(${W * OPCIONES.length}rem + 6px)` : `calc(${W}rem + 6px)` }}>
        <div className="relative h-full flex transition-transform duration-200 ease-out" style={{ transform: open ? 'translateX(0)' : `translateX(-${idx * W}rem)`, width: `${W * OPCIONES.length}rem` }}>
          <div className="absolute top-0 bottom-0 left-0 rounded-[0.6rem] bg-rose-600 transition-transform duration-200 ease-out"
            style={{ width: `${W}rem`, transform: `translateX(${idx * 100}%)` }} />
          {OPCIONES.map((o, i) => (
            <button key={o.v} id={`periodo-${o.v}`} type="button" role="option" aria-selected={o.v === value} tabIndex={-1}
              onClick={(e: any) => { if (open) { e.stopPropagation(); pick(o.v); } }}
              onMouseEnter={() => open && setActive(i)}
              className={`relative z-10 h-full flex-shrink-0 flex items-center justify-center text-sm font-medium transition-colors font-sans whitespace-nowrap rounded-[0.6rem] ${o.v === value ? 'text-white' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'} ${open && i === active && o.v !== value ? 'bg-rose-50 dark:bg-white/10' : ''}`}
              style={{ width: `${W}rem` }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Celular: lista desplegable que muestra solo la opción elegida con una flecha. */
function PeriodDropdown({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  const actual = OPCIONES.find((o) => o.v === value) ?? OPCIONES[0]!;
  return (
    <div ref={ref} className="relative h-10">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label="Periodo"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e: any) => { if (e.key === 'Escape') setOpen(false); }}
        className="h-10 px-3 flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-200">
        <span>{actual.label}</span>
        <CaretDownIcon size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full mt-1 z-50 min-w-full w-32 bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
          {OPCIONES.map((o) => (
            <button key={o.v} type="button" role="option" aria-selected={o.v === value}
              onClick={() => { onChange(o.v); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-b-0 dark:border-white/5 ${o.v === value ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-white/5'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PeriodSelect({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  return (
    <>
      <div className="sm:hidden"><PeriodDropdown value={value} onChange={onChange} /></div>
      <div className="hidden sm:block"><PeriodSwitch value={value} onChange={onChange} /></div>
    </>
  );
}
