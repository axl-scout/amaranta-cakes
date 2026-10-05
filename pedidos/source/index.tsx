import { useUrlParam } from './lib/useUrlParam';
import { useSemaforo, semaforoStyle, EtapaChip } from './produccion/semaforo';
import { useElementoDelete } from './produccion/deleteElemento';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PageToolbar, SideRail } from './components/SideMenu';
import { LandingPage } from './components/LandingPage';
import { FinanzasPage } from './finanzas/FinanzasPage';
import { useThemeMode } from './components/ThemeToggle';
import { setEstatusChoices, toneStyle, useIsDark } from './components/airtableColors';
import { PedidosContentSkeleton } from './components/Skeletons';
import { PeriodSelect } from './components/PeriodSelect';
import { TableroEtapas } from './components/TableroEtapas';
import { ProduccionPage } from './produccion/ProduccionPage';
import {
  CaretLeft as CaretLeftIcon,
  CaretRight as CaretRightIcon,
  Calendar as CalendarIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  Plus as PlusIcon,
} from '@phosphor-icons/react';
import { useBase, useRecords, useDeleteRecord, type AirtableRecord, type Table } from './lib/airtable-hooks';
import {
  FIELD_IDS, TABLE_IDS, MONTHS_ES,
  formatDateForComparison, formatFriendlyDateTime, formatCurrency,
  toTitleCase, readSelect, readLinked, cv, cvs,
} from './utils';
import { ContactoPill, EstatusPill, ImpresoPill } from './components/Pills';
import { FilterDropdown, type CatalogOption } from './components/Dropdowns';
import { MiniCalendar, MonthYearSpinner, CalendarioView } from './components/Calendar';
import { PedidoDetailModal } from './components/PedidoDetailModal';
import { NuevoPedidoModal } from './components/NuevoPedidoModal';

