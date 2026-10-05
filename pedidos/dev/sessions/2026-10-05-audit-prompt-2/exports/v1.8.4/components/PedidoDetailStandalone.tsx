import React, { useCallback, useMemo, useState } from 'react';
import { useBase, useRecords, useDeleteRecord, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, TABLE_IDS, cv, cvs, readSelect } from '../utils';
import type { CatalogOption } from './Dropdowns';
import { PedidoDetailModal } from './PedidoDetailModal';
import { useElementoDelete } from '../produccion/deleteElemento';

function catalog(records: AirtableRecord[], table: Table | null, tipo: string): CatalogOption[] {
  return records
    .filter((r) => readSelect(cv(r, table, FIELD_IDS.CAT_TIPO)) === tipo)
    .map((r) => ({ id: r.id, name: cvs(r, table, FIELD_IDS.CAT_NOMBRE) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

/** The same order-detail component used in Pedidos, loading its own supporting data so any page can open it. */
export function PedidoDetailStandalone({ record, pedidosTable, onClose, onDataChange }: {
  record: AirtableRecord; pedidosTable: Table; onClose: () => void; onDataChange: () => void;
}): React.ReactElement {
  const { base } = useBase();
  const elementosT = base?.getTableById(TABLE_IDS.elementos) ?? null;
  const ctT = base?.getTableById(TABLE_IDS.cake_topper) ?? null;
  const catT = base?.getTableById(TABLE_IDS.catalogo) ?? null;
  const elR = useRecords(elementosT);
  const ctR = useRecords(ctT);
  const catR = useRecords(catT);
  const { mutate: deletePedido } = useDeleteRecord(pedidosTable);
  const elDel = useElementoDelete();
  const [hiddenEl, setHiddenEl] = useState<Set<string>>(() => new Set());
  const change = useCallback(() => { elR.refetch(); ctR.refetch(); onDataChange(); }, [elR.refetch, ctR.refetch, onDataChange]); // eslint-disable-line react-hooks/exhaustive-deps
  const productos = useMemo(() => catalog(catR.records, catT, 'Producto'), [catR.records, catT]);
  const panes = useMemo(() => catalog(catR.records, catT, 'Pan'), [catR.records, catT]);
  const rellenos = useMemo(() => catalog(catR.records, catT, 'Relleno'), [catR.records, catT]);
  
  return (
    <>
    {elDel.notice && (
        <div role="alert" className="fixed bottom-4 right-4 z-[130] w-80 max-w-[85vw] bg-white border border-rose-300 rounded-lg shadow-xl px-4 py-3 text-sm text-gray-800 dark:bg-[#251D1F] dark:border-rose-700 dark:text-gray-100 flex items-start gap-3">
          <span className="flex-1">{elDel.notice}</span>
          <button type="button" onClick={elDel.clearNotice} className="font-semibold text-rose-600 hover:underline">Cerrar</button>
        </div>
      )}
    <PedidoDetailModal
      record={record} pedidosTable={pedidosTable} elementosTable={elementosT ?? undefined} cakeTopperTable={ctT ?? undefined}
      elementoRecords={elR.records} cakeTopperRecords={ctR.records}
      catalogoProductos={productos} catalogoPanes={panes} catalogoRellenos={rellenos} hiddenElementoIds={hiddenEl}
      onDeletePedido={(id) => { Promise.resolve(deletePedido(id)).then(onDataChange).catch(console.error); onClose(); }}
      onDeleteElemento={(id) => {
        elDel.hide(id); setHiddenEl((p) => new Set(p).add(id));
        elDel.run(id).catch(console.error).finally(() => { change(); setHiddenEl((p) => { const n = new Set(p); n.delete(id); return n; }); });
      }}
      onClose={onClose} onDataChange={change}
    />
    </>
  );
}
