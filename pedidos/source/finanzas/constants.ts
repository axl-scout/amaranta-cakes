import { FIELD_IDS } from '../utils';

export const PAGOS = {
  TABLE: 'tbl0zHyITc8aYCFxI',
  CONCEPTO: 'fldhjHtNN28hsdneD',
  PEDIDO: 'fldY9a9dLI8m5dJ3N',
  TIPO: 'fldoCT2bI087BPZV8',
  MONTO: 'fldx5agcaUCldwfYD',
  FORMA: 'fldh41rPnjzAw8DER',
  FECHA: 'fldl0CHeNGd2UWHDA',
  NOTAS: 'fldP7j009KqiS01pt',
} as const;

export const GASTOS = {
  TABLE: 'tblZSn2ApDyNQmlhN',
  DESCRIPCION: 'fldlKEGZTB2qI8UaK',
  FECHA: 'fldWLj1oaoJl5ioW0',
  CATEGORIA: 'fldyH7M9hf7ishrtj',
  MONTO: 'fld1UJaFW1fsgTrdv',
  NOTAS: 'fldYfaKS4xjZOGhL3',
  TIPO: 'fld1D7www6CtgwRTA',
  ESTATUS: 'fldsowluc57as87Uo',
  SEMANA: 'fldWzy44YzCR740MI',
  EMPLEADO: 'fldAkiOANpDILscpx',
  FORMA: 'fldbOgnxlUUzd4cbA',
} as const;

export const EMP = {
  TABLE: 'tblgvAGhDkTxLW4vl',
  NOMBRE: 'fldqmdTv4ifS0WaBw',
  ESTATUS: 'fld1MieUl9ZK2Z6Ap',
  SEMANAL: 'fldHTwtA0X33McjpU',
  /** Partners don't get payroll. */
  SOCIA: 'fldye721U8WlBpuyN',
} as const;

export const PED = {
  ID: FIELD_IDS.PEDIDO_ID,
  /** Delivery to the client — decides in which week an order's balance is expected. */
  FECHA: FIELD_IDS.FECHA_ENTREGA_CLIENTE,
  FECHA_PRODUCCION: FIELD_IDS.FECHA_ENTREGA,
  TOTAL: FIELD_IDS.COSTO_TOTAL,
  ANTICIPO: FIELD_IDS.ANTICIPO,
  LIQUIDADO: FIELD_IDS.LIQUIDADO,
  ESTATUS: FIELD_IDS.ESTATUS,
} as const;

export type TipoPago = 'Anticipo' | 'Abono' | 'Liquidación';
export const TIPOS_PAGO: TipoPago[] = ['Anticipo', 'Abono', 'Liquidación'];
export type FormaPago = 'Efectivo' | 'Tarjeta / Transferencia' | 'Sin especificar';
export const FORMAS_PAGO: FormaPago[] = ['Efectivo', 'Tarjeta / Transferencia'];

export const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() - ((x.getDay() + 6) % 7));
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
export function parseKey(s: string | null | undefined): Date | null {
  const m = s ? String(s).match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
export const fmtShort = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
