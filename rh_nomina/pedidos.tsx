import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  initializeBlock,
  useBase,
  useRecords,
  useCustomProperties,
} from '@airtable/blocks/interface/ui';
import type { Table, Record } from '@airtable/blocks/interface/models';
import {
  CaretLeft as CaretLeftIcon,
  CaretRight as CaretRightIcon,
  CaretUp as CaretUpIcon,
  CaretDown as CaretDownIcon,
  Calendar as CalendarIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  X as XIcon,
  Plus as PlusIcon,
} from '@phosphor-icons/react';

// ─── Rosewood palette tokens ──────────────────────────────────────────────────
function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light'
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);
  return theme;
}

// ─── Field IDs ────────────────────────────────────────────────────────────────
const FIELD_IDS = {
  PEDIDO_ID:          'fldczBetjpB774xkR',
  ESTATUS:            'fldxy88bESBs57F9r',
  NUMERO_NOTA:        'fldEgIlOKa0R2x9vx',
  FECHA_ENTREGA:      'fldc9PHWWrc4ThY6x',
  FECHA_ENTREGA_CLIENTE: 'fld3EOkVHmX8PHObD',
  CLIENTE:            'fldfhgJV1cvaETHxW',
  METODO_CONTACTO:    'fldrL0Ky9gFspwEeR',
  NUMERO_TELEFONO:    'fldnCpbKGBSjVW4WU',
  ELEMENTOS:          'fldpupPTUZWSEvemI',
  COSTO_TOTAL:        'fldKiOmzETq2MLdYC',
  ANTICIPO:           'fldSLRtgTaXQazskn',
  LIQUIDADO:          'fldUjlrxjHQa1n4Yo',
  RESTANTE:           'fldgmDFv8FbEICfYh',
  FECHA_ENTREGA_HORA: 'fldKSlQwn5jcXAj3b',
  IMPRESO:            'fld5LaJlJYzOdIEFD',
  CAKE_TOPPER:        'fldITlLvE8dcFMDgo',
  CREATED:            'fldqYUCbJF8CJX1KT',
  EL_NOMBRE:          'flddTGNiG8RFSqniA',
  EL_DESCRIPCION:     'fldUUqWGfhYqcQpJx',
  EL_CANTIDAD:        'fldRXts0LZFxbXeXz',
  EL_COSTO_UNITARIO:  'fld6hEjhbVFvvIrkI',
  EL_COSTO_TOTAL:     'fldFEGpYh5gZXr0hS',
  EL_PEDIDOS:         'fldyBFdIC1QVZJrnl',
  EL_PRODUCTO:        'fldhyj9TEbD8ABnBK',
  EL_PAN:             'fldilDtr8k7WHvLqd',
  EL_RELLENO:         'fld9lY7KD8cGin9bL',
  CAT_NOMBRE:         'flduxPtM9vWcE8x9n',
  CAT_TIPO:           'fldqkk22IHoPAkion',
  CT_NOMBRE:          'fld07EY54VjzIVNzR',
  CT_FECHA:           'fldgeRj5C2Q5EZP7l',
  CT_MEDIDAS:         'fldnNsrr7mEzGlNvc',
  CT_COSTO:           'fldUudD2bmAIh4jmf',
  CT_PEDIDOS:         'fldnoQlxnxx7wx2W2',
} as const;

// ─── Write queue ──────────────────────────────────────────────────────────────
let _writeQueue = Promise.resolve();
function queueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = _writeQueue.then(fn);
  _writeQueue = next.then(() => {}, () => {});
  return next;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateForComparison(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatFriendlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoMatch
    ? new Date(parseInt(isoMatch[1]!), parseInt(isoMatch[2]!) - 1, parseInt(isoMatch[3]!))
    : new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatFriendlyDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
}

function formatTimeOnly(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function parseTypedDate(str: string): Date | null {
  if (!str.trim()) return null;
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1]!), parseInt(iso[2]!) - 1, parseInt(iso[3]!));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function toTitleCase(str: string | null | undefined): string {
  if (!str) return str ?? '';
  return str.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function getCardColorClasses(estatus: string | null | undefined): string {
  const val = (estatus ?? '').toLowerCase();
  if (val === 'pendiente') return 'border-rose-200 bg-rose-50 hover:border-rose-300 hover:shadow-md dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:border-rose-400/50';
  if (val === 'entregado') return 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-md dark:border-green-500/30 dark:bg-green-500/10';
  return 'border-[#E9D9D9] bg-white hover:border-rose-200 hover:shadow-md dark:border-[#382C2E] dark:bg-[#251D1F]';
}

function esProductoConRellenoYPan(nombre: string): boolean {
  return /pastel|cupcake/i.test(nombre);
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_ES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS_ES = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

function getCalendarDays(year: number, month: number): Array<{ date: Date; currentMonth: boolean }> {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date; currentMonth: boolean }> = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), currentMonth: true });
  let n = 1;
  while (cells.length < 42) cells.push({ date: new Date(year, month + 1, n++), currentMonth: false });
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── MonthYearSpinner (inline dropdown, no fixed overlay) ────────────────────
function MonthYearSpinner({ initialMonth, initialYear, onConfirm, onClose }: {
  initialMonth: number; initialYear: number; onConfirm: (d: Date) => void; onClose: () => void;
}): React.ReactElement {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);
  function incMonth() { setMonth(m => m === 11 ? 0 : m + 1); }
  function decMonth() { setMonth(m => m === 0 ? 11 : m - 1); }
  function incYear() { setYear(y => y + 1); }
  function decYear() { setYear(y => y - 1); }
  const spinBtn = "p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors flex items-center justify-center";
  const spinVal = "text-sm font-bold text-gray-800 dark:text-gray-200 w-20 text-center select-none py-0.5";
  return (
    <div ref={ref} className="bg-white border border-gray-200 dark:bg-[#242220] dark:border-[#34312C] rounded-xl shadow-xl px-5 py-3 font-sans w-52" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center gap-4 justify-center">
        <div className="flex flex-col items-center gap-0">
          <button type="button" onClick={incMonth} className={spinBtn}><CaretDownIcon size={13} className="rotate-180" /></button>
          <span className={spinVal}>{MONTHS_ES[month]}</span>
          <button type="button" onClick={decMonth} className={spinBtn}><CaretDownIcon size={13} /></button>
        </div>
        <span className="text-gray-300 dark:text-gray-600 text-lg">/</span>
        <div className="flex flex-col items-center gap-0">
          <button type="button" onClick={incYear} className={spinBtn}><CaretDownIcon size={13} className="rotate-180" /></button>
          <span className={spinVal}>{year}</span>
          <button type="button" onClick={decYear} className={spinBtn}><CaretDownIcon size={13} /></button>
        </div>
      </div>
      <button type="button" onClick={() => { onConfirm(new Date(year, month, 1)); onClose(); }}
        className="mt-3 w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-semibold py-1.5 rounded-lg transition-colors font-sans">
        {'Ir a ' + MONTHS_ES_SHORT[month] + ' ' + year}
      </button>
    </div>
  );
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelectDate, onClose }: {
  selectedDate: Date; onSelectDate: (date: Date) => void; onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    };
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
  const todayStr    = formatDateForComparison(new Date());
  const selectedStr = formatDateForComparison(selectedDate);
  return (
    <div ref={containerRef} className="absolute top-full left-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-lg p-3 w-64 dark:bg-[#251D1F] dark:border-[#382C2E]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5">
          <CaretLeftIcon size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-base font-medium text-gray-800 capitalize dark:text-gray-200">{monthLabel}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5">
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
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;
          let cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer hover:bg-rose-50 text-gray-800 dark:text-gray-200 dark:hover:bg-white/5';
          if (isToday && !isSelected) cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
          if (isSelected) cls = 'text-base rounded transition-colors text-center py-1 cursor-pointer bg-rose-600 text-white dark:bg-rose-500';
          return (
            <button key={idx} type="button" onClick={() => onSelectDate(new Date(year, month, day))} className={cls}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-center">
        <button type="button" onClick={() => onSelectDate(new Date())} className="text-sm text-rose-600 hover:underline dark:text-rose-400">
          Ir a hoy
        </button>
      </div>
    </div>
  );
}

