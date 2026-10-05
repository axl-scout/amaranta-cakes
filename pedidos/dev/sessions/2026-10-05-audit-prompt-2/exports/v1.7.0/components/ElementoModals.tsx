import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useEscClose } from '../lib/escStack';
import { Trash as TrashIcon } from '@phosphor-icons/react';
import { useDraft, clearDraft } from './useDraft';
import { useCreateRecord, useUpdateRecord, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, formatCurrency, esProductoConRellenoYPan, readLinked, cv, cvs } from '../utils';
import { CatalogDropdown, type CatalogOption } from './Dropdowns';
import { DateRangeScope, RangeTrigger } from './DateRange';
import { ETAPA_STYLE } from '../produccion/constants';
import { useProduccionData, notifyProduccionChanged } from '../produccion/useProduccionData';
import { EmpleadoSelect } from '../produccion/EmpleadoSelect';
import { TAREAS, etapasDeProducto, toKey, type Etapa } from '../produccion/constants';

interface ElementoModalCommon {
  elementosTable: Table;
  catalogoProductos: CatalogOption[];
  catalogoPanes: CatalogOption[];
  catalogoRellenos: CatalogOption[];
  onClose: () => void;
  onSaved: () => void;
}

/** An element typed in the new-order form, created together with the order. */
export interface ElementoDraft {
  productoId: string; producto: string; panId: string | null; pan: string; rellenoId: string | null; relleno: string;
  cantidad: string; costoUnit: string; descripcion: string;
}

/** Fields to create an element record from a draft. */
export function elementoFields(d: ElementoDraft, pedidoRecordId: string): Record<string, unknown> {
  const f: Record<string, unknown> = { [FIELD_IDS.EL_PRODUCTO]: [d.productoId], [FIELD_IDS.EL_PEDIDOS]: [pedidoRecordId] };
  if (d.cantidad) f[FIELD_IDS.EL_CANTIDAD] = parseFloat(d.cantidad) || null;
  if (d.costoUnit) f[FIELD_IDS.EL_COSTO_UNITARIO] = parseFloat(d.costoUnit) || null;
  if (d.descripcion.trim()) f[FIELD_IDS.EL_DESCRIPCION] = d.descripcion.trim();
  if (esProductoConRellenoYPan(d.producto) && d.panId) f[FIELD_IDS.EL_PAN] = [d.panId];
  if (esProductoConRellenoYPan(d.producto) && d.rellenoId) f[FIELD_IDS.EL_RELLENO] = [d.rellenoId];
  return f;
}

