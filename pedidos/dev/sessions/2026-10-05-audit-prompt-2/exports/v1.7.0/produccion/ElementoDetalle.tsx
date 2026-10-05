import React, { useEffect } from 'react';
import { useEscClose } from '../lib/escStack';
import { PencilSimple as PencilIcon, X as XIcon } from '@phosphor-icons/react';
import { useProduccionData } from './useProduccionData';
import { ElementoTareasSection } from './PedidoTareasSection';

const labelClasses = 'block text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300';

/** Element detail page (same overlay presentation as the order detail): data, "Editar", stage tracker and the element's tasks. */
export function ElementoDetalle({ elementoId, onClose, onEdit, reloadToken }: {
  elementoId: string; onClose: () => void; onEdit: () => void; reloadToken?: unknown;
}): React.ReactElement {
  const D = useProduccionData();
  const el = D.elementoById.get(elementoId);
  const pedido = el?.pedidoId ? D.pedidoInfo.get(el.pedidoId)?.label : '';

  useEscClose(onClose);

  const Item = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><span className={labelClasses}>{label}</span><div className="text-base text-gray-800 dark:text-gray-200">{children || '—'}</div></div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Detalle del elemento" className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(3px)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-white w-full h-full max-w-none min-w-0 rounded-none sm:w-[80vw] sm:min-w-[560px] sm:max-w-[80vw] sm:h-[90vh] sm:rounded-2xl lg:w-[60vw] lg:max-w-[60vw] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-between gap-3">
          <h2 className="font-bold text-2xl text-gray-900 truncate dark:text-[#F5F3EF]">{el?.nombre || 'Elemento'}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E9D9D9] text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors dark:border-[#382C2E] dark:text-gray-300 dark:hover:bg-white/5">
              <PencilIcon size={16} />Editar
            </button>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-600/10"><XIcon size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {el ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Item label="Nombre">{el.nombre}</Item>
              <Item label="Producto">{el.producto}</Item>
              <Item label="Cantidad">{el.cantidad}</Item>
              <Item label="Pedido">{pedido}</Item>
              <div className="sm:col-span-2"><Item label="Descripción">{el.descripcion}</Item></div>
            </div>
          ) : <div className="h-20 rounded bg-gray-100 dark:bg-white/10 animate-pulse mb-5" />}
          <hr className="mb-5 border-0 border-t border-[#E9D9D9] dark:border-[#382C2E]" />
          <span className={labelClasses}>Tareas de producción</span>
          <ElementoTareasSection elementoId={elementoId} reloadToken={reloadToken} />
        </div>
      </div>
    </div>
  );
}
