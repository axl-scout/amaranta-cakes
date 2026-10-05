import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { Calendar as CalendarIcon, CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon, X as XIcon } from '@phosphor-icons/react';
import { useFloating } from './useFloating';
import { useEscClose } from '../lib/escStack';

export const PAST_DUE_MSG = 'La entrega de producción de este pedido ya pasó. Cambia esa fecha en el pedido para poder fechar la tarea.';

type Which = 'start' | 'end';
interface Ctx {
  id: string; start: string; end: string; min?: string; max?: string;
  open: { anchor: Which; mode: Which } | null;
  setOpen: (o: { anchor: Which; mode: Which } | null) => void;
  pick: (d: string) => void; clear: (w: Which) => void;
  canClear: (w: Which) => boolean;
}
const RangeCtx = createContext<Ctx | null>(null);

const parse = (v: string): Date | null => {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * One range calendar shared by an "Inicio" and a "Fin" field. Wrap both <RangeTrigger>s in it (they can live in
 * different table cells). Picking the start keeps the calendar open and the next pick is the end.
 * The parent owns the rules (bounds / auto-adjustment) through onStart / onEnd.
 */
export function DateRangeScope({ start, end, min, max, onStart, onEnd, onClear, canClear, children }: {
  start: string; end: string; min?: string; max?: string;
  onStart: (d: string) => void; onEnd: (d: string) => void; onClear: (w: Which) => void;
  canClear?: (w: Which) => boolean; children: React.ReactNode;
}): React.ReactElement {
  const id = useId();
  const [open, setOpen] = useState<Ctx['open']>(null);
  const pick = useCallback((d: string) => {
    if (!open) return;
    if (open.mode === 'start') { onStart(d); setOpen({ ...open, mode: 'end' }); }
    else { onEnd(d); setOpen(null); }
  }, [open, onStart, onEnd]);
  return (
    <RangeCtx.Provider value={{ id, start, end, min, max, open, setOpen, pick, clear: onClear, canClear: canClear ?? (() => true) }}>
      {children}
    </RangeCtx.Provider>
  );
}

export function RangeTrigger({ which, className = '', placeholder, ariaLabel, id, format = 'short' }: {
  which: Which; className?: string; placeholder: string; ariaLabel?: string; id?: string; format?: 'short' | 'long';
}): React.ReactElement {
  const c = useContext(RangeCtx)!;
  const value = which === 'start' ? c.start : c.end;
  const d = parse(value);
  const label = d ? d.toLocaleDateString('es-MX', format === 'long' ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const isOpen = !!c.open;
  const click = () => {
    if (!c.open) c.setOpen({ anchor: which, mode: which });
    else if (c.open.mode === which) c.setOpen(null);
    else c.setOpen({ ...c.open, mode: which });
  };
  const showClear = !!d && c.canClear(which);
  return (
    <div className="relative" data-range={c.id}>
      <div className="relative">
        <button id={id} type="button" onClick={click} aria-label={ariaLabel} aria-expanded={isOpen}
          className={`${className} flex items-center justify-between gap-2 text-left ${showClear ? 'pr-12' : ''}`}>
          <span className={`truncate first-letter:uppercase ${d ? '' : 'text-gray-400'}`}>{label || placeholder}</span>
          {!showClear && <CalendarIcon size={15} className="flex-shrink-0 text-gray-400" />}
        </button>
        {showClear && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button type="button" aria-label={`Quitar ${which === 'start' ? 'inicio' : 'fin'}`} onClick={() => c.clear(which)}
              className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={14} /></button>
            <CalendarIcon size={15} className="text-gray-400 pointer-events-none" />
          </span>
        )}
      </div>
      {c.open && c.open.anchor === which && <RangeCalendar />}
    </div>
  );
}

function RangeCalendar(): React.ReactElement {
  const c = useContext(RangeCtx)!;
  const ref = useRef<any>(null);
  const style = useFloating(() => ref.current?.parentElement, ref, true, {});
  const sd = parse(c.start); const ed = parse(c.end);
  const [view, setView] = useState<Date>(() => { const b = (c.open?.mode === 'end' ? ed ?? sd : sd ?? ed) ?? new Date(); return new Date(b.getFullYear(), b.getMonth(), 1); });
  useEscClose(() => c.setOpen(null));
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current?.contains(t) || t.closest?.(`[data-range="${c.id}"]`)) return;
      c.setOpen(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [c.id]); // eslint-disable-line
  const y = view.getFullYear(); const m = view.getMonth();
  const days: (number | null)[] = [];
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) days.push(null);
  for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) days.push(i);
  const todayK = key(new Date());
  const pastDue = !!c.min && !!c.max && c.max < c.min;
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(view);
  return (
    <div ref={ref} style={style} onMouseDown={(e: any) => e.stopPropagation()} role="dialog" aria-label="Calendario de inicio y fin"
      className="bg-white border border-[#E9D9D9] rounded-lg shadow-lg p-3 w-64 dark:bg-[#251D1F] dark:border-[#382C2E]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} className="p-1 hover:bg-rose-50 rounded dark:hover:bg-white/5" aria-label="Mes anterior"><CaretLeftIcon size={16} className="text-gray-600 dark:text-gray-400" /></button>
        <span className="text-base font-medium text-gray-800 capitalize dark:text-gray-200">{label}</span>
        <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} className="p-1 hover:bg-rose-50 rounded dark:hover:bg-white/5" aria-label="Mes siguiente"><CaretRightIcon size={16} className="text-gray-600 dark:text-gray-400" /></button>
      </div>
      <p className="mb-2 text-center text-xs font-medium text-rose-600 dark:text-rose-300">{c.open?.mode === 'start' ? 'Elige el inicio' : 'Elige el fin'}</p>
      <div className="grid grid-cols-7 mb-1">{['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => <div key={d} className="text-sm text-gray-500 text-center">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;
          const k = key(new Date(y, m, day));
          const disabled = (!!c.min && k < c.min) || (!!c.max && k > c.max);
          const isS = k === c.start; const isE = k === c.end;
          const inRange = !!c.start && !!c.end && k > c.start && k < c.end;
          let cls = 'text-base text-center py-1 transition-colors rounded ';
          if (disabled) cls += 'cursor-not-allowed text-gray-300 dark:text-gray-600';
          else if (isS || isE) cls += `bg-rose-600 text-white cursor-pointer ${isS && !isE && c.end ? 'rounded-r-none' : ''} ${isE && !isS && c.start ? 'rounded-l-none' : ''}`;
          else if (inRange) cls += 'bg-rose-100 text-rose-700 rounded-none cursor-pointer dark:bg-rose-600/20 dark:text-rose-200';
          else cls += `cursor-pointer text-gray-800 hover:bg-rose-50 dark:text-gray-200 dark:hover:bg-white/5 ${k === todayK ? 'ring-1 ring-rose-300' : ''}`;
          return <button key={i} type="button" disabled={disabled} onClick={() => c.pick(k)} className={cls}>{day}</button>;
        })}
      </div>
      {pastDue && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{PAST_DUE_MSG}</p>}
    </div>
  );
}
