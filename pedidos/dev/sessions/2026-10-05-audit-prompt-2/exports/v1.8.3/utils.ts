import { type AirtableRecord, type Table } from './lib/airtable-hooks';

/** Airtable table IDs (never table names, so renaming a table in Airtable can't break the app). */
export const TABLE_IDS = {
  pedidos: 'tbl4izLZNlOcem1SC',
  elementos: 'tblis88Izkhbi3SIG',
  catalogo: 'tbllPBYdLexX7ZetM',
  cake_topper: 'tblipWNMWD2ZfDSf1',
} as const;

// ─── Field access: always by field ID ──
// The code only ever passes field IDs. They are resolved against the live schema at load time,
// so renaming a field in Airtable never breaks the app.
export function fld(table: Table | null | undefined, fieldId: string): any {
  return table?.getFieldById(fieldId) ?? fieldId;
}
export function cv(record: AirtableRecord, table: Table | null | undefined, fieldId: string): unknown {
  return record.getCellValue(fld(table, fieldId));
}
export function cvs(record: AirtableRecord, table: Table | null | undefined, fieldId: string): string {
  return record.getCellValueAsString(fld(table, fieldId));
}

export const FIELD_IDS = {
  PEDIDO_ID: 'fldczBetjpB774xkR',
  ESTATUS: 'fldxy88bESBs57F9r',
  NUMERO_NOTA: 'fldEgIlOKa0R2x9vx',
  FECHA_ENTREGA: 'fldc9PHWWrc4ThY6x',
  FECHA_ENTREGA_CLIENTE: 'fld3EOkVHmX8PHObD',
  CLIENTE: 'fldfhgJV1cvaETHxW',
  METODO_CONTACTO: 'fldrL0Ky9gFspwEeR',
  NUMERO_TELEFONO: 'fldnCpbKGBSjVW4WU',
  ELEMENTOS: 'fldpupPTUZWSEvemI',
  COSTO_TOTAL: 'fldKiOmzETq2MLdYC',
  ANTICIPO: 'fldSLRtgTaXQazskn',
  LIQUIDADO: 'fldUjlrxjHQa1n4Yo',
  RESTANTE: 'fldgmDFv8FbEICfYh',
  FECHA_ENTREGA_HORA: 'fldKSlQwn5jcXAj3b',
  IMPRESO: 'fld5LaJlJYzOdIEFD',
  CAKE_TOPPER: 'fldITlLvE8dcFMDgo',
  CREATED: 'fldqYUCbJF8CJX1KT',
  EL_NOMBRE: 'flddTGNiG8RFSqniA',
  EL_DESCRIPCION: 'fldUUqWGfhYqcQpJx',
  EL_CANTIDAD: 'fldRXts0LZFxbXeXz',
  EL_COSTO_UNITARIO: 'fld6hEjhbVFvvIrkI',
  EL_COSTO_TOTAL: 'fldFEGpYh5gZXr0hS',
  EL_PEDIDOS: 'fldyBFdIC1QVZJrnl',
  EL_PRODUCTO: 'fldhyj9TEbD8ABnBK',
  EL_PAN: 'fldilDtr8k7WHvLqd',
  EL_RELLENO: 'fld9lY7KD8cGin9bL',
  CAT_NOMBRE: 'flduxPtM9vWcE8x9n',
  CAT_TIPO: 'fldqkk22IHoPAkion',
  CT_NOMBRE: 'fld07EY54VjzIVNzR',
  CT_FECHA: 'fldgeRj5C2Q5EZP7l',
  CT_MEDIDAS: 'fldnNsrr7mEzGlNvc',
  CT_COSTO: 'fldUudD2bmAIh4jmf',
  CT_PEDIDOS: 'fldnoQlxnxx7wx2W2',
  CT_REFERENCIA: 'fldo5y2cxMAwV9qw9',
} as const;

// ─── Date / number helpers ────────────────────────────────────────────────────
export function formatDateForComparison(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatFriendlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoMatch
    ? new Date(parseInt(isoMatch[1]!), parseInt(isoMatch[2]!) - 1, parseInt(isoMatch[3]!))
    : new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function formatFriendlyDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
}

export function formatTimeOnly(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function parseTypedDate(str: string): Date | null {
  if (!str.trim()) return null;
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1]!), parseInt(iso[2]!) - 1, parseInt(iso[3]!));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function toTitleCase(str: string | null | undefined): string {
  if (!str) return str ?? '';
  return str.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function getCardColorClasses(estatus: string | null | undefined): string {
  const val = (estatus ?? '').toLowerCase();
  if (val === 'pendiente') return 'border-rose-200 bg-rose-50 hover:border-rose-300 hover:shadow-md dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:border-rose-400/50';
  if (val === 'entregado') return 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-md dark:border-green-500/30 dark:bg-green-500/10';
  return 'border-[#E9D9D9] bg-white hover:border-rose-200 hover:shadow-md dark:border-[#382C2E] dark:bg-[#251D1F]';
}

export function esProductoConRellenoYPan(nombre: string): boolean {
  return /pastel|cupcake/i.test(nombre);
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────
export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MONTHS_ES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export function getCalendarDays(year: number, month: number): Array<{ date: Date; currentMonth: boolean }> {
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

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Time helpers ─────────────────────────────────────────────────────────────
export function to12h(h24: number): { h: number; p: 'AM' | 'PM' } {
  if (h24 === 0) return { h: 12, p: 'AM' };
  if (h24 === 12) return { h: 12, p: 'PM' };
  if (h24 < 12) return { h: h24, p: 'AM' };
  return { h: h24 - 12, p: 'PM' };
}

export function to24h(h12: number, p: 'AM' | 'PM'): number {
  if (p === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

export function fmtTimeDisplay(h24: number, m: number): string {
  const { h, p } = to12h(h24);
  return `${h}:${String(m).padStart(2, '0')} ${p}`;
}

export function parseTimeValue(v: string): { h24: number; m: number } | null {
  if (!v) return null;
  const parts = v.split(':');
  const h24 = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  if (isNaN(h24) || isNaN(m)) return null;
  return { h24, m };
}

export const SPIN_HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const SPIN_MINUTE_VALS = [0, 15, 30, 45] as const;
export const SPIN_MINUTES = SPIN_MINUTE_VALS.map((m) => String(m).padStart(2, '0'));
export const SPIN_PERIODS = ['AM', 'PM'] as const;

export function snapToValidMinute(m: number): number {
  return [...SPIN_MINUTE_VALS].reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a));
}

// ─── Select / linked-record value helpers ─────────────────────────────────────
export function readSelect(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'name' in (value as any)) return (value as any).name ?? '';
  return String(value);
}

export function readLinked(value: unknown): Array<{ id: string; name: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((v: any) => (typeof v === 'string' ? { id: v, name: v } : { id: v?.id, name: v?.name ?? v?.id }))
    .filter((v: any) => typeof v.id === 'string');
}

export function buildDateTime(date: Date | null, time: string): string {
  const d = date ? new Date(date) : new Date();
  if (time) {
    const parts = time.split(':').map(Number);
    d.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0);
  }
  return d.toISOString();
}
