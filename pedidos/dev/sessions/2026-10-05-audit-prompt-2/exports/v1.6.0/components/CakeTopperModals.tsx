import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraft, clearDraft } from './useDraft';
import { X as XIcon, Calendar as CalendarIcon, UploadSimple as UploadIcon } from '@phosphor-icons/react';
import { useCreateRecord, useUpdateRecord, useUploadAttachment, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, formatFriendlyDate, formatDateForComparison, parseTypedDate, toTitleCase, buildDateTime, cv, cvs } from '../utils';
import { MiniCalendar } from './Calendar';
import { CustomTimePicker } from './TimePicker';

const labelCls = 'text-sm text-gray-400 mb-2 block dark:text-gray-500';
const inputCls = 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600';
const req = <span className="text-rose-600 normal-case tracking-normal">*</span>;

// ─── Editar Cake Topper existente ─────────────────────────────────────────────
export function CakeTopperDetailModal({ record, cakeTopperTable, onClose, onSaved }: {
  record: AirtableRecord; cakeTopperTable: Table; onClose: () => void; onSaved: () => void;
}): React.ReactElement {
  const { mutate: updateRecord } = useUpdateRecord(cakeTopperTable);
  const [nombre, setNombre] = useState(cvs(record, cakeTopperTable, FIELD_IDS.CT_NOMBRE));
  const fechaRaw = cv(record, cakeTopperTable, FIELD_IDS.CT_FECHA) as string | null;
  const initFechaDate = fechaRaw ? new Date(fechaRaw) : null;
  const [fechaDate, setFechaDate] = useState<Date | null>(initFechaDate);
  const [fechaDateDisplay, setFechaDateDisplay] = useState(initFechaDate ? formatFriendlyDate(formatDateForComparison(initFechaDate)) : '');
  const [fechaTime, setFechaTime] = useState(initFechaDate ? `${String(initFechaDate.getHours()).padStart(2, '0')}:${String(initFechaDate.getMinutes()).padStart(2, '0')}` : '');
  const [showFechaCalendar, setShowFechaCalendar] = useState(false);
  const preventReopenFechaRef = useRef(false);
  const handleFechaCalendarClose = useCallback(() => { preventReopenFechaRef.current = true; setShowFechaCalendar(false); requestAnimationFrame(() => { preventReopenFechaRef.current = false; }); }, []);
  const costoRaw = cv(record, cakeTopperTable, FIELD_IDS.CT_COSTO) as number | null;
  const [medidas, setMedidas] = useState(cvs(record, cakeTopperTable, FIELD_IDS.CT_MEDIDAS));
  const [costo, setCosto] = useState(costoRaw !== null ? String(costoRaw) : '');
  const referencias = (cv(record, cakeTopperTable, FIELD_IDS.CT_REFERENCIA) as any[]) || [];
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const saveField = useCallback((fieldId: string, value: unknown) => {
    updateRecord({ recordId: record.id, fields: { [fieldId]: value } }).then(() => onSaved()).catch((err) => console.error(err));
  }, [updateRecord, record.id, onSaved]);

  const saveFecha = useCallback((date: Date | null, time: string) => {
    saveField(FIELD_IDS.CT_FECHA, buildDateTime(date, time));
  }, [saveField]);

  const handleFechaDateBlur = () => {
    if (!fechaDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaDateDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); saveFecha(parsed, fechaTime); }
    else setFechaDateDisplay(fechaDate ? formatFriendlyDate(formatDateForComparison(fechaDate)) : '');
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[500px] h-[90vh] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-start justify-between">
          <div>
            <h2 className="font-bold text-2xl text-gray-900 dark:text-[#F5F3EF]">Detalles de Cake Topper</h2>
            <p className="text-2xl font-normal text-gray-700 mt-0.5 dark:text-gray-400">{toTitleCase(nombre) || 'Sin nombre'}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <span className={labelCls}>Nombre</span>
            <input type="text" value={nombre} onChange={(e: any) => setNombre(e.target.value)} onBlur={() => saveField(FIELD_IDS.CT_NOMBRE, nombre.trim() || null)} placeholder="Nombre del cake topper..." className={inputCls} />
          </div>
          <div className="mb-5 w-full">
            <span className={labelCls}>Fecha de entrega de producción</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaDateDisplay} onChange={(e: any) => setFechaDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaRef.current) setShowFechaCalendar(true); }}
                  onBlur={handleFechaDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowFechaCalendar((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                {showFechaCalendar && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaDate(d); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaCalendar(false); saveFecha(d, fechaTime); }} onClose={handleFechaCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0">
                <CustomTimePicker value={fechaTime} onChange={(time) => { setFechaTime(time); saveFecha(fechaDate, time); }} />
              </div>
            </div>
          </div>
          <div className="mb-5">
            <span className={labelCls}>Medidas</span>
            <textarea value={medidas} onChange={(e: any) => setMedidas(e.target.value)} onBlur={() => saveField(FIELD_IDS.CT_MEDIDAS, medidas.trim() || null)} placeholder="Medidas y especificaciones..." rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div className="mb-5">
            <span className={labelCls}>Costo</span>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
              <input type="number" min="0" step="0.01" value={costo} onChange={(e: any) => setCosto(e.target.value)} onBlur={() => saveField(FIELD_IDS.CT_COSTO, parseFloat(costo) || null)} placeholder="0.00" className={`${inputCls} pl-7`} />
            </div>
          </div>
          {referencias.length > 0 && (
            <div className="mb-5">
              <span className={labelCls}>Referencia</span>
              <div className="flex flex-wrap gap-2">
                {referencias.map((att) => {
                  const isImg = (att?.type || '').startsWith('image');
                  const thumb = att?.thumbnails?.large?.url || att?.url;
                  const full = att?.thumbnails?.full?.url || att?.url;
                  return isImg ? (
                    <button key={att.id} type="button" onClick={() => setLightboxUrl(full)} aria-label={att.filename || 'Ver referencia'}
                      className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-rose-600 transition dark:border-[#382C2E]">
                      <img src={thumb} alt={att.filename || 'referencia'} className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
                      className="h-20 px-3 flex items-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-rose-200 dark:border-[#382C2E] dark:text-gray-300">
                      {att.filename || 'archivo'}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {lightboxUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Referencia" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e: any) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Nuevo Cake Topper EN LA MISMA PÁGINA (reemplaza el formulario externo) ────
export function NuevoCakeTopperModal({ pedidoRecordId, cakeTopperTable, onClose, onSaved }: {
  pedidoRecordId: string; cakeTopperTable: Table; onClose: () => void; onSaved: () => void;
}): React.ReactElement {
  const { mutate: createRecord } = useCreateRecord(cakeTopperTable);
  const { mutate: uploadAttachment } = useUploadAttachment(cakeTopperTable);
  const [files, setFiles] = useState<File[]>([]);
  // Typed values survive closing the form (attachments can't be kept and must be added again).
  const K = `nuevoCakeTopper:${pedidoRecordId}`;
  const [nombre, setNombre] = useDraft(K, 'nombre', '');
  const [fechaIso, setFechaIso] = useDraft<string | null>(K, 'fecha', null);
  const fechaDate = fechaIso ? new Date(fechaIso) : null;
  const setFechaDate = (d: Date | null) => setFechaIso(d ? d.toISOString() : null);
  const [fechaDateDisplay, setFechaDateDisplay] = useDraft(K, 'fechaDisplay', '');
  const [fechaTime, setFechaTime] = useDraft(K, 'fechaTime', '');
  const [showFechaCalendar, setShowFechaCalendar] = useState(false);
  const preventReopenFechaRef = useRef(false);
  const handleFechaCalendarClose = useCallback(() => { preventReopenFechaRef.current = true; setShowFechaCalendar(false); requestAnimationFrame(() => { preventReopenFechaRef.current = false; }); }, []);
  const [medidas, setMedidas] = useDraft(K, 'medidas', '');
  const [costo, setCosto] = useDraft(K, 'costo', '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const handleFechaDateBlur = () => {
    if (!fechaDateDisplay.trim()) return;
    const parsed = parseTypedDate(fechaDateDisplay);
    if (parsed) { setFechaDate(parsed); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(parsed))); }
    else setFechaDateDisplay(fechaDate ? formatFriendlyDate(formatDateForComparison(fechaDate)) : '');
  };

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido.'); return; }
    if (!fechaDate || !fechaTime) { setError('La fecha y hora de entrega son requeridas.'); return; }
    if (!medidas.trim()) { setError('Las medidas son requeridas.'); return; }
    if (!costo.trim()) { setError('El costo es requerido.'); return; }
    if (files.length === 0) { setError('Sube al menos un archivo de referencia.'); return; }
    setSaving(true); setError('');
    try {
      const fields: { [key: string]: unknown } = {};
      fields[FIELD_IDS.CT_NOMBRE] = nombre.trim();
      fields[FIELD_IDS.CT_PEDIDOS] = [pedidoRecordId];
      fields[FIELD_IDS.CT_FECHA] = buildDateTime(fechaDate, fechaTime);
      fields[FIELD_IDS.CT_MEDIDAS] = medidas.trim();
      fields[FIELD_IDS.CT_COSTO] = parseFloat(costo) || null;
      const created = await createRecord(fields);
      if (created) {
        for (const file of files) {
          await uploadAttachment({ recordId: created.id, fieldIdOrName: FIELD_IDS.CT_REFERENCIA, file });
        }
      }
      clearDraft(K);
      onSaved();
      onClose();
    } catch (err) { console.error('Error al crear cake topper:', err); setError('Ocurrió un error. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl dark:bg-[#251D1F]" onClick={(e: any) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <h2 className="font-bold text-2xl text-gray-900 dark:text-[#F5F3EF]">Nuevo Cake Topper</h2>
          <p className="text-sm text-gray-400 mt-0.5 dark:text-gray-500">Se agregará a este pedido</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <span className={labelCls}>Nombre {req}</span>
            <input type="text" value={nombre} onChange={(e: any) => { setNombre(e.target.value); if (error) setError(''); }} placeholder="Nombre del cake topper..." className={inputCls} />
          </div>
          <div className="mb-5 w-full">
            <span className={labelCls}>Fecha de entrega de producción {req}</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={fechaDateDisplay} onChange={(e: any) => setFechaDateDisplay(e.target.value)}
                  onClick={() => { if (!preventReopenFechaRef.current) setShowFechaCalendar(true); }}
                  onBlur={handleFechaDateBlur} placeholder="ej. 26 de mayo de 2026" className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowFechaCalendar((o) => !o)} aria-label="Abrir calendario" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors dark:text-gray-500 dark:hover:text-rose-600"><CalendarIcon size={15} /></button>
                {showFechaCalendar && <MiniCalendar selectedDate={fechaDate ?? new Date()} onSelectDate={(date) => { const d = new Date(date); setFechaDate(d); setFechaDateDisplay(formatFriendlyDate(formatDateForComparison(d))); setShowFechaCalendar(false); }} onClose={handleFechaCalendarClose} />}
              </div>
              <div className="w-28 flex-shrink-0">
                <CustomTimePicker value={fechaTime} onChange={setFechaTime} />
              </div>
            </div>
          </div>
          <div className="mb-5">
            <span className={labelCls}>Medidas {req}</span>
            <textarea value={medidas} onChange={(e: any) => setMedidas(e.target.value)} placeholder="Medidas y especificaciones..." rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div className="mb-5">
            <span className={labelCls}>Costo {req}</span>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none dark:text-gray-600">$</span>
              <input type="number" min="0" step="0.01" value={costo} onChange={(e: any) => setCosto(e.target.value)} placeholder="0.00" className={`${inputCls} pl-7`} />
            </div>
          </div>
          <div className="mb-5">
            <span className={labelCls}>Referencia {req}</span>
            <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg py-5 px-3 text-center cursor-pointer hover:border-rose-600 hover:bg-rose-50/50 transition-colors dark:border-[#382C2E] dark:hover:border-rose-600 dark:hover:bg-white/5">
              <UploadIcon size={20} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Toca para subir imágenes o archivos</span>
              <input type="file" multiple accept="image/*,.pdf" className="hidden"
                onChange={(e: any) => { const sel = Array.from(e.target.files || []) as File[]; setFiles((prev) => [...prev, ...sel]); if (error) setError(''); e.target.value = ''; }} />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 dark:bg-white/5 dark:border-[#382C2E]">
                    <span className="text-sm text-gray-700 truncate dark:text-gray-300">{f.name}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Quitar archivo" className="text-gray-400 hover:text-rose-600 flex-shrink-0 dark:text-gray-500"><XIcon size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-600">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-[#E9D9D9] dark:border-[#382C2E] flex items-center justify-end gap-3">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-md bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            {saving ? 'Guardando...' : 'Agregar cake topper'}
          </button>
        </div>
      </div>
    </div>
  );
}
