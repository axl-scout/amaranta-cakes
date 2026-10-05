import React, { useEffect, useRef, useState } from 'react';
import { Trash as TrashIcon } from '@phosphor-icons/react';
import { useDeleteRecord, useUpdateRecord, type Table } from '../lib/airtable-hooks';
import { DateField } from '../components/DateField';
import { FieldSelect } from '../components/Dropdowns';
import { InfoTip } from '../components/InfoTip';
import { PAGOS, TIPOS_PAGO, FORMAS_PAGO, money, type TipoPago, type FormaPago } from './constants';
import { conceptoDe, syncPedidoTotals, type Pago } from './pagos';

const inp = 'bg-[#F7F2F2] w-full h-10 border border-gray-300 rounded-xl px-3 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100';
const lblRow = 'flex items-center gap-1.5 mb-1.5';
const lbl = 'text-sm text-gray-500 dark:text-gray-400';
/** Detail of one payment: every change saves on its own; the order's paid totals are re-synced after each change. */
export function PagoDetailModal({ pago, pedidoLabel, pedidoId, otrosPagos, pagosT, pedidosT, onClose, onChanged }: {
  pago: Pago;
  pedidoLabel: string;
  pedidoId: string;
  /** The order's other payments (without this one), to recompute totals. */
  otrosPagos: Pago[];
  pagosT: Table;
  pedidosT: Table;
  onClose: () => void;
  onChanged: () => void;
}): React.ReactElement {
  const { mutate: updatePago } = useUpdateRecord(pagosT);
  const { mutate: deletePago } = useDeleteRecord(pagosT);
  const { mutate: updatePedido } = useUpdateRecord(pedidosT);
  const [tipo, setTipo] = useState<TipoPago | ''>(pago.tipo);
  const [monto, setMonto] = useState(String(pago.monto || ''));
  const [forma, setForma] = useState<FormaPago | ''>(pago.forma);
  const [fecha, setFecha] = useState(pago.fecha);
  const [notas, setNotas] = useState(pago.notas);
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saved = useRef({ tipo: pago.tipo, monto: pago.monto });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (confirm) setConfirm(false); else onClose(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, confirm]);

  const save = async (fields: Record<string, unknown>, next?: { tipo?: TipoPago | ''; monto?: number }) => {
    setStatus('saving');
    try {
      const t = next?.tipo ?? saved.current.tipo;
      const m = next?.monto ?? saved.current.monto;
      const affectsTotals = next && (next.tipo !== undefined || next.monto !== undefined);
      await updatePago({ recordId: pago.id, fields: affectsTotals ? { ...fields, [PAGOS.CONCEPTO]: conceptoDe(pedidoLabel, t || 'Pago', m) } : fields });
      if (affectsTotals) {
        saved.current = { tipo: t, monto: m };
        await syncPedidoTotals(updatePedido, pedidoId, [...otrosPagos, { tipo: t, monto: m }]);
      }
      setStatus('saved'); onChanged();
    } catch (e) { console.error(e); setStatus('error'); }
  };

  const saveMonto = () => {
    const m = parseFloat(monto) || 0;
    if (m <= 0) { setMonto(String(saved.current.monto || '')); return; }
    if (m !== saved.current.monto) save({ [PAGOS.MONTO]: m }, { monto: m });
  };

  const remove = async () => {
    setConfirm(false);
    try {
      await deletePago(pago.id);
      await syncPedidoTotals(updatePedido, pedidoId, otrosPagos);
      onChanged(); onClose();
    } catch (e) { console.error(e); setStatus('error'); }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="pago-det-h"
        className="relative bg-white w-full sm:max-w-[480px] max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]">
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <h2 id="pago-det-h" className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">{tipo || 'Pago'} · {money(parseFloat(monto) || 0)}</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {pedidoLabel}
            <span className="ml-2" aria-live="polite">
              {status === 'saving' && 'Guardando…'}
              {status === 'saved' && 'Guardado'}
              {status === 'error' && <span className="text-rose-600 dark:text-rose-400">No se pudo guardar</span>}
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 space-y-4">
          <div className="grid grid-cols-[3fr_7fr] gap-3">
            <div className="min-w-0">
              <div className={lblRow}><label htmlFor="pago-det-monto" className={lbl}>Monto</label></div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">$</span>
                <input id="pago-det-monto" type="number" min="0" step="0.01" inputMode="decimal" value={monto}
                  onChange={(e: any) => setMonto(e.target.value)} onBlur={saveMonto}
                  onKeyDown={(e: any) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className={`${inp} pl-7 tabular-nums`} />
              </div>
            </div>
            <div className="min-w-0">
              <div className={lblRow}><span className={lbl}>Fecha</span></div>
              <DateField value={fecha} onChange={(v) => { setFecha(v); save({ [PAGOS.FECHA]: v || null }); }} className={inp} ariaLabel="Fecha del pago" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className={lblRow}><span className={lbl}>Concepto</span><InfoTip text="Anticipo: el primer pago. Abono: pagos intermedios. Liquidación: el pago que completa el total." /></div>
              <FieldSelect value={tipo} options={TIPOS_PAGO.map((t) => ({ value: t, label: t }))} placeholder="Elegir concepto…" className={inp} ariaLabel="Concepto" clearable
                onChange={(v) => { const t = v as TipoPago | ''; if (t === tipo) return; setTipo(t); save({ [PAGOS.TIPO]: t || null }, { tipo: t }); }} />
            </div>
            <div className="min-w-0">
              <div className={lblRow}><span className={lbl}>Método de pago</span></div>
              <FieldSelect value={forma === 'Sin especificar' ? '' : forma} options={FORMAS_PAGO.map((f) => ({ value: f, label: f }))} placeholder={forma === 'Sin especificar' ? 'Sin especificar' : 'Elegir método…'} className={inp} ariaLabel="Método de pago" clearable
                onChange={(v) => { const f = v as FormaPago | ''; if (f === forma) return; setForma(f); save({ [PAGOS.FORMA]: f || null }); }} />
            </div>
          </div>
          <div>
            <div className={lblRow}><label htmlFor="pago-det-notas" className={lbl}>Notas</label></div>
            <textarea id="pago-det-notas" rows={3} value={notas} onChange={(e: any) => setNotas(e.target.value)}
              onBlur={() => { if (notas.trim() !== pago.notas.trim()) save({ [PAGOS.NOTAS]: notas.trim() || null }); }}
              className="bg-[#F7F2F2] w-full border border-gray-300 rounded-xl px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 resize-none dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100" />
          </div>
        </div>

        <button type="button" onClick={() => setConfirm(true)} aria-label="Eliminar pago"
          className="absolute bottom-4 right-4 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-rose-600 text-white shadow-lg hover:bg-rose-700 active:bg-rose-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
          <TrashIcon size={18} />
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e: any) => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl p-5 dark:bg-[#251D1F]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#F5F3EF]">¿Eliminar pago?</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tipo || 'Pago'} de {money(saved.current.monto)} se eliminará y el restante del pedido se recalculará.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="px-4 h-10 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-[#382C2E]">Cancelar</button>
              <button type="button" onClick={remove} className="px-4 h-10 rounded-xl bg-rose-600 text-white text-base font-medium hover:bg-rose-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
