import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CaretDown as CaretDownIcon, X as XIcon, Check as CheckIcon } from '@phosphor-icons/react';
import { useFloating } from './useFloating';
import { useListNav, ACTIVE_ROW } from '../lib/useListNav';

export interface CatalogOption { id: string; name: string }

export function FilterDropdown({ label, values, options, onChange, allLabel = 'Todos' }: {
  label: string; values: string[]; options: string[]; onChange: (v: string[]) => void; allLabel?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<any>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const displayText = values.length === 0 ? allLabel : values.length === 1 ? values[0]! : `${values.length} seleccionados`;
  const toggleOption = (opt: string) => onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  const nav = useListNav({ open, count: options.length + 1, initial: values.length ? options.indexOf(values[0]!) + 1 : 0,
    onPick: (i) => { if (i === 0) { onChange([]); setOpen(false); } else toggleOption(options[i - 1]!); }, onClose: () => setOpen(false) });
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-500 font-medium whitespace-nowrap dark:text-gray-400">{label}</span>}
      <div ref={containerRef} className="relative" onKeyDown={nav.onKeyDown}>
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center justify-between gap-2 min-w-[160px] h-10 bg-white border border-gray-300 rounded-xl px-3 text-base text-gray-700 hover:border-rose-200 focus:border-rose-600 focus:ring-1 focus:ring-rose-200 outline-none transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:hover:border-rose-600/50">
          <span className="truncate">{displayText}</span>
          <CaretDownIcon size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div ref={nav.listRef} className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[260px] overflow-y-auto overflow-x-hidden w-[200px] dark:bg-[#251D1F] dark:border-[#382C2E]">
            <button type="button" data-idx={0} onMouseEnter={() => nav.setActive(0)} onClick={() => { onChange([]); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-base transition-colors ${values.length === 0 ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : `text-gray-700 dark:text-gray-300 ${nav.active === 0 ? ACTIVE_ROW : ''}`}`}>
              {allLabel}
            </button>
            {options.map((opt, oi) => {
              const sel = values.includes(opt);
              return (
                <button key={opt} type="button" data-idx={oi + 1} onMouseEnter={() => nav.setActive(oi + 1)} onClick={() => toggleOption(opt)}
                  className={`w-full text-left px-3 py-2 text-base transition-colors truncate ${sel ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : `text-gray-700 dark:text-gray-300 ${nav.active === oi + 1 ? ACTIVE_ROW : ''}`}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Single-choice dropdown with the same look as FilterDropdown. */
export function SelectDropdown<T extends string>({ value, options, onChange, ariaLabel, minWidth = 'min-w-[140px]' }: {
  value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; ariaLabel: string; minWidth?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<any>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const current = options.find((o) => o.value === value) ?? options[0]!;
  const nav = useListNav({ open, count: options.length, initial: Math.max(0, options.findIndex((o) => o.value === value)),
    onPick: (i) => { onChange(options[i]!.value); setOpen(false); }, onClose: () => setOpen(false) });
  return (
    <div ref={containerRef} className="relative" onKeyDown={nav.onKeyDown}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
        className={`inline-flex items-center justify-between gap-2 ${minWidth} h-10 bg-white border border-gray-300 rounded-xl px-3 text-base text-gray-700 hover:border-rose-200 focus:border-rose-600 focus:ring-1 focus:ring-rose-200 outline-none transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:hover:border-rose-600/50`}>
        <span className="truncate">{current.label}</span>
        <CaretDownIcon size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div ref={nav.listRef} role="listbox" className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-full min-w-[160px] overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
          {options.map((o, oi) => {
            const sel = o.value === value;
            return (
              <button key={o.value} type="button" role="option" aria-selected={sel} data-idx={oi} onMouseEnter={() => nav.setActive(oi)} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-base transition-colors ${sel ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : `text-gray-700 dark:text-gray-300 ${nav.active === oi ? ACTIVE_ROW : ''}`}`}>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Form-field dropdown with the app's standard popup style (replaces native <select>).
 * Shows up to 7 options before scrolling, floats above modal footers and flips up when needed.
 */
export function FieldSelect({ id, value, options, onChange, placeholder = 'Elegir…', className = '', ariaLabel, clearable = false }: {
  id?: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void;
  placeholder?: string; className?: string; ariaLabel?: string;
  /** Shows an X to remove the chosen option (sets the value to ''). */
  clearable?: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<any>(null);
  const popRef = useRef<any>(null);
  const style = useFloating(() => wrapRef.current, popRef, open, { matchWidth: true, maxHeight: 254 });
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  useEffect(() => {
    if (open) popRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open]);
  const current = options.find((o) => o.value === value);
  const nav = useListNav({ open, count: options.length, initial: Math.max(0, options.findIndex((o) => o.value === value)),
    onPick: (i) => { onChange(options[i]!.value); setOpen(false); }, onClose: () => setOpen(false) });
  const setPop = (n: any) => { popRef.current = n; nav.listRef.current = n; };
  return (
    <div ref={wrapRef} className="relative" onKeyDown={nav.onKeyDown}>
      <button id={id} type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        className={`${className} flex items-center justify-between gap-2 text-left`}>
        <span className={`truncate ${current ? '' : 'text-gray-400 dark:text-gray-500'}`}>{current?.label ?? placeholder}</span>
        {clearable && current
          ? <span role="button" aria-label="Quitar selección" onMouseDown={(e: any) => e.preventDefault()}
              onClick={(e: any) => { e.stopPropagation(); setOpen(false); onChange(''); }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={14} /></span>
          : <CaretDownIcon size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div ref={setPop} role="listbox" style={style}
          className="overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-[#251D1F] dark:border-[#382C2E]">
          {options.map((o, oi) => {
            const sel = o.value === value;
            return (
              <button key={o.value || '__empty'} type="button" role="option" aria-selected={sel} data-idx={oi} onMouseEnter={() => nav.setActive(oi)} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-base transition-colors ${sel ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : `text-gray-700 dark:text-gray-300 ${nav.active === oi ? ACTIVE_ROW : ''}`}`}>
                <span className="truncate">{o.label}</span>
                {sel && <CheckIcon size={13} weight="bold" className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CatalogDropdown({ label, value, options, placeholder, showOpen, onToggle, onSelect, onClear, disabled = false, error, required = false }: {
  label: string;
  error?: string;
  required?: boolean;
  value: string;
  options: CatalogOption[];
  placeholder: string;
  showOpen: boolean;
  onToggle: () => void;
  onSelect: (r: CatalogOption) => void;
  onClear: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<any>(null);
  const triggerRef = useRef<any>(null);
  const popRef = useRef<any>(null);
  const floatStyle = useFloating(() => triggerRef.current, popRef, showOpen, { matchWidth: true });

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((r) => (r.name ?? '').toLowerCase().includes(query));
  }, [options, searchQuery]);

  const nav = useListNav({ open: showOpen, count: filteredRecords.length, initial: Math.max(0, filteredRecords.findIndex((r) => r.name === value)),
    onPick: (i) => { const r = filteredRecords[i]; if (r) { onSelect(r); setSearchQuery(''); } }, onClose: () => { onToggle(); setSearchQuery(''); } });
  useEffect(() => { nav.setActive(0); }, [searchQuery]); // eslint-disable-line
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { onToggle(); setSearchQuery(''); }
    };
    if (showOpen) {
      document.addEventListener('mousedown', handle);
      return () => document.removeEventListener('mousedown', handle);
    }
  }, [showOpen, onToggle]);

  const iCls = `bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100${disabled ? ' bg-gray-50 cursor-not-allowed dark:bg-white/5' : ''}`;
  const lCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';

  return (
    <div ref={containerRef} className="relative" onKeyDown={nav.onKeyDown}>
      <span className={lCls}>{label}{required && <span className="text-rose-600 dark:text-rose-400"> *</span>}</span>
      <button ref={triggerRef} type="button" disabled={disabled} onClick={onToggle} aria-invalid={!!error}
        className={`${iCls} ${error ? '!border-rose-500 dark:!border-rose-500' : ''} flex items-center justify-between gap-2 text-left cursor-pointer`}>
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}>{value || placeholder}</span>
        <span className="flex-shrink-0 flex items-center">
          {value && !disabled
            ? <span onMouseDown={(e: any) => e.preventDefault()} onClick={(e: any) => { e.stopPropagation(); onClear(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer dark:text-gray-500 dark:hover:text-gray-300"><XIcon size={14} /></span>
            : <CaretDownIcon size={14} className={`text-gray-400 transition-transform ${showOpen ? 'rotate-180' : ''}`} />}
        </span>
      </button>
      {error && <p role="alert" className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {showOpen && (
        <div ref={popRef} style={floatStyle} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
          <div className="p-2 border-b border-gray-200 dark:border-[#382C2E] flex-shrink-0">
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} autoFocus aria-label="Buscar"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-rose-600" />
          </div>
          <div ref={nav.listRef} className="max-h-[254px] overflow-y-auto" tabIndex={0}>
            {filteredRecords.length === 0
              ? <div className="px-4 py-3 text-sm text-gray-400 text-center dark:text-gray-600">{options.length === 0 ? 'Sin opciones' : 'No hay resultados'}</div>
              : filteredRecords.map((r, ri) => (
                  <button key={r.id} type="button" data-idx={ri} onMouseEnter={() => nav.setActive(ri)} onMouseDown={(e: any) => e.preventDefault()} onClick={() => { onSelect(r); setSearchQuery(''); }}
                    className={`w-full text-left px-3 py-2 text-base transition-colors ${r.name === value ? 'bg-rose-50 text-rose-600 font-medium dark:bg-rose-600/15 dark:text-rose-200' : `text-gray-700 dark:text-gray-300 ${nav.active === ri ? ACTIVE_ROW : ''}`}`}>
                    {r.name}
                  </button>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