// ─── CalendarioView para Pedidos ──────────────────────────────────────────────
function CalendarioView({ filteredPedidos, calendarDate, period, onRecordClick, getFechaField, getEstatusField, pedidosTable, elementoRecords, isSemana }: {
  filteredPedidos: Record[];
  calendarDate: Date;
  period: 'mes' | 'semana';
  onRecordClick: (id: string) => void;
  getFechaField: (r: Record) => string | null;
  getEstatusField: (r: Record) => string | null;
  pedidosTable: Table;
  elementoRecords: Record[];
  isSemana: boolean;
}): React.ReactElement {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dk = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayKey = dk(new Date());
  const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
  const mesCells = useMemo(() => getCalendarDays(year, month), [year, month]);
  const weekStart = useMemo(() => {
    const dow = (calendarDate.getDay() + 6) % 7;
    return new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - dow);
  }, [calendarDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)), [weekStart]);
  const recordsByDate = useMemo(() => {
    const map: { [k: string]: Record[] } = {};
    for (const r of filteredPedidos) {
      const fe = getFechaField(r);
      if (!fe) continue;
      const key = dk(new Date(fe));
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        const ta = getFechaField(a);
        const tb = getFechaField(b);
        if (!ta) return 1; if (!tb) return -1;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
    });
    return map;
  }, [filteredPedidos, getFechaField]);

  function chip(r: Record) {
    const pidField = pedidosTable.getFieldIfExists(FIELD_IDS.PEDIDO_ID);
    const elementosLinkField = pedidosTable.getFieldIfExists(FIELD_IDS.ELEMENTOS);
    const pid = pidField ? r.getCellValueAsString(pidField) : 'Sin ID';
    const estatus = getEstatusField(r);
    const fe = getFechaField(r);
    const hora = fe ? new Date(fe).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
    const color = estatus === 'Entregado' ? '#16A34A' : estatus === 'Pendiente' ? '#DC2626' : '#9CA3AF';

    // Get first elemento name for semana view
    let primerElemento = '';
    if (isSemana && elementosLinkField) {
      const linkedIds = (r.getCellValue(elementosLinkField) as Array<{ id: string }> | null)?.map(l => l.id) ?? [];
      if (linkedIds.length > 0) {
        const el = elementoRecords.find(e => e.id === linkedIds[0]);
        if (el) {
          const elNombreField = el.parentTable?.getFieldIfExists(FIELD_IDS.EL_NOMBRE);
          primerElemento = elNombreField ? el.getCellValueAsString(elNombreField) : '';
        }
      }
    }

    const textSizeCls = isSemana ? 'text-sm' : 'text-xs';

    return (
      <button key={r.id} type="button" onClick={() => onRecordClick(r.id)} title={pid}
        className={'w-full text-left px-1.5 py-0.5 rounded font-semibold hover:opacity-80 transition-opacity font-sans text-white ' + textSizeCls}
        style={{ backgroundColor: color }}>
        <div className="truncate">{hora && <span className="opacity-80 mr-1">{hora}</span>}{toTitleCase(pid)}</div>
        {isSemana && primerElemento && (
          <div className="truncate opacity-85 font-normal">{primerElemento}</div>
        )}
      </button>
    );
  }

  const outerCls = "flex-1 min-h-0 overflow-hidden px-4 pb-4 flex flex-col";
  const innerCls = "rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 flex-1 flex flex-col min-h-0";
  const headerBg = { backgroundColor: '#F9FAFB' };
  const gridBg = { backgroundColor: '#FFFFFF' };
  const hCls = "py-2 text-center text-base font-semibold text-gray-500 capitalize font-sans";

  if (period === 'mes') {
    return (
      <div className={outerCls}>
        <div className={innerCls} style={gridBg}>
          <div className="grid grid-cols-7 flex-shrink-0" style={headerBg}>
            {DAYS_ES.map(d => <div key={d} className={hCls}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6,1fr)' }}>
            {mesCells.map(({ date, currentMonth }, idx) => {
              const key = dk(date);
              const recs = recordsByDate[key] ?? [];
              const isToday = key === todayKey;
              const noRight = idx % 7 === 6 ? 'border-r-0' : '';
              return (
                <div key={idx} className={'p-1 flex flex-col overflow-hidden border-b border-r border-gray-200 dark:border-white/10 ' + noRight + (!currentMonth ? ' opacity-40' : '')}>
                  <div className={'w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mb-0.5 flex-shrink-0 font-sans ' + (isToday ? 'bg-rose-600 text-white' : 'text-gray-600 dark:text-gray-400')}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{recs.map(r => chip(r))}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={outerCls}>
      <div className={innerCls} style={gridBg}>
        <div className="grid grid-cols-7 flex-shrink-0" style={headerBg}>
          {weekDays.map((d, i) => {
            const isToday = dk(d) === todayKey;
            return (
              <div key={i} className="py-2 flex flex-col items-center">
                <span className={hCls}>{DAYS_ES[i]}</span>
                <span className={'mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold font-sans ' + (isToday ? 'bg-rose-600 text-white' : 'text-gray-700 dark:text-gray-200')}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 flex-1 min-h-0">
          {weekDays.map((d, i) => {
            const recs = recordsByDate[dk(d)] ?? [];
            const noRight = i === 6 ? 'border-r-0' : '';
            return (
              <div key={i} className={'p-1.5 border-r border-gray-200 dark:border-white/10 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ' + noRight}>
                {recs.map(r => chip(r))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Time helpers ─────────────────────────────────────────────────────────────
function to12h(h24: number): { h: number; p: 'AM' | 'PM' } {
  if (h24 === 0) return { h: 12, p: 'AM' };
  if (h24 === 12) return { h: 12, p: 'PM' };
  if (h24 < 12) return { h: h24, p: 'AM' };
  return { h: h24 - 12, p: 'PM' };
}

function to24h(h12: number, p: 'AM' | 'PM'): number {
  if (p === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function fmtTimeDisplay(h24: number, m: number): string {
  const { h, p } = to12h(h24);
  return `${h}:${String(m).padStart(2, '0')} ${p}`;
}

function parseTimeValue(v: string): { h24: number; m: number } | null {
  if (!v) return null;
  const parts = v.split(':');
  const h24 = parseInt(parts[0] ?? '0', 10);
  const m   = parseInt(parts[1] ?? '0', 10);
  if (isNaN(h24) || isNaN(m)) return null;
  return { h24, m };
}

const SPIN_HOURS       = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const SPIN_MINUTE_VALS = [0, 15, 30, 45] as const;
const SPIN_MINUTES     = SPIN_MINUTE_VALS.map(m => String(m).padStart(2, '0'));
const SPIN_PERIODS     = ['AM', 'PM'] as const;

function snapToValidMinute(m: number): number {
  return [...SPIN_MINUTE_VALS].reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a);
}

// ─── Pill components ──────────────────────────────────────────────────────────
function ContactoPill({ value, large = false }: { value: string | null | undefined; large?: boolean }) {
  if (!value) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const lower = value.toLowerCase();
  let classes = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10';
  if (lower === 'whatsapp') classes = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
  else if (lower === 'facebook') classes = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
  else if (lower === 'instagram') classes = 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30';
  const sizeClass = large ? 'px-4 py-1.5 text-base font-semibold' : 'px-2.5 py-0.5 text-sm font-medium';
  return (
    <span className={`inline-flex items-center rounded-full border whitespace-nowrap ${sizeClass} ${classes}`}>
      {value}
    </span>
  );
}

function EstatusPill({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/10 dark:text-gray-500 dark:border-white/10">Sin estatus</span>;
  let classes = 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/10 dark:text-gray-500 dark:border-white/10';
  if (value === 'Pendiente') classes = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30';
  else if (value === 'Entregado') classes = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border whitespace-nowrap ${classes}`}>{value}</span>;
}

function ImpresoPill({ value }: { value: boolean | null | undefined }) {
  const isImpreso = Boolean(value);
  const classes = isImpreso
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30'
    : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/10 dark:text-gray-500 dark:border-white/10';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border whitespace-nowrap ${classes}`}>{isImpreso ? 'Impreso' : 'No impreso'}</span>;
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ label, values, options, onChange }: {
  label: string; values: string[]; options: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const displayText = values.length === 0 ? label : values.length === 1 ? values[0]! : `${values.length} seleccionados`;
  const toggleOption = (opt: string) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  const hasValue = values.length > 0;
  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-between gap-2 min-w-[160px] bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-base text-gray-700 hover:border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-300 outline-none transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:hover:border-rose-400/50">
        <span className="truncate">{displayText}</span>
        {hasValue ? (
          <XIcon size={14} className="text-gray-400 flex-shrink-0 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange([]); }} />
        ) : (
          <CaretDownIcon size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[260px] overflow-y-auto w-[200px] py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
            {options.map(opt => {
              const sel = values.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => toggleOption(opt)}
                  className={`w-full text-left px-3 py-1.5 text-base transition-colors ${sel ? 'bg-rose-50 text-rose-700 font-medium dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── SpinnerColumn ────────────────────────────────────────────────────────────
function SpinnerColumn({ values, index, onPrev, onNext }: {
  values: readonly string[]; index: number; onPrev: () => void; onNext: () => void;
}) {
  const colRef  = useRef<HTMLDivElement>(null);
  const prevRef = useRef(onPrev);
  const nextRef = useRef(onNext);
  useEffect(() => { prevRef.current = onPrev; nextRef.current = onNext; });
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const handle = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) nextRef.current(); else prevRef.current();
    };
    el.addEventListener('wheel', handle, { passive: false });
    return () => el.removeEventListener('wheel', handle);
  }, []);
  const btnCls = 'p-0.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:hover:text-rose-300 dark:hover:bg-white/5';
  const nc = "text-lg font-bold text-gray-800 dark:text-gray-200 w-9 text-center tabular-nums select-none";
  return (
    <div ref={colRef} className="flex flex-col items-center select-none" style={{ userSelect: 'none' }}>
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onPrev} className={btnCls}><CaretUpIcon size={13} /></button>
      <div className={nc}>{values[index]}</div>
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onNext} className={btnCls}><CaretDownIcon size={13} /></button>
    </div>
  );
}

// ─── CustomTimePicker ─────────────────────────────────────────────────────────
function CustomTimePicker({ value, onChange, placeholder = 'Hora' }: {
  value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  const initParsed = parseTimeValue(value);
  const init12     = initParsed ? to12h(initParsed.h24) : null;
  const [open,      setOpen]      = useState(false);
  const [inputText, setInputText] = useState(initParsed ? fmtTimeDisplay(initParsed.h24, initParsed.m) : '');
  const [selHour12, setSelHour12] = useState<number>(init12?.h ?? 12);
  const [selMinute, setSelMinute] = useState<number>(initParsed ? snapToValidMinute(initParsed.m) : 0);
  const [selPeriod, setSelPeriod] = useState<'AM' | 'PM'>(init12?.p ?? 'AM');
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parsed = parseTimeValue(value);
    if (parsed) {
      const { h, p } = to12h(parsed.h24);
      setSelHour12(h); setSelMinute(snapToValidMinute(parsed.m)); setSelPeriod(p);
      setInputText(fmtTimeDisplay(parsed.h24, parsed.m));
    } else { setInputText(''); }
  }, [value]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const hourIdx   = selHour12 - 1;
  const minIdx    = SPIN_MINUTE_VALS.indexOf(selMinute as 0 | 15 | 30 | 45);
  const periodIdx = selPeriod === 'PM' ? 1 : 0;
  const emitUpdate = (h12: number, m: number, p: 'AM' | 'PM') => {
    const h24 = to24h(h12, p);
    const str = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setInputText(fmtTimeDisplay(h24, m)); onChange(str);
  };
  const safeMinIdx = minIdx >= 0 ? minIdx : 0;
  const prevHour   = () => { const n = ((selHour12 - 2 + 12) % 12) + 1; setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const nextHour   = () => { const n = (selHour12 % 12) + 1;            setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const prevMinute = () => { const i = (safeMinIdx - 1 + 4) % 4; const m = SPIN_MINUTE_VALS[i]!; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
  const nextMinute = () => { const i = (safeMinIdx + 1) % 4;     const m = SPIN_MINUTE_VALS[i]!; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
  const togglePeriod = () => { const p: 'AM' | 'PM' = selPeriod === 'AM' ? 'PM' : 'AM'; setSelPeriod(p); emitUpdate(selHour12, selMinute, p); };
  const handleInputBlur = () => {
    const text = inputText.trim();
    if (!text) return;
    const m12 = text.match(/^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?$/i);
    if (m12) {
      const h = parseInt(m12[1]!); const m = parseInt(m12[2]!);
      const pStr = (m12[3] ?? '').toLowerCase();
      const p: 'AM' | 'PM' = pStr.startsWith('p') ? 'PM' : pStr.startsWith('a') ? 'AM' : selPeriod;
      if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
        const sm = snapToValidMinute(m); setSelHour12(h); setSelMinute(sm); setSelPeriod(p);
        emitUpdate(h, sm, p); return;
      }
    }
    const prev = parseTimeValue(value);
    setInputText(prev ? fmtTimeDisplay(prev.h24, prev.m) : '');
  };
  return (
    <div ref={containerRef} className="relative">
      <input type="text" value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-rose-400"
      />
      {open && (
        <div className="absolute top-full right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-md p-2 flex items-center gap-0.5 dark:bg-[#251D1F] dark:border-[#382C2E]">
          <SpinnerColumn values={SPIN_HOURS}   index={hourIdx}    onPrev={prevHour}    onNext={nextHour} />
          <span className="text-gray-300 text-base font-bold mb-0.5 px-0.5 dark:text-gray-600">:</span>
          <SpinnerColumn values={SPIN_MINUTES} index={safeMinIdx} onPrev={prevMinute}  onNext={nextMinute} />
          <div className="w-px h-6 bg-gray-200 mx-1.5 dark:bg-white/10" />
          <SpinnerColumn values={SPIN_PERIODS} index={periodIdx}  onPrev={togglePeriod} onNext={togglePeriod} />
        </div>
      )}
    </div>
  );
}

// ─── CatalogDropdown with search ───────────────────────────────────────────────
function CatalogDropdown({
  label, value, records, placeholder, showOpen, onToggle, onSelect, onClear, disabled = false,
}: {
  label: string;
  value: string;
  records: Record[];
  placeholder: string;
  showOpen: boolean;
  onToggle: () => void;
  onSelect: (r: Record) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter((r) => r.name.toLowerCase().includes(query));
  }, [records, searchQuery]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
        setSearchQuery('');
      }
    };
    if (showOpen) {
      document.addEventListener('mousedown', handle);
      return () => document.removeEventListener('mousedown', handle);
    }
  }, [showOpen, onToggle]);

  const iCls = `w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E]${disabled ? ' bg-gray-50 cursor-not-allowed' : ''}`;
  const lCls = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  
  return (
    <div ref={containerRef} className="relative">
      <span className={lCls}>{label}</span>
      <button type="button" disabled={disabled}
        onClick={onToggle}
        className={`${iCls} flex items-center justify-between gap-2 text-left cursor-pointer`}>
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}>
          {value || placeholder}
        </span>
        <span className="flex-shrink-0 flex items-center">
          {value && !disabled
            ? <span onMouseDown={e => e.preventDefault()} onClick={e => { e.stopPropagation(); onClear(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-500 dark:hover:text-gray-300">
                <XIcon size={14} />
              </span>
            : <CaretDownIcon size={14} className={`text-gray-400 transition-transform ${showOpen ? 'rotate-180' : ''}`} />
          }
        </span>
      </button>
      {showOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-[#382C2E] flex-shrink-0">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-rose-400"
            />
          </div>
          
          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredRecords.length === 0
              ? <div className="px-4 py-3 text-sm text-gray-400 text-center dark:text-gray-600">
                  {records.length === 0 ? 'Sin opciones' : 'No hay resultados'}
                </div>
              : filteredRecords.map((r) => (
                  <button key={r.id} type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      onSelect(r);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-4 py-2 text-base transition-colors ${r.name === value ? 'bg-rose-50 text-rose-700 font-medium dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}>
                    {r.name}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NuevoElementoModal ───────────────────────────────────────────────────────
interface NuevoElementoModalProps {
  pedidoRecordId: string;
  elementosTable: Table;
  catalogoProductos: Record[];
  catalogoPanes: Record[];
  catalogoRellenos: Record[];
  onClose: () => void;
}

function NuevoElementoModal({
  pedidoRecordId, elementosTable,
  catalogoProductos, catalogoPanes, catalogoRellenos,
  onClose,
}: NuevoElementoModalProps) {
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null);
  const [selectedNombre,     setSelectedNombre]     = useState('');
  const [selectedPanId,      setSelectedPanId]      = useState<string | null>(null);
  const [selectedPanName,    setSelectedPanName]    = useState('');
  const [selectedRellenoId,  setSelectedRellenoId]  = useState<string | null>(null);
  const [selectedRellenoName,setSelectedRellenoName]= useState('');
  const [neCantidad,         setNeCantidad]         = useState('');
  const [neCostoUnit,        setNeCostoUnit]        = useState('');
  const [neDescripcion,      setNeDescripcion]      = useState('');
  const [saving, setSaving] = useState(false);
  const [showNombreDropdown,  setShowNombreDropdown]  = useState(false);
  const [showPanDropdown,     setShowPanDropdown]     = useState(false);
  const [showRellenoDropdown, setShowRellenoDropdown] = useState(false);
  const nombreRef  = useRef<HTMLDivElement>(null);
  const panRef     = useRef<HTMLDivElement>(null);
  const rellenoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (nombreRef.current  && !nombreRef.current.contains(e.target as Node))  setShowNombreDropdown(false);
      if (panRef.current     && !panRef.current.contains(e.target as Node))     setShowPanDropdown(false);
      if (rellenoRef.current && !rellenoRef.current.contains(e.target as Node)) setShowRellenoDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const showPastelFields = esProductoConRellenoYPan(selectedNombre);
  const costoTotalPreview = useMemo(() => {
    return (parseFloat(neCantidad) || 0) * (parseFloat(neCostoUnit) || 0);
  }, [neCantidad, neCostoUnit]);

  const handleSave = async () => {
    if (!elementosTable.hasPermissionToCreateRecords()) return;
    setSaving(true);
    try {
      const fields: { [key: string]: unknown } = {};
      if (selectedProductoId) fields[FIELD_IDS.EL_PRODUCTO] = [{ id: selectedProductoId }];
      fields[FIELD_IDS.EL_PEDIDOS] = [{ id: pedidoRecordId }];
      if (neCantidad)            fields[FIELD_IDS.EL_CANTIDAD]       = parseFloat(neCantidad) || null;
      if (neCostoUnit)           fields[FIELD_IDS.EL_COSTO_UNITARIO] = parseFloat(neCostoUnit) || null;
      if (neDescripcion.trim())  fields[FIELD_IDS.EL_DESCRIPCION]    = neDescripcion.trim();
      if (showPastelFields && selectedPanId)     fields[FIELD_IDS.EL_PAN]     = [{ id: selectedPanId     }];
      if (showPastelFields && selectedRellenoId) fields[FIELD_IDS.EL_RELLENO] = [{ id: selectedRellenoId }];
      await queueWrite(() => elementosTable.createRecordAsync(fields));
      onClose();
    } catch (err) { console.error('Error al guardar elemento:', err); }
    finally { setSaving(false); }
  };

  const lCls = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl p-5 dark:bg-[#251D1F]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-lg text-gray-900 dark:text-[#F5F3EF]">Agregar Elemento</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={18} /></button>
        </div>
        <div className="mb-4">
          <div className={`grid gap-3 ${showPastelFields ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div ref={nombreRef} className="relative">
              <CatalogDropdown
                label="Nombre"
                value={selectedNombre}
                records={catalogoProductos}
                placeholder="Seleccionar producto..."
                showOpen={showNombreDropdown}
                onToggle={() => setShowNombreDropdown(o => !o)}
                onSelect={(r) => { setSelectedProductoId(r.id); setSelectedNombre(r.name); setShowNombreDropdown(false); }}
                onClear={() => { setSelectedProductoId(null); setSelectedNombre(''); }}
              />
            </div>
            {showPastelFields && (
              <div ref={panRef} className="relative">
                <CatalogDropdown
                  label="Pan"
                  value={selectedPanName}
                  records={catalogoPanes}
                  placeholder="Tipo de pan..."
                  showOpen={showPanDropdown}
                  onToggle={() => setShowPanDropdown(o => !o)}
                  onSelect={(r) => { setSelectedPanName(r.name); setSelectedPanId(r.id); setShowPanDropdown(false); }}
                  onClear={() => { setSelectedPanName(''); setSelectedPanId(null); }}
                />
              </div>
            )}
            {showPastelFields && (
              <div ref={rellenoRef} className="relative">
                <CatalogDropdown
                  label="Relleno"
                  value={selectedRellenoName}
                  records={catalogoRellenos}
                  placeholder="Tipo de relleno..."
                  showOpen={showRellenoDropdown}
                  onToggle={() => setShowRellenoDropdown(o => !o)}
                  onSelect={(r) => { setSelectedRellenoName(r.name); setSelectedRellenoId(r.id); setShowRellenoDropdown(false); }}
                  onClear={() => { setSelectedRellenoName(''); setSelectedRellenoId(null); }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={lCls}>Cantidad</span>
              <input type="number" min="0" value={neCantidad} onChange={(e) => setNeCantidad(e.target.value)} placeholder="0"
                className={`${iCls} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
            </div>
            <div>
              <span className={lCls}>Costo unitario</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                <input type="number" min="0" step="0.01" value={neCostoUnit} onChange={(e) => setNeCostoUnit(e.target.value)} placeholder="0.00"
                  className={`${iCls} pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
              </div>
            </div>
            <div>
              <span className={lCls}>Total</span>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-gray-500 bg-gray-50 tabular-nums dark:bg-white/5 dark:border-[#382C2E] dark:text-gray-400">
                {formatCurrency(costoTotalPreview)}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <span className={lCls}>Descripción</span>
          <textarea value={neDescripcion} onChange={(e) => setNeDescripcion(e.target.value)}
            placeholder="Descripción del elemento..." rows={2} className={`${iCls} resize-none`} />
        </div>
        <div className="flex justify-end pt-4 border-t border-[#E9D9D9] dark:border-[#382C2E]">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditElementoModal ────────────────────────────────────────────────────────
interface EditElementoModalProps {
  record: Record;
  elementosTable: Table;
  catalogoProductos: Record[];
  catalogoPanes: Record[];
  catalogoRellenos: Record[];
  onClose: () => void;
}

function EditElementoModal({
  record, elementosTable,
  catalogoProductos, catalogoPanes, catalogoRellenos,
  onClose,
}: EditElementoModalProps) {
  const nombreField    = elementosTable.getFieldIfExists(FIELD_IDS.EL_NOMBRE);
  const productoField  = elementosTable.getFieldIfExists(FIELD_IDS.EL_PRODUCTO);
  const panField       = elementosTable.getFieldIfExists(FIELD_IDS.EL_PAN);
  const rellenoField   = elementosTable.getFieldIfExists(FIELD_IDS.EL_RELLENO);
  const descripField   = elementosTable.getFieldIfExists(FIELD_IDS.EL_DESCRIPCION);
  const cantidadField  = elementosTable.getFieldIfExists(FIELD_IDS.EL_CANTIDAD);
  const costoUnitField = elementosTable.getFieldIfExists(FIELD_IDS.EL_COSTO_UNITARIO);
  const costoTotField  = elementosTable.getFieldIfExists(FIELD_IDS.EL_COSTO_TOTAL);

  const productoRaw    = productoField ? (record.getCellValue(productoField) as { id: string }[] | null) : null;
  const initProductoId = productoRaw?.[0]?.id ?? null;
  const initNombre     = nombreField   ? record.getCellValueAsString(nombreField)   : '';
  const panLinked    = panField    ? (record.getCellValue(panField)    as { id: string; name: string }[] | null) : null;
  const rellenoLinked = rellenoField ? (record.getCellValue(rellenoField) as { id: string; name: string }[] | null) : null;
  const initPan     = panLinked?.[0]?.name     ?? '';
  const initRelleno = rellenoLinked?.[0]?.name ?? '';

  const [selectedProductoId,  setSelectedProductoId]  = useState<string | null>(initProductoId);
  const [nombre,    setNombre]   = useState(initNombre);
  const [pan,       setPan]      = useState(initPan);
  const [relleno,   setRelleno]  = useState(initRelleno);
  const [descrip,   setDescrip]  = useState(descripField  ? record.getCellValueAsString(descripField)  : '');
  const cantidadRaw  = cantidadField  ? (record.getCellValue(cantidadField)  as number | null) : null;
  const costoUnitRaw = costoUnitField ? (record.getCellValue(costoUnitField) as number | null) : null;
  const [cantidad,  setCantidad]  = useState(cantidadRaw  !== null ? String(cantidadRaw)  : '');
  const [costoUnit, setCostoUnit] = useState(costoUnitRaw !== null ? String(costoUnitRaw) : '');
  const [showNombreDropdown,  setShowNombreDropdown]  = useState(false);
  const [showPanDropdown,     setShowPanDropdown]     = useState(false);
  const [showRellenoDropdown, setShowRellenoDropdown] = useState(false);
  const nombreRef  = useRef<HTMLDivElement>(null);
  const panRef     = useRef<HTMLDivElement>(null);
  const rellenoRef = useRef<HTMLDivElement>(null);

  const showPastelFields = esProductoConRellenoYPan(nombre);
  const costoTotalRecord  = costoTotField ? (record.getCellValue(costoTotField) as number | null) : null;
  const costoTotalPreview = useMemo(() => (parseFloat(cantidad) || 0) * (parseFloat(costoUnit) || 0), [cantidad, costoUnit]);
  const costoTotalDisplay = costoTotalRecord !== null ? costoTotalRecord : costoTotalPreview;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (nombreRef.current  && !nombreRef.current.contains(e.target as Node))  setShowNombreDropdown(false);
      if (panRef.current     && !panRef.current.contains(e.target as Node))     setShowPanDropdown(false);
      if (rellenoRef.current && !rellenoRef.current.contains(e.target as Node)) setShowRellenoDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const canUpdate = elementosTable.hasPermissionToUpdateRecords();
  const save = useCallback((fieldId: string, value: unknown) => {
    if (!canUpdate) return;
    queueWrite(() => elementosTable.updateRecordAsync(record.id, { [fieldId]: value }))
      .catch(err => console.error('Error al guardar campo elemento:', err));
  }, [canUpdate, elementosTable, record.id]);

  const lCls = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  const iCls = `w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600${!canUpdate ? ' bg-gray-50 cursor-not-allowed' : ''}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl p-5 dark:bg-[#251D1F]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-lg text-gray-900 dark:text-[#F5F3EF]">Editar Elemento</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={18} /></button>
        </div>
        {!canUpdate && <p className="text-sm text-rose-500 mb-4 dark:text-rose-400">Sin permisos de edición.</p>}
        <div className="mb-4">
          <div className={`grid gap-3 ${showPastelFields ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div ref={nombreRef} className="relative">
              <CatalogDropdown
                label="Nombre"
                value={nombre}
                records={catalogoProductos}
                placeholder="Seleccionar producto..."
                showOpen={showNombreDropdown}
                disabled={!canUpdate}
                onToggle={() => canUpdate && setShowNombreDropdown(o => !o)}
                onSelect={(r) => {
                  setSelectedProductoId(r.id); setNombre(r.name); setShowNombreDropdown(false);
                  save(FIELD_IDS.EL_PRODUCTO, [{ id: r.id }]);
                }}
                onClear={() => {
                  setSelectedProductoId(null); setNombre('');
                  save(FIELD_IDS.EL_PRODUCTO, []);
                }}
              />
            </div>
            {showPastelFields && (
              <div ref={panRef} className="relative">
                <CatalogDropdown
                  label="Pan"
                  value={pan}
                  records={catalogoPanes}
                  placeholder="Tipo de pan..."
                  showOpen={showPanDropdown}
                  disabled={!canUpdate}
                  onToggle={() => canUpdate && setShowPanDropdown(o => !o)}
                  onSelect={(r) => { setPan(r.name); setShowPanDropdown(false); save(FIELD_IDS.EL_PAN, [{ id: r.id }]); }}
                  onClear={() => { setPan(''); save(FIELD_IDS.EL_PAN, []); }}
                />
              </div>
            )}
            {showPastelFields && (
              <div ref={rellenoRef} className="relative">
                <CatalogDropdown
                  label="Relleno"
                  value={relleno}
                  records={catalogoRellenos}
                  placeholder="Tipo de relleno..."
                  showOpen={showRellenoDropdown}
                  disabled={!canUpdate}
                  onToggle={() => canUpdate && setShowRellenoDropdown(o => !o)}
                  onSelect={(r) => { setRelleno(r.name); setShowRellenoDropdown(false); save(FIELD_IDS.EL_RELLENO, [{ id: r.id }]); }}
                  onClear={() => { setRelleno(''); save(FIELD_IDS.EL_RELLENO, []); }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={lCls}>Cantidad</span>
              <input type="number" min="0" value={cantidad} readOnly={!canUpdate}
                onChange={(e) => setCantidad(e.target.value)}
                onBlur={() => save(FIELD_IDS.EL_CANTIDAD, parseFloat(cantidad) || null)}
                placeholder="0"
                className={`${iCls} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
            </div>
            <div>
              <span className={lCls}>Costo unitario</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                <input type="number" min="0" step="0.01" value={costoUnit} readOnly={!canUpdate}
                  onChange={(e) => setCostoUnit(e.target.value)}
                  onBlur={() => save(FIELD_IDS.EL_COSTO_UNITARIO, parseFloat(costoUnit) || null)}
                  placeholder="0.00"
                  className={`${iCls} pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties} />
              </div>
            </div>
            <div>
              <span className={lCls}>Total</span>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-semibold tabular-nums bg-gray-50 dark:bg-white/5 dark:border-[#382C2E] dark:text-gray-300 text-gray-700">
                {formatCurrency(costoTotalDisplay)}
              </div>
            </div>
          </div>
        </div>
        <div>
          <span className={lCls}>Descripción</span>
          <textarea value={descrip} readOnly={!canUpdate}
            onChange={(e) => setDescrip(e.target.value)}
            onBlur={() => save(FIELD_IDS.EL_DESCRIPCION, descrip.trim() || null)}
            placeholder="Descripción del elemento..." rows={2}
            className={`${iCls} resize-none`} />
        </div>
      </div>
    </div>
  );
}

// ─── CakeTopperDetailModal ────────────────────────────────────────────────────
interface CakeTopperDetailModalProps {
  record: Record; cakeTopperTable: Table; onClose: () => void;
}

function CakeTopperDetailModal({ record, cakeTopperTable, onClose }: CakeTopperDetailModalProps) {
  const nombreField  = cakeTopperTable.getFieldIfExists(FIELD_IDS.CT_NOMBRE);
  const fechaField   = cakeTopperTable.getFieldIfExists(FIELD_IDS.CT_FECHA);
  const medidasField = cakeTopperTable.getFieldIfExists(FIELD_IDS.CT_MEDIDAS);
  const costoField   = cakeTopperTable.getFieldIfExists(FIELD_IDS.CT_COSTO);
  const [nombre, setNombre] = useState(nombreField ? record.getCellValueAsString(nombreField) : '');
  const fechaRaw      = fechaField ? (record.getCellValue(fechaField) as string | null) : null;
  const initFechaDate = fechaRaw ? new Date(fechaRaw) : null;
  const [fechaDate,        setFechaDate]        = useState<Date | null>(initFechaDate);
  const [fechaDateDisplay, setFechaDateDisplay] = useState(initFechaDate ? formatFriendlyDate(formatDateForComparison(initFechaDate)) : '');
  const [fechaTime, setFechaTime] = useState(initFechaDate ? `${String(initFechaDate.getHours()).padStart(2,'0')}:${String(initFechaDate.getMinutes()).padStart(2,'0')}` : '');
  const [showFechaCalendar, setShowFechaCalendar] = useState(false);
  const preventReopenFechaRef = useRef(false);
  const handleFechaCalendarClose = useCallback(() => { preventReopenFechaRef.current = true; setShowFechaCalendar(false); requestAnimationFrame(() => { preventReopenFechaRef.current = false; }); }, []);
  const costoRaw = costoField ? (record.getCellValue(costoField) as number | null) : null;
  const [medidas, setMedidas] = useState(medidasField ? record.getCellValueAsString(medidasField) : '');
  const [costo,   setCosto]   = useState(costoRaw !== null ? String(costoRaw) : '');
  const saveFechaToAirtable = useCallback((date: Date | null, time: string) => {
    if (!fechaField) return;
    const d = date ? new Date(date) : new Date();
    if (time) { const parts = time.split(':').map(Number); d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0); }
    queueWrite(() => cakeTopperTable.updateRecordAsync(record.id, { [FIELD_IDS.CT_FECHA]: d.toISOString() })).catch(err => console.error(err));
  }, [fechaField, cakeTopperTable, record.id]);
  const handleNombreBlur  = () => { if (!nombreField) return; queueWrite(() => cakeTopperTable.updateRecordAsync(record.id, { [FIELD_IDS.CT_NOMBRE]: nombre.trim() || null })).catch(err => console.error(err)); };
  const handleFechaDateBlur = () => {
    if (!fechaDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaDateDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFechaToAirtable(parsed, fechaTime); }
    else setFechaDateDisplay(fechaDate ? formatFriendlyDate(formatDateForComparison(fechaDate)) : '');
  };
  const handleMedidasBlur = () => { if (!medidasField) return; queueWrite(() => cakeTopperTable.updateRecordAsync(record.id, { [FIELD_IDS.CT_MEDIDAS]: medidas.trim() || null })).catch(err => console.error(err)); };
  const handleCostoBlur   = () => { if (!costoField) return; queueWrite(() => cakeTopperTable.updateRecordAsync(record.id, { [FIELD_IDS.CT_COSTO]: parseFloat(costo) || null })).catch(err => console.error(err)); };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);
  const labelCls = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-start justify-between">
          <div>
            <h2 className="font-bold text-2xl text-gray-900 dark:text-[#F5F3EF]">Detalles de Cake Topper</h2>
            <p className="text-2xl font-normal text-gray-700 mt-0.5 dark:text-gray-400">{toTitleCase(nombre) || 'Sin nombre'}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
          <div className="mb-5">
            <span className={labelCls}>Nombre</span>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={handleNombreBlur} placeholder="Nombre del cake topper..." className={inputCls} />
          </div>
          <div className="mb-5 w-1/2">
            <span className={labelCls}>Fecha de entrega de Producción</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaDateDisplay} onChange={(e) => setFechaDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaRef.current) setShowFechaCalendar(true); }}
                  onBlur={handleFechaDateBlur} placeholder="ej. 26 de mayo de 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100" />
                <button type="button" onClick={() => setShowFechaCalendar((o) => !o)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"><CalendarIcon size={15} /></button>
                {showFechaCalendar && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaDate(d); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaCalendar(false); saveFechaToAirtable(d, fechaTime); }} onClose={handleFechaCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0">
                <CustomTimePicker value={fechaTime} onChange={(time) => { setFechaTime(time); saveFechaToAirtable(fechaDate, time); }} />
              </div>
            </div>
          </div>
          <div className="mb-5">
            <span className={labelCls}>Medidas</span>
            <textarea value={medidas} onChange={(e) => setMedidas(e.target.value)} onBlur={handleMedidasBlur} placeholder="Medidas y especificaciones..." rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div className="mb-5">
            <span className={labelCls}>Costo</span>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
              <input type="number" min="0" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} onBlur={handleCostoBlur} placeholder="0.00" className={`${inputCls} pl-7`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PedidoDetailModal (Incluye elementos y cake toppers) ─────────────────────
interface PedidoDetailModalProps {
  record: Record;
  pedidosTable: Table;
  elementosTable: Table | undefined;
  cakeTopperTable: Table | undefined;
  elementoRecords: Record[];
  cakeTopperRecords: Record[];
  catalogoProductos: Record[];
  catalogoPanes: Record[];
  catalogoRellenos: Record[];
  onClose: () => void;
}

function PedidoDetailModal({
  record, pedidosTable, elementosTable, cakeTopperTable,
  elementoRecords, cakeTopperRecords,
  catalogoProductos, catalogoPanes, catalogoRellenos,
  onClose,
}: PedidoDetailModalProps) {
  const pedidoIdField        = pedidosTable.getFieldIfExists(FIELD_IDS.PEDIDO_ID);
  const metodoContactoField  = pedidosTable.getFieldIfExists(FIELD_IDS.METODO_CONTACTO);
  const numeroTelefonoField  = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_TELEFONO);
  const fechaEntregaField    = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
  const fechaEntregaClienteField = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA_CLIENTE);
  const estatusField         = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
  const impresoField         = pedidosTable.getFieldIfExists(FIELD_IDS.IMPRESO);
  const costoTotalField      = pedidosTable.getFieldIfExists(FIELD_IDS.COSTO_TOTAL);
  const anticipoField        = pedidosTable.getFieldIfExists(FIELD_IDS.ANTICIPO);
  const liquidadoField       = pedidosTable.getFieldIfExists(FIELD_IDS.LIQUIDADO);
  const restanteField        = pedidosTable.getFieldIfExists(FIELD_IDS.RESTANTE);
  const elementosLinkField   = pedidosTable.getFieldIfExists(FIELD_IDS.ELEMENTOS);
  const cakeTopperLinkField  = pedidosTable.getFieldIfExists(FIELD_IDS.CAKE_TOPPER);
  const clienteTextField     = pedidosTable.getFieldIfExists(FIELD_IDS.CLIENTE);
  const numeroNotaField      = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_NOTA);
  const elNombreField        = elementosTable?.getFieldIfExists(FIELD_IDS.EL_NOMBRE);
  const elDescripcionField   = elementosTable?.getFieldIfExists(FIELD_IDS.EL_DESCRIPCION);
  const elCostoTotalField    = elementosTable?.getFieldIfExists(FIELD_IDS.EL_COSTO_TOTAL);
  const elCantidadField      = elementosTable?.getFieldIfExists(FIELD_IDS.EL_CANTIDAD);
  const elPanField           = elementosTable?.getFieldIfExists(FIELD_IDS.EL_PAN);
  const elRellenoField       = elementosTable?.getFieldIfExists(FIELD_IDS.EL_RELLENO);
  const ctNombreField        = cakeTopperTable?.getFieldIfExists(FIELD_IDS.CT_NOMBRE);

  const fechaValue       = fechaEntregaField ? (record.getCellValue(fechaEntregaField) as string | null) : null;
  const initialFechaDate = fechaValue ? new Date(fechaValue) : null;
  const [fechaDate,        setFechaDate]        = useState<Date | null>(initialFechaDate);
  const [fechaDateDisplay, setFechaDateDisplay] = useState(initialFechaDate ? formatFriendlyDate(formatDateForComparison(initialFechaDate)) : '');
  const [fechaTime, setFechaTime] = useState(initialFechaDate ? `${String(initialFechaDate.getHours()).padStart(2,'0')}:${String(initialFechaDate.getMinutes()).padStart(2,'0')}` : '');
  const [showFechaCalendar, setShowFechaCalendar] = useState(false);
  const preventReopenFechaRef = useRef(false);
  const handleFechaCalendarClose = useCallback(() => { preventReopenFechaRef.current = true; setShowFechaCalendar(false); requestAnimationFrame(() => { preventReopenFechaRef.current = false; }); }, []);

  const fechaClienteValue       = fechaEntregaClienteField ? (record.getCellValue(fechaEntregaClienteField) as string | null) : null;
  const initialFechaClienteDate = fechaClienteValue ? new Date(fechaClienteValue) : null;
  const [fechaClienteDate,        setFechaClienteDate]        = useState<Date | null>(initialFechaClienteDate);
  const [fechaClienteDateDisplay, setFechaClienteDateDisplay] = useState(initialFechaClienteDate ? formatFriendlyDate(formatDateForComparison(initialFechaClienteDate)) : '');
  const [fechaClienteTime, setFechaClienteTime] = useState(initialFechaClienteDate ? `${String(initialFechaClienteDate.getHours()).padStart(2,'0')}:${String(initialFechaClienteDate.getMinutes()).padStart(2,'0')}` : '');
  const [showFechaClienteCalendar, setShowFechaClienteCalendar] = useState(false);
  const preventReopenFechaClienteRef = useRef(false);
  const handleFechaClienteCalendarClose = useCallback(() => { preventReopenFechaClienteRef.current = true; setShowFechaClienteCalendar(false); requestAnimationFrame(() => { preventReopenFechaClienteRef.current = false; }); }, []);

  const estatusValue = estatusField ? (record.getCellValue(estatusField) as { name: string } | null) : null;
  const [estatus, setEstatus] = useState(estatusValue?.name ?? '');
  const [showEstatusDropdown, setShowEstatusDropdown] = useState(false);
  const estatusRef = useRef<HTMLDivElement>(null);

  const impresoValue = impresoField ? (record.getCellValue(impresoField) as boolean | null) : null;
  const [impreso, setImpreso] = useState(Boolean(impresoValue));

  const anticipoRaw  = anticipoField  ? (record.getCellValue(anticipoField)  as number | null) : null;
  const liquidadoRaw = liquidadoField ? (record.getCellValue(liquidadoField) as number | null) : null;
  const [anticipo,  setAnticipo]  = useState(anticipoRaw  !== null ? String(anticipoRaw)  : '');
  const [liquidado, setLiquidado] = useState(liquidadoRaw !== null ? String(liquidadoRaw) : '');

  const linkedElementos = elementosLinkField ? (record.getCellValue(elementosLinkField) as { id: string; name: string }[] | null) : null;
  const matchedElementos = useMemo(() => {
    if (!linkedElementos) return [];
    return linkedElementos.map((link) => elementoRecords.find((r) => r.id === link.id)).filter((r): r is Record => r !== undefined);
  }, [linkedElementos, elementoRecords]);

  const [editElementoRecord, setEditElementoRecord] = useState<Record | null>(null);

  const linkedCakeToppers = cakeTopperLinkField ? (record.getCellValue(cakeTopperLinkField) as { id: string }[] | null) : null;
  const matchedCakeTopper = useMemo(() => {
    if (!linkedCakeToppers || linkedCakeToppers.length === 0) return null;
    return cakeTopperRecords.find((r) => r.id === linkedCakeToppers[0]?.id) ?? null;
  }, [linkedCakeToppers, cakeTopperRecords]);

  const [showCakeTopperDetail, setShowCakeTopperDetail] = useState(false);
  const [showNuevoElemento,    setShowNuevoElemento]    = useState(false);
  const canCreateCakeTopper = cakeTopperTable ? cakeTopperTable.hasPermissionToCreateRecords() : false;
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (estatusRef.current && !estatusRef.current.contains(e.target as Node)) setShowEstatusDropdown(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const saveFechaToAirtable = useCallback((date: Date | null, time: string) => {
    if (!fechaEntregaField) return;
    const d = date ? new Date(date) : new Date();
    if (time) { const parts = time.split(':').map(Number); d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0); }
    queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.FECHA_ENTREGA]: d.toISOString() })).catch((err) => console.error(err));
  }, [fechaEntregaField, pedidosTable, record.id]);

  const saveFechaClienteToAirtable = useCallback((date: Date | null, time: string) => {
    if (!fechaEntregaClienteField) return;
    const d = date ? new Date(date) : new Date();
    if (time) { const parts = time.split(':').map(Number); d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0); }
    queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.FECHA_ENTREGA_CLIENTE]: d.toISOString() })).catch((err) => console.error(err));
  }, [fechaEntregaClienteField, pedidosTable, record.id]);

  const handleFechaDateBlur = () => {
    if (!fechaDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaDateDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFechaToAirtable(parsed, fechaTime); }
    else setFechaDateDisplay(fechaDate ? formatFriendlyDate(formatDateForComparison(fechaDate)) : '');
  };

  const handleFechaClienteDateBlur = () => {
    if (!fechaClienteDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaClienteDateDisplay);
    if (parsed) { setFechaClienteDate(parsed); setFechaClienteDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFechaClienteToAirtable(parsed, fechaClienteTime); }
    else setFechaClienteDateDisplay(fechaClienteDate ? formatFriendlyDate(formatDateForComparison(fechaClienteDate)) : '');
  };

  const handleImpresoToggle = () => {
    const newVal = !impreso; setImpreso(newVal);
    queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.IMPRESO]: newVal })).catch((err) => { console.error(err); setImpreso(!newVal); });
  };

  const handleEstatusChange = (newValue: string) => {
    setEstatus(newValue); setShowEstatusDropdown(false);
    queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.ESTATUS]: { name: newValue } })).catch((err) => console.error(err));
  };

  const handleAnticipoBlur  = () => { queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.ANTICIPO]:  parseFloat(anticipo)  || null })).catch((err) => console.error(err)); };
  const handleLiquidadoBlur = () => { queueWrite(() => pedidosTable.updateRecordAsync(record.id, { [FIELD_IDS.LIQUIDADO]: parseFloat(liquidado) || null })).catch((err) => console.error(err)); };

  const labelClasses = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  const sharedInput  = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100';

  const costoTotal     = costoTotalField ? (record.getCellValue(costoTotalField) as number | null) : null;
  const restante       = restanteField   ? (record.getCellValue(restanteField)   as number | null) : null;
  const metodoContacto = metodoContactoField ? (record.getCellValue(metodoContactoField) as { name: string } | null)?.name : null;
  const telefono       = numeroTelefonoField ? record.getCellValueAsString(numeroTelefonoField) : '';
  const pedidoId       = pedidoIdField ? record.getCellValueAsString(pedidoIdField) : 'Sin ID';



  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-[60vw] max-w-[60vw] min-w-[560px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-start justify-between">
          <div>
            <h2 className="font-bold text-2xl text-gray-900 dark:text-[#F5F3EF]">Detalles de pedido</h2>
            <p className="text-2xl font-normal text-gray-700 mt-0.5 dark:text-gray-400">{toTitleCase(pedidoId)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-5">
            <ContactoPill value={metodoContacto} large />
            <span className="text-base text-gray-700 dark:text-gray-300">{telefono || '—'}</span>
          </div>
          <div className="mb-5 w-1/2">
            <span className={labelClasses}>Fecha de entrega de producción</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaDateDisplay} onChange={(e) => setFechaDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaRef.current) setShowFechaCalendar(true); }}
                  onBlur={handleFechaDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${sharedInput} pr-9`} />
                <button type="button" onClick={() => setShowFechaCalendar((o) => !o)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"><CalendarIcon size={15} /></button>
                {showFechaCalendar && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaDate(d); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaCalendar(false); saveFechaToAirtable(d, fechaTime); }} onClose={handleFechaCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0">
                <CustomTimePicker value={fechaTime} onChange={(time) => { setFechaTime(time); saveFechaToAirtable(fechaDate, time); }} />
              </div>
            </div>
          </div>
          <div className="mb-5 w-1/2">
            <span className={labelClasses}>Fecha de entrega al cliente</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaClienteDateDisplay} onChange={(e) => setFechaClienteDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaClienteRef.current) setShowFechaClienteCalendar(true); }}
                  onBlur={handleFechaClienteDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${sharedInput} pr-9`} />
                <button type="button" onClick={() => setShowFechaClienteCalendar((o) => !o)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"><CalendarIcon size={15} /></button>
                {showFechaClienteCalendar && <MiniCalendar selectedDate={fechaClienteDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaClienteDate(d); setFechaClienteDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaClienteCalendar(false); saveFechaClienteToAirtable(d, fechaClienteTime); }} onClose={handleFechaClienteCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0">
                <CustomTimePicker value={fechaClienteTime} onChange={(time) => { setFechaClienteTime(time); saveFechaClienteToAirtable(fechaClienteDate, time); }} />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-6 mb-5">
            <div>
              <span className="text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500">Estatus</span>
              <div className="relative" ref={estatusRef}>
                <button type="button" onClick={() => setShowEstatusDropdown((o) => !o)}
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-base font-semibold border transition-colors cursor-pointer ${estatus === 'Entregado' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30' : estatus === 'Pendiente' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/10 dark:text-gray-500 dark:border-white/10'}`}>
                  {estatus || 'Sin estatus'}
                </button>
                {showEstatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden p-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                    {['Pendiente', 'Entregado'].map((opt) => (
                      <button key={opt} type="button" onClick={() => handleEstatusChange(opt)}
                        className="w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 dark:text-gray-300">
                        <span className={`inline-block w-2 h-2 rounded-full ${opt === 'Pendiente' ? 'bg-rose-400' : 'bg-green-500'}`} />{opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500">Impresión</span>
              <button type="button" onClick={impreso ? undefined : handleImpresoToggle}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base font-semibold border transition-colors ${impreso ? 'bg-green-50 text-green-700 border-green-200 cursor-default dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'}`}>
                {impreso ? (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Impreso</>) : 'Sin imprimir'}
              </button>
            </div>
            <div>
              <span className="text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500">Cake Topper</span>
              {matchedCakeTopper ? (
                <button type="button" onClick={() => setShowCakeTopperDetail(true)}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-base font-semibold bg-white text-gray-700 border border-[#E9D9D9] hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer whitespace-nowrap dark:bg-[#251D1F] dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">
                  {toTitleCase(ctNombreField ? matchedCakeTopper.getCellValueAsString(ctNombreField) || 'Sin nombre' : 'Sin nombre')}
                </button>
              ) : (
                <button type="button" onClick={() => window.open('https://airtable.com/appSQk87nF0WpH2gi/pagxzFmU6PHk6Jor8/form', '_blank', 'noopener,noreferrer')}
                  className="w-9 h-9 border border-[#E9D9D9] rounded-lg text-gray-500 hover:border-rose-400 hover:text-rose-500 transition-colors flex items-center justify-center text-lg font-medium dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-400 dark:hover:text-rose-400">+</button>
              )}
            </div>
          </div>
          <div className="mb-5">
            <span className={labelClasses}>Financiero</span>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-400 capitalize mb-1 block dark:text-gray-500">Total</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-[#F5F3EF]">{formatCurrency(costoTotal)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400 capitalize mb-1 block dark:text-gray-500">Anticipo</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                  <input type="number" min="0" step="0.01" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} onBlur={handleAnticipoBlur}
                    className="w-full border border-gray-300 rounded-lg py-2 pl-7 pr-3 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 tabular-nums dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100" />
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400 capitalize mb-1 block dark:text-gray-500">Liquidado</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                  <input type="number" min="0" step="0.01" value={liquidado} onChange={(e) => setLiquidado(e.target.value)} onBlur={handleLiquidadoBlur}
                    className="w-full border border-gray-300 rounded-lg py-2 pl-7 pr-3 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 tabular-nums dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100" />
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400 capitalize mb-1 block dark:text-gray-500">Restante</span>
                <span className={`text-lg font-semibold ${restante !== null && restante > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(restante)}</span>
              </div>
            </div>
          </div>
          <div className="mb-5">
            <span className={labelClasses}>Elementos</span>
            <div className="w-full rounded-xl border border-[#E5E1DA] overflow-hidden dark:border-[#382C2E]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
                  <tr>
                    {['Nombre','Descripción','Cantidad','Costo Unit.','Total'].map(h => (
                      <th key={h} className="px-3 py-2 text-sm font-semibold text-gray-700 capitalize text-left dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchedElementos.length === 0
                    ? <tr><td colSpan={5} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Sin elementos.</td></tr>
                    : matchedElementos.map((el) => {
                        const elNombre    = elNombreField      ? el.getCellValueAsString(elNombreField)      : '';
                        const descripcion = elDescripcionField ? el.getCellValueAsString(elDescripcionField) : '';
                        const total       = elCostoTotalField  ? (el.getCellValue(elCostoTotalField) as number | null) : null;
                        const cantidad    = elementosTable?.getFieldIfExists(FIELD_IDS.EL_CANTIDAD)
                          ? (el.getCellValue(elementosTable.getFieldIfExists(FIELD_IDS.EL_CANTIDAD)!) as number | null) : null;
                        const costoUnit   = elementosTable?.getFieldIfExists(FIELD_IDS.EL_COSTO_UNITARIO)
                          ? (el.getCellValue(elementosTable.getFieldIfExists(FIELD_IDS.EL_COSTO_UNITARIO)!) as number | null) : null;
                        return (
                          <tr key={el.id} onClick={() => setEditElementoRecord(el)}
                            className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5" title="Clic para editar">
                            <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300">{elNombre}</td>
                            <td className="px-3 py-2 text-base text-gray-700 max-w-[160px] dark:text-gray-300"><span className="line-clamp-2">{descripcion || '—'}</span></td>
                            <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{cantidad ?? '—'}</td>
                            <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{costoUnit !== null ? formatCurrency(costoUnit) : '—'}</td>
                            <td className="px-3 py-2 text-base font-medium text-gray-700 tabular-nums dark:text-gray-300">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
            {elementosTable && (
              <button type="button" onClick={() => setShowNuevoElemento(true)} title="Agregar elemento"
                className="mt-2 w-8 h-8 flex items-center justify-center bg-white border border-[#E9D9D9] rounded-lg text-gray-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500 transition-colors text-lg font-medium dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-400 dark:hover:text-rose-400">+</button>
            )}
          </div>
        </div>
      </div>
      {showCakeTopperDetail && matchedCakeTopper && cakeTopperTable && <CakeTopperDetailModal record={matchedCakeTopper} cakeTopperTable={cakeTopperTable} onClose={() => setShowCakeTopperDetail(false)} />}
      {showNuevoElemento && elementosTable && (
        <NuevoElementoModal
          pedidoRecordId={record.id} elementosTable={elementosTable}
          catalogoProductos={catalogoProductos} catalogoPanes={catalogoPanes} catalogoRellenos={catalogoRellenos}
          onClose={() => setShowNuevoElemento(false)}
        />
      )}
      {editElementoRecord && elementosTable && (
        <EditElementoModal
          record={editElementoRecord} elementosTable={elementosTable}
          catalogoProductos={catalogoProductos} catalogoPanes={catalogoPanes} catalogoRellenos={catalogoRellenos}
          onClose={() => setEditElementoRecord(null)}
        />
      )}
    </div>
  );
}

// ─── NuevoPedidoModal ─────────────────────────────────────────────────────────
interface NuevoPedidoModalProps { pedidosTable: Table; onClose: (newRecordId?: string) => void; }
function NuevoPedidoModal({ pedidosTable, onClose }: NuevoPedidoModalProps) {
  const clienteField  = pedidosTable.getFieldIfExists(FIELD_IDS.CLIENTE);
  const fechaField    = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
  const fechaClienteField = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA_CLIENTE);
  const metodoField   = pedidosTable.getFieldIfExists(FIELD_IDS.METODO_CONTACTO);
  const telefonoField = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_TELEFONO);
  const estatusField  = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
  const [cliente,     setCliente]     = useState('');
  const [fechaDate,   setFechaDate]   = useState<Date | null>(null);
  const [fechaDisplay,setFechaDisplay]= useState('');
  const [fechaTime,   setFechaTime]   = useState('');
  const [showCal,     setShowCal]     = useState(false);
  const [fechaClienteDate,   setFechaClienteDate]   = useState<Date | null>(null);
  const [fechaClienteDisplay,setFechaClienteDisplay]= useState('');
  const [fechaClienteTime,   setFechaClienteTime]   = useState('');
  const [showCalCliente,     setShowCalCliente]     = useState(false);
  const [metodo,      setMetodo]      = useState('');
  const [showMetodo,  setShowMetodo]  = useState(false);
  const [telefono,    setTelefono]    = useState('');
  const [estatus,     setEstatus]     = useState('Pendiente');
  const [showEstatus, setShowEstatus] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const preventReopenCalRef = useRef(false);
  const preventReopenCalClienteRef = useRef(false);
  const metodoRef  = useRef<HTMLDivElement>(null);
  const estatusRef = useRef<HTMLDivElement>(null);
  const modalRef   = useRef<HTMLDivElement>(null);
  const metodoOptions: string[] = useMemo(() => {
    if (!metodoField) return ['WhatsApp', 'Facebook', 'Instagram'];
    return ((metodoField as any).options?.choices ?? []).map((c: { name: string }) => c.name);
  }, [metodoField]);
  const estatusOptions: string[] = useMemo(() => {
    if (!estatusField) return ['Pendiente', 'Entregado'];
    return ((estatusField as any).options?.choices ?? []).map((c: { name: string }) => c.name);
  }, [estatusField]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (metodoRef.current && !metodoRef.current.contains(e.target as Node)) setShowMetodo(false);
      if (estatusRef.current && !estatusRef.current.contains(e.target as Node)) setShowEstatus(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);
  const handleCalClose = useCallback(() => {
    preventReopenCalRef.current = true; setShowCal(false);
    requestAnimationFrame(() => { preventReopenCalRef.current = false; });
  }, []);
  const handleCalClienteClose = useCallback(() => {
    preventReopenCalClienteRef.current = true; setShowCalCliente(false);
    requestAnimationFrame(() => { preventReopenCalClienteRef.current = false; });
  }, []);
  const handleFechaBlur = () => {
    const parsed = parseTypedDate(fechaDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDisplay(formatFriendlyDate(formatDateForComparison(parsed))); }
  };
  const handleFechaClienteBlur = () => {
    const parsed = parseTypedDate(fechaClienteDisplay);
    if (parsed) { setFechaClienteDate(parsed); setFechaClienteDisplay(formatFriendlyDate(formatDateForComparison(parsed))); }
  };
  const canCreate = pedidosTable.hasPermissionToCreateRecords();
  const handleSave = async () => {
    if (!cliente.trim()) { setError('El nombre del cliente es requerido.'); return; }
    if (!canCreate) { setError('Sin permisos para crear pedidos.'); return; }
    setSaving(true); setError('');
    try {
      const fields: { [key: string]: unknown } = {};
      if (clienteField && cliente.trim())      fields[FIELD_IDS.CLIENTE]         = cliente.trim();
      if (telefonoField && telefono.trim())     fields[FIELD_IDS.NUMERO_TELEFONO] = telefono.trim();
      if (metodoField && metodo)                fields[FIELD_IDS.METODO_CONTACTO] = { name: metodo };
      if (estatusField && estatus)              fields[FIELD_IDS.ESTATUS]         = { name: estatus };
      if (fechaField && fechaDate) {
        const d = new Date(fechaDate);
        if (fechaTime) { const parts = fechaTime.split(':').map(Number); d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0); }
        fields[FIELD_IDS.FECHA_ENTREGA] = d.toISOString();
      }
      if (fechaClienteField && fechaClienteDate) {
        const d = new Date(fechaClienteDate);
        if (fechaClienteTime) { const parts = fechaClienteTime.split(':').map(Number); d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0); }
        fields[FIELD_IDS.FECHA_ENTREGA_CLIENTE] = d.toISOString();
      }
      const newRecordId = await queueWrite(() => pedidosTable.createRecordAsync(fields));
      onClose(newRecordId);
    } catch (err) { console.error('Error al crear pedido:', err); setError('Ocurrió un error. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };
  const labelCls = 'text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500';
  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-rose-400';
  const dropdownItemBase = 'w-full text-left px-3 py-2 text-base transition-colors rounded-md dark:text-gray-300';
  function metoDoActiveClass(opt: string) {
    const lower = opt.toLowerCase();
    if (lower === 'whatsapp') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
    if (lower === 'facebook') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
    if (lower === 'instagram') return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/10';
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F3EF]">Nuevo Pedido</h2>
            <p className="text-sm text-gray-400 mt-0.5 dark:text-gray-500">Completa los datos del pedido</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div>
            <span className={labelCls}>Cliente <span className="text-rose-400 normal-case tracking-normal">*</span></span>
            <input type="text" value={cliente} onChange={(e) => { setCliente(e.target.value); if (error) setError(''); }} placeholder="Nombre del cliente..."
              className={`${inputCls} ${!cliente.trim() && error ? 'border-rose-400 ring-1 ring-rose-300' : ''}`} />
          </div>
          <div>
            <span className={labelCls}>Fecha de entrega de producción</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaDisplay} onChange={(e) => setFechaDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenCalRef.current) setShowCal(true); }}
                  onBlur={handleFechaBlur} placeholder="ej. 26 de mayo de 2026" className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowCal(o => !o)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"><CalendarIcon size={15} /></button>
                {showCal && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { setFechaDate(date); setFechaDisplay(formatFriendlyDate(formatDateForComparison(date))); setShowCal(false); }} onClose={handleCalClose} />}
              </div>
              <div className="w-28 flex-shrink-0"><CustomTimePicker value={fechaTime} onChange={setFechaTime} placeholder="Hora" /></div>
            </div>
          </div>
          <div>
            <span className={labelCls}>Fecha de entrega al cliente</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaClienteDisplay} onChange={(e) => setFechaClienteDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenCalClienteRef.current) setShowCalCliente(true); }}
                  onBlur={handleFechaClienteBlur} placeholder="ej. 26 de mayo de 2026" className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowCalCliente(o => !o)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"><CalendarIcon size={15} /></button>
                {showCalCliente && <MiniCalendar selectedDate={fechaClienteDate ?? new Date()} onSelectDate={(date) => { setFechaClienteDate(date); setFechaClienteDisplay(formatFriendlyDate(formatDateForComparison(date))); setShowCalCliente(false); }} onClose={handleCalClienteClose} />}
              </div>
              <div className="w-28 flex-shrink-0"><CustomTimePicker value={fechaClienteTime} onChange={setFechaClienteTime} placeholder="Hora" /></div>
            </div>
          </div>
          <div>
            <span className={labelCls}>Método de contacto</span>
            <div ref={metodoRef} className="relative">
              <button type="button" onClick={() => setShowMetodo(o => !o)}
                className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-base outline-none transition-colors focus:ring-1 focus:ring-rose-300 ${metodo ? `${metoDoActiveClass(metodo)} border font-medium` : 'border-gray-300 text-gray-400 bg-white dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 hover:border-rose-300'}`}>
                <span>{metodo || 'Seleccionar canal...'}</span>
                <CaretDownIcon size={14} className={`flex-shrink-0 transition-transform ${showMetodo ? 'rotate-180' : ''} ${metodo ? 'opacity-60' : 'text-gray-400'}`} />
              </button>
              {showMetodo && (
                <div className="absolute top-full left-0 right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-lg py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                  <button type="button" onClick={() => { setMetodo(''); setShowMetodo(false); }}
                    className={`${dropdownItemBase} ${!metodo ? 'bg-rose-50 text-rose-700 font-medium dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Sin especificar</button>
                  {metodoOptions.map((opt) => (
                    <button key={opt} type="button" onClick={() => { setMetodo(opt); setShowMetodo(false); }}
                      className={`${dropdownItemBase} ${metodo === opt ? 'bg-rose-50 text-rose-700 font-medium dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'}`}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <span className={labelCls}>Número de teléfono</span>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="ej. 844 123 4567" className={inputCls} />
          </div>
          <div>
            <span className={labelCls}>Estatus</span>
            <div ref={estatusRef} className="relative">
              <button type="button" onClick={() => setShowEstatus(o => !o)}
                className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-base font-medium outline-none transition-colors focus:ring-1 focus:ring-rose-300 ${estatus === 'Pendiente' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' : estatus === 'Entregado' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30' : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10'}`}>
                <span>{estatus || 'Sin estatus'}</span>
                <CaretDownIcon size={14} className={`flex-shrink-0 opacity-60 transition-transform ${showEstatus ? 'rotate-180' : ''}`} />
              </button>
              {showEstatus && (
                <div className="absolute top-full left-0 right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-lg py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                  {estatusOptions.map((opt) => {
                    const dotCls = opt === 'Pendiente' ? 'bg-rose-400 dark:bg-rose-500' : opt === 'Entregado' ? 'bg-green-500' : 'bg-gray-300';
                    return (
                      <button key={opt} type="button" onClick={() => { setEstatus(opt); setShowEstatus(false); }}
                        className={`${dropdownItemBase} flex items-center gap-2 ${estatus === opt ? 'bg-rose-50 text-rose-700 font-medium dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />{opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving || !canCreate}
            className="px-5 py-2 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            {saving ? 'Guardando...' : 'Crear pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── getCustomProperties ──────────────────────────────────────────────────────
function getCustomProperties(base: ReturnType<typeof useBase>) {
  return [
    { key: 'pedidosTable',    label: 'Tabla de Pedidos',      type: 'table' as const, defaultValue: base.tables.find((t) => t.id === 'tbl4izLZNlOcem1SC') },
    { key: 'elementosTable',  label: 'Tabla de Elementos',    type: 'table' as const, defaultValue: base.tables.find((t) => t.id === 'tblis88Izkhbi3SIG') },
    { key: 'cakeTopperTable', label: 'Tabla de Cake Toppers', type: 'table' as const, defaultValue: base.tables.find((t) => t.id === 'tblipWNMWD2ZfDSf1') },
  ];
}

// ─── PedidosApp ───────────────────────────────────────────────────────────────
function PedidosApp(): React.ReactElement {
  useTheme();
  const base = useBase();
  const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
  const pedidosTable    = customPropertyValueByKey.pedidosTable    as Table | undefined;
  const elementosTable  = customPropertyValueByKey.elementosTable  as Table | undefined;
  const cakeTopperTable = customPropertyValueByKey.cakeTopperTable as Table | undefined;
  const catalogoTable   = useMemo(() => base.tables.find((t) => t.id === 'tbllPBYdLexX7ZetM') ?? null, [base.tables]);

  const pedidoRecords     = useRecords(pedidosTable    ?? null);
  const elementoRecords   = useRecords(elementosTable  ?? null);
  const cakeTopperRecords = useRecords(cakeTopperTable ?? null);
  const catalogoRecords   = useRecords(catalogoTable   ?? null);

  const catalogoTipoField = catalogoTable?.getFieldIfExists(FIELD_IDS.CAT_TIPO);

  const catalogoProductos = useMemo(() => {
    if (!catalogoRecords || !catalogoTipoField) return [];
    return catalogoRecords
      .filter((r) => {
        const tipo = (r.getCellValue(catalogoTipoField) as { name: string } | null)?.name;
        return tipo === 'Producto';
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' }));
  }, [catalogoRecords, catalogoTipoField]);

  const catalogoPanes = useMemo(() => {
    if (!catalogoRecords || !catalogoTipoField) return [];
    return catalogoRecords
      .filter((r) => {
        const tipo = (r.getCellValue(catalogoTipoField) as { name: string } | null)?.name;
        return tipo === 'Pan';
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' }));
  }, [catalogoRecords, catalogoTipoField]);

  const catalogoRellenos = useMemo(() => {
    if (!catalogoRecords || !catalogoTipoField) return [];
    return catalogoRecords
      .filter((r) => {
        const tipo = (r.getCellValue(catalogoTipoField) as { name: string } | null)?.name;
        return tipo === 'Relleno';
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' }));
  }, [catalogoRecords, catalogoTipoField]);

  const [view,                      setView]                      = useState<'dia' | 'semana' | 'mes'>('dia');
  const [calendarDate,              setCalendarDate]              = useState(new Date());
  const [showDatePicker,            setShowDatePicker]            = useState(false);
  const [selectedRecordId,          setSelectedRecordId]          = useState<string | null>(null);
  const [searchQuery,               setSearchQuery]               = useState('');
  const [searchResults,             setSearchResults]             = useState<Record[]>([]);
  const [showSearchDropdown,        setShowSearchDropdown]        = useState(false);
  const [selectedEstatus,           setSelectedEstatus]           = useState<string[]>(['Pendiente']);
  const [showNuevoPedido,           setShowNuevoPedido]           = useState(false);

  // calendarPeriod is now derived from view
  const calendarPeriod: 'mes' | 'semana' = view === 'semana' ? 'semana' : 'mes';

  const searchRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setShowSearchDropdown(false); setSearchQuery(''); }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);


  const toggleEstatus = useCallback((value: string) => {
    setSelectedEstatus((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return value === 'Pendiente' ? ['Entregado'] : ['Pendiente'];
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  }, []);

  const getFechaValue = useCallback((r: Record): string | null => {
    if (!pedidosTable) return null;
    const field = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
    return field ? (r.getCellValue(field) as string | null) : null;
  }, [pedidosTable]);

  const getEstatusValue = useCallback((r: Record): string => {
    if (!pedidosTable) return '';
    const field = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
    return field ? ((r.getCellValue(field) as { name: string } | null)?.name ?? '') : '';
  }, [pedidosTable]);

  const filteredPedidosDia = useMemo(() => {
    if (!pedidoRecords || !pedidosTable) return [];
    const fechaField = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
    const estatusFld = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
    if (!fechaField) return [];
    const selStr = formatDateForComparison(calendarDate);
    return pedidoRecords
      .filter((r) => {
        const val = r.getCellValue(fechaField) as string | null;
        if (!val || formatDateForComparison(new Date(val)) !== selStr) return false;
        if (selectedEstatus.length > 0 && estatusFld) {
          const est = (r.getCellValue(estatusFld) as { name: string } | null)?.name ?? '';
          if (!selectedEstatus.includes(est)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = a.getCellValue(fechaField) as string | null;
        const tb = b.getCellValue(fechaField) as string | null;
        if (!ta) return 1; if (!tb) return -1;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
  }, [pedidoRecords, pedidosTable, calendarDate, selectedEstatus]);

  const filteredPedidosCalendar = useMemo(() => {
    if (!pedidoRecords || !pedidosTable) return [];
    const estatusFld = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
    return pedidoRecords.filter((r) => {
      if (selectedEstatus.length > 0 && estatusFld) {
        const est = (r.getCellValue(estatusFld) as { name: string } | null)?.name ?? '';
        if (!selectedEstatus.includes(est)) return false;
      }
      return true;
    });
  }, [pedidoRecords, pedidosTable, selectedEstatus]);

  useEffect(() => {
    if (!searchQuery.trim() || !pedidoRecords || !pedidosTable) { setSearchResults([]); setShowSearchDropdown(false); return; }
    const pedidoIdField = pedidosTable.getFieldIfExists(FIELD_IDS.PEDIDO_ID);
    const numeroNotaField = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_NOTA);
    const clienteField = pedidosTable.getFieldIfExists(FIELD_IDS.CLIENTE);
    const numeroTelefonoField = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_TELEFONO);
    const fechaField    = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
    const estatusFld    = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
    if (!pedidoIdField || !fechaField) return;
    const queryLower = searchQuery.toLowerCase();
    const matches = pedidoRecords
      .filter((r) => {
        const fecha = r.getCellValue(fechaField) as string | null;
        if (!fecha) return false;
        if (selectedEstatus.length > 0 && estatusFld) {
          const est = (r.getCellValue(estatusFld) as { name: string } | null)?.name ?? '';
          if (!selectedEstatus.includes(est)) return false;
        }
        const pedidoId = r.getCellValueAsString(pedidoIdField).toLowerCase();
        const numeroNota = numeroNotaField ? r.getCellValueAsString(numeroNotaField).toLowerCase() : '';
        const cliente = clienteField ? r.getCellValueAsString(clienteField).toLowerCase() : '';
        const telefono = numeroTelefonoField ? r.getCellValueAsString(numeroTelefonoField).toLowerCase() : '';
        return pedidoId.includes(queryLower) || 
               numeroNota.includes(queryLower) ||
               cliente.includes(queryLower) ||
               telefono.includes(queryLower) ||
               formatFriendlyDateTime(fecha).toLowerCase().includes(queryLower);
      })
      .sort((a, b) => {
        const ta = a.getCellValue(fechaField) as string | null;
        const tb = b.getCellValue(fechaField) as string | null;
        if (!ta) return 1; if (!tb) return -1;
        return new Date(tb).getTime() - new Date(ta).getTime();
      })
      .slice(0, 10);
    setSearchResults(matches);
    setShowSearchDropdown(matches.length > 0);
  }, [searchQuery, pedidoRecords, pedidosTable, selectedEstatus]);

  const selectedRecord = useMemo(() => {
    if (!selectedRecordId || !pedidoRecords) return null;
    return pedidoRecords.find((r) => r.id === selectedRecordId) ?? null;
  }, [selectedRecordId, pedidoRecords]);

  const navCalendar = useCallback((dir: number) => {
    setCalendarDate(d => {
      if (view === 'mes') return new Date(d.getFullYear(), d.getMonth() + dir, 1);
      if (view === 'semana') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir * 7);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir);
    });
  }, [view]);

  const goToCurrentCalendar = useCallback(() => {
    setCalendarDate(new Date());
  }, []);

  const isCurrentPeriod = useMemo(() => {
    const n = new Date();
    if (view === 'dia') return formatDateForComparison(calendarDate) === formatDateForComparison(n);
    if (view === 'mes') return calendarDate.getFullYear() === n.getFullYear() && calendarDate.getMonth() === n.getMonth();
    // semana
    const dow = (n.getDay() + 6) % 7;
    const nowWs = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow).getTime();
    const cdow = (calendarDate.getDay() + 6) % 7;
    const calWs = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - cdow).getTime();
    return nowWs === calWs;
  }, [calendarDate, view]);

  const dateLabel = useMemo(() => {
    if (view === 'dia') {
      return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(calendarDate);
    }
    if (view === 'mes') return MONTHS_ES[calendarDate.getMonth()].toLowerCase() + ' ' + calendarDate.getFullYear();
    // semana
    const dow = (calendarDate.getDay() + 6) % 7;
    const ws = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - dow);
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
    const sm = we.toLocaleString('es-MX', { month: 'short' });
    if (ws.getMonth() === we.getMonth()) return ws.getDate() + ' - ' + we.getDate() + ' ' + sm + ' ' + we.getFullYear();
    const sm2 = ws.toLocaleString('es-MX', { month: 'short' });
    return ws.getDate() + ' ' + sm2 + ' - ' + we.getDate() + ' ' + sm + ' ' + we.getFullYear();
  }, [calendarDate, view]);

  const currentPeriodLabel = view === 'dia' ? 'Hoy' : 'Actual';

  const handleDatePickerSelect = useCallback((d: Date | null) => {
    if (!d) return;
    if (view === 'semana') {
      const snapped = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
      setCalendarDate(snapped);
    } else {
      setCalendarDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    setShowDatePicker(false);
  }, [view]);

  if (errorState) return <div className="h-screen flex items-center justify-center bg-[#F8F2F2] dark:bg-[#1B1517]"><p className="text-gray-500 dark:text-gray-400">Error al cargar la configuración.</p></div>;
  if (!pedidosTable) return (
    <div className="h-screen flex items-center justify-center bg-[#F8F2F2] dark:bg-[#1B1517]">
      <div className="text-center p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 dark:text-[#F5F3EF]">Configuración requerida</h2>
        <p className="text-base text-gray-500 dark:text-gray-400">Configura las tablas en el panel de propiedades.</p>
      </div>
    </div>
  );

  const pedidoIdField       = pedidosTable.getFieldIfExists(FIELD_IDS.PEDIDO_ID);
  const fechaEntregaField   = pedidosTable.getFieldIfExists(FIELD_IDS.FECHA_ENTREGA);
  const metodoContactoField = pedidosTable.getFieldIfExists(FIELD_IDS.METODO_CONTACTO);
  const numeroTelefonoField = pedidosTable.getFieldIfExists(FIELD_IDS.NUMERO_TELEFONO);
  const costoTotalField     = pedidosTable.getFieldIfExists(FIELD_IDS.COSTO_TOTAL);
  const restanteField       = pedidosTable.getFieldIfExists(FIELD_IDS.RESTANTE);
  const impresoField        = pedidosTable.getFieldIfExists(FIELD_IDS.IMPRESO);
  const estatusField        = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);
  const cakeTopperField     = pedidosTable.getFieldIfExists(FIELD_IDS.CAKE_TOPPER);

  const isToday = formatDateForComparison(calendarDate) === formatDateForComparison(new Date());
  const canCreate = pedidosTable.hasPermissionToCreateRecords();

  const navBtnCls = "p-1.5 rounded-full border border-gray-300 dark:border-[#2E352C] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 transition-colors flex items-center justify-center";

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans antialiased bg-[#F8F2F2] dark:bg-[#1B1517]">
      {/* ── Filter bar ── */}
      <div className="px-7 pt-5 pb-3 flex-shrink-0 flex items-center gap-3">
        {/* Search */}
        <div ref={searchRef} className="relative w-1/4">
          <MagnifyingGlassIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
          <input type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
            placeholder="Buscar pedido..."
            className="pl-8 pr-3 py-2 w-full text-base bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400 dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:placeholder-gray-600" />
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden min-w-[280px] max-h-[300px] overflow-y-auto dark:bg-[#251D1F] dark:border-[#382C2E]">
              {searchResults.map((r) => {
                const pid   = pedidoIdField     ? r.getCellValueAsString(pedidoIdField) : 'Sin ID';
                const telefono = numeroTelefonoField ? r.getCellValueAsString(numeroTelefonoField) : '';
                const fecha = fechaEntregaField ? (r.getCellValue(fechaEntregaField) as string | null) : null;
                return (
                  <button key={r.id} type="button" onClick={() => { setSelectedRecordId(r.id); setShowSearchDropdown(false); setSearchQuery(''); }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer dark:hover:bg-white/5 dark:border-white/5">
                    <div className="font-medium text-base text-gray-900 dark:text-gray-100">{toTitleCase(pid)}</div>
                    {telefono && <div className="text-sm text-gray-600 dark:text-gray-400">{telefono}</div>}
                    <div className="text-sm text-gray-500 dark:text-gray-500">{formatFriendlyDateTime(fecha)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Estatus filter */}
        <FilterDropdown label="Estatus" values={selectedEstatus} options={['Pendiente', 'Entregado']} onChange={setSelectedEstatus} />

        {/* ── Inline date selector ── */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => navCalendar(-1)} className={navBtnCls}>
            <CaretLeftIcon size={13} />
          </button>

          {/* Label / picker trigger — relative wrapper so popup centers on it */}
          <div className="relative">
            <button type="button" onClick={() => setShowDatePicker(o => !o)}
              className="text-base font-bold text-gray-700 dark:text-gray-200 lowercase select-none px-3 py-1 border border-gray-300 dark:border-[#2E352C] rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-sans min-w-[160px] text-center cursor-pointer flex items-center justify-center gap-2">
              {view === 'dia' && <CalendarIcon size={13} className="text-gray-400 flex-shrink-0" />}
              {dateLabel}
            </button>

            {/* Pickers — centered under the label button */}
            {showDatePicker && (view === 'dia' || view === 'semana') && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100]">
                <MiniCalendar selectedDate={calendarDate} onSelectDate={handleDatePickerSelect} onClose={() => setShowDatePicker(false)} />
              </div>
            )}
            {showDatePicker && view === 'mes' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100]">
                <MonthYearSpinner
                  initialMonth={calendarDate.getMonth()}
                  initialYear={calendarDate.getFullYear()}
                  onConfirm={(d) => { setCalendarDate(d); setShowDatePicker(false); }}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          <button type="button" onClick={() => navCalendar(1)} className={navBtnCls}>
            <CaretRightIcon size={13} />
          </button>

          {!isCurrentPeriod && (
            <button type="button" onClick={goToCurrentCalendar}
              className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-300 font-sans">
              {currentPeriodLabel}
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Día / Semana / Mes toggle */}
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-[#2E352C]">
            {(['dia', 'semana', 'mes'] as const).map((v, i) => (
              <button key={v} type="button"
                onClick={() => { setView(v); setShowDatePicker(false); }}
                className={'px-3 py-[7px] text-sm font-medium transition-colors font-sans' +
                  (i > 0 ? ' border-l border-gray-300 dark:border-[#2E352C]' : '') +
                  (view === v ? ' bg-rose-600 text-white' : ' bg-white text-gray-600 hover:bg-gray-50 dark:bg-[#251D1F] dark:text-gray-400 dark:hover:bg-white/5')}>
                {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNuevoPedido(true)} disabled={!canCreate}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium font-sans transition-colors ' + (canCreate ? 'bg-gray-900 hover:bg-gray-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed dark:bg-gray-600')}>
            <PlusIcon size={16} />Nuevo pedido
          </button>
        </div>
      </div>


      {/* ── Vista Día ── */}
      {view === 'dia' && (
        <>
          {/* Cards */}
          <div className="px-7 flex gap-3 overflow-x-auto pb-2 mb-3 flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredPedidosDia.length === 0
              ? <p className="text-gray-400 text-sm py-3 dark:text-gray-600">No hay pedidos para este día.</p>
              : filteredPedidosDia.map((r) => {
                  const hora     = fechaEntregaField  ? formatTimeOnly(r.getCellValue(fechaEntregaField) as string | null) : '—';
                  const pid      = pedidoIdField       ? r.getCellValueAsString(pedidoIdField) : 'Sin ID';
                  const metodo   = metodoContactoField ? (r.getCellValue(metodoContactoField) as { name: string } | null)?.name : null;
                  const telefono = numeroTelefonoField ? r.getCellValueAsString(numeroTelefonoField) : '';
                  const total    = costoTotalField     ? (r.getCellValue(costoTotalField) as number | null) : null;
                  const estatus  = estatusField        ? (r.getCellValue(estatusField) as { name: string } | null)?.name : null;
                  return (
                    <div key={r.id} onClick={() => setSelectedRecordId(r.id)}
                      className={`min-w-[220px] max-w-[240px] border rounded-xl p-4 cursor-pointer flex-shrink-0 transition-all ${getCardColorClasses(estatus)}`}>
                      <div className="text-base text-gray-500 font-medium dark:text-gray-400">{hora}</div>
                      <div className="font-bold text-base text-gray-900 mt-1 dark:text-[#F5F3EF]">{toTitleCase(pid)}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <ContactoPill value={metodo} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{telefono || '—'}</span>
                      </div>
                      <div className="text-base font-semibold text-gray-800 mt-2 dark:text-gray-200">{formatCurrency(total)}</div>
                    </div>
                  );
                })}
          </div>
          {/* Table */}
          <div className="flex-1 min-h-0 px-7 pb-5 overflow-hidden">
            <div className="h-full bg-white border border-[#E5E1DA] rounded-xl flex flex-col overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
              <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full border-collapse min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 dark:bg-white/5 dark:border-white/10">
                  <tr>
                    {['Hora','Pedido','Estatus','Impreso','Cake Topper','Total','Restante','Contacto','Teléfono'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-base font-semibold text-gray-700 capitalize whitespace-nowrap dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidosDia.length === 0
                    ? <tr><td colSpan={9} className="px-8 py-8 text-center text-gray-400 text-base dark:text-gray-600">No hay pedidos para {dateLabel}.</td></tr>
                    : filteredPedidosDia.map((r) => {
                        const hora       = fechaEntregaField  ? formatTimeOnly(r.getCellValue(fechaEntregaField) as string | null) : '—';
                        const pid        = pedidoIdField       ? r.getCellValueAsString(pedidoIdField) : 'Sin ID';
                        const metodo     = metodoContactoField ? (r.getCellValue(metodoContactoField) as { name: string } | null)?.name : null;
                        const telefono   = numeroTelefonoField ? r.getCellValueAsString(numeroTelefonoField) : '';
                        const total      = costoTotalField     ? (r.getCellValue(costoTotalField)  as number | null) : null;
                        const restanteV  = restanteField       ? (r.getCellValue(restanteField)    as number | null) : null;
                        const impresoV   = impresoField        ? (r.getCellValue(impresoField)     as boolean | null) : null;
                        const estatusV   = estatusField        ? (r.getCellValue(estatusField)     as { name: string } | null)?.name : null;
                        const hasCakeTopper = cakeTopperField  ? ((r.getCellValue(cakeTopperField) as { id: string }[] | null)?.length ?? 0) > 0 : false;
                        const isSelected = r.id === selectedRecordId;
                        return (
                          <tr key={r.id} onClick={() => setSelectedRecordId(r.id)}
                            className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-rose-50 dark:border-white/5 dark:hover:bg-white/5 ${isSelected ? 'bg-rose-50 dark:bg-rose-500/10' : ''}`}>
                            <td className="px-3 py-3 text-base text-gray-700 whitespace-nowrap tabular-nums dark:text-gray-300">{hora}</td>
                            <td className="px-3 py-3 text-base font-medium text-gray-900 dark:text-gray-100">{toTitleCase(pid)}</td>
                            <td className="px-3 py-3"><EstatusPill value={estatusV} /></td>
                            <td className="px-3 py-3"><ImpresoPill value={impresoV} /></td>
                            <td className="px-3 py-3 text-base text-center">
                              {hasCakeTopper
                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30">Incluye</span>
                                : <span className="text-gray-300 dark:text-gray-700">—</span>}
                            </td>
                            <td className="px-3 py-3 text-base text-gray-800 dark:text-gray-200">{formatCurrency(total)}</td>
                            <td className="px-3 py-3 text-base text-gray-800 dark:text-gray-200">{formatCurrency(restanteV)}</td>
                            <td className="px-3 py-3"><ContactoPill value={metodo} /></td>
                            <td className="px-3 py-3 text-base text-gray-700 dark:text-gray-300">{telefono || '—'}</td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Vista Semana / Mes ── */}
      {(view === 'semana' || view === 'mes') && (
        <CalendarioView
          filteredPedidos={filteredPedidosCalendar}
          calendarDate={calendarDate}
          period={calendarPeriod}
          onRecordClick={(id) => setSelectedRecordId(id)}
          getFechaField={getFechaValue}
          getEstatusField={getEstatusValue}
          pedidosTable={pedidosTable}
          elementoRecords={elementoRecords ?? []}
          isSemana={view === 'semana'}
        />
      )}

      {selectedRecord && pedidosTable && (
        <PedidoDetailModal
          record={selectedRecord}
          pedidosTable={pedidosTable}
          elementosTable={elementosTable}
          cakeTopperTable={cakeTopperTable}
          elementoRecords={elementoRecords ?? []}
          cakeTopperRecords={cakeTopperRecords ?? []}
          catalogoProductos={catalogoProductos}
          catalogoPanes={catalogoPanes}
          catalogoRellenos={catalogoRellenos}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
      {showNuevoPedido && pedidosTable && (
        <NuevoPedidoModal pedidosTable={pedidosTable} onClose={(newRecordId) => { setShowNuevoPedido(false); if (newRecordId) setSelectedRecordId(newRecordId); }} />
      )}
    </div>
  );
}

initializeBlock({ interface: () => <PedidosApp /> });