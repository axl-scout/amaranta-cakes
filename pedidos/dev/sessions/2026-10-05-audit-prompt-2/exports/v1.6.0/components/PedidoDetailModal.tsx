import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Plus as PlusIcon, Trash as TrashIcon, DownloadSimple as DownloadIcon } from '@phosphor-icons/react';
import { useUpdateRecord, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, formatCurrency, formatFriendlyDate, formatDateForComparison, parseTypedDate, toTitleCase, readSelect, readLinked, buildDateTime, cv, cvs } from '../utils';
import { ReceiptDocument, type ReceiptData, type ReceiptVariant } from './ReceiptDocument';
import { ContactoPill, EstatusPill, EstatusDot } from './Pills';
import { toneStyle, useIsDark } from './airtableColors';
import { PagosSection } from '../finanzas/PagosSection';
import { MiniCalendar } from './Calendar';
import { CustomTimePicker } from './TimePicker';
import { type CatalogOption } from './Dropdowns';
import { NuevoElementoModal, EditElementoModal } from './ElementoModals';
import { ElementoDetalle } from '../produccion/ElementoDetalle';
import { PedidoTareasSection } from '../produccion/PedidoTareasSection';
import { CakeTopperDetailModal, NuevoCakeTopperModal } from './CakeTopperModals';

interface PedidoDetailModalProps {
  record: AirtableRecord;
  pedidosTable: Table;
  elementosTable: Table | undefined;
  cakeTopperTable: Table | undefined;
  elementoRecords: AirtableRecord[];
  cakeTopperRecords: AirtableRecord[];
  catalogoProductos: CatalogOption[];
  catalogoPanes: CatalogOption[];
  catalogoRellenos: CatalogOption[];
  hiddenElementoIds: Set<string>;
  onDeletePedido: (recordId: string) => void;
  onDeleteElemento: (recordId: string) => void;
  onClose: () => void;
  onDataChange: () => void;
}

