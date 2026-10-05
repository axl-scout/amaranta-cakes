import type { AirtableRecord, Table } from '../lib/airtable-hooks';
import { cv, cvs, readSelect, readLinked } from '../utils';
import { PAGOS, PED, money, type TipoPago, type FormaPago } from './constants';

export interface Pago {
  id: string; pedidoId: string | null; tipo: TipoPago | ''; monto: number; forma: FormaPago | ''; fecha: string; notas: string;
}

export function readPago(r: AirtableRecord, t: Table | null): Pago {
  return {
    id: r.id,
    pedidoId: readLinked(cv(r, t, PAGOS.PEDIDO))[0]?.id ?? null,
    tipo: readSelect(cv(r, t, PAGOS.TIPO)) as TipoPago | '',
    monto: Number(cv(r, t, PAGOS.MONTO) ?? 0) || 0,
    forma: readSelect(cv(r, t, PAGOS.FORMA)) as FormaPago | '',
    fecha: String(cv(r, t, PAGOS.FECHA) ?? '').slice(0, 10),
    notas: cvs(r, t, PAGOS.NOTAS),
  };
}

/** Minimal info about an order needed to register payments against it. */
export interface PedidoPagoInfo {
  id: string; label: string; total: number; legacyAnticipo: number; legacyLiquidado: number; due: Date | null;
}

/** Paid amount: sum of payment records; orders that still only have the old anticipo/liquidado fields use those. */
export function pagadoDe(p: PedidoPagoInfo, pagos: Pago[]): number {
  return pagos.length ? pagos.reduce((s, x) => s + x.monto, 0) : p.legacyAnticipo + p.legacyLiquidado;
}

export function readPedidoInfo(r: AirtableRecord, t: Table | null): PedidoPagoInfo {
  // Client delivery date; falls back to the production date only when the client date is blank.
  const raw = (cv(r, t, PED.FECHA) as string | null) || (cv(r, t, PED.FECHA_PRODUCCION) as string | null);
  return {
    id: r.id,
    label: cvs(r, t, PED.ID) || 'Sin ID',
    total: Number(cv(r, t, PED.TOTAL) ?? 0) || 0,
    legacyAnticipo: Number(cv(r, t, PED.ANTICIPO) ?? 0) || 0,
    legacyLiquidado: Number(cv(r, t, PED.LIQUIDADO) ?? 0) || 0,
    due: raw ? new Date(raw) : null,
  };
}

type Create = (fields: Record<string, unknown>) => Promise<unknown>;
type Update = (a: { recordId: string; fields: Record<string, unknown> }) => Promise<unknown>;

export const conceptoDe = (label: string, tipo: string, monto: number) => `${label} · ${tipo} · ${money(monto)}`;

/**
 * Keeps the order's anticipo / liquidado fields equal to the sum of its payment records, so the
 * "restante" formula, receipts and older views keep working. Anticipo = Anticipo payments; liquidado = the rest.
 */
export async function syncPedidoTotals(updatePedido: Update, pedidoId: string, pagos: Array<Pick<Pago, 'tipo' | 'monto'>>) {
  const anticipo = pagos.filter((p) => p.tipo === 'Anticipo').reduce((s, p) => s + p.monto, 0);
  const liquidado = pagos.filter((p) => p.tipo !== 'Anticipo').reduce((s, p) => s + p.monto, 0);
  await updatePedido({ recordId: pedidoId, fields: { [PED.ANTICIPO]: anticipo || null, [PED.LIQUIDADO]: liquidado || null } });
}

/**
 * Registers a payment. If the order still has amounts only in the old fields (no payment records),
 * those are first saved as payment records ("Sin especificar") so nothing is lost when totals are re-synced.
 */
export async function registrarPago(opts: {
  createPago: Create; updatePedido: Update; pedido: PedidoPagoInfo; existentes: Pago[];
  nuevo: { tipo: TipoPago; monto: number; forma: FormaPago; fecha: string; notas: string };
}) {
  const { createPago, updatePedido, pedido, existentes, nuevo } = opts;
  const all: Array<Pick<Pago, 'tipo' | 'monto'>> = [...existentes];
  if (existentes.length === 0) {
    const legacy: Array<[TipoPago, number]> = [['Anticipo', pedido.legacyAnticipo], ['Liquidación', pedido.legacyLiquidado]];
    for (const [tipo, monto] of legacy) {
      if (monto <= 0) continue;
      await createPago({
        [PAGOS.CONCEPTO]: conceptoDe(pedido.label, tipo, monto), [PAGOS.PEDIDO]: [pedido.id], [PAGOS.TIPO]: tipo,
        [PAGOS.MONTO]: monto, [PAGOS.FORMA]: 'Sin especificar', [PAGOS.NOTAS]: 'Migrado del registro anterior del pedido.',
      });
      all.push({ tipo, monto });
    }
  }
  await createPago({
    [PAGOS.CONCEPTO]: conceptoDe(pedido.label, nuevo.tipo, nuevo.monto), [PAGOS.PEDIDO]: [pedido.id], [PAGOS.TIPO]: nuevo.tipo,
    [PAGOS.MONTO]: nuevo.monto, [PAGOS.FORMA]: nuevo.forma, [PAGOS.FECHA]: nuevo.fecha || null, [PAGOS.NOTAS]: nuevo.notas.trim() || null,
  });
  all.push({ tipo: nuevo.tipo, monto: nuevo.monto });
  await syncPedidoTotals(updatePedido, pedido.id, all);
}
