import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import type { AirtableRecord, Table } from '../lib/airtable-hooks';
import { useFloating } from './useFloating';
import { estatusStyle, toneStyle, useIsDark } from './airtableColors';
import { FIELD_IDS, MONTHS_ES, MONTHS_ES_SHORT, DAYS_ES, getCalendarDays, formatDateForComparison, toTitleCase, cvs } from '../utils';

const MONTH_MAX = 3;

export function MonthYearSpinner({ initialMonth, initialYear, onConfirm, onClose }: {
  initialMonth: number; initialYear: number; onConfirm: (d: Date) => void; onClose: () => void;
}): React.ReactElement {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const ref = useRef<any>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);
  const spinBtn = 'p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors flex items-center justify-center';
  const spinVal = 'text-sm font-bold text-gray-800 dark:text-gray-200 w-20 text-center select-none py-0.5';
  return (
    <div ref={ref} className="bg-white border border-gray-200 dark:bg-[#242220] dark:border-[#34312C] rounded-xl shadow-xl px-5 py-3 font-sans w-52" onMouseDown={(e: any) => e.stopPropagation()}>
      <div className="flex items-center gap-4 justify-center">
        <div className="flex flex-col items-center gap-0">
          <button type="button" onClick={() => setMonth((m) => (m === 11 ? 0 : m + 1))} className={spinBtn} aria-label="Mes siguiente"><CaretDownIcon size={13} className="rotate-180" /></button>
          <span className={spinVal}>{MONTHS_ES[month]}</span>
          <button type="button" onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))} className={spinBtn} aria-label="Mes anterior"><CaretDownIcon size={13} /></button>
        </div>
        <span className="text-gray-300 dark:text-gray-600 text-lg">/</span>
        <div className="flex flex-col items-center gap-0">
          <button type="button" onClick={() => setYear((y) => y + 1)} className={spinBtn} aria-label="Año siguiente"><CaretDownIcon size={13} className="rotate-180" /></button>
          <span className={spinVal}>{year}</span>
          <button type="button" onClick={() => setYear((y) => y - 1)} className={spinBtn} aria-label="Año anterior"><CaretDownIcon size={13} /></button>
        </div>
      </div>
      <button type="button" onClick={() => { onConfirm(new Date(year, month, 1)); onClose(); }}
        className="mt-3 w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-semibold py-1.5 rounded-lg transition-colors font-sans">
        {'Ir a ' + MONTHS_ES_SHORT[month] + ' ' + year}
      </button>
    </div>
  );
}

export function MiniCalendar({ selectedDate, onSelectDate, onClose, align = 'left', minKey, maxKey }: {
  selectedDate: Date; onSelectDate: (date: Date) => void; onClose: () => void; align?: 'left' | 'right' | 'center';
  /** Optional YYYY-MM-DD bounds; days outside are disabled. */
  minKey?: string; maxKey?: string;
}): React.ReactElement {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const containerRef = useRef<any>(null);
  // Anchored to the wrapping element; floats above everything and flips up when there's no room below.
  const floatStyle = useFloating(() => containerRef.current?.parentElement, containerRef, true, { align });
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(viewDate);
  const todayStr = formatDateForComparison(new Date());
  const selectedStr = formatDateForComparison(selectedDate);
  return (
    <div ref={containerRef} style={floatStyle} className="bg-white border border-[#E9D9D9] rounded-lg shadow-lg p-3 w-64 dark:bg-[#251D1F] dark:border-[#382C2E]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5" aria-label="Mes anterior">
          <CaretLeftIcon size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-base font-medium text-gray-800 capitalize dark:text-gray-200">{monthLabel}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5" aria-label="Mes siguiente">
          <CaretRightIcon size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
          <div key={d} className="text-sm text-gray-500 text-center dark:text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = formatDateForComparison(new Date(year, month, day));
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;
          let cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer hover:bg-rose-50 text-gray-800 dark:text-gray-200 dark:hover:bg-white/5';
          if (isToday && !isSelected) cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer bg-rose-100 text-rose-600 dark:bg-rose-600/15 dark:text-rose-200';
          if (isSelected) cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer bg-rose-600 text-white dark:bg-rose-600';
          const disabled = (!!minKey && dateStr < minKey) || (!!maxKey && dateStr > maxKey);
          if (disabled) cls = 'text-base rounded text-center py-1 cursor-not-allowed text-gray-300 dark:text-gray-600';
          return (
            <button key={idx} type="button" disabled={disabled} onClick={() => onSelectDate(new Date(year, month, day))} className={cls}>{day}</button>
          );
        })}
      </div>
      <div className="mt-2 text-center">
        <button type="button" disabled={(!!minKey && todayStr < minKey) || (!!maxKey && todayStr > maxKey)} onClick={() => onSelectDate(new Date())} className="text-sm text-rose-600 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed dark:text-rose-600 dark:disabled:text-gray-600">Ir a hoy</button>
      </div>
    </div>
  );
}