export function PedidoDetailModal({
  record, pedidosTable, elementosTable, cakeTopperTable,
  elementoRecords, cakeTopperRecords,
  catalogoProductos, catalogoPanes, catalogoRellenos,
  hiddenElementoIds, onDeletePedido, onDeleteElemento,
  onClose, onDataChange,
}: PedidoDetailModalProps): React.ReactElement {
  const isDarkMode = useIsDark();
  const { mutate: updateRecord } = useUpdateRecord(pedidosTable);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDelete = () => { setShowDeleteConfirm(false); onDeletePedido(record.id); onClose(); };

  const notaRef = useRef<any>(null);
  const reciboRef = useRef<any>(null);
  const exportMenuRef = useRef<any>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const fechaValue = cv(record, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null;
  const initialFechaDate = fechaValue ? new Date(fechaValue) : null;
  const [fechaDate, setFechaDate] = useState<Date | null>(initialFechaDate);
  const [fechaDateDisplay, setFechaDateDisplay] = useState(initialFechaDate ? formatFriendlyDate(formatDateForComparison(initialFechaDate)) : '');
  const [fechaTime, setFechaTime] = useState(initialFechaDate ? `${String(initialFechaDate.getHours()).padStart(2, '0')}:${String(initialFechaDate.getMinutes()).padStart(2, '0')}` : '');
  const [showFechaCalendar, setShowFechaCalendar] = useState(false);
  const preventReopenFechaRef = useRef(false);
  const handleFechaCalendarClose = useCallback(() => { preventReopenFechaRef.current = true; setShowFechaCalendar(false); requestAnimationFrame(() => { preventReopenFechaRef.current = false; }); }, []);

  const fechaClienteValue = cv(record, pedidosTable, FIELD_IDS.FECHA_ENTREGA_CLIENTE) as string | null;
  const initialFechaClienteDate = fechaClienteValue ? new Date(fechaClienteValue) : null;
  const [fechaClienteDate, setFechaClienteDate] = useState<Date | null>(initialFechaClienteDate);
  const [fechaClienteDateDisplay, setFechaClienteDateDisplay] = useState(initialFechaClienteDate ? formatFriendlyDate(formatDateForComparison(initialFechaClienteDate)) : '');
  const [fechaClienteTime, setFechaClienteTime] = useState(initialFechaClienteDate ? `${String(initialFechaClienteDate.getHours()).padStart(2, '0')}:${String(initialFechaClienteDate.getMinutes()).padStart(2, '0')}` : '');
  const [showFechaClienteCalendar, setShowFechaClienteCalendar] = useState(false);
  const preventReopenFechaClienteRef = useRef(false);
  const handleFechaClienteCalendarClose = useCallback(() => { preventReopenFechaClienteRef.current = true; setShowFechaClienteCalendar(false); requestAnimationFrame(() => { preventReopenFechaClienteRef.current = false; }); }, []);

  const [estatus, setEstatus] = useState(readSelect(cv(record, pedidosTable, FIELD_IDS.ESTATUS)));
  const [showEstatusDropdown, setShowEstatusDropdown] = useState(false);
  const estatusRef = useRef<any>(null);

  const [impreso, setImpreso] = useState(Boolean(cv(record, pedidosTable, FIELD_IDS.IMPRESO)));


  const linkedElementos = readLinked(cv(record, pedidosTable, FIELD_IDS.ELEMENTOS));
  const matchedElementos = useMemo(() => {
    return linkedElementos.map((link) => elementoRecords.find((r) => r.id === link.id)).filter((r): r is AirtableRecord => r !== undefined && !hiddenElementoIds.has(r.id));
  }, [linkedElementos, elementoRecords, hiddenElementoIds]);

  const [editElementoRecord, setEditElementoRecord] = useState<AirtableRecord | null>(null);
  const [detailElementoId, setDetailElementoId] = useState<string | null>(null);

  const linkedCakeToppers = readLinked(cv(record, pedidosTable, FIELD_IDS.CAKE_TOPPER));
  const matchedCakeTopper = useMemo(() => {
    if (linkedCakeToppers.length === 0) return null;
    return cakeTopperRecords.find((r) => r.id === linkedCakeToppers[0]?.id) ?? null;
  }, [linkedCakeToppers, cakeTopperRecords]);

  const [showCakeTopperDetail, setShowCakeTopperDetail] = useState(false);
  const [showNuevoCakeTopper, setShowNuevoCakeTopper] = useState(false);
  const [showNuevoElemento, setShowNuevoElemento] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) onClose(); }; // nested pop-ups close first
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (estatusRef.current && !estatusRef.current.contains(e.target as Node)) setShowEstatusDropdown(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const saveField = useCallback((fieldId: string, value: unknown) => {
    updateRecord({ recordId: record.id, fields: { [fieldId]: value } }).then(() => onDataChange()).catch((err) => console.error(err));
  }, [updateRecord, record.id, onDataChange]);

  const saveFecha = (date: Date | null, time: string) => saveField(FIELD_IDS.FECHA_ENTREGA, buildDateTime(date, time));
  const saveFechaCliente = (date: Date | null, time: string) => saveField(FIELD_IDS.FECHA_ENTREGA_CLIENTE, buildDateTime(date, time));

  const handleFechaDateBlur = () => {
    if (!fechaDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaDateDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFecha(parsed, fechaTime); }
    else setFechaDateDisplay(fechaDate ? formatFriendlyDate(formatDateForComparison(fechaDate)) : '');
  };
  const handleFechaClienteDateBlur = () => {
    if (!fechaClienteDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaClienteDateDisplay);
    if (parsed) { setFechaClienteDate(parsed); setFechaClienteDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFechaCliente(parsed, fechaClienteTime); }
    else setFechaClienteDateDisplay(fechaClienteDate ? formatFriendlyDate(formatDateForComparison(fechaClienteDate)) : '');
  };

  const handleImpresoToggle = () => {
    const newVal = !impreso; setImpreso(newVal);
    updateRecord({ recordId: record.id, fields: { [FIELD_IDS.IMPRESO]: newVal } }).then(() => onDataChange()).catch((err) => { console.error(err); setImpreso(!newVal); });
  };

  const handleEstatusChange = (newValue: string) => {
    setEstatus(newValue); setShowEstatusDropdown(false);
    saveField(FIELD_IDS.ESTATUS, newValue);
  };

  const labelClasses = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
  const dateTimeBox = 'flex items-stretch bg-[#F7F2F2] border border-gray-300 rounded-lg transition-colors focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-200 dark:bg-[#1B1517] dark:border-[#382C2E] dark:focus-within:border-rose-600';
  const bareDateInput = 'bg-transparent w-full border-0 px-3 py-2 text-base text-gray-900 outline-none dark:text-gray-100';

  const costoTotal = cv(record, pedidosTable, FIELD_IDS.COSTO_TOTAL) as number | null;
  const restante = cv(record, pedidosTable, FIELD_IDS.RESTANTE) as number | null;
  const anticipoValue = cv(record, pedidosTable, FIELD_IDS.ANTICIPO) as number | null;
  const metodoContacto = readSelect(cv(record, pedidosTable, FIELD_IDS.METODO_CONTACTO));
  const telefono = cvs(record, pedidosTable, FIELD_IDS.NUMERO_TELEFONO);
  const pedidoId = cvs(record, pedidosTable, FIELD_IDS.PEDIDO_ID) || 'Sin ID';

  const receiptData: ReceiptData = useMemo(() => {
    const fechaVal = (cv(record, pedidosTable, FIELD_IDS.FECHA_ENTREGA_CLIENTE) as string | null)
      || (cv(record, pedidosTable, FIELD_IDS.FECHA_ENTREGA) as string | null);
    const fechaFmt = fechaVal ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(fechaVal)) : '—';
    const horaFmt = fechaVal ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(fechaVal)) : '—';
    return {
      pedidoId: toTitleCase(pedidoId),
      cliente: cvs(record, pedidosTable, FIELD_IDS.CLIENTE),
      nota: cvs(record, pedidosTable, FIELD_IDS.NUMERO_NOTA),
      telefono,
      redSocial: metodoContacto,
      fecha: fechaFmt,
      hora: horaFmt,
      elementos: matchedElementos.map((el) => {
        const cant = cv(el, elementosTable, FIELD_IDS.EL_CANTIDAD) as number | null;
        return {
          cantidad: cant !== null ? String(cant) : '',
          titulo: cvs(el, elementosTable, FIELD_IDS.EL_NOMBRE),
          descripcion: cvs(el, elementosTable, FIELD_IDS.EL_DESCRIPCION),
          pan: readLinked(cv(el, elementosTable, FIELD_IDS.EL_PAN))[0]?.name ?? '',
          relleno: readLinked(cv(el, elementosTable, FIELD_IDS.EL_RELLENO))[0]?.name ?? '',
          total: formatCurrency(cv(el, elementosTable, FIELD_IDS.EL_COSTO_TOTAL) as number | null),
        };
      }),
      total: formatCurrency(costoTotal),
      anticipo: formatCurrency(anticipoValue),
      liquidado: formatCurrency(cv(record, pedidosTable, FIELD_IDS.LIQUIDADO) as number | null),
      restante: formatCurrency(restante),
      estatus,
      cakeTopper: matchedCakeTopper ? toTitleCase(cvs(matchedCakeTopper, cakeTopperTable, FIELD_IDS.CT_NOMBRE)) : '',
    };
  }, [record, pedidosTable, elementosTable, cakeTopperTable, matchedElementos, matchedCakeTopper, pedidoId, telefono, metodoContacto, costoTotal, restante, anticipoValue, estatus]);

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExport = async (docType: ReceiptVariant, format: 'pdf' | 'png') => {
    setShowExportMenu(false);
    const el = docType === 'nota' ? notaRef.current : reciboRef.current;
    if (!el) return;
    setExporting(`${docType}-${format}`);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, width: el.scrollWidth, height: el.scrollHeight });
      const fileBase = `${docType === 'nota' ? 'Nota' : 'Recibo'} - ${receiptData.pedidoId}`;
      if (format === 'png') {
        downloadDataUrl(canvas.toDataURL('image/png'), `${fileBase}.png`);
      } else {
        const { jsPDF } = await import('jspdf');
        const pdfWmm = 210;
        const pdfHmm = (canvas.height / canvas.width) * pdfWmm;
        const pdf = new jsPDF({ orientation: pdfWmm > pdfHmm ? 'landscape' : 'portrait', unit: 'mm', format: [pdfWmm, pdfHmm] });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfWmm, pdfHmm);
        pdf.save(`${fileBase}.pdf`);
      }
    } catch (err) {
      console.error('Error al exportar el detalle:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(3px)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-white w-full h-full max-w-none min-w-0 rounded-none sm:w-[80vw] sm:min-w-[560px] sm:max-w-[80vw] sm:h-[90vh] sm:rounded-2xl lg:w-[60vw] lg:max-w-[60vw] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-2xl text-gray-900 dark:text-[#F5F3EF]">{toTitleCase(pedidoId)}</h2>
            <div className="flex items-center gap-2 min-w-0">
              <ContactoPill value={metodoContacto} large />
              <span className="text-base text-gray-700 dark:text-gray-300 truncate">{telefono || '—'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative" ref={exportMenuRef}>
              <button type="button" onClick={() => setShowExportMenu((o) => !o)} disabled={exporting !== null} aria-label="Descargar detalle" aria-haspopup="menu" aria-expanded={showExportMenu}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer dark:text-gray-500 dark:hover:text-rose-600 dark:hover:bg-rose-600/10 disabled:opacity-50">
                {exporting !== null
                  ? <span className="block h-[18px] w-[18px] rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" role="status" aria-label="Generando" />
                  : <DownloadIcon size={18} />}
              </button>
              {showExportMenu && (
                <div role="menu" className="absolute top-full right-0 mt-1 z-[75] w-44 bg-white border border-[#E9D9D9] rounded-lg shadow-lg py-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                  <button type="button" role="menuitem" onClick={() => handleExport('nota', 'pdf')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-white/5">Nota en PDF</button>
                  <button type="button" role="menuitem" onClick={() => handleExport('recibo', 'pdf')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-white/5">Recibo en PDF</button>
                  <button type="button" role="menuitem" onClick={() => handleExport('recibo', 'png')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-white/5">Recibo en PNG</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="grid grid-cols-3 gap-x-4 gap-y-4 mb-5 items-start">
            <div className="min-w-0">
              <span className={labelClasses}>Estatus</span>
              <div className="relative" ref={estatusRef}>
                <button type="button" onClick={() => setShowEstatusDropdown((o) => !o)} className="cursor-pointer rounded-full hover:opacity-85 transition-opacity">
                  <EstatusPill value={estatus} large />
                </button>
                {showEstatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#E9D9D9] rounded-lg shadow-lg overflow-hidden p-1 dark:bg-[#251D1F] dark:border-[#382C2E]">
                    {['Pendiente', 'Entregado'].map((opt) => (
                      <button key={opt} type="button" onClick={() => handleEstatusChange(opt)}
                        className="w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 dark:text-gray-300">
                        <EstatusDot value={opt} />{opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <span className={labelClasses}>Impresión</span>
              <button type="button" onClick={impreso ? undefined : handleImpresoToggle}
                style={toneStyle(impreso ? 'green' : 'red', isDarkMode)}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base font-semibold transition-opacity ${impreso ? 'cursor-default' : 'cursor-pointer hover:opacity-85'}`}>
                {impreso ? (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Impreso</>) : 'Sin imprimir'}
              </button>
            </div>
            <div className="min-w-0">
              <span className={labelClasses}>Cake Topper</span>
              {matchedCakeTopper ? (
                <button type="button" onClick={() => setShowCakeTopperDetail(true)}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-base font-semibold bg-white text-gray-700 border border-[#E9D9D9] hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer whitespace-nowrap dark:bg-[#251D1F] dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">
                  {toTitleCase(cvs(matchedCakeTopper, cakeTopperTable, FIELD_IDS.CT_NOMBRE) || 'Sin nombre')}
                </button>
              ) : (
                <button type="button" onClick={() => setShowNuevoCakeTopper(true)} disabled={!cakeTopperTable} aria-label="Agregar cake topper"
                  className="w-9 h-9 border border-[#E9D9D9] rounded-lg text-gray-500 hover:border-rose-600 hover:text-rose-600 transition-colors flex items-center justify-center dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-600 dark:hover:text-rose-600 disabled:opacity-50"><PlusIcon size={16} /></button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-5">
          <div className="min-w-0">
            <span className={labelClasses}>Fecha de entrega de producción</span>
            <div className={dateTimeBox}>
              <div className="relative flex-1 min-w-0">
                <input type="text" value={fechaDateDisplay} onChange={(e: any) => setFechaDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaRef.current) setShowFechaCalendar(true); }}
                  onBlur={handleFechaDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${bareDateInput} pr-9`} />
                <button type="button" onClick={() => setShowFechaCalendar((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                {showFechaCalendar && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaDate(d); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaCalendar(false); saveFecha(d, fechaTime); }} onClose={handleFechaCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0 border-l border-gray-300 dark:border-[#382C2E]">
                <CustomTimePicker bare value={fechaTime} onChange={(time) => { setFechaTime(time); saveFecha(fechaDate, time); }} />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <span className={labelClasses}>Fecha de entrega al cliente</span>
            <div className={dateTimeBox}>
              <div className="relative flex-1 min-w-0">
                <input type="text" value={fechaClienteDateDisplay} onChange={(e: any) => setFechaClienteDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaClienteRef.current) setShowFechaClienteCalendar(true); }}
                  onBlur={handleFechaClienteDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${bareDateInput} pr-9`} />
                <button type="button" onClick={() => setShowFechaClienteCalendar((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                {showFechaClienteCalendar && <MiniCalendar selectedDate={fechaClienteDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaClienteDate(d); setFechaClienteDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaClienteCalendar(false); saveFechaCliente(d, fechaClienteTime); }} onClose={handleFechaClienteCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0 border-l border-gray-300 dark:border-[#382C2E]">
                <CustomTimePicker bare value={fechaClienteTime} onChange={(time) => { setFechaClienteTime(time); saveFechaCliente(fechaClienteDate, time); }} />
              </div>
            </div>
          </div>
          </div>
          <hr className="mb-5 border-0 border-t border-[#E9D9D9] dark:border-[#382C2E]" />
          <div className="mb-5">
            <span className={labelClasses}>Elementos</span>
            <div className="w-full rounded-xl border border-[#E5E1DA] overflow-x-auto dark:border-[#382C2E] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full min-w-[480px]">
                <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
                  <tr>
                    {['Nombre', 'Descripción', 'Cantidad', 'Costo Unit.', 'Total'].map((h) => (
                      <th key={h} className="px-3 py-2 text-sm font-semibold text-gray-700 text-left dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchedElementos.length === 0
                    ? <tr><td colSpan={5} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Sin elementos.</td></tr>
                    : matchedElementos.map((el) => {
                        const elNombre = cvs(el, elementosTable, FIELD_IDS.EL_NOMBRE);
                        const descripcion = cvs(el, elementosTable, FIELD_IDS.EL_DESCRIPCION);
                        const total = cv(el, elementosTable, FIELD_IDS.EL_COSTO_TOTAL) as number | null;
                        const cantidad = cv(el, elementosTable, FIELD_IDS.EL_CANTIDAD) as number | null;
                        const costoUnit = cv(el, elementosTable, FIELD_IDS.EL_COSTO_UNITARIO) as number | null;
                        return (
                          <tr key={el.id} onClick={() => setDetailElementoId(el.id)}
                            className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5" title="Clic para ver detalle">
                            <td className="px-3 py-2 text-base text-gray-700 dark:text-gray-300">{elNombre}</td>
                            <td className="px-3 py-2 text-base text-gray-700 max-w-[160px] dark:text-gray-300"><span className="line-clamp-2">{descripcion || '—'}</span></td>
                            <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{cantidad ?? '—'}</td>
                            <td className="px-3 py-2 text-base text-gray-700 tabular-nums dark:text-gray-300">{costoUnit !== null ? formatCurrency(costoUnit) : '—'}</td>
                            <td className="px-3 py-2 text-base font-medium text-gray-700 tabular-nums dark:text-gray-300">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
            {elementosTable && (
              <button type="button" onClick={() => setShowNuevoElemento(true)} aria-label="Agregar elemento"
                className="mt-2 w-8 h-8 flex items-center justify-center bg-white border border-[#E9D9D9] rounded-lg text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors dark:bg-[#251D1F] dark:border-[#382C2E] dark:text-gray-500 dark:hover:border-rose-600 dark:hover:text-rose-600"><PlusIcon size={16} /></button>
            )}
          </div>
          <hr className="mb-5 border-0 border-t border-[#E9D9D9] dark:border-[#382C2E]" />
          <div className="mb-5">
            <span className={labelClasses}>Pagos</span>
            <PagosSection record={record} pedidosTable={pedidosTable} onDataChange={onDataChange} />
          </div>
          <hr className="mb-5 border-0 border-t border-[#E9D9D9] dark:border-[#382C2E]" />
          <div className="mb-5">
            <span className={labelClasses}>Producción</span>
            <PedidoTareasSection pedidoId={record.id} pedidoLabel={toTitleCase(pedidoId)} />
          </div>
        </div>
        <button type="button" onClick={() => setShowDeleteConfirm(true)} aria-label="Eliminar pedido"
          className="absolute bottom-4 right-4 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-rose-600 text-white shadow-lg hover:bg-rose-700 active:bg-rose-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
          <TrashIcon size={18} />
        </button>
      </div>
      {/* Off-screen documents used for PDF/PNG capture */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        <ReceiptDocument ref={notaRef} data={receiptData} variant="nota" />
        <ReceiptDocument ref={reciboRef} data={receiptData} variant="recibo" />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e: any) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl p-5 dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#F5F3EF]">¿Eliminar pedido?</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Se eliminará <span className="font-medium text-gray-700 dark:text-gray-300">{toTitleCase(pedidoId)}</span>. Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">Cancelar</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 text-base font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {showCakeTopperDetail && matchedCakeTopper && cakeTopperTable && (
        <CakeTopperDetailModal record={matchedCakeTopper} cakeTopperTable={cakeTopperTable} onClose={() => setShowCakeTopperDetail(false)} onSaved={onDataChange} />
      )}
      {showNuevoCakeTopper && cakeTopperTable && (
        <NuevoCakeTopperModal pedidoRecordId={record.id} cakeTopperTable={cakeTopperTable} onClose={() => setShowNuevoCakeTopper(false)} onSaved={onDataChange} />
      )}
      {showNuevoElemento && elementosTable && (
        <NuevoElementoModal pedidoRecordId={record.id} elementosTable={elementosTable}
          catalogoProductos={catalogoProductos} catalogoPanes={catalogoPanes} catalogoRellenos={catalogoRellenos}
          onClose={() => setShowNuevoElemento(false)} onSaved={onDataChange} />
      )}
      {detailElementoId && (
        <ElementoDetalle elementoId={detailElementoId} reloadToken={matchedElementos}
          onClose={() => setDetailElementoId(null)}
          onEdit={() => { const r = matchedElementos.find((x) => x.id === detailElementoId); if (r) setEditElementoRecord(r); }} />
      )}
      {editElementoRecord && elementosTable && (
        <EditElementoModal record={editElementoRecord} elementosTable={elementosTable}
          catalogoProductos={catalogoProductos} catalogoPanes={catalogoPanes} catalogoRellenos={catalogoRellenos}
          onDelete={(id) => onDeleteElemento(id)}
          onClose={() => setEditElementoRecord(null)} onSaved={onDataChange} />
      )}
    </div>
  );
}
