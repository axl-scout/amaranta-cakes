import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Money as MoneyIcon, CreditCard as CardIcon } from '@phosphor-icons/react';
import { useCreateRecord, useUpdateRecord, type Table } from '../lib/airtable-hooks';
import { FieldSelect } from '../components/Dropdowns';
import { DateField } from '../components/DateField';
import { InfoTip } from '../components/InfoTip';
import { useDraft, clearDraft } from '../components/useDraft';
import { TIPOS_PAGO, money, toKey, type TipoPago, type FormaPago } from './constants';
import { registrarPago, pagadoDe, type Pago, type PedidoPagoInfo } from './pagos';

const inp = 'bg-[#F7F2F2] w-full h-10 border border-gray-300 rounded-xl px-3 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100';
const lblRow = 'flex items-center gap-1.5 mb-1.5';
const lbl = 'text-sm text-gray-500 dark:text-gray-400';

/** Short form to register one client payment (anticipo, abono or liquidación). */
export function PagoModal({ pedidos, pagosByPedido, presetPedidoId, pagosT, pedidosT, onClose, onSaved }: {
  pedidos: PedidoPagoInfo[];
  pagosByPedido: Map<string, Pago[]>;
  presetPedidoId?: string | null;
  pagosT: Table;
  pedidosT: Table;
  onClose: () => void;
  onSaved: () => void;
}): React.ReactElement {
  const { mutate: createPago } = useCreateRecord(pagosT);
  const { mutate: updatePedido } = useUpdateRecord(pedidosT);
  // Typed values survive closing the form, until the payment is registered.
  const K = `pago:${presetPedidoId ?? 'general'}`;
  const [pedidoId, setPedidoId] = useDraft(K, 'pedido', presetPedidoId ?? '');
  const pedido = pedidos.find((p) => p.id === pedidoId) ?? null;
  const existentes = pedidoId ? pagosByPedido.get(pedidoId) ?? [] : [];
  const pagado = pedido ? pagadoDe(pedido, existentes) : 0;
  const restante = pedido ? Math.max(0, pedido.total - pagado) : 0;

  const tipoSugerido = (): TipoPago => (pagado <= 0 ? 'Anticipo' : 'Liquidación');
  const [tipo, setTipo] = useDraft<TipoPago>(K, 'tipo', tipoSugerido());
  const [monto, setMonto] = useDraft(K, 'monto', restante > 0 ? String(restante) : '');
  const [forma, setForma] = useDraft<FormaPago | ''>(K, 'forma', '');
  const [fecha, setFecha] = useDraft(K, 'fecha', toKey(new Date()));
  const [notas, setNotas] = useDraft(K, 'notas', '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When the order changes, re-suggest type and amount.
  // Skip the first run so a saved draft isn't overwritten when the form reopens.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setTipo(tipoSugerido()); setMonto(restante > 0 ? String(restante) : ''); /* eslint-disable-next-line */
  }, [pedidoId]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const options = useMemo(() => [...pedidos].sort((a, b) => (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0))
    .map((p) => ({ value: p.id, label: `${p.label}${p.due ? ` · ${p.due.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}` : ''}` })), [pedidos]);

  const m = parseFloat(monto) || 0;
  const save = async () => {
    if (!pedido) { setError('Elige el pedido.'); return; }
    if (m <= 0) { setError('Escribe el monto recibido.'); return; }
    if (!forma) { setError('Elige cómo pagó el cliente.'); return; }
    setSaving(true); setError('');
    try {
      await registrarPago({ createPago, updatePedido, pedido, existentes, nuevo: { tipo, monto: m, forma, fecha, notas } });
      clearDraft(K); onSaved(); onClose();
    } catch (e) { console.error(e); setError('No se pudo registrar el pago. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="pago-h" className="bg-white w-full sm:max-w-[480px] max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]">
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <h2 id="pago-h" className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">Registrar pago</h2>
          {pedido && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total {money(pedido.total)} · Pagado {money(pagado)} · <b className="text-gray-800 dark:text-gray-200">Restante {money(restante)}</b>
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <div className={lblRow}><span className={lbl}>Pedido</span></div>
            <FieldSelect value={pedidoId} onChange={setPedidoId} options={options} placeholder="Elegir pedido…" className={inp} ariaLabel="Pedido" />
          </div>
          <div>
            <div className={lblRow}><span className={lbl}>Tipo de pago</span><InfoTip text="Anticipo: el primer pago. Abono: pagos intermedios. Liquidación: el pago que completa el total." /></div>
            <div className="grid grid-cols-3 gap-1.5">
              {TIPOS_PAGO.map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)} aria-pressed={tipo === t}
                  className={`h-10 rounded-xl border text-sm font-medium transition-colors ${tipo === t ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200' : 'bg-[#F7F2F2] border-gray-300 text-gray-600 hover:bg-gray-100 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-300'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={lblRow}><label htmlFor="pago-monto" className={lbl}>Monto</label><InfoTip text="Se sugiere lo que falta por pagar; cámbialo si el cliente pagó otra cantidad." /></div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">$</span>
                <input id="pago-monto" type="number" min="0" step="0.01" inputMode="decimal" value={monto} onChange={(e: any) => setMonto(e.target.value)} className={`${inp} pl-7 tabular-nums`} />
              </div>
            </div>
            <div>
              <div className={lblRow}><span className={lbl}>Fecha</span></div>
              <DateField value={fecha} onChange={setFecha} className={inp} />
            </div>
          </div>
          <div>
            <div className={lblRow}><span className={lbl}>¿Cómo pagó?</span><InfoTip text="Así sabrás cuánto deberías tener en caja y cuánto en el banco." /></div>
            <div className="grid grid-cols-2 gap-2">
              {([['Efectivo', MoneyIcon], ['Tarjeta / Transferencia', CardIcon]] as const).map(([f, Icon]) => (
                <button key={f} type="button" onClick={() => setForma(f)} aria-pressed={forma === f}
                  className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${forma === f ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200' : 'bg-[#F7F2F2] border-gray-300 text-gray-600 hover:bg-gray-100 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-300'}`}>
                  <Icon size={18} />{f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={lblRow}><label htmlFor="pago-notas" className={lbl}>Notas</label><InfoTip text="Opcional: referencia de la transferencia, quién recibió, etc." /></div>
            <textarea id="pago-notas" rows={2} value={notas} onChange={(e: any) => setNotas(e.target.value)}
              className="bg-[#F7F2F2] w-full border border-gray-300 rounded-xl px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 resize-none dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100" />
          </div>
          {pedido && m > restante && restante > 0 && <p className="text-sm text-amber-700 dark:text-amber-300">El monto es mayor a lo que falta ({money(restante)}).</p>}
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-[#E9D9D9] dark:border-[#382C2E] flex justify-end">
          <button type="button" onClick={save} disabled={saving}
            className="px-5 h-10 rounded-xl bg-rose-600 text-white text-base font-medium hover:bg-rose-700 transition-colors disabled:opacity-60">
            {saving ? 'Registrando…' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
