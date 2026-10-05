export const TAREAS = {
  TABLE: 'tblESlAFi4WqHlJtk',
  TITULO: 'fldjp6JuLhAyrG73J',
  ETAPA: 'fldXHZrKduKmnqBca',
  /** Fecha de inicio. */
  FECHA: 'fldUZHLxstgHF2CWV',
  FECHA_FIN: 'fldXRmX1xEbLjIEyI',
  ASIGNADA: 'fld4G5m56kFAa8FjG',
  COMPLETADA: 'fldwWD5uEpyESCR5g',
  ESTATUS: 'fldc4Zj0xoAB8JR3H',
  ORIGEN: 'flds23DEOOiZLXmqj',
  NOTAS: 'fldYvtuASYfHv1olm',
  PEDIDO: 'fldUxrDmIoHee1nIM',
  ELEMENTO: 'fldrSmQZzC0rA9wVs',
  EMPLEADO: 'fldtvB1baArb6vNLX',
} as const;

export const CAPACIDAD = {
  TABLE: 'tblPAkcQ9H9FkQuJs',
  NOMBRE: 'fldDQahB1raYVjP71',
  ETAPA: 'fldy8yPHLXgiOy2FT',
  GPD: 'fldUANjFTjbng0OHl',
  NOTAS: 'fld3AP39xZ9sYsSWJ',
  EMPLEADO: 'fldC1hdFsCMzeBL4d',
} as const;

export const EMPLEADOS = {
  TABLE: 'tblgvAGhDkTxLW4vl',
  NOMBRE: 'fldqmdTv4ifS0WaBw',
  NUMERO: 'fld98Dvce9dtbk8Ja',
  ESTATUS: 'fld1MieUl9ZK2Z6Ap',
  // Checkbox: participa en producción de galletas
  PRODUCCION: 'fldWHv9SRVEcxxaIu' as string,
} as const;

export const HORARIOS = {
  TABLE: 'tblyKQ7lENlUt3Itd',
  EMPLEADO: 'fldj0acS7o2lo0o7I',
  DESDE: 'fldHfZyjDJvuxsUvH',
  // Monday..Sunday → [entrada, salida] (duration in seconds)
  DAYS: [
    ['fld8gXfUvksOqmymh', 'fldVf7QtzwXy6uXq4'],
    ['fldAzsK57s3ziwpb9', 'fldRdLUaIJcRKUC6P'],
    ['fldGiJFnmFV4RF4by', 'fldNOAx1jPpreomEn'],
    ['fld71WboX6wMLzOVd', 'fldobk8Sl9GPUC69V'],
    ['fldM1WfwMRb7vqTaR', 'fldGRXO5UTAPVsI75'],
    ['fldM74O9EabpdvBz5', 'fldJqpWKPZlcIXbcG'],
    ['fldkkuWvGKoOc39cL', 'fldSVswgiYRn521I3'],
  ] as const,
} as const;

export type Etapa = 'Horneado' | 'Embetunado' | 'Glaseado' | 'Decorado' | 'Empacado';
export type TipoProducto = 'Pastel' | 'Plancha de cupcakes' | 'Galletas';

/** Every stage, in production order (matches the Etapa select options). */
export const TODAS_ETAPAS: Etapa[] = ['Horneado', 'Embetunado', 'Glaseado', 'Decorado', 'Empacado'];

/**
 * Product type, deduced from the Catálogo product name (NOT the Catálogo "Tipo" field).
 * "Pastel…" (incl. "Pastel Cake Box") → Pastel; "Cupcakes" → Plancha de cupcakes; "Galletas" → Galletas.
 * Anything else (Calendario, Rosca de reyes, Casa de Jengibre, Figuras fondant, Caja de repostería…) → null (no stages, no tasks).
 */
export function tipoProducto(nombre: string | null | undefined): TipoProducto | null {
  const n = (nombre ?? '').trim().toLowerCase();
  if (n.startsWith('pastel')) return 'Pastel';
  if (n.startsWith('cupcake')) return 'Plancha de cupcakes';
  if (n.startsWith('galleta')) return 'Galletas';
  return null;
}

/** Stages for a product type. Pastel / Plancha de cupcakes: Horneado, Embetunado, Decorado, Empacado. Galletas: Horneado, Glaseado, Decorado, Empacado. */
export function etapasPorTipo(tipo: TipoProducto | null): Etapa[] {
  if (tipo === 'Pastel' || tipo === 'Plancha de cupcakes') return ['Horneado', 'Embetunado', 'Decorado', 'Empacado'];
  if (tipo === 'Galletas') return ['Horneado', 'Glaseado', 'Decorado', 'Empacado'];
  return [];
}

/** Stages for a Catálogo product name (empty for products without stages). */
export function etapasDeProducto(nombreProducto: string | null | undefined): Etapa[] {
  return etapasPorTipo(tipoProducto(nombreProducto));
}

/** Current Producción screens still track cookie orders only; they use the cookie stages until the per-element prompts. */
export const ETAPAS: Etapa[] = etapasPorTipo('Galletas');
export const ESTATUS_TAREA = ['Pendiente', 'En proceso', 'Terminado', 'Bloqueado'] as const;

// Default galletas/día per person when no capacity row exists (estimates; editable in "Capacidades").
export const DEFAULT_RATE: Record<Etapa, number> = { Horneado: 1000, Embetunado: 300, Glaseado: 400, Decorado: 100, Empacado: 600 };

// Orders with at least this many cookies are treated as "grandes".
export const BIG_THRESHOLD = 200;

export const ETAPA_STYLE: Record<Etapa, { chip: string; bar: string; dot: string; short: string; hex: string; text: string }> = {
  Horneado: { chip: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30', bar: 'bg-amber-500', dot: 'bg-amber-500', short: 'Horn.', hex: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' },
  Embetunado: { chip: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-200 dark:border-teal-500/30', bar: 'bg-teal-500', dot: 'bg-teal-500', short: 'Embet.', hex: '#14b8a6', text: 'text-teal-600 dark:text-teal-400' },
  Glaseado: { chip: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30', bar: 'bg-sky-500', dot: 'bg-sky-500', short: 'Glas.', hex: '#0ea5e9', text: 'text-sky-600 dark:text-sky-400' },
  Decorado: { chip: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30', bar: 'bg-rose-500', dot: 'bg-rose-500', short: 'Deco.', hex: '#f43f5e', text: 'text-rose-600 dark:text-rose-400' },
  Empacado: { chip: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30', bar: 'bg-violet-500', dot: 'bg-violet-500', short: 'Emp.', hex: '#8b5cf6', text: 'text-violet-600 dark:text-violet-400' },
};

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseKey(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() - ((x.getDay() + 6) % 7));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export const fmtInt = (n: number) => new Intl.NumberFormat('es-MX').format(Math.round(n));
