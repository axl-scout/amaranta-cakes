import React, { useState, useEffect } from 'react';
import { useEscClose } from '../lib/escStack';
import { useCreateRecord, useUpdateRecord, type Table } from '../lib/airtable-hooks';
import { CAPACIDAD, EMPLEADOS, ETAPAS, DEFAULT_RATE, ETAPA_STYLE, type Etapa } from './constants';
import type { Emp } from './useProduccionData';

export function CapacityModal({ emps, capacity, capT, empT, onClose, onSaved, onEmpSaved }: {
  emps: Emp[];
  empT: Table | null;
  onEmpSaved: () => void;
  capacity: Map<string, { id: string; gpd: number | null }>;
  capT: Table;
  onClose: () => void;
  onSaved: () => void;
}): React.ReactElement {
  const { mutate: create } = useCreateRecord(capT);
  const { mutate: update } = useUpdateRecord(capT);
  const { mutate: updateEmp } = useUpdateRecord(empT);
  const [prod, setProd] = useState<Record<string, boolean>>(() => Object.fromEntries(emps.map((e) => [e.id, e.produccion])));
  const toggleProd = async (emp: Emp) => {
    if (!EMPLEADOS.PRODUCCION) return;
    const next = !prod[emp.id];
    setProd((p) => ({ ...p, [emp.id]: next }));
    try { await updateEmp({ recordId: emp.id, fields: { [EMPLEADOS.PRODUCCION]: next } }); onEmpSaved(); }
    catch (e) { console.error(e); setProd((p) => ({ ...p, [emp.id]: !next })); }
  };
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    emps.forEach((e) => ETAPAS.forEach((s) => { const c = capacity.get(`${e.id}|${s}`); o[`${e.id}|${s}`] = c?.gpd != null ? String(c.gpd) : ''; }));
    return o;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEscClose(onClose);

  const persist = async (emp: Emp, etapa: Etapa) => {
    const key = `${emp.id}|${etapa}`;
    const raw = vals[key] ?? '';
    const num = raw.trim() === '' ? null : Math.max(0, parseInt(raw, 10) || 0);
    const existing = capacity.get(key);
    if ((existing?.gpd ?? null) === num) return;
    setSavingKey(key);
    try {
      if (existing) await update({ recordId: existing.id, fields: { [CAPACIDAD.GPD]: num } });
      else if (num != null) await create({ [CAPACIDAD.NOMBRE]: `${emp.name} · ${etapa}`, [CAPACIDAD.EMPLEADO]: [emp.id], [CAPACIDAD.ETAPA]: etapa, [CAPACIDAD.GPD]: num });
      onSaved();
    } catch (e) { console.error(e); }
    finally { setSavingKey(null); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-[680px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]">
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">Capacidades del equipo</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Galletas que cada persona produce en un día de trabajo. Si una celda está vacía se usa el valor gris de referencia. Desmarca a quien no hace producción para ocultarlo de la planeación. Los cambios se guardan solos.</p>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-[#2C2325]">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">Empleado</th>
                {EMPLEADOS.PRODUCCION && <th className="px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">En producción</th>}
                {ETAPAS.map((s) => (
                  <th key={s} className="px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${ETAPA_STYLE[s].dot}`} />{s}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emps.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 dark:border-white/5">
                  <td className={`px-4 py-2 text-base font-medium ${prod[e.id] ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{e.name}</td>
                  {EMPLEADOS.PRODUCCION && (
                    <td className="px-2 py-2 text-center">
                      <input type="checkbox" checked={!!prod[e.id]} onChange={() => toggleProd(e)} aria-label={`${e.name} participa en producción`}
                        className="h-4 w-4 accent-rose-600 cursor-pointer" />
                    </td>
                  )}
                  {ETAPAS.map((s) => {
                    const key = `${e.id}|${s}`;
                    return (
                      <td key={s} className="px-2 py-2">
                        <input type="number" min="0" inputMode="numeric" value={vals[key] ?? ''} placeholder={String(DEFAULT_RATE[s])}
                          aria-label={`${e.name} · ${s} galletas por día`}
                          onChange={(ev: any) => setVals((v) => ({ ...v, [key]: ev.target.value }))}
                          onBlur={() => persist(e, s)}
                          className={`w-full h-9 border rounded-lg px-2 text-right text-base tabular-nums outline-none bg-[#F7F2F2] focus:border-rose-600 focus:ring-1 focus:ring-rose-200 dark:bg-[#1B1517] dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 ${savingKey === key ? 'border-rose-300' : 'border-gray-300 dark:border-[#382C2E]'}`} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#E9D9D9] dark:border-[#382C2E] flex justify-end">
          <button type="button" onClick={onClose} className="px-5 h-10 rounded-xl bg-gray-900 text-white text-base font-medium hover:bg-gray-700 dark:bg-white dark:text-gray-900">Listo</button>
        </div>
      </div>
    </div>
  );
}
