import { EstatusDot } from './Pills';
import { toneStyle, estatusStyle, useIsDark } from './airtableColors';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, CaretDown as CaretDownIcon, Plus as PlusIcon } from '@phosphor-icons/react';
import { useBase, useRecords, useCreateRecord, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, TABLE_IDS, cv, cvs, readSelect, formatCurrency, formatFriendlyDate, formatDateForComparison, parseTypedDate, buildDateTime } from '../utils';
import { MiniCalendar } from './Calendar';
import { CustomTimePicker } from './TimePicker';
import { useProduccionData } from '../produccion/useProduccionData';
import { TaskModal, type TaskDraft } from '../produccion/TaskModal';
import { TAREAS, ETAPA_STYLE, fmtInt } from '../produccion/constants';
import { taskWindow } from '../produccion/pace';
import { useDraft, clearDraft } from './useDraft';
import { NuevoElementoModal, elementoFields, type ElementoDraft } from './ElementoModals';
import type { CatalogOption } from './Dropdowns';

function catalog(records: AirtableRecord[], table: Table | null, tipo: string): CatalogOption[] {
  return records
    .filter((r) => readSelect(cv(r, table, FIELD_IDS.CAT_TIPO)) === tipo)
    .map((r) => ({ id: r.id, name: cvs(r, table, FIELD_IDS.CAT_NOMBRE) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

const K = 'nuevoPedido';

export function NuevoPedidoModal({ pedidosTable, onClose }: { pedidosTable: Table; onClose: (newRecordId?: string) => void }): React.ReactElement {
  const { mutate: createRecord } = useCreateRecord(pedidosTable);
  const P = useProduccionData();
  const { mutate: createTarea } = useCreateRecord(P.tareasT);
  // Tasks added before the order exists; they are created right after the order.
  const [drafts, setDrafts] = useDraft<TaskDraft[]>(K, 'tareas', []);
  const [draftModal, setDraftModal] = useState<{ index: number | null } | null>(null);
  // Elements added before the order exists; created right after it.
  const { base } = useBase();
  const elementosT = base?.getTableById(TABLE_IDS.elementos) ?? null;
  const catT = base?.getTableById(TABLE_IDS.catalogo) ?? null;
  const catR = useRecords(catT);
  const productos = useMemo(() => catalog(catR.records, catT, 'Producto'), [catR.records, catT]);
  const panes = useMemo(() => catalog(catR.records, catT, 'Pan'), [catR.records, catT]);
  const rellenos = useMemo(() => catalog(catR.records, catT, 'Relleno'), [catR.records, catT]);
  const { mutate: createElemento } = useCreateRecord(elementosT);
  const [elementos, setElementos] = useDraft<ElementoDraft[]>(K, 'elementos', []);
  const [elModal, setElModal] = useState<{ index: number | null } | null>(null);
  const metodoField = pedidosTable.getFieldIfExists(FIELD_IDS.METODO_CONTACTO);
  const estatusField = pedidosTable.getFieldIfExists(FIELD_IDS.ESTATUS);

  // Everything typed is kept if the form is closed, until the order is created.
  const [cliente, setCliente] = useDraft(K, 'cliente', '');
  const [fechaIso, setFechaIso] = useDraft<string | null>(K, 'fecha', null);
  const fechaDate = fechaIso ? new Date(fechaIso) : null;
  const setFechaDate = (d: Date | null) => setFechaIso(d ? d.toISOString() : null);
  const [fechaDisplay, setFechaDisplay] = useDraft(K, 'fechaDisplay', '');
  const [fechaTime, setFechaTime] = useDraft(K, 'fechaTime', '');
  const [showCal, setShowCal] = useState(false);
  const [fechaClienteIso, setFechaClienteIso] = useDraft<string | null>(K, 'fechaCliente', null);
  const fechaClienteDate = fechaClienteIso ? new Date(fechaClienteIso) : null;
  const setFechaClienteDate = (d: Date | null) => setFechaClienteIso(d ? d.toISOString() : null);
  const [fechaClienteDisplay, setFechaClienteDisplay] = useDraft(K, 'fechaClienteDisplay', '');
  const [fechaClienteTime, setFechaClienteTime] = useDraft(K, 'fechaClienteTime', '');
  const [showCalCliente, setShowCalCliente] = useState(false);
  const [metodo, setMetodo] = useDraft(K, 'metodo', '');
  const [showMetodo, setShowMetodo] = useState(false);
  const [telefono, setTelefono] = useDraft(K, 'telefono', '');
  const [estatus, setEstatus] = useDraft(K, 'estatus', 'Pendiente');
  const [showEstatus, setShowEstatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const preventReopenCalRef = useRef(false);
  const preventReopenCalClienteRef = useRef(false);
  const metodoRef = useRef<any>(null);
  const estatusRef = useRef<any>(null);

  const metodoOptions: string[] = useMemo(() => {
    const choices = (metodoField?.options as any)?.choices;
    if (!choices) return ['WhatsApp', 'Facebook', 'Instagram'];
    return choices.map((c: { name: string }) => c.name);
  }, [metodoField]);
  const estatusOptions: string[] = useMemo(() => {
    const choices = (estatusField?.options as any)?.choices;
    if (!choices) return ['Pendiente', 'Entregado'];
    return choices.map((c: { name: string }) => c.name);
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
    if (draftModal || elModal) return; // the sub-form handles Escape while open
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose, draftModal, elModal]);

  const handleCalClose = useCallback(() => { preventReopenCalRef.current = true; setShowCal(false); requestAnimationFrame(() => { preventReopenCalRef.current = false; }); }, []);
  const handleCalClienteClose = useCallback(() => { preventReopenCalClienteRef.current = true; setShowCalCliente(false); requestAnimationFrame(() => { preventReopenCalClienteRef.current = false; }); }, []);
  const handleFechaBlur = () => { const parsed = parseTypedDate(fechaDisplay); if (parsed) { setFechaDate(parsed); setFechaDisplay(formatFriendlyDate(formatDateForComparison(parsed))); } };
  const handleFechaClienteBlur = () => { const parsed = parseTypedDate(fechaClienteDisplay); if (parsed) { setFechaClienteDate(parsed); setFechaClienteDisplay(formatFriendlyDate(formatDateForComparison(parsed))); } };

  const handleSave = async () => {
    if (!cliente.trim()) { setError('El nombre del cliente es requerido.'); return; }
    setSaving(true); setError('');
    try {
      const fields: { [key: string]: unknown } = {};
      if (cliente.trim()) fields[FIELD_IDS.CLIENTE] = cliente.trim();
      if (telefono.trim()) fields[FIELD_IDS.NUMERO_TELEFONO] = telefono.trim();
      if (metodo) fields[FIELD_IDS.METODO_CONTACTO] = metodo;
      if (estatus) fields[FIELD_IDS.ESTATUS] = estatus;
      if (fechaDate) fields[FIELD_IDS.FECHA_ENTREGA] = buildDateTime(fechaDate, fechaTime);
      if (fechaClienteDate) fields[FIELD_IDS.FECHA_ENTREGA_CLIENTE] = buildDateTime(fechaClienteDate, fechaClienteTime);
      const newRecord = await createRecord(fields);
      let galletasElId: string | null = null;
      if (newRecord?.id) {
        for (const el of elementos) {
          const created: any = await createElemento(elementoFields(el, newRecord.id));
          if (!galletasElId && el.producto.trim().toLowerCase() === 'galletas' && created?.id) galletasElId = created.id;
        }
      }
      if (newRecord?.id && drafts.length > 0) {
        for (const d of drafts) {
          await createTarea({
            [TAREAS.TITULO]: `${cliente.trim()} · ${d.etapa} · ${d.asignada}`,
            [TAREAS.PEDIDO]: [newRecord.id], [TAREAS.ETAPA]: d.etapa, [TAREAS.EMPLEADO]: d.empleadoId ? [d.empleadoId] : [],
            [TAREAS.FECHA]: d.fecha || null, [TAREAS.FECHA_FIN]: d.fechaFin || d.fecha || null,
            [TAREAS.ASIGNADA]: d.asignada, [TAREAS.COMPLETADA]: 0, [TAREAS.ESTATUS]: 'Pendiente', [TAREAS.ORIGEN]: 'Manual',
            [TAREAS.NOTAS]: d.notas || null,
            ...(galletasElId ? { [TAREAS.ELEMENTO]: [galletasElId] } : {}),
          });
        }
      }
      clearDraft(K);
      onClose(newRecord?.id);
    } catch (err) { console.error('Error al crear pedido:', err); setError('Ocurrió un error. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const dateTimeBox = 'flex items-stretch bg-[#F7F2F2] border border-gray-300 rounded-lg transition-colors focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-200 dark:bg-[#1B1517] dark:border-[#382C2E] dark:focus-within:border-rose-600';
  const bareInput = 'bg-transparent w-full border-0 px-3 py-2 text-base text-gray-900 outline-none dark:text-gray-100 dark:placeholder-gray-600';
  const labelCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
  const inputCls = 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-rose-600';
  const dropdownItemBase = 'w-full text-left px-3 py-2 text-base transition-colors rounded-md dark:text-gray-300';
  const isDark = useIsDark();
  function metoDoActiveClass(opt: string) {
    const lower = opt.toLowerCase();
    if (lower === 'whatsapp') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
    if (lower === 'facebook') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
    if (lower === 'instagram') return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/10';
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(3px)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[760px] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F3EF]">Nuevo Pedido</h2>
            <p className="text-sm text-gray-400 mt-0.5 dark:text-gray-500">Completa los datos del pedido</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <span className={labelCls}>Cliente <span className="text-rose-600 normal-case tracking-normal">*</span></span>
              <input type="text" value={cliente} onChange={(e: any) => { setCliente(e.target.value); if (error) setError(''); }} placeholder="Nombre del cliente..."
                className={`${inputCls} ${!cliente.trim() && error ? 'border-rose-600 ring-1 ring-rose-200' : ''}`} />
            </div>
            <div className="min-w-0">
              <span className={labelCls}>Número de teléfono</span>
              <input type="tel" value={telefono} onChange={(e: any) => setTelefono(e.target.value)} placeholder="ej. 844 123 4567" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <span className={labelCls}>Fecha de entrega de producción</span>
              <div className={dateTimeBox}>
                <div className="relative flex-1 min-w-0">
                  <input type="text" value={fechaDisplay} onChange={(e: any) => setFechaDisplay(e.target.value)}
                    onClick={() => { if (!preventReopenCalRef.current) setShowCal(true); }}
                    onBlur={handleFechaBlur} placeholder="ej. 26 de mayo de 2026" className={`${bareInput} pr-9`} />
                  <button type="button" onClick={() => setShowCal((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                  {showCal && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { setFechaDate(date); setFechaDisplay(formatFriendlyDate(formatDateForComparison(date))); setShowCal(false); }} onClose={handleCalClose} />}
                </div>
                <div className="w-28 flex-shrink-0 border-l border-gray-300 dark:border-[#382C2E]"><CustomTimePicker bare value={fechaTime} onChange={setFechaTime} placeholder="Hora" /></div>
              </div>
            </div>
            <div className="min-w-0">
              <span className={labelCls}>Fecha de entrega al cliente</span>
              <div className={dateTimeBox}>
                <div className="relative flex-1 min-w-0">
                  <input type="text" value={fechaClienteDisplay} onChange={(e: any) => setFechaClienteDisplay(e.target.value)}
                    onClick={() => { if (!preventReopenCalClienteRef.current) setShowCalCliente(true); }}
                    onBlur={handleFechaClienteBlur} placeholder="ej. 26 de mayo de 2026" className={`${bareInput} pr-9`} />
                  <button type="button" onClick={() => setShowCalCliente((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                  {showCalCliente && <MiniCalendar selectedDate={fechaClienteDate ?? new Date()} onSelectDate={(date) => { setFechaClienteDate(date); setFechaClienteDisplay(formatFriendlyDate(formatDateForComparison(date))); setShowCalCliente(false); }} onClose={handleCalClienteClose} />}
                </div>
                <div className="w-28 flex-shrink-0 border-l border-gray-300 dark:border-[#382C2E]"><CustomTimePicker bare value={fechaClienteTime} onChange={setFechaClienteTime} placeholder="Hora" /></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <span className={labelCls}>Método de contacto</span>
              <div ref={metodoRef} className="relative">
                <button type="button" onClick={() => setShowMetodo((o) => !o)}
                  style={metodo?.toLowerCase() === 'whatsapp' ? toneStyle('green', isDark) : undefined}
                  className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-base outline-none transition-colors focus:ring-1 focus:ring-rose-200 ${metodo ? `${metoDoActiveClass(metodo)} border font-medium` : 'border-gray-300 text-gray-400 bg-white dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 hover:border-rose-200'}`}>
                  <span>{metodo || 'Seleccionar canal...'}</span>
                  <CaretDownIcon size={14} className={`flex-shrink-0 transition-transform ${showMetodo ? 'rotate-180' : ''} ${metodo ? 'opacity-60' : 'text-gray-400'}`} />
                </button>
                {showMetodo && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-[60] bg-white border border-[#E9D9D9] rounded-lg shadow-lg py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                    <button type="button" onClick={() => { setMetodo(''); setShowMetodo(false); }}
                      className={`${dropdownItemBase} ${!metodo ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Sin especificar</button>
                    {metodoOptions.map((opt) => (
                      <button key={opt} type="button" onClick={() => { setMetodo(opt); setShowMetodo(false); }}
                        className={`${dropdownItemBase} ${metodo === opt ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'}`}>{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <span className={labelCls}>Estatus</span>
              <div ref={estatusRef} className="relative">
                <button type="button" onClick={() => setShowEstatus((o) => !o)}
                  style={estatus ? estatusStyle(estatus, isDark) ?? undefined : undefined}
                  className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-base outline-none transition-colors focus:ring-1 focus:ring-rose-200 ${estatus ? 'font-medium' : 'border-gray-300 text-gray-400 bg-white dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500'}`}>
                  <span>{estatus || 'Seleccionar estatus...'}</span>
                  <CaretDownIcon size={14} className={`flex-shrink-0 opacity-60 transition-transform ${showEstatus ? 'rotate-180' : ''}`} />
                </button>
                {showEstatus && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-[60] bg-white border border-[#E9D9D9] rounded-lg shadow-lg py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                    {estatusOptions.map((opt) => {
                      return (
                        <button key={opt} type="button" onClick={() => { setEstatus(opt); setShowEstatus(false); }}
                          className={`${dropdownItemBase} flex items-center gap-2 ${estatus === opt ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                          <EstatusDot value={opt} />{opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <span className={labelCls}>Elementos</span>
            <div className="w-full rounded-xl border border-[#E5E1DA] overflow-x-auto dark:border-[#382C2E] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <table className="w-full min-w-[480px]">
                <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
                  <tr>{['Nombre', 'Descripción', 'Cantidad', 'Costo Unit.', 'Total'].map((h) => <th key={h} className="px-3 py-2 text-sm font-semibold text-gray-700 text-left dark:text-gray-300">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {elementos.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Sin elementos.</td></tr>
                  ) : elementos.map((el, i) => {
                    const cant = parseFloat(el.cantidad) || 0; const cu = parseFloat(el.costoUnit) || 0;
                    const nombre = [el.producto, el.pan, el.relleno].filter(Boolean).join(' · ');
                    return (
                      <tr key={i} onClick={() => setElModal({ index: i })} title="Clic para editar"
                        className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5">
                        <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300">{nombre}</td>
                        <td className="px-3 py-2 text-base text-gray-700 max-w-[160px] dark:text-gray-300"><span className="line-clamp-2">{el.descripcion || '—'}</span></td>
                        <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{el.cantidad || '—'}</td>
                        <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{el.costoUnit ? formatCurrency(cu) : '—'}</td>
                        <td className="px-3 py-2 text-base font-medium text-gray-700 tabular-nums dark:text-gray-300">{formatCurrency(cant * cu)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {elementosT && (
              <button type="button" onClick={() => setElModal({ index: null })} aria-label="Agregar elemento" title="Agregar elemento"
                className="mt-2 w-8 h-8 flex items-center justify-center bg-white border border-[#E9D9D9] rounded-lg text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-600 dark:hover:text-rose-600"><PlusIcon size={16} /></button>
            )}
          </div>
          <div>
            <span className={labelCls}>Tareas de producción</span>
            <div className="w-full rounded-xl border border-[#E5E1DA] overflow-hidden dark:border-[#382C2E]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
                  <tr>{['Etapa', 'Empleado', 'Fechas', 'Galletas'].map((h) => <th key={h} className="px-3 py-2 text-sm font-semibold text-gray-700 text-left dark:text-gray-300">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Sin tareas.</td></tr>
                  ) : drafts.map((d, i) => (
                    <tr key={i} onClick={() => setDraftModal({ index: i })} title="Clic para editar"
                      className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5">
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: ETAPA_STYLE[d.etapa].hex }} />{d.etapa}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[7rem]">{d.empleadoId ? P.empName.get(d.empleadoId) ?? '—' : 'Sin asignar'}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{taskWindow(d)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{fmtInt(d.asignada)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {P.tareasT && (
              <button type="button" onClick={() => setDraftModal({ index: null })} aria-label="Agregar tarea" title="Agregar tarea"
                className="mt-2 w-8 h-8 flex items-center justify-center bg-white border border-[#E9D9D9] rounded-lg text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-600 dark:hover:text-rose-600"><PlusIcon size={16} /></button>
            )}
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-600">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-end gap-3">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            {saving ? 'Guardando...' : 'Crear pedido'}
          </button>
        </div>
      </div>
      {elModal && elementosT && (
        <NuevoElementoModal pedidoRecordId="nuevoPedido" elementosTable={elementosT}
          catalogoProductos={productos} catalogoPanes={panes} catalogoRellenos={rellenos}
          draft={elModal.index !== null ? elementos[elModal.index] : undefined}
          onDraft={(d) => setElementos((prev) => elModal.index !== null ? prev.map((x, i) => (i === elModal.index ? d : x)) : [...prev, d])}
          onRemove={elModal.index !== null ? () => setElementos((prev) => prev.filter((_, i) => i !== elModal.index)) : undefined}
          onClose={() => setElModal(null)} onSaved={() => {}} />
      )}
      {draftModal && P.tareasT && (
        <TaskModal
          mode={{
            kind: 'draft',
            draft: draftModal.index !== null ? drafts[draftModal.index] : undefined,
            onDraft: (d) => setDrafts((prev) => draftModal.index !== null ? prev.map((x, i) => (i === draftModal.index ? d : x)) : [...prev, d]),
            onRemove: draftModal.index !== null ? () => setDrafts((prev) => prev.filter((_, i) => i !== draftModal.index)) : undefined,
          }}
          orders={[]} emps={P.activeEmps} rateFor={P.rateFor} tareasT={P.tareasT}
          onClose={() => setDraftModal(null)} onSaved={() => {}} onDelete={() => {}} />
      )}
    </div>
  );
}
