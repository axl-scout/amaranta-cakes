import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  initializeBlock,
  useBase,
  useRecords,
  useCustomProperties,
} from '@airtable/blocks/interface/ui';
import { Table, Record as AirtableRecord } from '@airtable/blocks/interface/models';
import {
  UploadSimpleIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  CaretLeftIcon,
  CaretUpIcon,
  CalendarIcon,
  SpinnerIcon,
  XIcon,
} from '@phosphor-icons/react';

// ─── Rosewood palette: sigue el tema del sistema (claro/oscuro) ──────────────
function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light'
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);
  return theme;
}

const FIELD_IDS = {
  EMPLEADOS_NUMERO_DE_EMPLEADO: 'fldtsIcGB618YwyOq',
  EMPLEADOS_NOMBRE_PREFERIDO: 'fldGfJeg01obJiDtE',
  EMPLEADOS_ESTATUS: 'fldkwxY2gWZBKSdId',
  CH_EMPLEADO: 'fldrMMPnZCpIk9ugJ',
  CH_ENTRADA: 'fld0kpZvjnYuc7xQG',
  CH_SALIDA: 'fldPsPujWCDvZDLfH',
  CH_SALARIO_POR_HORA: 'fldZiyFvrxp9w9jB3',
  CH_HORAS_LABORABLES: 'fldcrVMKD2i0cnRlD',
  CH_HORAS_ORDINARIAS: 'fldueLQHfD1dCEUM9',
  CH_HORAS_EXTRA: 'fldevmTTeZYuI0gLU',
  CH_HORAS_EXTRA_AUTORIZADAS: 'fldDdRIMpuIQOztDK',
  CH_NOMINA: 'fldynty28KdzwAR1c',
  NOMINA_CONTROL_HORARIO: 'fldRpnEkaWG7nPlei',
  NOMINA_SALARIO_POR_HORA_LOOKUP: 'fldAOqUq8L6YFOk6N',
  NOMINA_SALARIO_POR_HORA: 'fldcIgwyl0dfYGS1P',
  NOMINA_PAGO_DE_NOMINA: 'fld5cla35OoJhK1xC',
  NOMINA_EMPLEADO_LOOKUP: 'fldBa7MqXLRcdjy5w',
  NOMINA_SEMANA_LOOKUP: 'fld4wtM9gjNNvbayk',
  NOMINA_INICIO_SEMANA: 'fldbhJaHQKJI0Rb5J',
  NOMINA_PAGADO_ORDINARIO: 'fldLYTNNnSlJmye1d',
  NOMINA_PAGADO_EXTRA: 'flduA2v8kPddieruW',
  NOMINA_FALTANTE: 'flduXrn2ouC5lVmMl',
  NOMINA_STATUS: 'fldtQXgaJaAQ9h7Uu',
  NOMINA_HORAS_ORDINARIAS_TRABAJADAS: 'fld3E5xf6fjMVwRlU',
  NOMINA_HORAS_EXTRA_TRABAJADAS: 'fldxSbWMQm8O5sqP5',
  NOMINA_MONTO_HORAS_ORDINARIAS: 'fldIwndVNw3FIk9xH',
  NOMINA_MONTO_HORAS_EXTRA: 'fld5Vt19hf3n6396r',
} as const;

const EMPLOYEE_NUMBERS_EXCLUDED = [5, 6, 7];

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS_SEMANA_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

