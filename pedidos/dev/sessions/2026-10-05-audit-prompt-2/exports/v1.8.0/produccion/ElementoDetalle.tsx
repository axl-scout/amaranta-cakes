import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useEscClose } from '../lib/escStack';
import { Trash as TrashIcon, X as XIcon } from '@phosphor-icons/react';
import { useUpdateRecord, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, formatCurrency, esProductoConRellenoYPan, readLinked, cv, cvs } from '../utils';
import { CatalogDropdown, type CatalogOption } from '../components/Dropdowns';
import { useProduccionData } from './useProduccionData';
import { ElementoTareasSection } from './PedidoTareasSection';

const labelClasses = 'block text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300';
const lCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
const iCls = 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';
const noSpin = '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

/** Element detail page: fields editable in place (auto-saved), stage tracker and the element's tasks. */
export function ElementoDetalle({ record, elementosTable, catalogoProductos, catalogoPanes, catalogoRellenos, onClose, onDelete, onSaved, reloadToken }: {
  record: AirtableRecord; elementosTable: Table;
  catalogoProductos: CatalogOption[]; catalogoPanes: CatalogOption[]; catalogoRellenos: CatalogOption[];
  onClose: () => void; onDelete: (id: string) => void; onSaved: () => void; reloadToken?: unknown;
}): React.ReactElement {
  const D = useProduccionData();
  const { mutate: updateRecord } = useUpdateRecord(elementosTable);
  const elementoId = record.id;
  const nombreRec = cvs(record, elementosTable, FIELD_IDS.EL_NOMBRE);
  const pedido = D.elementoById.get(elementoId)?.pedidoId ? D.pedidoInfo.get(D.elementoById.get(elementoId)!.pedidoId!)?.label : '';

  const [producto, setProducto] = useState(readLinked(cv(record, elementosTable, FIELD_IDS.EL_PRODUCTO))[0]?.name ?? '');
  const [pan, setPan] = useState(readLinked(cv(record, elementosTable, FIELD_IDS.EL_PAN))[0]?.name ?? '');
  const [relleno, setRelleno] = useState(readLinked(cv(record, elementosTable, FIELD_IDS.EL_RELLENO))[0]?.name ?? '');
  const [descrip, setDescrip] = useState(cvs(record, elementosTable, FIELD_IDS.EL_DESCRIPCION));
  const cantRaw = cv(record, elementosTable, FIELD_IDS.EL_CANTIDAD) as number | null;
  const costoRaw = cv(record, elementosTable, FIELD_IDS.EL_COSTO_UNITARIO) as number | null;
  const [cantidad, setCantidad] = useState(cantRaw !== null ? String(cantRaw) : '');
  const [costoUnit, setCostoUnit] = useState(costoRaw !== null ? String(costoRaw) : '');
  const [openDd, setOpenDd] = useState<'' | 'producto' | 'pan' | 'relleno'>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<any>(null);

  const showPastel = esProductoConRellenoYPan(producto);
  const totalRec = cv(record, elementosTable, FIELD_IDS.EL_COSTO_TOTAL) as number | null;
  const totalPreview = useMemo(() => (parseFloat(cantidad) || 0) * (parseFloat(costoUnit) || 0), [cantidad, costoUnit]);

  useEscClose(onClose, !showDeleteConfirm);
  useEscClose(() => setShowDeleteConfirm(false), showDeleteConfirm);

  const save = useCallback((fieldId: string, value: unknown) => {
    setSaveState('saving');
    updateRecord({ recordId: record.id, fields: { [fieldId]: value } })
      .then(() => { onSaved(); setSaveState('saved'); clearTimeout(timer.current); timer.current = setTimeout(() => setSaveState('idle'), 2500); })
      .catch((err) => { console.error('Error al guardar campo elemento:', err); setSaveState('error'); });
  }, [updateRecord, record.id, onSaved]);

  const Fixed = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><span className={labelClasses}>{label}</span><div className="text-base text-gray-800 dark:text-gray-200">{children || '—'}</div></div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Detalle del elemento" className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(3px)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-white w-full h-full max-w-none min-w-0 rounded-none sm:w-[80vw] sm:min-w-[560px] sm:max-w-[80vw] sm:h-[90vh] sm:rounded-2xl lg:w-[60vw] lg:max-w-[60vw] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-between gap-3">
          <h2 className="font-bold text-2xl text-gray-900 truncate dark:text-[#F5F3EF]">{nombreRec || 'Elemento'}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 mr-2" aria-live="polite">
              {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Cambios guardados' : saveState === 'error' ? <span className="text-rose-600">No se pudo guardar el último cambio</span> : ''}
            </span>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} aria-label="Eliminar elemento"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:text-gray-500 dark:hover:bg-rose-600/10"><TrashIcon size={18} /></button>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-600/10"><XIcon size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="sm:hidden text-xs text-gray-400 mb-3 min-h-[1rem]">
            {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Cambios guardados' : saveState === 'error' ? <span className="text-rose-600">No se pudo guardar el último cambio</span> : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Fixed label="Nombre">{nombreRec}</Fixed>
            <Fixed label="Pedido">{pedido}</Fixed>
          </div>
          <div className={`grid gap-3 mb-4 ${showPastel ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
            <CatalogDropdown label="Producto" value={producto} options={catalogoProductos} placeholder="Seleccionar producto..." required
              error={producto ? '' : 'Elige un producto; el elemento no puede quedar sin producto.'}
              showOpen={openDd === 'producto'} onToggle={() => setOpenDd((o) => (o === 'producto' ? '' : 'producto'))}
              onSelect={(r) => { setProducto(r.name); setOpenDd(''); save(FIELD_IDS.EL_PRODUCTO, [r.id]); }}
              onClear={() => { setProducto(''); setOpenDd('producto'); }} />
            {showPastel && (
              <CatalogDropdown label="Pan" value={pan} options={catalogoPanes} placeholder="Tipo de pan..."
                showOpen={openDd === 'pan'} onToggle={() => setOpenDd((o) => (o === 'pan' ? '' : 'pan'))}
                onSelect={(r) => { setPan(r.name); setOpenDd(''); save(FIELD_IDS.EL_PAN, [r.id]); }}
                onClear={() => { setPan(''); save(FIELD_IDS.EL_PAN, []); }} />
            )}
            {showPastel && (
              <CatalogDropdown label="Relleno" value={relleno} options={catalogoRellenos} placeholder="Tipo de relleno..."
                showOpen={openDd === 'relleno'} onToggle={() => setOpenDd((o) => (o === 'relleno' ? '' : 'relleno'))}
                onSelect={(r) => { setRelleno(r.name); setOpenDd(''); save(FIELD_IDS.EL_RELLENO, [r.id]); }}
                onClear={() => { setRelleno(''); save(FIELD_IDS.EL_RELLENO, []); }} />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <span className={lCls}>Cantidad</span>
              <input type="number" min="0" value={cantidad} onChange={(e: any) => setCantidad(e.target.value)} onBlur={() => save(FIELD_IDS.EL_CANTIDAD, parseFloat(cantidad) || null)} placeholder="0"
                className={`${iCls} ${noSpin}`} style={{ MozAppearance: 'textfield' } as any} />
            </div>
            <div>
              <span className={lCls}><span className="sm:hidden">Costo U.</span><span className="hidden sm:inline">Costo unitario</span></span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
                <input type="number" min="0" step="0.01" value={costoUnit} onChange={(e: any) => setCostoUnit(e.target.value)} onBlur={() => save(FIELD_IDS.EL_COSTO_UNITARIO, parseFloat(costoUnit) || null)} placeholder="0.00"
                  className={`${iCls} pl-7 ${noSpin}`} style={{ MozAppearance: 'textfield' } as any} />
              </div>
            </div>
            <div>
              <span className={lCls}>Total</span>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-semibold tabular-nums bg-gray-50 dark:bg-white/5 dark:border-[#382C2E] dark:text-gray-300 text-gray-700">{formatCurrency(totalRec !== null ? totalRec : totalPreview)}</div>
            </div>
          </div>
          <div className="mb-5">
            <span className={lCls}>Descripción</span>
            <textarea value={descrip} onChange={(e: any) => setDescrip(e.target.value)} onBlur={() => save(FIELD_IDS.EL_DESCRIPCION, descrip.trim() || null)} placeholder="Descripción del elemento..." rows={4} className={`${iCls} resize-none`} />
          </div>
          <hr className="mb-5 border-0 border-t border-[#E9D9D9] dark:border-[#382C2E]" />
          <span className={labelClasses}>Tareas de producción</span>
          <ElementoTareasSection elementoId={elementoId} reloadToken={reloadToken} />
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
              <button type="button" onClick={() => { setShowDeleteConfirm(false); onDelete(record.id); }} className="px-4 py-2 text-base font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
