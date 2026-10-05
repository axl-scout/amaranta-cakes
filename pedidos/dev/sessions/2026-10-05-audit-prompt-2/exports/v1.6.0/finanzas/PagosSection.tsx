import React, { useMemo, useState } from 'react';
import { Plus as PlusIcon, Money as MoneyIcon, CreditCard as CardIcon, Question as QuestionIcon } from '@phosphor-icons/react';
import { useBase, useRecords, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { PAGOS, money, parseKey } from './constants';
import { readPago, readPedidoInfo, pagadoDe, type Pago } from './pagos';
import { PagoModal } from './PagoModal';
import { PagoDetailModal } from './PagoDetailModal';

/** "Pagos" block inside the order detail: list of payment records, paid / remaining and "+ Registrar pago". */
export function PagosSection({ record, pedidosTable, onDataChange }: {
  record: AirtableRecord; pedidosTable: Table; onDataChange: () => void;
}): React.ReactElement {
  const { base } = useBase();
  const pagosT = base?.getTableById(PAGOS.TABLE) ?? null;
  const pagR = useRecords(pagosT);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Pago | null>(null);

  const info = readPedidoInfo(record, pedidosTable);
  const all = useMemo(() => pagR.records.map((r) => readPago(r, pagosT)), [pagR.records, pagosT]);
  const mine = useMemo(() => all.filter((p) => p.pedidoId === record.id).sort((a, b) => a.fecha.localeCompare(b.fecha)), [all, record.id]);
  const pagado = pagadoDe(info, mine);
  const restante = Math.max(0, info.total - pagado);
  const byPedido = useMemo(() => new Map([[record.id, mine]]), [record.id, mine]);
  const legacy = mine.length === 0 && (info.legacyAnticipo > 0 || info.legacyLiquidado > 0);



  return (
    <div>
      <div>
        {/* Totals */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div><span className="text-sm text-gray-400 mb-0.5 block dark:text-gray-500">Total</span><span className="text-lg font-semibold text-gray-900 dark:text-[#F5F3EF] tabular-nums">{money(info.total)}</span></div>
          <div><span className="text-sm text-gray-400 mb-0.5 block dark:text-gray-500">Pagado</span><span className="text-lg font-semibold text-gray-900 dark:text-[#F5F3EF] tabular-nums">{money(pagado)}</span></div>
          <div><span className="text-sm text-gray-400 mb-0.5 block dark:text-gray-500">Restante</span>
            <span className={`text-lg font-semibold tabular-nums ${restante > 0 ? 'text-rose-600' : 'text-green-600 dark:text-green-400'}`}>{money(restante)}</span></div>
        </div>

        {/* Payments table */}
        <div className="w-full">
          <div className="rounded-xl border border-[#E5E1DA] dark:border-[#382C2E] overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <table className="w-full min-w-[420px]">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
                <tr>
                  {['Concepto', 'Fecha', 'Método de pago', 'Monto'].map((h) => (
                    <th key={h} className={`px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 text-left`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legacy && (
                  <tr className="border-b border-gray-100 last:border-b-0 dark:border-white/5">
                    <td colSpan={4} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Registro anterior: anticipo {money(info.legacyAnticipo)}{info.legacyLiquidado > 0 ? ` · liquidado ${money(info.legacyLiquidado)}` : ''}. Se convertirá en pagos al registrar el siguiente.
                    </td>
                  </tr>
                )}
                {mine.length === 0 && !legacy ? (
                  <tr><td colSpan={4} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Aún no hay pagos registrados.</td></tr>
                ) : mine.map((p) => {
                  const d = parseKey(p.fecha);
                  const Icon = p.forma === 'Efectivo' ? MoneyIcon : p.forma === 'Tarjeta / Transferencia' ? CardIcon : QuestionIcon;
                  return (
                    <tr key={p.id} onClick={() => setDetail(p)} title="Clic para ver detalle"
                      className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5">
                      <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300">{p.tipo || 'Pago'}</td>
                      <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300 whitespace-nowrap">{d ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') : 'Sin fecha'}</td>
                      <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Icon size={15} className="flex-shrink-0 text-gray-400" />{p.forma || 'Sin especificar'}</span>
                      </td>
                      <td className="px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 tabular-nums whitespace-nowrap">{money(p.monto)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setOpen(true)} disabled={!pagosT} aria-label="Registrar pago" title="Registrar pago"
            className="mt-2 w-8 h-8 flex items-center justify-center bg-white border border-[#E9D9D9] rounded-lg text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-600 dark:hover:text-rose-600 disabled:opacity-50"><PlusIcon size={16} /></button>
        </div>
      </div>

      {open && pagosT && (
        <PagoModal pedidos={[info]} pagosByPedido={byPedido} presetPedidoId={record.id} pagosT={pagosT} pedidosT={pedidosTable}
          onClose={() => setOpen(false)} onSaved={() => { pagR.refetch(); onDataChange(); }} />
      )}
      {detail && pagosT && (
        <PagoDetailModal pago={detail} pedidoLabel={info.label} pedidoId={record.id} otrosPagos={mine.filter((x) => x.id !== detail.id)}
          pagosT={pagosT} pedidosT={pedidosTable} onClose={() => setDetail(null)} onChanged={() => { pagR.refetch(); onDataChange(); }} />
      )}
    </div>
  );
}
