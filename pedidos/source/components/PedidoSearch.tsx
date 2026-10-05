import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';
import { formatFriendlyDateTime, toTitleCase } from '../utils';

export interface PedidoSearchItem { id: string; label: string; cliente: string; due: Date | null }

/** Order search box (same look and keyboard behaviour as the one in Pedidos). */
export function PedidoSearch({ items, onSelect }: { items: PedidoSearchItem[]; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<any>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((o) => o.label.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) ||
        (o.due ? formatFriendlyDateTime(o.due.toISOString()).toLowerCase().includes(q) : false))
      .sort((a, b) => (b.due?.getTime() ?? 0) - (a.due?.getTime() ?? 0))
      .slice(0, 10);
  }, [query, items]);

  useEffect(() => { setActive(0); setOpen(results.length > 0); }, [results.length, query]);
  useEffect(() => {
    const h = (e: any) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (id: string) => { onSelect(id); setOpen(false); setQuery(''); };
  const show = open && results.length > 0;

  return (
    <div ref={ref} className="relative">
      <MagnifyingGlassIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
      <input type="text" value={query} onChange={(e: any) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={(e: any) => {
          if (e.key === 'Escape') { setOpen(false); return; }
          if (!show) { if (e.key === 'ArrowDown' && results.length > 0) { e.preventDefault(); setOpen(true); } return; }
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
          else if (e.key === 'Enter') { e.preventDefault(); const r = results[active]; if (r) pick(r.id); }
        }}
        placeholder="Buscar pedido..." aria-label="Buscar pedido"
        className="pl-8 pr-3 h-10 w-44 sm:w-56 text-base bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:border-rose-600 dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:placeholder-gray-600" />
      {show && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden w-[380px] max-w-[90vw] max-h-[300px] overflow-y-auto dark:bg-[#251D1F] dark:border-[#382C2E]">
          {results.map((r, idx) => (
            <button key={r.id} type="button" onClick={() => pick(r.id)} onMouseEnter={() => setActive(idx)}
              ref={(el: any) => { if (el && idx === active) el.scrollIntoView?.({ block: 'nearest' }); }}
              className={`w-full text-left px-4 py-2 hover:bg-rose-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer dark:hover:bg-white/5 dark:border-white/5 ${idx === active ? 'bg-rose-50 dark:bg-white/5' : ''}`}>
              <div className="font-medium text-base text-gray-900 dark:text-gray-100">{toTitleCase(r.label) || 'Sin ID'}</div>
              {r.cliente && <div className="text-sm text-gray-600 dark:text-gray-400">{r.cliente}</div>}
              {r.due && <div className="text-sm text-gray-500">{formatFriendlyDateTime(r.due.toISOString())}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