export function CalendarioView({ filteredPedidos, calendarDate, period, onRecordClick, getFechaField, getEstatusField, pedidosTable, elementosTable, elementoRecords, isSemana }: {
  filteredPedidos: AirtableRecord[];
  calendarDate: Date;
  period: 'mes' | 'semana';
  onRecordClick: (id: string) => void;
  getFechaField: (r: AirtableRecord) => string | null;
  getEstatusField: (r: AirtableRecord) => string | null;
  pedidosTable: Table;
  elementosTable: Table | null;
  elementoRecords: AirtableRecord[];
  isSemana: boolean;
}): React.ReactElement {
  const dark = useIsDark();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dk = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayKey = dk(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const mesCells = useMemo(() => getCalendarDays(year, month), [year, month]);
  const weekStart = useMemo(() => {
    const dow = (calendarDate.getDay() + 6) % 7;
    return new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - dow);
  }, [calendarDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)), [weekStart]);
  const recordsByDate = useMemo(() => {
    const map: { [k: string]: AirtableRecord[] } = {};
    for (const r of filteredPedidos) {
      const fe = getFechaField(r);
      if (!fe) continue;
      const key = dk(new Date(fe));
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    Object.keys(map).forEach((key) => {
      map[key]!.sort((a, b) => {
        const ta = getFechaField(a);
        const tb = getFechaField(b);
        if (!ta) return 1; if (!tb) return -1;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
    });
    return map;
  }, [filteredPedidos, getFechaField]);

  const [expanded, setExpanded] = useState<{ key: string; x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => { setExpanded(null); }, [period, calendarDate]);

  const openExpand = (e: any, key: string) => {
    e.stopPropagation();
    const cell = e.currentTarget.closest('[data-daycell]');
    const rect = (cell ?? e.currentTarget).getBoundingClientRect();
    setExpanded({ key, x: rect.left, y: rect.top, w: rect.width, h: rect.height });
  };

  function chip(r: AirtableRecord, month = false, shadow = false) {
    const pidField = pedidosTable.getFieldIfExists(FIELD_IDS.PEDIDO_ID);
    const elementosLinkField = pedidosTable.getFieldIfExists(FIELD_IDS.ELEMENTOS);
    const pid = pidField ? r.getCellValueAsString(pidField) : 'Sin ID';
    const estatus = getEstatusField(r);
    const style = estatusStyle(estatus, dark) ?? { backgroundColor: dark ? '#2E2F30' : '#E5E9F0', color: dark ? '#C4C7CD' : '#1D1F25' };

    if (month) {
      return (
        <button key={r.id} type="button" onClick={() => { onRecordClick(r.id); setExpanded(null); }} title={pid}
          className={'w-full flex items-center gap-1 min-w-0 text-left px-1.5 py-0.5 rounded font-semibold hover:opacity-80 transition-opacity font-sans text-xs ' + (shadow ? 'shadow-md' : '')}
          style={style}>
          <span className="truncate">{toTitleCase(pid)}</span>
        </button>
      );
    }

    let primerElemento = '';
    if (elementosLinkField) {
      const linkedIds = (r.getCellValue(elementosLinkField) as Array<{ id: string }> | null)?.map((l) => l.id) ?? [];
      if (linkedIds.length > 0) {
        const el = elementoRecords.find((e) => e.id === linkedIds[0]);
        if (el) primerElemento = cvs(el, elementosTable, FIELD_IDS.EL_NOMBRE);
      }
    }
    return (
      <button key={r.id} type="button" onClick={() => onRecordClick(r.id)} title={pid}
        className="w-full text-left px-1.5 py-0.5 rounded font-semibold hover:opacity-80 transition-opacity font-sans text-xs"
        style={style}>
        <div className="truncate">{toTitleCase(pid)}</div>
        {/* Always render the second line so every week card has the same height */}
        <div className="truncate opacity-85 font-normal">{primerElemento || '—'}</div>
      </button>
    );
  }

  function expandPopup() {
    if (!expanded) return null;
    const recs = recordsByDate[expanded.key] ?? [];
    if (recs.length === 0) return null;
    const parts = expanded.key.split('-').map(Number);
    const isToday = expanded.key === todayKey;
    const maxH = Math.max(expanded.h, window.innerHeight - expanded.y - 8);
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(null)} />
        <div className="fixed z-50 p-1 flex flex-col rounded-t-none rounded-b-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#251D1F]"
          style={{ left: expanded.x, top: expanded.y, width: expanded.w, minHeight: expanded.h, maxHeight: maxH }} onClick={(e: any) => e.stopPropagation()}>
          <div className={'w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mb-0.5 flex-shrink-0 font-sans ' + (isToday ? 'bg-rose-600 text-white' : 'text-gray-600 dark:text-gray-400')}>{parts[2]}</div>
          <div className="space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {recs.map((r) => chip(r, true))}
          </div>
        </div>
      </>
    );
  }

  const outerCls = 'flex-1 min-h-0 overflow-hidden px-4 pb-4 flex flex-col';
  const innerCls = 'rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 flex-1 flex flex-col min-h-0 bg-white dark:bg-[#251D1F]';
  const hCls = 'py-2 text-center text-base font-semibold text-gray-500 font-sans';

  if (period === 'mes') {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <div className="grid grid-cols-7 flex-shrink-0 bg-gray-50 dark:bg-white/5">
            {DAYS_ES.map((d) => <div key={d} className={hCls}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6,1fr)' }}>
            {mesCells.map(({ date, currentMonth }, idx) => {
              const key = dk(date);
              const recs = recordsByDate[key] ?? [];
              const isToday = key === todayKey;
              const noRight = idx % 7 === 6 ? 'border-r-0' : '';
              const overflow = recs.length > MONTH_MAX ? recs.length - (MONTH_MAX - 1) : 0;
              const visible = overflow > 0 ? recs.slice(0, MONTH_MAX - 1) : recs;
              return (
                <div key={idx} data-daycell className={'p-1 flex flex-col overflow-hidden border-b border-r border-gray-200 dark:border-white/10 ' + noRight + (!currentMonth ? ' opacity-40' : '')}>
                  <div className={'w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mb-0.5 flex-shrink-0 font-sans ' + (isToday ? 'bg-rose-600 text-white' : 'text-gray-600 dark:text-gray-400')}>{date.getDate()}</div>
                  <div className="space-y-0.5 overflow-hidden">
                    {visible.map((r) => chip(r, true))}
                    {overflow > 0 && (
                      <button type="button" onClick={(e: any) => openExpand(e, key)} title="Ver todos los pedidos" style={toneStyle('gray', dark)}
                        className="w-full flex items-center justify-between gap-1 px-1.5 py-0.5 rounded text-xs font-semibold hover:opacity-85 transition-opacity">
                        <span className="truncate">+{overflow} pedidos</span>
                        <CaretDownIcon size={11} className="flex-shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {expandPopup()}
      </div>
    );
  }

  return (
    <div className={outerCls}>
      <div className={innerCls}>
        <div className="grid grid-cols-7 flex-shrink-0 bg-gray-50 dark:bg-white/5">
          {weekDays.map((d, i) => {
            const isToday = dk(d) === todayKey;
            return (
              <div key={i} className="py-2 flex flex-col items-center">
                <span className={hCls}>{DAYS_ES[i]}</span>
                <span className={'mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold font-sans ' + (isToday ? 'bg-rose-600 text-white' : 'text-gray-700 dark:text-gray-200')}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 flex-1 min-h-0">
          {weekDays.map((d, i) => {
            const recs = recordsByDate[dk(d)] ?? [];
            const noRight = i === 6 ? 'border-r-0' : '';
            return (
              <div key={i} tabIndex={0} className={'p-1.5 border-r border-gray-200 dark:border-white/10 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ' + noRight}>
                {recs.map((r) => chip(r))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