export function NuevoElementoModal({ pedidoRecordId, elementosTable, catalogoProductos, catalogoPanes, catalogoRellenos, onClose, onSaved, draft, onDraft, onRemove }: ElementoModalCommon & {
  pedidoRecordId: string;
  /** New-order form: return the element instead of saving it (the order doesn't exist yet). */
  onDraft?: (d: ElementoDraft) => void;
  /** Existing draft being edited. */
  draft?: ElementoDraft;
  onRemove?: () => void;
}): React.ReactElement {
  const { mutate: createRecord } = useCreateRecord(elementosTable);
  const PD = useProduccionData();
  const { mutate: createTask } = useCreateRecord(PD.tareasT);
  const createdEl = useRef<string | null>(null);
  const tasksDone = useRef<Set<string>>(new Set());
  const [warning, setWarning] = useState('');
  type TRow = { emp: string; ini: string; fin: string };
  const [taskRows, setTaskRows] = useState<Record<string, TRow>>({});
  // Typed values survive closing the form, until the element is created.
  const K = draft ? null : `nuevoElemento:${pedidoRecordId}`;
  const [selectedProductoId, setSelectedProductoId] = useDraft<string | null>(K, 'productoId', draft?.productoId ?? null);
  const [selectedNombre, setSelectedNombre] = useDraft(K, 'producto', draft?.producto ?? '');
  const [selectedPanId, setSelectedPanId] = useDraft<string | null>(K, 'panId', draft?.panId ?? null);
  const [selectedPanName, setSelectedPanName] = useDraft(K, 'pan', draft?.pan ?? '');
  const [selectedRellenoId, setSelectedRellenoId] = useDraft<string | null>(K, 'rellenoId', draft?.rellenoId ?? null);
  const [selectedRellenoName, setSelectedRellenoName] = useDraft(K, 'relleno', draft?.relleno ?? '');
  const [neCantidad, setNeCantidad] = useDraft(K, 'cantidad', draft?.cantidad ?? '');
  const [neCostoUnit, setNeCostoUnit] = useDraft(K, 'costoUnit', draft?.costoUnit ?? '');
  const [neDescripcion, setNeDescripcion] = useDraft(K, 'descripcion', draft?.descripcion ?? '');
  const [saving, setSaving] = useState(false);
  const [productoError, setProductoError] = useState('');
  const [showNombreDropdown, setShowNombreDropdown] = useState(false);
  const [showPanDropdown, setShowPanDropdown] = useState(false);
  const [showRellenoDropdown, setShowRellenoDropdown] = useState(false);

  useEscClose(onClose);

  const showPastelFields = esProductoConRellenoYPan(selectedNombre);
  const costoTotalPreview = useMemo(() => (parseFloat(neCantidad) || 0) * (parseFloat(neCostoUnit) || 0), [neCantidad, neCostoUnit]);

  const showTasks = !onDraft && !draft;
  const etapas: Etapa[] = showTasks ? etapasDeProducto(selectedNombre) : [];
  const pInfo = PD.pedidoInfo.get(pedidoRecordId);
  const minKey = toKey(PD.today);
  const maxKey = pInfo?.dueKey || '';
  const qty = parseFloat(neCantidad) || 0;
  const rowOf = (e: string): TRow => taskRows[e] ?? { emp: '', ini: '', fin: '' };
  const setRow = (e: string, patch: Partial<TRow>) => setTaskRows((r) => ({ ...r, [e]: { ...rowOf(e), ...patch } }));
  const inB = (k: string) => k >= minKey && (!maxKey || k <= maxKey);
  const onIni = (e: string, d: string) => {
    if (!inB(d)) return;
    const r = rowOf(e);
    setRow(e, { ini: d, fin: r.fin && r.fin < d ? d : r.fin });
  };
  const onFin = (e: string, d: string) => {
    if (!inB(d)) return;
    const r = rowOf(e);
    setRow(e, { fin: d, ini: r.ini && r.ini > d ? d : r.ini });
  };
  const tituloOf = (e: string) => `${pInfo?.label ?? ''} · ${e} · ${qty}`;

  const handleSave = async () => {
    if (!selectedProductoId) { setProductoError('Elige un producto para poder guardar.'); return; }
    if (onDraft) {
      onDraft({ productoId: selectedProductoId, producto: selectedNombre, panId: selectedPanId, pan: selectedPanName, rellenoId: selectedRellenoId, relleno: selectedRellenoName, cantidad: neCantidad, costoUnit: neCostoUnit, descripcion: neDescripcion });
      if (K) clearDraft(K);
      onClose(); return;
    }
    setSaving(true);
    try {
      const fields: { [key: string]: unknown } = {};
      if (selectedProductoId) fields[FIELD_IDS.EL_PRODUCTO] = [selectedProductoId];
      fields[FIELD_IDS.EL_PEDIDOS] = [pedidoRecordId];
      if (neCantidad) fields[FIELD_IDS.EL_CANTIDAD] = parseFloat(neCantidad) || null;
      if (neCostoUnit) fields[FIELD_IDS.EL_COSTO_UNITARIO] = parseFloat(neCostoUnit) || null;
      if (neDescripcion.trim()) fields[FIELD_IDS.EL_DESCRIPCION] = neDescripcion.trim();
      if (showPastelFields && selectedPanId) fields[FIELD_IDS.EL_PAN] = [selectedPanId];
      if (showPastelFields && selectedRellenoId) fields[FIELD_IDS.EL_RELLENO] = [selectedRellenoId];
      if (!createdEl.current) {
        const rec = await createRecord(fields);
        createdEl.current = rec?.id ?? null;
        if (K) clearDraft(K);
      }
      let failed = false;
      if (createdEl.current && etapas.length > 0) {
        for (const e of etapas) {
          if (tasksDone.current.has(e)) continue;
          const r = rowOf(e);
          try {
            await createTask({
              [TAREAS.TITULO]: tituloOf(e),
              [TAREAS.ETAPA]: e,
              [TAREAS.ASIGNADA]: qty,
              [TAREAS.COMPLETADA]: 0,
              [TAREAS.ESTATUS]: 'Pendiente',
              [TAREAS.ORIGEN]: 'Manual',
              [TAREAS.PEDIDO]: [pedidoRecordId],
              [TAREAS.ELEMENTO]: [createdEl.current],
              ...(r.emp ? { [TAREAS.EMPLEADO]: [r.emp] } : {}),
              ...(r.ini ? { [TAREAS.FECHA]: r.ini } : {}),
              ...(r.fin ? { [TAREAS.FECHA_FIN]: r.fin } : {}),
            });
            tasksDone.current.add(e);
          } catch (err) { console.error('Error al crear tarea:', err); failed = true; break; }
        }
      }
      onSaved(); notifyProduccionChanged();
      if (failed) { setWarning('El elemento se creó, pero no se pudieron crear todas las tareas. Puedes crearlas después desde el detalle del elemento.'); return; }
      onClose();
    } catch (err) { console.error('Error al guardar elemento:', err); }
    finally { setSaving(false); }
  };

  const lCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
  const iCls = 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-white rounded-2xl w-full ${etapas.length > 0 ? 'max-w-[760px]' : 'max-w-[580px]'} max-h-[92vh] overflow-y-auto shadow-2xl p-5 dark:bg-[#251D1F]`} onClick={(e: any) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-lg text-gray-900 dark:text-[#F5F3EF]">{draft ? 'Editar Elemento' : 'Agregar Elemento'}</span>
          {onRemove && (
            <button type="button" onClick={() => { onRemove(); onClose(); }} aria-label="Quitar elemento"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:text-gray-500 dark:hover:text-rose-600 dark:hover:bg-rose-600/10"><TrashIcon size={18} /></button>
          )}
        </div>
        <div className="mb-4">
          <div className={`grid gap-3 ${showPastelFields ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <CatalogDropdown label="Nombre" value={selectedNombre} options={catalogoProductos} placeholder="Seleccionar producto..." required error={productoError}
              showOpen={showNombreDropdown} onToggle={() => setShowNombreDropdown((o) => !o)}
              onSelect={(r) => { setSelectedProductoId(r.id); setSelectedNombre(r.name); setProductoError(''); setShowNombreDropdown(false); }}
              onClear={() => { setSelectedProductoId(null); setSelectedNombre(''); }} />
            {showPastelFields && (
              <CatalogDropdown label="Pan" value={selectedPanName} options={catalogoPanes} placeholder="Tipo de pan..."
                showOpen={showPanDropdown} onToggle={() => setShowPanDropdown((o) => !o)}
                onSelect={(r) => { setSelectedPanName(r.name); setSelectedPanId(r.id); setShowPanDropdown(false); }}
                onClear={() => { setSelectedPanName(''); setSelectedPanId(null); }} />
            )}
            {showPastelFields && (
              <CatalogDropdown label="Relleno" value={selectedRellenoName} options={catalogoRellenos} placeholder="Tipo de relleno..."
                showOpen={showRellenoDropdown} onToggle={() => setShowRellenoDropdown((o) => !o)}
                onSelect={(r) => { setSelectedRellenoName(r.name); setSelectedRellenoId(r.id); setShowRellenoDropdown(false); }}
                onClear={() => { setSelectedRellenoName(''); setSelectedRellenoId(null); }} />
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={lCls}>Cantidad</span>
              <input type="number" min="0" value={neCantidad} onChange={(e: any) => setNeCantidad(e.target.value)} placeholder="0"
                className={`${iCls} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} style={{ MozAppearance: 'textfield' } as any} />
            </div>
            <div>
              <span className={lCls}><span className="sm:hidden">Costo U.</span><span className="hidden sm:inline">Costo unitario</span></span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                <input type="number" min="0" step="0.01" value={neCostoUnit} onChange={(e: any) => setNeCostoUnit(e.target.value)} placeholder="0.00"
                  className={`${iCls} pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} style={{ MozAppearance: 'textfield' } as any} />
              </div>
            </div>
            <div>
              <span className={lCls}>Total</span>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-gray-500 bg-gray-50 tabular-nums dark:bg-white/5 dark:border-[#382C2E] dark:text-gray-400">{formatCurrency(costoTotalPreview)}</div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <span className={lCls}>Descripción</span>
          <textarea value={neDescripcion} onChange={(e: any) => setNeDescripcion(e.target.value)} placeholder="Descripción del elemento..." rows={8} className={`${iCls} resize-none`} />
        </div>
        {etapas.length > 0 && (
          <div className="mb-4">
            <span className={lCls}>Tareas de producción</span>
            <div className="rounded-xl border border-[#E5E1DA] dark:border-[#382C2E]">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200 rounded-t-xl dark:bg-white/5 dark:border-white/10">
                  <tr>{['Etapa', 'Empleado', 'Inicio', 'Fin'].map((h) => <th key={h} className="px-2 py-2 text-xs font-semibold text-gray-700 text-left dark:text-gray-300">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {etapas.map((e) => {
                    const r = rowOf(e);
                    const inp = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-[#F7F2F2] dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100';
                    return (
                      <tr key={e} className="border-b border-gray-100 last:border-b-0 dark:border-white/5">
                        <DateRangeScope start={r.ini} end={r.fin} min={minKey} max={maxKey || undefined} onStart={(d) => onIni(e, d)} onEnd={(d) => onFin(e, d)}
                          onClear={(w) => setRow(e, w === 'start' ? { ini: '' } : { fin: '' })}>
                          <td className="px-2 py-1.5 w-[22%]"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ETAPA_STYLE[e].chip}`}>{e}</span></td>
                          <td className="px-2 py-1.5 w-[28%]"><EmpleadoSelect value={r.emp} emps={PD.activeEmps} onChange={(id) => setRow(e, { emp: id })} ariaLabel={`Empleado de ${e}`} /></td>
                          <td className="px-2 py-1.5 w-[25%]"><RangeTrigger which="start" ariaLabel={`Inicio de ${e}`} placeholder="Inicio" className={inp} /></td>
                          <td className="px-2 py-1.5 w-[25%]"><RangeTrigger which="end" ariaLabel={`Fin de ${e}`} placeholder="Fin" className={inp} /></td>
                        </DateRangeScope>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {warning && <p role="alert" className="mb-3 text-sm text-amber-700 dark:text-amber-300">{warning}</p>}
        <div className="flex justify-end pt-4 border-t border-[#E9D9D9] dark:border-[#382C2E]">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            {onDraft ? (draft ? 'Guardar' : 'Agregar') : saving ? 'Creando...' : warning ? 'Reintentar tareas' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditElementoModal({ record, elementosTable, catalogoProductos, catalogoPanes, catalogoRellenos, onClose, onSaved, onDelete }: ElementoModalCommon & { record: AirtableRecord; onDelete: (recordId: string) => void }): React.ReactElement {
  const { mutate: updateRecord } = useUpdateRecord(elementosTable);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDelete = () => { setShowDeleteConfirm(false); onDelete(record.id); onClose(); };

  const initProductoId = readLinked(cv(record, elementosTable, FIELD_IDS.EL_PRODUCTO))[0]?.id ?? null;
  const initNombre = cvs(record, elementosTable, FIELD_IDS.EL_NOMBRE);
  const initPan = readLinked(cv(record, elementosTable, FIELD_IDS.EL_PAN))[0]?.name ?? '';
  const initRelleno = readLinked(cv(record, elementosTable, FIELD_IDS.EL_RELLENO))[0]?.name ?? '';

  const [, setSelectedProductoId] = useState<string | null>(initProductoId);
  const [nombre, setNombre] = useState(initNombre);
  const [pan, setPan] = useState(initPan);
  const [relleno, setRelleno] = useState(initRelleno);
  const [descrip, setDescrip] = useState(cvs(record, elementosTable, FIELD_IDS.EL_DESCRIPCION));
  const cantidadRaw = cv(record, elementosTable, FIELD_IDS.EL_CANTIDAD) as number | null;
  const costoUnitRaw = cv(record, elementosTable, FIELD_IDS.EL_COSTO_UNITARIO) as number | null;
  const [cantidad, setCantidad] = useState(cantidadRaw !== null ? String(cantidadRaw) : '');
  const [costoUnit, setCostoUnit] = useState(costoUnitRaw !== null ? String(costoUnitRaw) : '');
  const [showNombreDropdown, setShowNombreDropdown] = useState(false);
  const [showPanDropdown, setShowPanDropdown] = useState(false);
  const [showRellenoDropdown, setShowRellenoDropdown] = useState(false);

  const showPastelFields = esProductoConRellenoYPan(nombre);
  const costoTotalRecord = cv(record, elementosTable, FIELD_IDS.EL_COSTO_TOTAL) as number | null;
  const costoTotalPreview = useMemo(() => (parseFloat(cantidad) || 0) * (parseFloat(costoUnit) || 0), [cantidad, costoUnit]);
  const costoTotalDisplay = costoTotalRecord !== null ? costoTotalRecord : costoTotalPreview;

  useEscClose(onClose);

  const save = useCallback((fieldId: string, value: unknown) => {
    updateRecord({ recordId: record.id, fields: { [fieldId]: value } })
      .then(() => onSaved())
      .catch((err) => console.error('Error al guardar campo elemento:', err));
  }, [updateRecord, record.id, onSaved]);

  const lCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
  const iCls = 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl p-5 dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-lg text-gray-900 dark:text-[#F5F3EF]">Editar Elemento</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button type="button" onClick={() => setShowDeleteConfirm(true)} aria-label="Eliminar elemento"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:text-gray-500 dark:hover:text-rose-600 dark:hover:bg-rose-600/10"><TrashIcon size={18} /></button>
          </div>
        </div>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={(e: any) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
            <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl p-5 dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#F5F3EF]">¿Eliminar elemento?</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">Cancelar</button>
                <button type="button" onClick={handleDelete} className="px-4 py-2 text-base font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-4">
          <div className={`grid gap-3 ${showPastelFields ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <CatalogDropdown label="Nombre" value={nombre} options={catalogoProductos} placeholder="Seleccionar producto..." required
              error={nombre ? '' : 'Elige un producto; el elemento no puede quedar sin producto.'}
              showOpen={showNombreDropdown} onToggle={() => setShowNombreDropdown((o) => !o)}
              onSelect={(r) => { setSelectedProductoId(r.id); setNombre(r.name); setShowNombreDropdown(false); save(FIELD_IDS.EL_PRODUCTO, [r.id]); }}
              onClear={() => { setNombre(''); setShowNombreDropdown(true); }} />
            {showPastelFields && (
              <CatalogDropdown label="Pan" value={pan} options={catalogoPanes} placeholder="Tipo de pan..."
                showOpen={showPanDropdown} onToggle={() => setShowPanDropdown((o) => !o)}
                onSelect={(r) => { setPan(r.name); setShowPanDropdown(false); save(FIELD_IDS.EL_PAN, [r.id]); }}
                onClear={() => { setPan(''); save(FIELD_IDS.EL_PAN, []); }} />
            )}
            {showPastelFields && (
              <CatalogDropdown label="Relleno" value={relleno} options={catalogoRellenos} placeholder="Tipo de relleno..."
                showOpen={showRellenoDropdown} onToggle={() => setShowRellenoDropdown((o) => !o)}
                onSelect={(r) => { setRelleno(r.name); setShowRellenoDropdown(false); save(FIELD_IDS.EL_RELLENO, [r.id]); }}
                onClear={() => { setRelleno(''); save(FIELD_IDS.EL_RELLENO, []); }} />
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className={lCls}>Cantidad</span>
              <input type="number" min="0" value={cantidad} onChange={(e: any) => setCantidad(e.target.value)} onBlur={() => save(FIELD_IDS.EL_CANTIDAD, parseFloat(cantidad) || null)} placeholder="0"
                className={`${iCls} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} style={{ MozAppearance: 'textfield' } as any} />
            </div>
            <div>
              <span className={lCls}><span className="sm:hidden">Costo U.</span><span className="hidden sm:inline">Costo unitario</span></span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                <input type="number" min="0" step="0.01" value={costoUnit} onChange={(e: any) => setCostoUnit(e.target.value)} onBlur={() => save(FIELD_IDS.EL_COSTO_UNITARIO, parseFloat(costoUnit) || null)} placeholder="0.00"
                  className={`${iCls} pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} style={{ MozAppearance: 'textfield' } as any} />
              </div>
            </div>
            <div>
              <span className={lCls}>Total</span>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-semibold tabular-nums bg-gray-50 dark:bg-white/5 dark:border-[#382C2E] dark:text-gray-300 text-gray-700">{formatCurrency(costoTotalDisplay)}</div>
            </div>
          </div>
        </div>
        <div>
          <span className={lCls}>Descripción</span>
          <textarea value={descrip} onChange={(e: any) => setDescrip(e.target.value)} onBlur={() => save(FIELD_IDS.EL_DESCRIPCION, descrip.trim() || null)} placeholder="Descripción del elemento..." rows={8} className={`${iCls} resize-none`} />
        </div>
      </div>
    </div>
  );
}