function buildCatalogOptions(records: AirtableRecord[], table: Table | null, tipo: string): CatalogOption[] {
  return records
    .filter((r) => readSelect(cv(r, table, FIELD_IDS.CAT_TIPO)) === tipo)
    .map((r) => ({ id: r.id, name: cvs(r, table, FIELD_IDS.CAT_NOMBRE) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

function PedidosApp(): React.ReactElement {
  const { base, loading: baseLoading, error: baseError } = useBase();

  const pedidosTable = base?.getTableById(TABLE_IDS.pedidos) ?? null;
  const isDark = useIsDark();
  // Estatus colors come from the choice colors configured on the Airtable field.
  setEstatusChoices(pedidosTable?.getFieldById(FIELD_IDS.ESTATUS)?.options?.choices);
  const elementosTable = base?.getTableById(TABLE_IDS.elementos) ?? null;
  const cakeTopperTable = base?.getTableById(TABLE_IDS.cake_topper) ?? null;
  const catalogoTable = base?.getTableById(TABLE_IDS.catalogo) ?? null;

  const { records: pedidoRecords, loading: pedidosLoading, refetch: refetchPedidos } = useRecords(pedidosTable);
  const { records: elementoRecords, refetch: refetchElementos } = useRecords(elementosTable);
  const { records: cakeTopperRecords, refetch: refetchCakeToppers } = useRecords(cakeTopperTable);
  const { records: catalogoRecords } = useRecords(catalogoTable);

  const onDataChange = useCallback(() => {
    refetchPedidos(); refetchElementos(); refetchCakeToppers();
  }, [refetchPedidos, refetchElementos, refetchCakeToppers]);

  // ── Soft delete with undo (10s) ──────────────────────────────────────────────
  const { mutate: deletePedidoApi } = useDeleteRecord(pedidosTable);
  const [pendingDeletes, setPendingDeletes] = useState<Array<{ key: string; type: 'pedido' | 'elemento'; recordId: string }>>([]);
  const deleteTimers = useRef<Record<string, any>>({});
  const elDel = useElementoDelete();
  const semaforo = useSemaforo();

  const hiddenPedidoIds = useMemo(() => new Set(pendingDeletes.filter((p) => p.type === 'pedido').map((p) => p.recordId)), [pendingDeletes]);
  const hiddenElementoIds = useMemo(() => new Set(pendingDeletes.filter((p) => p.type === 'elemento').map((p) => p.recordId)), [pendingDeletes]);

  const finalizeDelete = useCallback((pd: { key: string; type: 'pedido' | 'elemento'; recordId: string }) => {
    delete deleteTimers.current[pd.key];
    setPendingDeletes((prev) => prev.filter((x) => x.key !== pd.key));
    if (pd.type === 'elemento') {
      // Tasks first, then the element; if a task fails the element stays.
      elDel.run(pd.recordId).then(() => onDataChange()).catch((e) => console.error('Error al eliminar definitivamente:', e));
      return;
    }
    Promise.resolve(deletePedidoApi(pd.recordId)).then(() => onDataChange()).catch((e) => console.error('Error al eliminar definitivamente:', e));
  }, [deletePedidoApi, elDel, onDataChange]);

  const requestDelete = useCallback((type: 'pedido' | 'elemento', recordId: string) => {
    const key = `${type}-${recordId}-${Date.now()}`;
    const pd = { key, type, recordId };
    if (type === 'elemento') elDel.hide(recordId);
    setPendingDeletes((prev) => [...prev, pd]);
    deleteTimers.current[key] = setTimeout(() => finalizeDelete(pd), 10000);
  }, [finalizeDelete, elDel]);

  const undoDelete = useCallback((key: string) => {
    const t = deleteTimers.current[key];
    if (t) { clearTimeout(t); delete deleteTimers.current[key]; }
    const pd = pendingDeletes.find((x) => x.key === key);
    if (pd?.type === 'elemento') elDel.restore(pd.recordId);
    setPendingDeletes((prev) => prev.filter((x) => x.key !== key));
  }, [pendingDeletes, elDel]);

  useEffect(() => () => { Object.values(deleteTimers.current).forEach((t) => clearTimeout(t)); }, []);

  const catalogoProductos = useMemo(() => buildCatalogOptions(catalogoRecords, catalogoTable, 'Producto'), [catalogoRecords, catalogoTable]);
  const catalogoPanes = useMemo(() => buildCatalogOptions(catalogoRecords, catalogoTable, 'Pan'), [catalogoRecords, catalogoTable]);
  const catalogoRellenos = useMemo(() => buildCatalogOptions(catalogoRecords, catalogoTable, 'Relleno'), [catalogoRecords, catalogoTable]);

  const [view, setView] = useState<'dia' | 'semana' | 'mes' | 'todos'>(() => {
    if (typeof window === 'undefined') return 'dia';
    const s = window.localStorage.getItem('pedidos-view');
    return s === 'dia' || s === 'semana' || s === 'mes' || s === 'todos' ? s : 'dia';
  });
  const [diaForma, setDiaForma] = useState<'lista' | 'tablero'>(() => {
    if (typeof window === 'undefined') return 'lista';
    return window.localStorage.getItem('pedidos-dia-forma') === 'tablero' ? 'tablero' : 'lista';
  });
  useEffect(() => {
    try { window.localStorage.setItem('pedidos-dia-forma', diaForma); } catch { /* ignore */ }
  }, [diaForma]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useUrlParam('pedido');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIdx, setActiveSearchIdx] = useState(0);
  const [searchResults, setSearchResults] = useState<AirtableRecord[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedEstatus, setSelectedEstatus] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['Pendiente'];
    try {
      const s = window.localStorage.getItem('pedidos-estatus');
      if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.every((x) => typeof x === 'string')) return a; }
    } catch { /* ignore */ }
    return ['Pendiente'];
  });
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const calendarPeriod: 'mes' | 'semana' = view === 'semana' ? 'semana' : 'mes';
  const searchRef = useRef<any>(null);
  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false); setSearchQuery(''); setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    try { window.localStorage.setItem('pedidos-view', view); } catch { /* ignore */ }
  }, [view]);

  useEffect(() => {
    try { window.localStorage.setItem('pedidos-estatus', JSON.stringify(selectedEstatus)); } catch { /* ignore */ }
  }, [selectedEstatus]);

  const getFechaValue = useCallback((r: AirtableRecord): string | null => cv(r, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null, [pedidosTable]);
  const getEstatusValue = useCallback((r: AirtableRecord): string => readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS)), [pedidosTable]);

  const filteredPedidosDia = useMemo(() => {
    const selStr = formatDateForComparison(calendarDate);
    return pedidoRecords
      .filter((r) => {
        if (hiddenPedidoIds.has(r.id)) return false;
        const val = cv(r, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        if (!val || formatDateForComparison(new Date(val)) !== selStr) return false;
        if (selectedEstatus.length > 0) {
          if (!selectedEstatus.includes(readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS)))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = cv(a, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        const tb = cv(b, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        if (!ta) return 1; if (!tb) return -1;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
  }, [pedidoRecords, pedidosTable, calendarDate, selectedEstatus, hiddenPedidoIds]);

  // Tablero por etapas (Todos / Día + Tablero): mismos pedidos y filtro de estatus; el buscador no filtra y los Entregados nunca aparecen.
  const pedidosTablero = useMemo(() => {
    const selStr = formatDateForComparison(calendarDate);
    const out: { id: string; pid: string; fecha: string | null; estatus: string }[] = [];
    for (const r of pedidoRecords) {
      if (hiddenPedidoIds.has(r.id)) continue;
      const estatus = readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS));
      if (estatus === 'Entregado') continue;
      const fecha = (cv(r, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null) || null;
      if (selectedEstatus.length > 0 && !selectedEstatus.includes(estatus)) continue;
      if (view === 'dia' && (!fecha || formatDateForComparison(new Date(fecha)) !== selStr)) continue;
      out.push({ id: r.id, pid: cvs(r, pedidosTable, FIELD_IDS.PEDIDO_ID), fecha, estatus });
    }
    return out;
  }, [pedidoRecords, pedidosTable, calendarDate, selectedEstatus, hiddenPedidoIds, view]);

  const filteredPedidosCalendar = useMemo(() => {
    return pedidoRecords.filter((r) => {
      if (hiddenPedidoIds.has(r.id)) return false;
      if (selectedEstatus.length > 0) {
        if (!selectedEstatus.includes(readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS)))) return false;
      }
      return true;
    });
  }, [pedidoRecords, pedidosTable, selectedEstatus, hiddenPedidoIds]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearchDropdown(false); return; }
    const queryLower = searchQuery.toLowerCase();
    const matches = pedidoRecords
      .filter((r) => {
        if (hiddenPedidoIds.has(r.id)) return false;
        const fecha = cv(r, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        if (!fecha) return false;
        const pedidoId = cvs(r, pedidosTable, FIELD_IDS.PEDIDO_ID).toLowerCase();
        const numeroNota = cvs(r, pedidosTable, FIELD_IDS.NUMERO_NOTA).toLowerCase();
        const cliente = cvs(r, pedidosTable, FIELD_IDS.CLIENTE).toLowerCase();
        const telefono = cvs(r, pedidosTable, FIELD_IDS.NUMERO_TELEFONO).toLowerCase();
        return pedidoId.includes(queryLower) || numeroNota.includes(queryLower) || cliente.includes(queryLower) ||
          telefono.includes(queryLower) || formatFriendlyDateTime(fecha).toLowerCase().includes(queryLower);
      })
      .sort((a, b) => {
        const ta = cv(a, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        const tb = cv(b, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        if (!ta) return 1; if (!tb) return -1;
        return new Date(tb).getTime() - new Date(ta).getTime();
      })
      .slice(0, 10);
    setSearchResults(matches);
    setActiveSearchIdx(0);
    setShowSearchDropdown(matches.length > 0);
  }, [searchQuery, pedidoRecords, pedidosTable, hiddenPedidoIds]);

  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return pedidoRecords.find((r) => r.id === selectedRecordId) ?? null;
  }, [selectedRecordId, pedidoRecords]);

  const navCalendar = useCallback((dir: number) => {
    setCalendarDate((d) => {
      if (view === 'mes') return new Date(d.getFullYear(), d.getMonth() + dir, 1);
      if (view === 'semana') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir * 7);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir);
    });
  }, [view]);

  const isCurrentPeriod = useMemo(() => {
    const n = new Date();
    if (view === 'dia') return formatDateForComparison(calendarDate) === formatDateForComparison(n);
    if (view === 'mes') return calendarDate.getFullYear() === n.getFullYear() && calendarDate.getMonth() === n.getMonth();
    const dow = (n.getDay() + 6) % 7;
    const nowWs = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow).getTime();
    const cdow = (calendarDate.getDay() + 6) % 7;
    const calWs = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - cdow).getTime();
    return nowWs === calWs;
  }, [calendarDate, view]);

  const dateLabel = useMemo(() => {
    if (view === 'dia') return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(calendarDate);
    if (view === 'mes') return MONTHS_ES[calendarDate.getMonth()]! + ' ' + calendarDate.getFullYear();
    const dow = (calendarDate.getDay() + 6) % 7;
    const ws = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - dow);
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
    const sm = we.toLocaleString('es-MX', { month: 'short' });
    if (ws.getMonth() === we.getMonth()) return ws.getDate() + ' - ' + we.getDate() + ' ' + sm + ' ' + we.getFullYear();
    const sm2 = ws.toLocaleString('es-MX', { month: 'short' });
    return ws.getDate() + ' ' + sm2 + ' - ' + we.getDate() + ' ' + sm + ' ' + we.getFullYear();
  }, [calendarDate, view]);

  const currentPeriodLabel = view === 'dia' ? 'Hoy' : 'Actual';

  const handleDatePickerSelect = useCallback((d: Date | null) => {
    if (!d) return;
    if (view === 'semana') {
      const snapped = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
      setCalendarDate(snapped);
    } else {
      setCalendarDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    setShowDatePicker(false);
  }, [view]);

  // The toolbar renders right away; only the content waits for data.
  const dataLoading = baseLoading || (pedidosLoading && pedidoRecords.length === 0);
  const dataError = !dataLoading && (baseError || !base || !pedidosTable);

  const navBtnCls = 'h-10 w-10 flex-shrink-0 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 transition-colors flex items-center justify-center';

  const searchDropdown = showSearchDropdown && searchResults.length > 0 ? (
    <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 z-50 bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden sm:w-[380px] sm:max-w-[90vw] max-h-[300px] overflow-y-auto dark:bg-[#251D1F] dark:border-[#382C2E]">
      {searchResults.map((r, idx) => {
        const pid = cvs(r, pedidosTable, FIELD_IDS.PEDIDO_ID) || 'Sin ID';
        const telefono = cvs(r, pedidosTable, FIELD_IDS.NUMERO_TELEFONO);
        const fecha = cv(r, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
        return (
          <button key={r.id} type="button" ref={(el: any) => { if (el && idx === activeSearchIdx) el.scrollIntoView?.({ block: 'nearest' }); }} onMouseEnter={() => setActiveSearchIdx(idx)} onClick={() => { setSelectedRecordId(r.id); setShowSearchDropdown(false); setSearchQuery(''); setMobileSearchOpen(false); }}
            className={`w-full text-left px-4 py-2 hover:bg-rose-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer dark:hover:bg-white/5 dark:border-white/5 ${idx === activeSearchIdx ? 'bg-rose-50 dark:bg-white/5' : ''}`}
            >
            <div className="font-medium text-base text-gray-900 dark:text-gray-100">{toTitleCase(pid)}</div>
            {telefono && <div className="text-sm text-gray-600 dark:text-gray-400">{telefono}</div>}
            <div className="text-sm text-gray-500 dark:text-gray-500">{formatFriendlyDateTime(fecha)}</div>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="h-screen overflow-hidden font-sans antialiased bg-[#F8F2F2] dark:bg-[#1B1517] flex flex-col">
      <PageToolbar>
        {/* Search (unified: icon on mobile, expands flex-1 to the right when opened) */}
        <div ref={searchRef} className="relative order-2 sm:order-1 flex-1 min-w-0 sm:flex-none sm:w-56 lg:w-1/4">
          <button type="button" onClick={() => setMobileSearchOpen(true)} aria-label="Buscar pedido"
            className={`sm:hidden ${navBtnCls} ${mobileSearchOpen ? 'hidden' : ''}`}>
            <MagnifyingGlassIcon size={15} />
          </button>
          <div className={`relative ${mobileSearchOpen ? 'block' : 'hidden'} sm:block`}>
            <MagnifyingGlassIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
            <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              onKeyDown={(e: any) => {
                if (e.key === 'Escape') { setShowSearchDropdown(false); return; }
                if (!showSearchDropdown || searchResults.length === 0) { if (e.key === 'ArrowDown' && searchResults.length > 0) { e.preventDefault(); setShowSearchDropdown(true); } return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSearchIdx((i) => (i + 1) % searchResults.length); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSearchIdx((i) => (i - 1 + searchResults.length) % searchResults.length); }
                else if (e.key === 'Enter') { e.preventDefault(); const r = searchResults[activeSearchIdx]; if (r) { setSelectedRecordId(r.id); setShowSearchDropdown(false); setSearchQuery(''); setMobileSearchOpen(false); } }
              }}
              placeholder="Buscar pedido..." aria-label="Buscar pedido"
              className="pl-8 pr-3 h-10 w-full text-base bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:border-rose-600 dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-200 dark:placeholder-gray-600" />
            {searchDropdown}
          </div>
        </div>

        {/* Estatus filter */}
        <div className="order-6 sm:order-3 lg:order-3"><FilterDropdown label="" values={selectedEstatus} options={['Pendiente', 'Entregado']} onChange={setSelectedEstatus} /></div>

        {/* Fecha selector */}
        {view !== 'todos' && <div className="flex items-center gap-1.5 order-1 sm:order-2 lg:order-2">
          <button type="button" onClick={() => navCalendar(-1)} className={`hidden sm:flex ${navBtnCls}`} aria-label="Anterior"><CaretLeftIcon size={13} /></button>
          <div className="relative">
            {/* mobile icon trigger */}
            <button type="button" onClick={() => setShowDatePicker((o) => !o)} aria-label="Elegir fecha"
              className={`sm:hidden ${navBtnCls}`}><CalendarIcon size={15} /></button>
            {/* tablet/desktop label trigger */}
            <button type="button" onClick={() => setShowDatePicker((o) => !o)}
              className="hidden sm:flex text-base font-bold text-gray-700 dark:text-gray-200 select-none px-3 h-10 bg-white border border-gray-300 dark:bg-[#251D1F] dark:border-[#2E352C] rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-sans min-w-[150px] lg:min-w-[160px] text-center cursor-pointer items-center justify-center gap-2">
              {view === 'dia' && <CalendarIcon size={13} className="text-gray-400 flex-shrink-0" />}
              {dateLabel}
            </button>
            {showDatePicker && (view === 'dia' || view === 'semana') && (
              <MiniCalendar align="center" selectedDate={calendarDate} onSelectDate={handleDatePickerSelect} onClose={() => setShowDatePicker(false)} />
            )}
            {showDatePicker && view === 'mes' && (
              <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 z-[100]">
                <MonthYearSpinner initialMonth={calendarDate.getMonth()} initialYear={calendarDate.getFullYear()}
                  onConfirm={(d) => { setCalendarDate(d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
              </div>
            )}
          </div>
          <button type="button" onClick={() => navCalendar(1)} className={`hidden sm:flex ${navBtnCls}`} aria-label="Siguiente"><CaretRightIcon size={13} /></button>
          {!isCurrentPeriod && (
            <button type="button" onClick={() => setCalendarDate(new Date())}
              className="hidden sm:flex items-center px-3 h-10 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-300 font-sans">
              {currentPeriodLabel}
            </button>
          )}
        </div>}

        {/* Row break: between row1 and row2 (mobile after fecha-block group; tablet after fecha) */}
        <div className="basis-full h-0 order-5 sm:order-4 lg:hidden" />

        {/* Selector de periodo */}
        <div className="order-7 sm:order-5 lg:order-5 lg:ml-auto flex items-center gap-2">
          {view === 'dia' && (
            <button type="button" onClick={() => setDiaForma((f) => (f === 'lista' ? 'tablero' : 'lista'))}
              aria-label="Cambiar entre lista y tablero" title={diaForma === 'lista' ? 'Ver como tablero' : 'Ver como lista'}
              className="h-10 px-3 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-sans cursor-pointer whitespace-nowrap">
              {diaForma === 'lista' ? 'Lista' : 'Tablero'}
            </button>
          )}
          <PeriodSelect value={view} onChange={(v) => { setView(v); setShowDatePicker(false); }} />
        </div>

        {/* Nuevo pedido */}
        <button type="button" onClick={() => setShowNuevoPedido(true)} aria-label="Nuevo pedido"
          className="order-4 sm:order-7 lg:order-7 flex items-center gap-2 px-3 sm:px-4 h-10 rounded-xl text-white text-sm font-medium font-sans transition-colors bg-rose-600 hover:bg-rose-700 cursor-pointer dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700">
          <PlusIcon size={16} /><span className="hidden sm:inline">Nuevo pedido</span>
        </button>
      </PageToolbar>
      <div className="flex-1 min-h-0 mx-auto w-[90%] flex flex-col overflow-hidden pt-4">
      {dataLoading && !(view === 'todos' || (view === 'dia' && diaForma === 'tablero')) ? <div className="px-3 sm:px-5 lg:px-7 pb-6 flex-1 min-h-0 flex flex-col"><PedidosContentSkeleton /></div> : dataError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 dark:text-[#F5F3EF]">No se pudo cargar</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">{baseError?.message || 'No se encontró la tabla de pedidos.'}</p>
          </div>
        </div>
      ) : (<>
      {/* Keyed so switching Día / Semana / Mes fades the new layout in */}
      <div key={view} className="anim-view flex-1 min-h-0 flex flex-col">
      {view === 'todos' || (view === 'dia' && diaForma === 'tablero') ? (
        <TableroEtapas pedidos={pedidosTablero} loading={dataLoading} onOpen={(id) => setSelectedRecordId(id)} />
      ) : null}

      {view === 'dia' && diaForma === 'lista' && (
        <>
          <div className="px-4 sm:px-7 flex gap-3 overflow-x-auto pt-1.5 -mt-1.5 pb-3 mb-1.5 flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredPedidosDia.length === 0
              ? <p className="text-gray-400 text-sm py-3 dark:text-gray-600">No hay pedidos para este día.</p>
              : filteredPedidosDia.map((r) => {
                  const pid = cvs(r, pedidosTable, FIELD_IDS.PEDIDO_ID) || 'Sin ID';
                  const metodo = readSelect(cv(r, pedidosTable, FIELD_IDS.METODO_CONTACTO));
                  const telefono = cvs(r, pedidosTable, FIELD_IDS.NUMERO_TELEFONO);
                  const total = cv(r, pedidosTable, FIELD_IDS.COSTO_TOTAL) as number | null;
                  const estatus = readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS));
                  const sem = semaforo.pedido(r.id, estatus);
                  const semStyle = sem ? semaforoStyle(sem.nivel, 'suave', isDark) : null;
                  return (
                    <div key={r.id} onClick={() => setSelectedRecordId(r.id)}
                      style={semStyle ?? undefined}
                      className={`min-w-[220px] max-w-[240px] rounded-xl p-4 cursor-pointer flex-shrink-0 transition-all hover:shadow-md hover:-translate-y-0.5 ${semStyle ? '' : 'bg-white text-gray-900 dark:bg-[#251D1F] dark:text-gray-100'}`}>
                      <div className="font-bold text-base">{toTitleCase(pid)}</div>
                      {sem ? <div className="text-sm font-medium mt-0.5 opacity-90">{sem.etapa}</div> : semaforo.pendiente(r.id) ? <div aria-hidden className="mt-1.5 h-2.5 w-24 rounded-full bg-current opacity-20 animate-pulse" /> : null}
                      <div className="flex items-center gap-2 mt-2">
                        <ContactoPill value={metodo} />
                        <span className="text-sm opacity-75">{telefono || '—'}</span>
                      </div>
                      <div className="text-base font-semibold mt-2">{formatCurrency(total)}</div>
                    </div>
                  );
                })}
          </div>
          <div className="flex-1 min-h-0 px-4 sm:px-7 pb-5 flex flex-col overflow-hidden">
            <div className="max-h-full bg-white border border-[#E5E1DA] rounded-xl flex flex-col overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
              <div tabIndex={0} className="overflow-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10 dark:bg-[#2C2325] dark:border-white/10">
                    <tr>
                      {['Pedido', 'Estatus', 'Etapa', 'Impreso', 'Cake Topper', 'Total', 'Restante', 'Contacto', 'Teléfono'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-base font-semibold text-gray-700 whitespace-nowrap bg-gray-100 dark:bg-[#2C2325] dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPedidosDia.length === 0
                      ? <tr><td colSpan={9} className="px-8 py-8 text-center text-gray-400 text-base dark:text-gray-600">No hay pedidos para {dateLabel}.</td></tr>
                      : filteredPedidosDia.map((r) => {
                                  const pid = cvs(r, pedidosTable, FIELD_IDS.PEDIDO_ID) || 'Sin ID';
                          const metodo = readSelect(cv(r, pedidosTable, FIELD_IDS.METODO_CONTACTO));
                          const telefono = cvs(r, pedidosTable, FIELD_IDS.NUMERO_TELEFONO);
                          const total = cv(r, pedidosTable, FIELD_IDS.COSTO_TOTAL) as number | null;
                          const restanteV = cv(r, pedidosTable, FIELD_IDS.RESTANTE) as number | null;
                          const impresoV = cv(r, pedidosTable, FIELD_IDS.IMPRESO) as boolean | null;
                          const estatusV = readSelect(cv(r, pedidosTable, FIELD_IDS.ESTATUS));
                          const hasCakeTopper = readLinked(cv(r, pedidosTable, FIELD_IDS.CAKE_TOPPER)).length > 0;
                          const isSelected = r.id === selectedRecordId;
                          return (
                            <tr key={r.id} onClick={() => setSelectedRecordId(r.id)}
                              className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-rose-50 dark:border-white/5 dark:hover:bg-white/5 ${isSelected ? 'bg-rose-50 dark:bg-rose-600/10' : ''}`}>
                              <td className="px-3 py-3 text-base font-medium text-gray-900 dark:text-gray-100">{toTitleCase(pid)}</td>
                              <td className="px-3 py-3"><EstatusPill value={estatusV} /></td>
                              <td className="px-3 py-3">{(() => {
                                const sem = semaforo.pedido(r.id, estatusV);
                                return sem ? <EtapaChip nivel={sem.nivel} etapa={sem.etapa} /> : semaforo.pendiente(r.id) ? <span aria-hidden className="inline-block h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse align-middle" /> : <span className="text-gray-300 dark:text-gray-700">—</span>;
                              })()}</td>
                              <td className="px-3 py-3"><ImpresoPill value={impresoV} /></td>
                              <td className="px-3 py-3 text-base text-center">
                                {hasCakeTopper
                                  ? <span style={toneStyle('green', isDark)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium whitespace-nowrap">Incluye</span>
                                  : <span className="text-gray-300 dark:text-gray-700">—</span>}
                              </td>
                              <td className="px-3 py-3 text-base text-gray-800 dark:text-gray-200">{formatCurrency(total)}</td>
                              <td className="px-3 py-3 text-base text-gray-800 dark:text-gray-200">{formatCurrency(restanteV)}</td>
                              <td className="px-3 py-3"><ContactoPill value={metodo} /></td>
                              <td className="px-3 py-3 text-base text-gray-700 dark:text-gray-300">{telefono || '—'}</td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {(view === 'semana' || view === 'mes') && (
        <CalendarioView
          filteredPedidos={filteredPedidosCalendar}
          calendarDate={calendarDate}
          period={calendarPeriod}
          onRecordClick={(id) => setSelectedRecordId(id)}
          getFechaField={getFechaValue}
          getEstatusField={getEstatusValue}
          pedidosTable={pedidosTable}
          elementosTable={elementosTable}
          elementoRecords={elementoRecords}
          isSemana={view === 'semana'}
          semaforo={semaforo}
        />
      )}
      </div>
      </>)}
      </div>

      {selectedRecord && pedidosTable && (
        <PedidoDetailModal
          record={selectedRecord}
          pedidosTable={pedidosTable}
          elementosTable={elementosTable ?? undefined}
          cakeTopperTable={cakeTopperTable ?? undefined}
          elementoRecords={elementoRecords}
          cakeTopperRecords={cakeTopperRecords}
          catalogoProductos={catalogoProductos}
          catalogoPanes={catalogoPanes}
          catalogoRellenos={catalogoRellenos}
          hiddenElementoIds={hiddenElementoIds}
          onDeletePedido={(id) => { requestDelete('pedido', id); setSelectedRecordId(null); }}
          onDeleteElemento={(id) => requestDelete('elemento', id)}
          onClose={() => setSelectedRecordId(null)}
          onDataChange={onDataChange}
        />
      )}
      {showNuevoPedido && pedidosTable && (
        <NuevoPedidoModal pedidosTable={pedidosTable} onClose={(newRecordId) => { setShowNuevoPedido(false); if (newRecordId) { refetchPedidos(); refetchElementos(); setSelectedRecordId(newRecordId); } }} />
      )}

      {elDel.notice && (
        <div role="alert" className="fixed bottom-4 right-4 z-[130] w-80 max-w-[85vw] bg-white border border-rose-300 rounded-lg shadow-xl px-4 py-3 text-sm text-gray-800 dark:bg-[#251D1F] dark:border-rose-700 dark:text-gray-100 flex items-start gap-3">
          <span className="flex-1">{elDel.notice}</span>
          <button type="button" onClick={elDel.clearNotice} className="font-semibold text-rose-600 hover:underline">Cerrar</button>
        </div>
      )}
      {pendingDeletes.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[120] flex flex-col gap-2">
          {pendingDeletes.map((pd) => (
            <DeleteToast key={pd.key} label={pd.type === 'pedido' ? 'Pedido eliminado' : 'Elemento eliminado'} onUndo={() => undoDelete(pd.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteToast({ label, onUndo }: { label: string; onUndo: () => void }): React.ReactElement {
  return (
    <div className="w-72 max-w-[85vw] bg-white border border-[#E9D9D9] rounded-lg shadow-xl overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
        <button type="button" onClick={onUndo}
          className="text-sm font-semibold text-rose-600 hover:text-rose-600 hover:underline transition-colors dark:text-rose-600 dark:hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 rounded">
          Deshacer
        </button>
      </div>
      <div className="h-1 bg-gray-100 dark:bg-white/10">
        <div className="h-full bg-rose-600 origin-left" style={{ animation: 'toastProgress 10s linear forwards' }} />
      </div>
    </div>
  );
}

// Each page fades/slides in when you navigate between Pedidos and Producción.
function AnimatedRoutes(): React.ReactElement {
  const location = useLocation();
  const page = location.pathname.split('/')[1] || 'inicio';
  return (
    <div key={page} className="anim-page">
      <Routes location={location}>
        <Route path="/pedidos" element={<div id="pagina-pedidos" data-page-id="pagina-pedidos"><PedidosApp /></div>} />
        <Route path="/produccion" element={<div id="pagina-produccion" data-page-id="pagina-produccion"><ProduccionPage /></div>} />
        <Route path="/finanzas" element={<div id="pagina-finanzas" data-page-id="pagina-finanzas"><FinanzasPage /></div>} />
        <Route path="*" element={<div id="pagina-inicio" data-page-id="pagina-inicio"><LandingPage /></div>} />
      </Routes>
    </div>
  );
}

function App(): React.ReactElement {
  useThemeMode(); // apply the saved theme before any page (or skeleton) renders
  return (
    <BrowserRouter>
      <div className="h-screen flex overflow-hidden">
        <SideRail />
        <div className="flex-1 min-w-0"><AnimatedRoutes /></div>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
