import React, { useEffect, useRef, useState } from 'react';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import { useFloating } from '../components/useFloating';
import { useListNav, ACTIVE_ROW } from '../lib/useListNav';

/** Optional, searchable employee picker. Empty value = "Sin asignar". The list is fixed-positioned so scrolling tables don't clip it. */
export function EmpleadoSelect({ value, emps, onChange, ariaLabel }: {
  value: string; emps: Array<{ id: string; name: string }>; onChange: (id: string) => void; ariaLabel: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btn = useRef<any>(null);
  const box = useRef<any>(null);
  const style = useFloating(() => btn.current, box, open, { matchWidth: true, minWidth: 200 });

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || box.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => { document.removeEventListener('mousedown', down); };
  }, [open]);

  const toggle = () => {
    if (!open) setQ('');
    setOpen((o) => !o);
  };
  const cur = emps.find((e) => e.id === value);
  const list = emps.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (id: string) => { onChange(id); setOpen(false); };
  // index 0 = "Sin asignar", then the filtered employees
  const nav = useListNav({ open, count: list.length + 1, initial: value ? list.findIndex((e) => e.id === value) + 1 : 0,
    onPick: (i) => pick(i === 0 ? '' : list[i - 1]!.id), onClose: () => setOpen(false) });
  useEffect(() => { nav.setActive(0); }, [q]); // eslint-disable-line

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} onKeyDown={nav.onKeyDown} aria-label={ariaLabel} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-left bg-[#F7F2F2] outline-none focus:border-rose-600 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100">
        <span className={`truncate ${cur ? '' : 'text-gray-400 dark:text-gray-500'}`}>{cur ? cur.name : 'Sin asignar'}</span>
        <CaretDownIcon size={12} className="flex-shrink-0 text-gray-400" />
      </button>
      {open && (
        <div ref={box} onKeyDown={nav.onKeyDown} className="bg-white border border-[#E9D9D9] rounded-lg shadow-lg dark:bg-[#251D1F] dark:border-[#382C2E]" style={style}>
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10 dark:border-white/10 dark:bg-[#251D1F]">
            <input autoFocus value={q} onChange={(e: any) => setQ(e.target.value)} placeholder="Buscar empleado…" aria-label="Buscar empleado"
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-rose-600 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100" />
          </div>
          <ul ref={nav.listRef} className="py-1">
            <li><button type="button" data-idx={0} onMouseEnter={() => nav.setActive(0)} onClick={() => pick('')} className={`w-full text-left px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 ${nav.active === 0 ? ACTIVE_ROW : ''}`}>Sin asignar</button></li>
            {list.map((e, ei) => (
              <li key={e.id}><button type="button" data-idx={ei + 1} onMouseEnter={() => nav.setActive(ei + 1)} onClick={() => pick(e.id)} className={`w-full text-left px-3 py-1.5 text-sm ${nav.active === ei + 1 ? ACTIVE_ROW : ''} ${e.id === value ? 'font-semibold text-rose-600' : 'text-gray-800 dark:text-gray-200'}`}>{e.name}</button></li>
            ))}
            {list.length === 0 && <li className="px-3 py-1.5 text-sm text-gray-400">Sin resultados</li>}
          </ul>
        </div>
      )}
    </>
  );
}