function formatFechaLarga(fecha: string): string {
  const [year, month, day] = fecha.replace(/\//g, '-').split('-');
  const mes = MESES_ES[parseInt(month ?? '', 10) - 1];
  if (!year || !day || !mes) return fecha;
  const date = parseFechaToDate(fecha);
  const diaSemana = date ? DIAS_SEMANA_ES[date.getDay()] : null;
  return diaSemana ? `${diaSemana}, ${day} de ${mes} de ${year}` : `${day} de ${mes} de ${year}`;
}

function parseFechaToDate(fecha: string): Date | null {
  const [year, month, day] = fecha.replace(/\//g, '-').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

// El reporte del checador puede exportar la fecha como YYYY-MM-DD o como
// DD/MM/YYYY (formato regional), y a veces con un componente de hora pegado.
// Sin normalizar a YYYY-MM-DD aquí, parseFechaToDate asume el orden equivocado
// y la semana calculada queda mal, mezclando días de semanas distintas en el
// mismo record de Nómina.
function normalizeFecha(raw: string): string | null {
  const trimmed = raw.trim().split(/[ T]/)[0] ?? '';
  const parts = trimmed.split(/[\/\-]/).map(p => p.trim());
  if (parts.length !== 3) return null;

  const [a, b, c] = parts as [string, string, string];
  let year: string, month: string, day: string;
  if (a.length === 4) {
    [year, month, day] = [a, b, c];
  } else if (c.length === 4) {
    [day, month, year] = [a, b, c];
  } else {
    return null;
  }

  if (!/^\d+$/.test(year) || !/^\d+$/.test(month) || !/^\d+$/.test(day)) return null;

  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;

  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Semana laboral de Amaranta Cakes: lunes a sábado (cerrado domingo).
function getWeekRange(fecha: string): { key: string; start: Date; end: Date } {
  const date = parseFechaToDate(fecha) ?? new Date(NaN);
  const mondayOffset = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 5);
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return { key, start, end };
}

function formatFechaCorta(date: Date): string {
  const mes = MESES_ES[date.getMonth()];
  const diaSemana = DIAS_SEMANA_ES[date.getDay()];
  return `${diaSemana} ${String(date.getDate()).padStart(2, '0')} de ${mes}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
}

function formatDateForComparison(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CHECADOR_TIMEZONE = 'America/Mexico_City';

// El SDK de Airtable regresa el cell value de un campo dateTime como ISO en
// UTC, no ya ajustado a la zona horaria configurada del campo. Leer la hora
// directamente del string (p. ej. con split('T')) muestra 6 horas de más o
// de menos, y en horas cercanas a medianoche puede incluso mostrar el día
// equivocado. Esta conversión usa Intl con la zona horaria real para extraer
// la fecha y hora locales correctas sin importar el formato del string.
function isoToMexicoCityParts(iso: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHECADOR_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  if (!map.year || !map.month || !map.day || !map.hour || !map.minute) return null;
  return {
    year: Number(map.year), month: Number(map.month), day: Number(map.day),
    hour: Number(map.hour), minute: Number(map.minute),
  };
}

function isoToMexicoCityDateKey(iso: string): string | null {
  const p = isoToMexicoCityParts(iso);
  if (!p) return null;
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// ─── Calendario y selector de hora (estilo Pedidos) ──────────────────────────
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
  const m = parseInt(parts[1] ?? '0', 10);
  if (isNaN(h24) || isNaN(m)) return null;
  return { h24, m };
}

const SPIN_HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const SPIN_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const SPIN_PERIODS = ['AM', 'PM'] as const;

interface SpinnerColumnProps {
  values: readonly string[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
}

function SpinnerColumn({ values, index, onPrev, onNext }: SpinnerColumnProps): React.ReactElement {
  const colRef = useRef<HTMLDivElement>(null);
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
  const nc = 'text-3xl font-bold text-gray-800 dark:text-gray-200 w-14 text-center tabular-nums select-none';
  return (
    <div ref={colRef} className="flex flex-col items-center select-none" style={{ userSelect: 'none' }}>
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onPrev} className={btnCls}><CaretUpIcon size={15} /></button>
      <div className={nc}>{values[index]}</div>
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onNext} className={btnCls}><CaretDownIcon size={15} /></button>
    </div>
  );
}

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

function MiniCalendar({ selectedDate, onSelectDate, onClose }: MiniCalendarProps): React.ReactElement {
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
  const todayStr = formatDateForComparison(new Date());
  const selectedStr = formatDateForComparison(selectedDate);
  return (
    <div ref={containerRef} className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#E9D9D9] rounded-lg shadow-lg p-3 w-96 dark:bg-[#251D1F] dark:border-[#382C2E]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5">
          <CaretLeftIcon size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-2xl font-medium text-gray-800 capitalize dark:text-gray-200">{monthLabel}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-rose-50 rounded transition-colors dark:hover:bg-white/5">
          <CaretRightIcon size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
          <div key={d} className="text-xl text-gray-500 text-center dark:text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = formatDateForComparison(new Date(year, month, day));
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;
          let cls = 'text-2xl rounded transition-colors text-center py-1 cursor-pointer hover:bg-rose-50 text-gray-800 dark:text-gray-200 dark:hover:bg-white/5';
          if (isToday && !isSelected) cls = 'text-2xl rounded transition-colors text-center py-1 cursor-pointer bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
          if (isSelected) cls = 'text-2xl rounded transition-colors text-center py-1 cursor-pointer bg-rose-600 text-white dark:bg-rose-500';
          return (
            <button key={idx} type="button" onClick={() => onSelectDate(new Date(year, month, day))} className={cls}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-center">
        <button type="button" onClick={() => onSelectDate(new Date())} className="text-xl text-rose-600 hover:underline dark:text-rose-400">
          Ir a hoy
        </button>
      </div>
    </div>
  );
}

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Selector de hora con precisión de 1 minuto (a diferencia del picker de
// Pedidos que redondea a cuartos de hora): los checadores registran entradas
// y salidas en minutos arbitrarios.
function CustomTimePicker({ value, onChange, placeholder = 'Hora' }: CustomTimePickerProps): React.ReactElement {
  const initParsed = parseTimeValue(value);
  const init12 = initParsed ? to12h(initParsed.h24) : null;
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(initParsed ? fmtTimeDisplay(initParsed.h24, initParsed.m) : '');
  const [selHour12, setSelHour12] = useState<number>(init12?.h ?? 12);
  const [selMinute, setSelMinute] = useState<number>(initParsed ? initParsed.m : 0);
  const [selPeriod, setSelPeriod] = useState<'AM' | 'PM'>(init12?.p ?? 'AM');
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parsed = parseTimeValue(value);
    if (parsed) {
      const { h, p } = to12h(parsed.h24);
      setSelHour12(h); setSelMinute(parsed.m); setSelPeriod(p);
      setInputText(fmtTimeDisplay(parsed.h24, parsed.m));
    } else {
      setInputText('');
    }
  }, [value]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const hourIdx = selHour12 - 1;
  const minIdx = selMinute;
  const periodIdx = selPeriod === 'PM' ? 1 : 0;
  const emitUpdate = (h12: number, m: number, p: 'AM' | 'PM') => {
    const h24 = to24h(h12, p);
    const str = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setInputText(fmtTimeDisplay(h24, m));
    onChange(str);
  };
  const prevHour = () => { const n = ((selHour12 - 2 + 12) % 12) + 1; setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const nextHour = () => { const n = (selHour12 % 12) + 1; setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const prevMinute = () => { const m = (selMinute - 1 + 60) % 60; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
  const nextMinute = () => { const m = (selMinute + 1) % 60; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
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
        setSelHour12(h); setSelMinute(m); setSelPeriod(p);
        emitUpdate(h, m, p);
        return;
      }
    }
    const prev = parseTimeValue(value);
    setInputText(prev ? fmtTimeDisplay(prev.h24, prev.m) : '');
  };
  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xl text-gray-900 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-rose-400"
      />
      {open && (
        <div className="absolute top-full right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-md p-2 flex items-center gap-0.5 dark:bg-[#251D1F] dark:border-[#382C2E]">
          <SpinnerColumn values={SPIN_HOURS} index={hourIdx} onPrev={prevHour} onNext={nextHour} />
          <span className="text-gray-300 text-2xl font-bold mb-0.5 px-0.5 dark:text-gray-600">:</span>
          <SpinnerColumn values={SPIN_MINUTES} index={minIdx} onPrev={prevMinute} onNext={nextMinute} />
          <div className="w-px h-6 bg-gray-200 mx-1.5 dark:bg-white/10" />
          <SpinnerColumn values={SPIN_PERIODS} index={periodIdx} onPrev={togglePeriod} onNext={togglePeriod} />
        </div>
      )}
    </div>
  );
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function formatWeekLabel(weekNumber: number, start: Date, end: Date): string {
  const startLabel = formatFechaCorta(start);
  const endLabel = start.getFullYear() === end.getFullYear()
    ? formatFechaCorta(end)
    : `${formatFechaCorta(end)} de ${end.getFullYear()}`;
  return `Semana ${weekNumber} - ${startLabel} al ${endLabel}`;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find(line => line.trim().length > 0) ?? '';
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  // Excel en español (México) suele exportar CSV con ; como separador,
  // porque la coma se usa como separador decimal regional.
  return semicolonCount > commaCount ? ';' : ',';
}

function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignorado, el salto de línea real lo maneja \n
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.map(r => r.map(cell => cell.trim()));
}

type RowStatus = 'ok' | 'partial' | 'duplicate' | 'not_found';

interface ParsedRow {
  id: string;
  employeeNumber: number;
  employeeName: string;
  employeeRecordId: string | null;
  employeePreferredName: string | null;
  fecha: string;
  entradaRaw: string | null;
  salidaRaw: string | null;
  entradaISO: string | null;
  salidaISO: string | null;
  status: RowStatus;
  statusMessage: string;
  included: boolean;
}

interface EmployeeGroup {
  employeeRecordId: string | null;
  employeeNumber: number;
  employeeName: string;
  employeePreferredName: string | null;
  rows: ParsedRow[];
  groupStatus: RowStatus;
}

interface WeekGroup {
  key: string;
  weekNumber: number;
  start: Date;
  end: Date;
  employeeGroups: EmployeeGroup[];
}

interface ImportResultEmployee {
  employeeName: string;
  weekLabel: string;
  controlHorarioCreated: number;
  nominaCreated: boolean;
  nominaId: string | null;
  pagoNomina: number | null;
  salarioPendiente: boolean;
  error: string | null;
}

interface ImportResult {
  totalControlHorario: number;
  totalNomina: number;
  employees: ImportResultEmployee[];
  skippedDuplicates: number;
  notFoundRows: { employeeNumber: number; employeeName: string }[];
}

type ViewState =
  | { stage: 'idle' }
  | { stage: 'parsing' }
  | { stage: 'preview'; rows: ParsedRow[]; error?: string }
  | { stage: 'importing'; rows: ParsedRow[] }
  | { stage: 'completed'; result: ImportResult }
  | { stage: 'error'; message: string };

function getCustomProperties(base: ReturnType<typeof useBase>) {
  return [
    {
      key: 'empleadosTable',
      label: 'Empleados',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblzdBu9ftOvcfa9m'),
    },
    {
      key: 'controlHorarioTable',
      label: 'Control Horario',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblWvUyLhouwnF2t2'),
    },
    {
      key: 'nominaTable',
      label: 'Nómina',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblurZY0bL0yBPjNp'),
    },
  ];
}

function ImportadorChecadorApp(): React.ReactElement {
  useTheme();
  const base = useBase();
  const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);

  const empleadosTable = customPropertyValueByKey.empleadosTable as Table | undefined;
  const controlHorarioTable = customPropertyValueByKey.controlHorarioTable as Table | undefined;
  const nominaTable = customPropertyValueByKey.nominaTable as Table | undefined;

  const empleadosRecords = useRecords(empleadosTable ?? null);
  const controlHorarioRecords = useRecords(controlHorarioTable ?? null);
  const nominaRecords = useRecords(nominaTable ?? null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ stage: 'idle' });
  const [isAddingMoreFiles, setIsAddingMoreFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFileInputRef = useRef<HTMLInputElement>(null);
  const rowIdCounterRef = useRef(0);

  const existingControlHorarioKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!controlHorarioRecords) return keys;
    
    const empleadoField = controlHorarioTable?.getFieldIfExists(FIELD_IDS.CH_EMPLEADO);
    const entradaField = controlHorarioTable?.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
    
    if (!empleadoField || !entradaField) return keys;

    for (const record of controlHorarioRecords) {
      const empleadoLinks = record.getCellValue(empleadoField) as Array<{ id: string }> | null;
      const entrada = record.getCellValue(entradaField) as string | null;
      
      if (empleadoLinks && empleadoLinks.length > 0 && entrada) {
        const empleadoId = empleadoLinks[0]?.id;
        const fechaOnly = isoToMexicoCityDateKey(entrada);
        if (empleadoId && fechaOnly) {
          keys.add(`${empleadoId}|${fechaOnly}`);
        }
      }
    }
    return keys;
  }, [controlHorarioRecords, controlHorarioTable]);

  const activeEmployeesMap = useMemo(() => {
    const map = new Map<number, { id: string; preferredName: string }>();
    if (!empleadosRecords || !empleadosTable) return map;

    const numeroField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_NUMERO_DE_EMPLEADO);
    const nombreField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_NOMBRE_PREFERIDO);
    const estatusField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_ESTATUS);

    if (!numeroField || !nombreField || !estatusField) return map;

    for (const record of empleadosRecords) {
      const estatus = record.getCellValue(estatusField) as { name: string } | null;
      if (estatus?.name === 'Activo') {
        const numero = record.getCellValue(numeroField) as number | null;
        const nombre = record.getCellValue(nombreField) as string | null;
        if (numero !== null) {
          map.set(numero, { id: record.id, preferredName: nombre ?? '' });
        }
      }
    }
    return map;
  }, [empleadosRecords, empleadosTable]);

  const buildISODateTime = (fecha: string, hora: string): string => {
    const normalizedFecha = fecha.replace(/\//g, '-');
    return `${normalizedFecha}T${hora}:00-06:00`;
  };

  const parseFileToRows = useCallback((fileName: string, text: string, seenKeys: Set<string>): ParsedRow[] | { error: string } => {
      const rawRows = parseCSV(text);

      if (rawRows.length < 5) {
        return { error: `"${fileName}" no parece tener el formato esperado del reporte de Excepcionales.` };
      }

      // Validación ligera: la fila de encabezados (índice 2) debe empezar con "No."
      const headerFirstCell = (rawRows[2]?.[0] ?? '').trim();
      if (headerFirstCell !== 'No.') {
        return { error: `"${fileName}" no parece ser el reporte de la hoja 'Excepcional'. Verifica que hayas exportado esa hoja como CSV.` };
      }

      const dataRows = rawRows.slice(4);

      const parsedRows: ParsedRow[] = [];

      for (const row of dataRows) {
        if (!row || row.every(cell => !cell || cell.trim() === '')) continue;

        const col0 = row[0];
        const col1 = row[1];
        const col3 = row[3];
        const col4 = row[4]; // AM Entrada
        const col5 = row[5]; // AM Salida
        const col6 = row[6]; // PM Entrada
        const col7 = row[7]; // PM Salida

        if (!col0) continue;

        const employeeNumber = parseInt(col0, 10);
        if (isNaN(employeeNumber)) continue;
        if (EMPLOYEE_NUMBERS_EXCLUDED.includes(employeeNumber)) continue;

        const employeeName = col1?.trim() ?? '';
        const fechaRaw = col3?.trim() ?? '';
        const fecha = normalizeFecha(fechaRaw) ?? fechaRaw;
        const fechaValida = normalizeFecha(fechaRaw) !== null;
        const amEntrada = col4?.trim() || null;
        const amSalida = col5?.trim() || null;
        const pmEntrada = col6?.trim() || null;
        const pmSalida = col7?.trim() || null;

        // Algunos empleados solo checan en PM (AM entrada/salida vacíos).
        // La entrada del empleado es la primera hora registrada (AM u PM)
        // y la salida es la última hora registrada (PM u AM).
        const entradaRaw = amEntrada || pmEntrada;
        const salidaRaw = pmSalida || amSalida;

        if (!entradaRaw && !salidaRaw) continue;

        const employee = activeEmployeesMap.get(employeeNumber);
        const employeeRecordId = employee?.id ?? null;
        const employeePreferredName = employee?.preferredName ?? null;

        let status: RowStatus;
        let statusMessage: string;

        if (!fechaValida) {
          status = 'partial';
          statusMessage = 'Fecha inválida';
        } else if (!employeeRecordId) {
          status = 'not_found';
          statusMessage = 'Empleado no encontrado';
        } else if (!entradaRaw || !salidaRaw) {
          status = 'partial';
          statusMessage = !entradaRaw ? 'Falta hora de entrada' : 'Falta hora de salida';
        } else {
          status = 'ok';
          statusMessage = 'Completo';
        }

        const normalizedFecha = fecha.replace(/\//g, '-');
        const rowKey = employeeRecordId ? `${employeeRecordId}|${normalizedFecha}` : null;
        if (rowKey && seenKeys.has(rowKey)) {
          status = 'duplicate';
          statusMessage = 'Ya existe un registro para esta fecha';
        }

        const entradaISO = entradaRaw && fecha ? buildISODateTime(fecha, entradaRaw) : null;
        const salidaISO = salidaRaw && fecha ? buildISODateTime(fecha, salidaRaw) : null;

        if (rowKey && status !== 'duplicate') {
          seenKeys.add(rowKey);
        }

        parsedRows.push({
          id: `row-${rowIdCounterRef.current++}`,
          employeeNumber,
          employeeName,
          employeeRecordId,
          employeePreferredName,
          fecha,
          entradaRaw,
          salidaRaw,
          entradaISO,
          salidaISO,
          status,
          statusMessage,
          included: status !== 'not_found' && status !== 'duplicate' && fechaValida,
        });
      }

      return parsedRows;
  }, [activeEmployeesMap]);

  const processFiles = useCallback(async (files: File[], mode: 'replace' | 'append') => {
    if (files.length === 0) return;

    if (mode === 'replace') {
      setViewState({ stage: 'parsing' });
    } else {
      setIsAddingMoreFiles(true);
    }

    try {
      const seenKeys = new Set(existingControlHorarioKeys);
      const existingRows = mode === 'append' && viewState.stage === 'preview' ? viewState.rows : [];
      for (const row of existingRows) {
        if (row.employeeRecordId && row.status !== 'duplicate') {
          seenKeys.add(`${row.employeeRecordId}|${row.fecha.replace(/\//g, '-')}`);
        }
      }

      const allNewRows: ParsedRow[] = [];
      for (const file of files) {
        const text = await file.text();
        const result = parseFileToRows(file.name, text, seenKeys);
        if ('error' in result) {
          setViewState({ stage: 'error', message: result.error });
          return;
        }
        allNewRows.push(...result);
      }

      setViewState({ stage: 'preview', rows: [...existingRows, ...allNewRows] });
    } catch (error) {
      console.error('Error parsing CSV file(s):', error);
      setViewState({ stage: 'error', message: 'No se pudo leer alguno de los archivos. Verifica que sean el CSV exportado de la hoja Excepcional del checador.' });
    } finally {
      setIsAddingMoreFiles(false);
    }
  }, [existingControlHorarioKeys, parseFileToRows, viewState]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      processFiles(files, 'replace');
    }
    e.target.value = '';
  }, [processFiles]);

  const handleAddMoreFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      processFiles(files, 'append');
    }
    e.target.value = '';
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files ?? []).filter(f => f.name.toLowerCase().endsWith('.csv'));
    if (files.length > 0) {
      processFiles(files, 'replace');
    }
  }, [processFiles]);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSelectMoreFiles = useCallback(() => {
    addMoreFileInputRef.current?.click();
  }, []);

  const toggleRowInclusion = useCallback((rowId: string) => {
    setViewState(prev => {
      if (prev.stage !== 'preview') return prev;
      return {
        ...prev,
        rows: prev.rows.map(row =>
          row.id === rowId && row.status !== 'not_found'
            ? { ...row, included: !row.included }
            : row
        ),
      };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setViewState({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (viewState.stage !== 'preview') return;
    if (!controlHorarioTable || !nominaTable) return;

    const rowsToImport = viewState.rows.filter(r => r.included && r.employeeRecordId);
    if (rowsToImport.length === 0) return;

    if (!controlHorarioTable.hasPermissionToCreateRecords() || !nominaTable.hasPermissionToCreateRecords()) {
      setViewState({ stage: 'error', message: 'No tienes permisos para crear registros en esta base.' });
      return;
    }

    setViewState({ stage: 'importing', rows: viewState.rows });

    // La nómina se paga por semana calendario, así que cada combinación
    // empleado + semana genera su propio record de Nómina.
    const groupedByEmployeeWeek = new Map<string, { employeeRecordId: string; rows: ParsedRow[] }>();
    for (const row of rowsToImport) {
      const { key: weekKey } = getWeekRange(row.fecha);
      const groupKey = `${row.employeeRecordId}|${weekKey}`;
      if (!groupedByEmployeeWeek.has(groupKey)) {
        groupedByEmployeeWeek.set(groupKey, { employeeRecordId: row.employeeRecordId!, rows: [] });
      }
      groupedByEmployeeWeek.get(groupKey)!.rows.push(row);
    }

    // Los archivos pueden subirse fuera de orden cronológico (p. ej. la semana
    // más reciente primero). Si los Control Horario quedan vinculados en ese
    // orden, los lookups de Inicio/Fin de Semana en Nómina (que dependen del
    // orden de vínculo) muestran fechas erróneas. Ordenar aquí garantiza que
    // el primer y último record vinculado sean cronológicamente correctos.
    for (const group of groupedByEmployeeWeek.values()) {
      group.rows.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }

    const results: ImportResultEmployee[] = [];
    let totalControlHorario = 0;
    let totalNomina = 0;

    for (const { employeeRecordId, rows } of groupedByEmployeeWeek.values()) {
      const firstRow = rows[0]!;
      const employeeName = firstRow.employeePreferredName ?? firstRow.employeeName;
      const { start, end } = getWeekRange(firstRow.fecha);
      const weekLabel = formatWeekLabel(getISOWeekNumber(start), start, end);

      const resultEntry: ImportResultEmployee = {
        employeeName,
        weekLabel,
        controlHorarioCreated: 0,
        nominaCreated: false,
        nominaId: null,
        pagoNomina: null,
        salarioPendiente: false,
        error: null,
      };

      try {
        const controlHorarioPayloads = rows.map(row => {
          const fields: Record<string, unknown> = {
            [FIELD_IDS.CH_EMPLEADO]: [{ id: employeeRecordId }],
          };
          if (row.entradaISO) {
            fields[FIELD_IDS.CH_ENTRADA] = row.entradaISO;
          }
          if (row.salidaISO) {
            fields[FIELD_IDS.CH_SALIDA] = row.salidaISO;
          }
          return { fields };
        });

        const createdControlHorarioIds: string[] = [];
        for (let i = 0; i < controlHorarioPayloads.length; i += 50) {
          const batch = controlHorarioPayloads.slice(i, i + 50);
          const ids = await controlHorarioTable.createRecordsAsync(batch);
          createdControlHorarioIds.push(...ids);
        }

        resultEntry.controlHorarioCreated = createdControlHorarioIds.length;
        totalControlHorario += createdControlHorarioIds.length;

        const nominaPayload = {
          fields: {
            [FIELD_IDS.NOMINA_CONTROL_HORARIO]: createdControlHorarioIds.map(id => ({ id })),
          },
        };

        const nominaIds = await nominaTable.createRecordsAsync([nominaPayload]);
        const nominaId = nominaIds[0];
        
        if (nominaId) {
          resultEntry.nominaCreated = true;
          resultEntry.nominaId = nominaId;
          totalNomina += 1;

          const salarioLookupField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_SALARIO_POR_HORA_LOOKUP);
          const salarioField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_SALARIO_POR_HORA);
          const pagoNominaField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_PAGO_DE_NOMINA);

          if (salarioLookupField && salarioField && nominaTable.hasPermissionToUpdateRecords()) {
            let attempts = 0;
            let salarioValue: number | null = null;

            while (attempts < 5 && salarioValue === null) {
              await new Promise(resolve => setTimeout(resolve, 800));
              attempts++;

              try {
                const queryResult = await nominaTable.selectRecordsAsync({ fields: [salarioLookupField] });
                const refreshedRecord = queryResult.getRecordByIdIfExists(nominaId);
                const lookupRaw = refreshedRecord?.getCellValue(salarioLookupField) as unknown;
                queryResult.unloadData();

                if (Array.isArray(lookupRaw) && lookupRaw.length > 0) {
                  const first = lookupRaw[0];
                  if (typeof first === 'number') {
                    salarioValue = first;
                  } else if (first && typeof first === 'object' && 'value' in (first as Record<string, unknown>)) {
                    const candidate = (first as Record<string, unknown>).value;
                    salarioValue = typeof candidate === 'number' ? candidate : null;
                  }
                }
              } catch (pollError) {
                console.error('Error leyendo Salario_por_Hora_Lookup:', pollError);
              }
            }

            if (salarioValue !== null) {
              try {
                await nominaTable.updateRecordAsync(nominaId, {
                  [FIELD_IDS.NOMINA_SALARIO_POR_HORA]: salarioValue,
                });
              } catch (updateError) {
                console.error('Error updating salario:', updateError);
                resultEntry.salarioPendiente = true;
              }
            } else {
              resultEntry.salarioPendiente = true;
            }
          }
        }
      } catch (error) {
        console.error('Error creating records for employee:', employeeName, error);
        resultEntry.error = error instanceof Error ? error.message : 'Error desconocido';
      }

      results.push(resultEntry);
    }

    const skippedDuplicates = viewState.rows.filter(r => r.status === 'duplicate' && !r.included).length;
    const notFoundRows = viewState.rows
      .filter(r => r.status === 'not_found')
      .map(r => ({ employeeNumber: r.employeeNumber, employeeName: r.employeeName }));

    const uniqueNotFound = Array.from(
      new Map(notFoundRows.map(r => [`${r.employeeNumber}`, r])).values()
    );

    setViewState({
      stage: 'completed',
      result: {
        totalControlHorario,
        totalNomina,
        employees: results,
        skippedDuplicates,
        notFoundRows: uniqueNotFound,
      },
    });
  }, [viewState, controlHorarioTable, nominaTable]);

  const handleReset = useCallback(() => {
    setViewState({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false);
    setViewState({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (errorState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 text-2xl">Error de configuración</p>
          <p className="text-gray-500 text-lg mt-2">{errorState.message}</p>
        </div>
      </div>
    );
  }

  if (!empleadosTable || !controlHorarioTable || !nominaTable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <WarningIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-800 text-2xl font-medium">Configuración Requerida</p>
          <p className="text-gray-500 text-lg mt-2">
            Configura las tablas de Empleados, Control Horario y Nómina en el panel de propiedades.
          </p>
        </div>
      </div>
    );
  }

  const renderImportStage = (): React.ReactElement => {
    if (viewState.stage === 'idle') {
      return (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center justify-center text-center border-2 border-dashed rounded-lg py-16 px-8 transition-colors ${
            isDraggingOver
              ? 'border-rose-400 bg-rose-50 dark:border-rose-400/50 dark:bg-rose-500/10'
              : 'border-gray-300 dark:border-[#382C2E]'
          }`}
        >
          <div>
            <UploadSimpleIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-800 dark:text-[#F5F3EF] text-2xl mb-1">Arrastra el reporte semanal del checador (.csv)</p>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">o selecciónalo desde tu computadora</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleSelectFile}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Seleccionar archivo(s)
            </button>
          </div>
        </div>
      );
    }

    if (viewState.stage === 'parsing') {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <SpinnerIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Procesando archivo...</p>
          </div>
        </div>
      );
    }

    if (viewState.stage === 'error') {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md mx-auto">
            <XCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <p className="text-gray-800 dark:text-[#F5F3EF] text-2xl mb-2">Error</p>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{viewState.message}</p>
            <button
              onClick={handleReset}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      );
    }

    if (viewState.stage === 'preview' || viewState.stage === 'importing') {
      const rows = viewState.rows;
      const isImporting = viewState.stage === 'importing';

      const weekMap = new Map<string, { start: Date; end: Date; rows: ParsedRow[] }>();
      for (const row of rows) {
        const { key, start, end } = getWeekRange(row.fecha);
        if (!weekMap.has(key)) {
          weekMap.set(key, { start, end, rows: [] });
        }
        weekMap.get(key)!.rows.push(row);
      }

      const weekGroups: WeekGroup[] = Array.from(weekMap.entries())
        .sort((a, b) => a[1].start.getTime() - b[1].start.getTime())
        .map(([key, weekData]) => {
          const groupMap = new Map<string, EmployeeGroup>();

          for (const row of weekData.rows) {
            const groupKey = row.employeeRecordId ?? `notfound-${row.employeeNumber}`;
            if (!groupMap.has(groupKey)) {
              groupMap.set(groupKey, {
                employeeRecordId: row.employeeRecordId,
                employeeNumber: row.employeeNumber,
                employeeName: row.employeePreferredName ?? row.employeeName,
                employeePreferredName: row.employeePreferredName,
                rows: [],
                groupStatus: 'ok',
              });
            }
            groupMap.get(groupKey)!.rows.push(row);
          }

          const employeeGroups = Array.from(groupMap.values());
          for (const group of employeeGroups) {
            group.rows.sort((a, b) => a.fecha.replace(/\//g, '-').localeCompare(b.fecha.replace(/\//g, '-')));
            if (group.rows.some(r => r.status === 'not_found')) {
              group.groupStatus = 'not_found';
            } else if (group.rows.some(r => r.status === 'duplicate')) {
              group.groupStatus = 'duplicate';
            } else if (group.rows.some(r => r.status === 'partial')) {
              group.groupStatus = 'partial';
            }
          }
          employeeGroups.sort((a, b) => a.employeeNumber - b.employeeNumber);

          const weekNumber = getISOWeekNumber(weekData.start);
          return { key, weekNumber, start: weekData.start, end: weekData.end, employeeGroups };
        });

      const totalEmployees = new Set(rows.map(r => r.employeeRecordId ?? `notfound-${r.employeeNumber}`)).size;
      const validRows = rows.filter(r => r.status === 'ok' || r.status === 'partial').length;
      const warningRows = rows.filter(r => r.status === 'duplicate' || r.status === 'partial').length;
      const errorRows = rows.filter(r => r.status === 'not_found').length;
      const includedRows = rows.filter(r => r.included).length;

      return (
        <div>
          <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-[#E9D9D9] dark:border-[#382C2E]">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {totalEmployees} empleados · {validRows} registros válidos · {warningRows} advertencias · {errorRows} errores
            </p>
          </div>

          <div className="space-y-8 mb-6">
            {weekGroups.map(week => (
              <div key={week.key}>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {formatWeekLabel(week.weekNumber, week.start, week.end)}
                </h3>
                <div className="space-y-4">
                  {week.employeeGroups.map(group => (
                    <EmployeeGroupComponent
                      key={group.employeeRecordId ?? group.employeeNumber}
                      group={group}
                      onToggleRow={toggleRowInclusion}
                      disabled={isImporting}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-[#E9D9D9] dark:border-[#382C2E]">
            <input
              ref={addMoreFileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleAddMoreFilesChange}
              className="hidden"
            />
            <button
              onClick={handleSelectMoreFiles}
              disabled={isImporting || isAddingMoreFiles}
              className="bg-white hover:bg-black/5 px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#E9D9D9] dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:hover:bg-white/5"
            >
              {isAddingMoreFiles && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isAddingMoreFiles ? 'Cargando...' : 'Seleccionar más archivos'}
            </button>

            <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isImporting}
              className="bg-white hover:bg-black/5 px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-[#E9D9D9] dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || includedRows === 0}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isImporting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isImporting ? 'Creando registros...' : 'Confirmar e Importar'}
            </button>
            </div>
          </div>
        </div>
      );
    }

    if (viewState.stage === 'completed') {
      const { result } = viewState;

      return (
        <div>
          <div className="text-center mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-medium text-gray-800 dark:text-[#F5F3EF] mb-2">Importación Completada</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {result.totalControlHorario} registros de Control Horario creados, {result.totalNomina} registros de Nómina creados
            </p>
          </div>

          {result.employees.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Resumen por empleado y semana</h3>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-[#E9D9D9] dark:border-[#382C2E] divide-y divide-[#E9D9D9] dark:divide-[#382C2E]">
                {result.employees.map((emp, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-lg text-gray-800 dark:text-gray-200">{emp.employeeName} · {emp.weekLabel}</p>
                      <p className="text-base text-gray-500 dark:text-gray-400">
                        {emp.controlHorarioCreated} Control Horario · {emp.nominaCreated ? 'Nómina creada' : 'Sin nómina'}
                      </p>
                    </div>
                    {emp.error && (
                      <span className="text-base bg-rose-50 text-rose-700 px-2 py-1 rounded dark:bg-rose-500/15 dark:text-rose-300">
                        Error: {emp.error}
                      </span>
                    )}
                    {emp.salarioPendiente && (
                      <span className="text-base bg-yellow-50 text-yellow-700 px-2 py-1 rounded dark:bg-yellow-500/15 dark:text-yellow-300">
                        Salario pendiente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.skippedDuplicates > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Advertencias</h3>
              <p className="text-lg text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:text-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30">
                {result.skippedDuplicates} registro(s) duplicado(s) omitido(s)
              </p>
            </div>
          )}

          {result.notFoundRows.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Empleados no encontrados</h3>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 dark:bg-rose-500/10 dark:border-rose-500/30">
                {result.notFoundRows.map((row, idx) => (
                  <p key={idx} className="text-lg text-rose-700 dark:text-rose-300">
                    #{row.employeeNumber} - {row.employeeName}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={handleReset}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Importar otro archivo
            </button>
          </div>
        </div>
      );
    }

    return <></>;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1B1517] flex flex-col">
      <NominaManager
        nominaTable={nominaTable}
        controlHorarioTable={controlHorarioTable}
        nominaRecords={nominaRecords}
        controlHorarioRecords={controlHorarioRecords}
        onOpenImport={() => setShowImportModal(true)}
      />

      {showImportModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={handleCloseImportModal}
        >
          <div
            className="bg-white dark:bg-[#251D1F] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#E9D9D9] dark:border-[#382C2E] sticky top-0 bg-white dark:bg-[#251D1F]">
              <h2 className="text-2xl font-medium text-gray-800 dark:text-[#F5F3EF]">Importar checador</h2>
              <button onClick={handleCloseImportModal} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{renderImportStage()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

interface EmployeeGroupProps {
  group: EmployeeGroup;
  onToggleRow: (rowId: string) => void;
  disabled: boolean;
}

function EmployeeGroupComponent({ group, onToggleRow, disabled }: EmployeeGroupProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  const statusBadge = useMemo(() => {
    switch (group.groupStatus) {
      case 'ok':
        return (
          <span className="inline-flex items-center gap-1 text-base bg-green-50 text-green-700 px-2 py-1 rounded dark:bg-green-500/15 dark:text-green-300">
            <CheckCircleIcon className="w-3 h-3" />
            OK
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-base bg-yellow-50 text-yellow-700 px-2 py-1 rounded dark:bg-yellow-500/15 dark:text-yellow-300">
            <WarningIcon className="w-3 h-3" />
            Parcial
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 text-base bg-yellow-50 text-yellow-700 px-2 py-1 rounded dark:bg-yellow-500/15 dark:text-yellow-300">
            <WarningIcon className="w-3 h-3" />
            Duplicados
          </span>
        );
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1 text-base bg-rose-50 text-rose-700 px-2 py-1 rounded dark:bg-rose-500/15 dark:text-rose-300">
            <XCircleIcon className="w-3 h-3" />
            No encontrado
          </span>
        );
    }
  }, [group.groupStatus]);

  return (
    <div className="border border-[#E9D9D9] dark:border-[#382C2E] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <CaretDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <CaretRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
            {group.employeeName}
          </span>
          <span className="text-base text-gray-500 dark:text-gray-400">
            #{group.employeeNumber}
          </span>
        </div>
        {statusBadge}
      </button>

      {expanded && (
        <div className="p-3">
          <table className="w-full text-lg">
            <thead>
              <tr className="text-left text-base text-gray-500 dark:text-gray-400 border-b border-[#E9D9D9] dark:border-[#382C2E]">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Entrada</th>
                <th className="pb-2 font-medium">Salida</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium text-center">Incluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {group.rows.map(row => (
                <tr key={row.id} className={row.status === 'not_found' ? 'opacity-50' : ''}>
                  <td className="py-2 text-gray-800 dark:text-gray-200">{formatFechaLarga(row.fecha)}</td>
                  <td className="py-2 text-gray-800 dark:text-gray-200">{row.entradaRaw ?? '-'}</td>
                  <td className="py-2 text-gray-800 dark:text-gray-200">{row.salidaRaw ?? '-'}</td>
                  <td className="py-2">
                    <RowStatusBadge status={row.status} message={row.statusMessage} />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.included}
                      disabled={disabled || row.status === 'not_found'}
                      onChange={() => onToggleRow(row.id)}
                      className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-400 disabled:opacity-50 dark:border-[#382C2E] dark:bg-[#251D1F]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface RowStatusBadgeProps {
  status: RowStatus;
  message: string;
}

function RowStatusBadge({ status, message }: RowStatusBadgeProps): React.ReactElement {
  switch (status) {
    case 'ok':
      return (
        <span className="inline-flex items-center gap-1 text-base bg-green-50 text-green-700 px-2 py-0.5 rounded dark:bg-green-500/15 dark:text-green-300">
          <CheckCircleIcon className="w-3 h-3" />
          {message}
        </span>
      );
    case 'partial':
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1 text-base bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded dark:bg-yellow-500/15 dark:text-yellow-300">
          <WarningIcon className="w-3 h-3" />
          {message}
        </span>
      );
    case 'not_found':
      return (
        <span className="inline-flex items-center gap-1 text-base bg-rose-50 text-rose-700 px-2 py-0.5 rounded dark:bg-rose-500/15 dark:text-rose-300">
          <XCircleIcon className="w-3 h-3" />
          {message}
        </span>
      );
  }
}

// El cell value de un campo multipleLookupValues siempre viene envuelto como
// { linkedRecordId, value }[] (nunca los valores planos), sin importar el tipo
// del campo original. Renderizar el wrapper directo dispara el error de React
// "Objects are not valid as a React child".
function getLookupFirst<T>(record: AirtableRecord, table: Table | undefined, fieldId: string): T | null {
  const field = table?.getFieldIfExists(fieldId);
  if (!field) return null;
  const value = record.getCellValue(field) as Array<{ linkedRecordId: string; value: T }> | null;
  return value && value.length > 0 ? (value[0]?.value ?? null) : null;
}

// Recorre cualquier combinación de envolturas que Airtable pueda devolver para
// un lookup encadenado (arreglos, {linkedRecordId, value}, {id, name}) hasta
// encontrar un nombre legible. Evita depender de suposiciones frágiles sobre
// cuántos niveles de anidamiento trae un lookup en particular.
function extractLookupName(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') return raw || undefined;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const name = extractLookupName(item);
      if (name) return name;
    }
    return undefined;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.name === 'string' && obj.name) return obj.name;
    if ('value' in obj) return extractLookupName(obj.value);
  }
  return undefined;
}

// NOMINA_EMPLEADO_LOOKUP hace lookup del campo Empleado (multipleRecordLinks)
// de Control Horario, así que el valor viene con más de un nivel de anidamiento.
function getEmpleadoName(record: AirtableRecord, nominaTable: Table | undefined): string | undefined {
  const field = nominaTable?.getFieldIfExists(FIELD_IDS.NOMINA_EMPLEADO_LOOKUP);
  if (!field) return undefined;
  return extractLookupName(record.getCellValue(field));
}

// Status es un campo de fórmula (singleSelect) directamente en Nómina, no un
// lookup, así que su valor no viene envuelto en un arreglo como los lookups.
function getStatusName(record: AirtableRecord, table: Table | undefined): string | undefined {
  const field = table?.getFieldIfExists(FIELD_IDS.NOMINA_STATUS);
  if (!field) return undefined;
  const value = record.getCellValue(field) as { name: string } | null;
  return value?.name;
}

interface LinkValue {
  id: string;
  name: string;
}

interface NominaManagerProps {
  nominaTable: Table | undefined;
  controlHorarioTable: Table | undefined;
  nominaRecords: AirtableRecord[] | null;
  controlHorarioRecords: AirtableRecord[] | null;
  onOpenImport: () => void;
}

function NominaManager({
  nominaTable,
  controlHorarioTable,
  nominaRecords,
  controlHorarioRecords,
  onOpenImport,
}: NominaManagerProps): React.ReactElement {
  const [selectedNominaId, setSelectedNominaId] = useState<string | null>(null);
  const [selectedControlHorarioId, setSelectedControlHorarioId] = useState<string | null>(null);
  // Colapsados por default: solo se expande el grupo de semana que el usuario abra.
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const toggleWeek = useCallback((label: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const pendingRecords = useMemo<AirtableRecord[]>(() => {
    if (!nominaRecords || !nominaTable) return [];

    const pendientes = nominaRecords.filter(record => getStatusName(record, nominaTable) !== 'Pagado');

    pendientes.sort((a, b) => {
      const inicioA = getLookupFirst<string>(a, nominaTable, FIELD_IDS.NOMINA_INICIO_SEMANA);
      const inicioB = getLookupFirst<string>(b, nominaTable, FIELD_IDS.NOMINA_INICIO_SEMANA);
      const sortKeyA = inicioA ? new Date(inicioA).getTime() : -Infinity;
      const sortKeyB = inicioB ? new Date(inicioB).getTime() : -Infinity;
      if (sortKeyA !== sortKeyB) return sortKeyB - sortKeyA;
      const nameA = getEmpleadoName(a, nominaTable) ?? '';
      const nameB = getEmpleadoName(b, nominaTable) ?? '';
      return nameA.localeCompare(nameB);
    });

    return pendientes;
  }, [nominaRecords, nominaTable]);

  const weekGroups = useMemo<{ label: string; sortKey: number; records: AirtableRecord[] }[]>(() => {
    if (!nominaTable) return [];
    const groupMap = new Map<string, { label: string; sortKey: number; records: AirtableRecord[] }>();
    for (const record of pendingRecords) {
      const label = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_SEMANA_LOOKUP) ?? 'Semana desconocida';
      const inicio = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_INICIO_SEMANA);
      const sortKey = inicio ? new Date(inicio).getTime() : -Infinity;
      if (!groupMap.has(label)) {
        groupMap.set(label, { label, sortKey, records: [] });
      }
      groupMap.get(label)!.records.push(record);
    }
    return Array.from(groupMap.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [pendingRecords, nominaTable]);

  const employeeSummary = useMemo<{ name: string; faltante: number }[]>(() => {
    if (!nominaTable) return [];
    const faltanteField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_FALTANTE);
    if (!faltanteField) return [];

    const totals = new Map<string, number>();
    for (const record of pendingRecords) {
      const name = getEmpleadoName(record, nominaTable) ?? 'Sin empleado';
      const faltante = (record.getCellValue(faltanteField) as number | null) ?? 0;
      totals.set(name, (totals.get(name) ?? 0) + faltante);
    }
    return Array.from(totals.entries())
      .map(([name, faltante]) => ({ name, faltante }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [pendingRecords, nominaTable]);

  const selectedNominaRecord = useMemo(
    () => nominaRecords?.find(r => r.id === selectedNominaId) ?? null,
    [nominaRecords, selectedNominaId]
  );

  const selectedControlHorarioRecord = useMemo(
    () => controlHorarioRecords?.find(r => r.id === selectedControlHorarioId) ?? null,
    [controlHorarioRecords, selectedControlHorarioId]
  );

  const closeNominaModal = useCallback(() => {
    setSelectedNominaId(null);
    setSelectedControlHorarioId(null);
  }, []);

  if (!nominaTable || !controlHorarioTable) return <></>;

  const hasAnyNominaRecords = !!nominaRecords && nominaRecords.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto flex gap-6 items-start">
        <div className="flex-1 min-w-0 border border-[#E9D9D9] dark:border-[#382C2E] rounded-lg overflow-hidden bg-white dark:bg-[#251D1F]">
          {!hasAnyNominaRecords && (
            <div className="text-center py-20">
              <UploadSimpleIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-1">Aún no hay registros de Nómina.</p>
              <p className="text-gray-500 dark:text-gray-500 text-lg">Importa el reporte del checador para generar los primeros registros.</p>
            </div>
          )}

          {hasAnyNominaRecords && pendingRecords.length === 0 && (
            <p className="text-lg text-gray-500 dark:text-gray-500 text-center py-12">
              No hay registros de Nómina pendientes de pago.
            </p>
          )}

          {pendingRecords.length > 0 && (
            <table className="w-full text-lg">
              <thead>
                <tr className="text-left text-base text-gray-500 dark:text-gray-400 border-b border-[#E9D9D9] dark:border-[#382C2E]">
                  <th className="px-4 py-2 font-medium">Empleado</th>
                  <th className="px-4 py-2 font-medium">Horas Ordinarias</th>
                  <th className="px-4 py-2 font-medium">Horas Extra</th>
                  <th className="px-4 py-2 font-medium">Faltante</th>
                  <th className="px-4 py-2 font-medium">Estatus</th>
                </tr>
              </thead>
              {weekGroups.map(group => {
                const isExpanded = expandedWeeks.has(group.label);
                return (
                <tbody key={group.label} className="divide-y divide-[#E9D9D9] dark:divide-[#382C2E] border-t border-[#E9D9D9] dark:border-[#382C2E]">
                  <tr
                    onClick={() => toggleWeek(group.label)}
                    className="bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <td colSpan={5} className="px-4 py-2 text-base font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <CaretDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <CaretRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                        {group.label}
                        <span className="text-gray-400 dark:text-gray-500 font-normal">
                          ({group.records.length})
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && group.records.map(record => {
                    const empleadoName = getEmpleadoName(record, nominaTable);
                    const status = getStatusName(record, nominaTable);
                    const montoOrdinariasField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_MONTO_HORAS_ORDINARIAS);
                    const montoExtraField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_MONTO_HORAS_EXTRA);
                    const faltanteField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_FALTANTE);
                    return (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedNominaId(record.id)}
                        className="cursor-pointer hover:bg-rose-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{empleadoName ?? 'Sin empleado'}</td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {montoOrdinariasField ? record.getCellValueAsString(montoOrdinariasField) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {montoExtraField ? record.getCellValueAsString(montoExtraField) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {faltanteField ? record.getCellValueAsString(faltanteField) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <NominaStatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                );
              })}
            </table>
          )}
        </div>

        <div className="w-80 shrink-0 border border-[#E9D9D9] dark:border-[#382C2E] rounded-lg overflow-hidden bg-white dark:bg-[#251D1F]">
          <div className="flex items-center justify-between p-3 border-b border-[#E9D9D9] dark:border-[#382C2E]">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">Resumen por empleado</h3>
            <button
              onClick={onOpenImport}
              title="Importar"
              className="bg-gray-900 text-white p-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer flex items-center justify-center dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <UploadSimpleIcon className="w-4 h-4" />
            </button>
          </div>

          {employeeSummary.length === 0 ? (
            <p className="text-base text-gray-500 dark:text-gray-500 text-center py-10 px-3">
              Sin montos pendientes.
            </p>
          ) : (
            <table className="w-full text-lg">
              <thead>
                <tr className="text-left text-base text-gray-500 dark:text-gray-400 border-b border-[#E9D9D9] dark:border-[#382C2E]">
                  <th className="px-3 py-2 font-medium">Empleado</th>
                  <th className="px-3 py-2 font-medium text-right">Faltante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D9D9] dark:divide-[#382C2E]">
                {employeeSummary.map(item => (
                  <tr key={item.name}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(item.faltante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedNominaRecord && (
        <NominaDetailModal
          record={selectedNominaRecord}
          nominaTable={nominaTable}
          controlHorarioTable={controlHorarioTable}
          controlHorarioRecords={controlHorarioRecords}
          onClose={closeNominaModal}
          onSelectControlHorario={setSelectedControlHorarioId}
        />
      )}

      {selectedControlHorarioRecord && (
        <ControlHorarioDetailModal
          record={selectedControlHorarioRecord}
          controlHorarioTable={controlHorarioTable}
          onClose={() => setSelectedControlHorarioId(null)}
        />
      )}
    </div>
  );
}

function NominaStatusBadge({ status }: { status: string | undefined }): React.ReactElement {
  switch (status) {
    case 'Pagado':
      return (
        <span className="inline-flex items-center gap-1 text-base bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30">
          <CheckCircleIcon className="w-3 h-3" />
          Pagado
        </span>
      );
    case 'Parcial':
      return (
        <span className="inline-flex items-center gap-1 text-base bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30">
          <WarningIcon className="w-3 h-3" />
          Parcial
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-base bg-rose-50 text-rose-600 px-2 py-1 rounded-full border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
          {status ?? 'Pendiente'}
        </span>
      );
  }
}

interface NominaDetailModalProps {
  record: AirtableRecord;
  nominaTable: Table;
  controlHorarioTable: Table;
  controlHorarioRecords: AirtableRecord[] | null;
  onClose: () => void;
  onSelectControlHorario: (id: string) => void;
}

function NominaDetailModal({
  record,
  nominaTable,
  controlHorarioTable,
  controlHorarioRecords,
  onClose,
  onSelectControlHorario,
}: NominaDetailModalProps): React.ReactElement {
  const pagadoOrdinarioField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_PAGADO_ORDINARIO);
  const pagadoExtraField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_PAGADO_EXTRA);
  const canEditPagado = nominaTable.hasPermissionToUpdateRecords();

  const currentPagadoOrdinario = (pagadoOrdinarioField ? (record.getCellValue(pagadoOrdinarioField) as number | null) : null) ?? 0;
  const currentPagadoExtra = (pagadoExtraField ? (record.getCellValue(pagadoExtraField) as number | null) : null) ?? 0;
  const [pagadoOrdinarioValue, setPagadoOrdinarioValue] = useState<string>(String(currentPagadoOrdinario));
  const [pagadoExtraValue, setPagadoExtraValue] = useState<string>(String(currentPagadoExtra));

  const empleadoName = getEmpleadoName(record, nominaTable);
  const semana = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_SEMANA_LOOKUP);
  const status = getStatusName(record, nominaTable);
  const faltanteField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_FALTANTE);
  const faltanteDisplay = faltanteField ? record.getCellValueAsString(faltanteField) : '';

  const horasOrdinariasTrabajadasField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_HORAS_ORDINARIAS_TRABAJADAS);
  const horasOrdinariasTrabajadasDisplay = horasOrdinariasTrabajadasField ? record.getCellValueAsString(horasOrdinariasTrabajadasField) : '-';
  const horasExtraTrabajadasField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_HORAS_EXTRA_TRABAJADAS);
  const horasExtraTrabajadasDisplay = horasExtraTrabajadasField ? record.getCellValueAsString(horasExtraTrabajadasField) : '-';
  const montoHorasOrdinariasField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_MONTO_HORAS_ORDINARIAS);
  const montoHorasOrdinariasDisplay = montoHorasOrdinariasField ? record.getCellValueAsString(montoHorasOrdinariasField) : '-';
  const montoHorasExtraField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_MONTO_HORAS_EXTRA);
  const montoHorasExtraDisplay = montoHorasExtraField ? record.getCellValueAsString(montoHorasExtraField) : '-';

  const controlHorarioField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_CONTROL_HORARIO);
  const linkedIds = new Set(
    (controlHorarioField ? (record.getCellValue(controlHorarioField) as LinkValue[] | null) : null)?.map(
      l => l.id
    ) ?? []
  );
  const linkedRecords = (controlHorarioRecords ?? []).filter(r => linkedIds.has(r.id));

  const entradaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
  linkedRecords.sort((a, b) => {
    const da = entradaField ? ((a.getCellValue(entradaField) as string | null) ?? '') : '';
    const db = entradaField ? ((b.getCellValue(entradaField) as string | null) ?? '') : '';
    return da.localeCompare(db);
  });

  const savePagadoOrdinario = useCallback(() => {
    if (!canEditPagado || !pagadoOrdinarioField) return;
    const parsed = parseFloat(pagadoOrdinarioValue);
    const nextValue = isNaN(parsed) ? 0 : parsed;
    if (nextValue === currentPagadoOrdinario) return;
    nominaTable.updateRecordAsync(record.id, { [FIELD_IDS.NOMINA_PAGADO_ORDINARIO]: nextValue }).catch(error => {
      console.error('Error updating pagado_ordinario:', error);
    });
  }, [canEditPagado, pagadoOrdinarioField, pagadoOrdinarioValue, currentPagadoOrdinario, nominaTable, record.id]);

  const savePagadoExtra = useCallback(() => {
    if (!canEditPagado || !pagadoExtraField) return;
    const parsed = parseFloat(pagadoExtraValue);
    const nextValue = isNaN(parsed) ? 0 : parsed;
    if (nextValue === currentPagadoExtra) return;
    nominaTable.updateRecordAsync(record.id, { [FIELD_IDS.NOMINA_PAGADO_EXTRA]: nextValue }).catch(error => {
      console.error('Error updating pagado_extra:', error);
    });
  }, [canEditPagado, pagadoExtraField, pagadoExtraValue, currentPagadoExtra, nominaTable, record.id]);

  const horasExtraAutorizadasField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA_AUTORIZADAS);
  const canEditHorasExtraAutorizadas = !!horasExtraAutorizadasField && controlHorarioTable.hasPermissionToUpdateRecords();

  const toggleHorasExtraAutorizadas = useCallback((chRecord: AirtableRecord, current: boolean) => {
    if (!canEditHorasExtraAutorizadas || !horasExtraAutorizadasField) return;
    controlHorarioTable.updateRecordAsync(chRecord.id, { [FIELD_IDS.CH_HORAS_EXTRA_AUTORIZADAS]: !current }).catch(error => {
      console.error('Error updating Horas Extra Autorizadas:', error);
    });
  }, [canEditHorasExtraAutorizadas, horasExtraAutorizadasField, controlHorarioTable]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#251D1F] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-medium text-gray-800 dark:text-[#F5F3EF]">Pago de Nómina</h2>
              <NominaStatusBadge status={status} />
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">{empleadoName ?? 'Sin empleado'} · {semana}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Pagado Ordinario</label>
                <div className="flex items-center border border-gray-300 dark:border-[#382C2E] rounded-lg px-2 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-300 transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    value={pagadoOrdinarioValue}
                    disabled={!canEditPagado}
                    onChange={e => setPagadoOrdinarioValue(e.target.value)}
                    onBlur={savePagadoOrdinario}
                    className="w-full py-1.5 px-1 text-lg outline-none disabled:bg-transparent disabled:text-gray-500 bg-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Pagado Extra</label>
                <div className="flex items-center border border-gray-300 dark:border-[#382C2E] rounded-lg px-2 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-300 transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    value={pagadoExtraValue}
                    disabled={!canEditPagado}
                    onChange={e => setPagadoExtraValue(e.target.value)}
                    onBlur={savePagadoExtra}
                    className="w-full py-1.5 px-1 text-lg outline-none disabled:bg-transparent disabled:text-gray-500 bg-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Faltante</label>
                <p className="text-lg text-gray-800 dark:text-gray-200 py-1.5">{faltanteDisplay}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Horas Ordinarias Trabajadas</label>
                <p className="text-lg text-gray-800 dark:text-gray-200 py-1.5">{horasOrdinariasTrabajadasDisplay}</p>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Monto Horas Ordinarias</label>
                <p className="text-lg text-gray-800 dark:text-gray-200 py-1.5">{montoHorasOrdinariasDisplay}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Horas Extra Trabajadas</label>
                <p className="text-lg text-gray-800 dark:text-gray-200 py-1.5">{horasExtraTrabajadasDisplay}</p>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Monto Horas Extra</label>
                <p className="text-lg text-gray-800 dark:text-gray-200 py-1.5">{montoHorasExtraDisplay}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Control Horario</p>
            <table className="w-full text-lg">
              <thead>
                <tr className="text-left text-base text-gray-500 dark:text-gray-400 border-b border-[#E9D9D9] dark:border-[#382C2E]">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Horas Ordinarias</th>
                  <th className="pb-2 font-medium">Horas Extra</th>
                  <th className="pb-2 font-medium text-center">Extra Autorizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {linkedRecords.map(chRecord => {
                  const entrada = entradaField ? (chRecord.getCellValue(entradaField) as string | null) : null;
                  const horasOrdField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_ORDINARIAS);
                  const horasExtraField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA);
                  const horasExtraAutorizadas = horasExtraAutorizadasField
                    ? !!chRecord.getCellValue(horasExtraAutorizadasField)
                    : false;
                  return (
                    <tr
                      key={chRecord.id}
                      onClick={() => onSelectControlHorario(chRecord.id)}
                      className="cursor-pointer hover:bg-rose-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2 text-gray-800 dark:text-gray-200">{entrada ? formatFechaLarga(isoToMexicoCityDateKey(entrada) ?? '') : '-'}</td>
                      <td className="py-2 text-gray-800 dark:text-gray-200">
                        {horasOrdField ? chRecord.getCellValueAsString(horasOrdField) : '-'}
                      </td>
                      <td className="py-2 text-gray-800 dark:text-gray-200">
                        {horasExtraField ? chRecord.getCellValueAsString(horasExtraField) : '-'}
                      </td>
                      <td className="py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={horasExtraAutorizadas}
                          disabled={!canEditHorasExtraAutorizadas}
                          onChange={() => toggleHorasExtraAutorizadas(chRecord, horasExtraAutorizadas)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-400 disabled:opacity-50 dark:border-[#382C2E] dark:bg-[#251D1F] cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ControlHorarioDetailModalProps {
  record: AirtableRecord;
  controlHorarioTable: Table;
  onClose: () => void;
}

function parseISOToDateAndTime(iso: string | null): { date: Date; time: string } {
  const parts = iso ? isoToMexicoCityParts(iso) : null;
  if (!parts) {
    const now = new Date();
    return { date: now, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` };
  }
  const date = new Date(parts.year, parts.month - 1, parts.day);
  const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  return { date, time };
}

function ControlHorarioDetailModal({
  record,
  controlHorarioTable,
  onClose,
}: ControlHorarioDetailModalProps): React.ReactElement {
  const empleadoField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_EMPLEADO);
  const entradaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
  const salidaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_SALIDA);
  const horasLaborablesField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_LABORABLES);
  const horasOrdField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_ORDINARIAS);
  const horasExtraField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA);
  const horasExtraAutorizadasField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA_AUTORIZADAS);

  const canEdit = controlHorarioTable.hasPermissionToUpdateRecords();

  const empleado = empleadoField ? (record.getCellValue(empleadoField) as LinkValue[] | null)?.[0] : null;
  const currentEntrada = entradaField ? (record.getCellValue(entradaField) as string | null) : null;
  const currentSalida = salidaField ? (record.getCellValue(salidaField) as string | null) : null;
  const currentHorasExtraAutorizadas = horasExtraAutorizadasField ? !!record.getCellValue(horasExtraAutorizadasField) : false;

  const entradaParsed = parseISOToDateAndTime(currentEntrada);
  const salidaParsed = parseISOToDateAndTime(currentSalida);

  const [entradaDate, setEntradaDate] = useState(entradaParsed.date);
  const [entradaTime, setEntradaTime] = useState(entradaParsed.time);
  const [salidaDate, setSalidaDate] = useState(salidaParsed.date);
  const [salidaTime, setSalidaTime] = useState(salidaParsed.time);
  const [showEntradaCalendar, setShowEntradaCalendar] = useState(false);
  const [showSalidaCalendar, setShowSalidaCalendar] = useState(false);

  const saveEntrada = useCallback((date: Date, time: string) => {
    if (!canEdit || !entradaField) return;
    const iso = `${formatDateForComparison(date)}T${time}:00-06:00`;
    controlHorarioTable.updateRecordAsync(record.id, { [FIELD_IDS.CH_ENTRADA]: iso }).catch(error => {
      console.error('Error updating Entrada:', error);
    });
  }, [canEdit, entradaField, controlHorarioTable, record.id]);

  const saveSalida = useCallback((date: Date, time: string) => {
    if (!canEdit || !salidaField) return;
    const iso = `${formatDateForComparison(date)}T${time}:00-06:00`;
    controlHorarioTable.updateRecordAsync(record.id, { [FIELD_IDS.CH_SALIDA]: iso }).catch(error => {
      console.error('Error updating Salida:', error);
    });
  }, [canEdit, salidaField, controlHorarioTable, record.id]);

  const toggleHorasExtraAutorizadas = useCallback(() => {
    if (!canEdit || !horasExtraAutorizadasField) return;
    controlHorarioTable.updateRecordAsync(record.id, { [FIELD_IDS.CH_HORAS_EXTRA_AUTORIZADAS]: !currentHorasExtraAutorizadas }).catch(error => {
      console.error('Error updating Horas Extra Autorizadas:', error);
    });
  }, [canEdit, horasExtraAutorizadasField, currentHorasExtraAutorizadas, controlHorarioTable, record.id]);

  const dateInputCls = 'w-full border border-gray-300 dark:border-[#382C2E] rounded-lg px-3 py-2 pr-9 text-lg outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition-colors disabled:bg-gray-50 disabled:text-gray-500 dark:bg-[#1B1517] dark:text-gray-100 dark:disabled:bg-white/5';
  const labelCls = 'block text-base font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#251D1F] rounded-2xl shadow-2xl border border-[#E9D9D9] dark:border-[#382C2E] max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <h3 className="text-lg font-medium text-gray-800 dark:text-[#F5F3EF]">Detalle de Control Horario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <label className={labelCls}>Empleado</label>
              <p className="text-lg text-gray-800 dark:text-gray-200">{empleado?.name ?? 'Sin empleado'}</p>
            </div>
            <label className="flex items-center gap-2 pb-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentHorasExtraAutorizadas}
                disabled={!canEdit || !horasExtraAutorizadasField}
                onChange={toggleHorasExtraAutorizadas}
                className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-400 disabled:opacity-50 dark:border-[#382C2E] dark:bg-[#251D1F] cursor-pointer"
              />
              <span className="text-base text-gray-600 dark:text-gray-400 whitespace-nowrap">Horas Extra Autorizadas</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Entrada</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  disabled={!canEdit}
                  value={formatFechaLarga(formatDateForComparison(entradaDate))}
                  onClick={() => canEdit && setShowEntradaCalendar(o => !o)}
                  className={`${dateInputCls} cursor-pointer`}
                />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => canEdit && setShowEntradaCalendar(o => !o)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"
                >
                  <CalendarIcon size={15} />
                </button>
                {showEntradaCalendar && (
                  <MiniCalendar
                    selectedDate={entradaDate}
                    onSelectDate={date => { setEntradaDate(date); setShowEntradaCalendar(false); saveEntrada(date, entradaTime); }}
                    onClose={() => setShowEntradaCalendar(false)}
                  />
                )}
              </div>
              <div className="w-32 flex-shrink-0">
                <CustomTimePicker
                  value={entradaTime}
                  onChange={time => { setEntradaTime(time); saveEntrada(entradaDate, time); }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Salida</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  disabled={!canEdit}
                  value={formatFechaLarga(formatDateForComparison(salidaDate))}
                  onClick={() => canEdit && setShowSalidaCalendar(o => !o)}
                  className={`${dateInputCls} cursor-pointer`}
                />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => canEdit && setShowSalidaCalendar(o => !o)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors dark:text-gray-500 dark:hover:text-rose-400"
                >
                  <CalendarIcon size={15} />
                </button>
                {showSalidaCalendar && (
                  <MiniCalendar
                    selectedDate={salidaDate}
                    onSelectDate={date => { setSalidaDate(date); setShowSalidaCalendar(false); saveSalida(date, salidaTime); }}
                    onClose={() => setShowSalidaCalendar(false)}
                  />
                )}
              </div>
              <div className="w-32 flex-shrink-0">
                <CustomTimePicker
                  value={salidaTime}
                  onChange={time => { setSalidaTime(time); saveSalida(salidaDate, time); }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Horas Laborables</label>
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {horasLaborablesField ? record.getCellValueAsString(horasLaborablesField) : '-'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Horas Ordinarias</label>
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {horasOrdField ? record.getCellValueAsString(horasOrdField) : '-'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Horas Extra</label>
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {horasExtraField ? record.getCellValueAsString(horasExtraField) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

initializeBlock({ interface: () => <ImportadorChecadorApp /> });