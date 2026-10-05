import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEscClose } from '../lib/escStack';
import { Trash as TrashIcon, Scissors as ScissorsIcon } from '@phosphor-icons/react';
import { useCreateRecord, useUpdateRecord, type Table } from '../lib/airtable-hooks';
import { TAREAS, ETAPAS, ESTATUS_TAREA, type Etapa, fmtInt, toKey } from './constants';
import type { Emp, Order, OrderStats, Task } from './useProduccionData';
import { DateField } from '../components/DateField';
import { DateRangeScope, RangeTrigger, PAST_DUE_MSG } from '../components/DateRange';
import { InfoTip } from '../components/InfoTip';
import { FieldSelect } from '../components/Dropdowns';
import { taskPace, PacePill } from './pace';
import { prevEnd, cascade, type SeqItem } from './seqDates';
import { useDraft, clearDraft } from '../components/useDraft';

export type TaskModalMode =
  | { kind: 'edit'; task: Task }
  | { kind: 'new'; empleadoId: string | null; fecha: string; pedidoId?: string | null; etapa?: Etapa; asignada?: number }
  /** For an order that doesn't exist yet (new-order form): returns the task instead of saving it. */
  | { kind: 'draft'; draft?: TaskDraft; onDraft: (d: TaskDraft) => void; onRemove?: () => void };

export interface TaskDraft { etapa: Etapa; empleadoId: string; fecha: string; fechaFin: string; asignada: number; notas: string }

const lbl = 'text-sm text-gray-500 mb-1.5 block dark:text-gray-400';
const lblRow = 'flex items-center gap-1.5 mb-1.5';
const inp = 'bg-[#F7F2F2] w-full h-10 border border-gray-300 rounded-xl px-3 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100';

function autoStatus(estatus: string, asignada: number, completada: number): string {
  if (estatus === 'Bloqueado') return estatus;
  if (asignada > 0 && completada >= asignada) return 'Terminado';
  if (completada > 0 && estatus === 'Pendiente') return 'En proceso';
  if (completada < asignada && estatus === 'Terminado') return 'En proceso';
  return estatus;
}

export function TaskModal({ mode, orders, emps, rateFor, tareasT, stats, lockPedido = false, etapas, siblings, dueKeyFor, onClose, onSaved, onDelete }: {
  mode: TaskModalMode;
  /** Hide the order picker (the task is being added from that order's own page). */
  lockPedido?: boolean;
  /** Stages offered in the picker (defaults to the cookie stages). */
  etapas?: Etapa[];
  /** Other tasks of the same element (edit mode): dates stay sequential between stages. */
  siblings?: Task[];
  /** Production delivery day (YYYY-MM-DD) of an order: tasks can't start or end after it. */
  dueKeyFor?: (pedidoId: string) => string;
  /** Per-order progress, to suggest the next stage when a previous one is already complete. */
  stats?: Map<string, OrderStats>;
  orders: Order[];
  emps: Emp[];
  rateFor: (empId: string | null, etapa: Etapa | '') => number;
  tareasT: Table;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (id: string) => void;
}): React.ReactElement {
  const ETAPAS_OPC: Etapa[] = etapas && etapas.length ? etapas : ETAPAS;
  const { mutate: create } = useCreateRecord(tareasT);
  const { mutate: update } = useUpdateRecord(tareasT);
  const t = mode.kind === 'edit' ? mode.task : null;
  const isNew = !t;
  const draft = mode.kind === 'draft' ? mode : null;
  const d0 = draft?.draft;
  // Unsaved new tasks keep what was typed if the form is closed (per order / person / day it was opened for).
  const K = mode.kind === 'new' ? `tarea:${mode.pedidoId ?? ''}:${mode.empleadoId ?? ''}:${mode.fecha}`
    : mode.kind === 'draft' && !d0 ? 'tarea:nuevoPedido' : null;

  const [pedidoId, setPedidoId] = useDraft<string>(K, 'pedido', t?.pedidoId ?? (mode.kind === 'new' ? mode.pedidoId ?? '' : ''));
  // New task: stage starts empty, unless the order already finished a stage — then the next one is suggested.
  const suggestEtapa = (pid: string): Etapa | '' => {
    const o = orders.find((x) => x.id === pid); const st = pid ? stats?.get(pid) : undefined;
    if (!o || !st || o.qty <= 0) return '';
    let last = -1;
    ETAPAS.forEach((e, i) => { if (st.done[e] >= o.qty) last = i; });
    return last >= 0 && last < ETAPAS.length - 1 ? ETAPAS[last + 1]! : '';
  };
  const [etapa, setEtapa] = useDraft<Etapa | ''>(K, 'etapa', (t?.etapa as Etapa) || (mode.kind === 'new' ? suggestEtapa(mode.pedidoId ?? '') : d0?.etapa ?? ''));
  const etapaTouched = useRef(false);
  const [empleadoId, setEmpleadoId] = useDraft<string>(K, 'empleado', t?.empleadoId ?? (mode.kind === 'new' ? mode.empleadoId ?? '' : d0?.empleadoId ?? ''));
  const [fecha, setFecha] = useDraft<string>(K, 'fecha', t?.fecha ?? (mode.kind === 'new' ? mode.fecha : d0?.fecha ?? toKey(new Date())));
  const [fechaFin, setFechaFin] = useDraft<string>(K, 'fechaFin', t?.fechaFin || t?.fecha || (mode.kind === 'new' ? mode.fecha : d0?.fechaFin || d0?.fecha || toKey(new Date())));
  const [asignada, setAsignada] = useDraft<string>(K, 'asignada', t ? String(t.asignada) : mode.kind === 'new' && mode.asignada ? String(mode.asignada) : d0 ? String(d0.asignada) : '');
  const [completada, setCompletada] = useState<string>(t ? String(t.completada) : '0');
  const [estatus, setEstatus] = useState<string>(t?.estatus ?? 'Pendiente');
  const [notas, setNotas] = useDraft<string>(K, 'notas', t?.notas ?? d0?.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'' | 'saving' | 'saved' | 'error'>('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [splitQty, setSplitQty] = useState('');
  const [splitFecha, setSplitFecha] = useState(t?.fecha ?? '');
  const [splitEmp, setSplitEmp] = useState(t?.empleadoId ?? '');
  // Last persisted numbers, to revert invalid edits on blur.
  const saved = useRef({ asignada: t?.asignada ?? 0, completada: t?.completada ?? 0, notas: t?.notas ?? '' });

  useEscClose(onClose);

  const order = orders.find((o) => o.id === pedidoId) ?? null;
  const pace = t ? taskPace({ fecha, fechaFin, asignada: parseInt(asignada, 10) || 0, completada: parseInt(completada, 10) || 0, estatus }, new Date()) : null;
  const asig = parseInt(asignada, 10) || 0;
  const comp = parseInt(completada, 10) || 0;
  const sortedOrders = useMemo(() => [...orders].sort((a, b) => (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0)), [orders]);

  // Date bounds: start can't be before the task was created (today for a new one) nor after the order's production delivery.
  const maxKey = (order && dueKeyFor ? dueKeyFor(order.id) : '') || (order?.due ? toKey(order.due) : '');
  const baseMin = t ? (t.creada || '') : toKey(new Date());
  const seqItems: SeqItem[] = (t && t.elementoId && siblings ? siblings.filter((x) => x.id !== t.id && x.elementoId === t.elementoId) : [])
    .map((x) => ({ id: x.id, etapa: x.etapa, ini: x.fecha, fin: x.fechaFin }));
  const seqMin = t && seqItems.length && t.etapa ? prevEnd(seqItems, ETAPAS_OPC, t.etapa, maxKey) : '';
  const minKey = seqMin && seqMin > baseMin ? seqMin : baseMin;
  const inBounds = (d: string) => (!minKey || d >= minKey) && (!maxKey || d <= maxKey);

  const titleFor = (pid: string, et: Etapa | '', qty: number) => `${orders.find((o) => o.id === pid)?.label ?? t?.pedidoName ?? 'Pedido'} · ${et} · ${qty}`;

  // ── Edit mode: every change is saved immediately (optimistic) ──
  // Dates of an edited task + sequential adjustment of the later stages of the same element.
  const persistDates = async (ini: string, fin: string) => {
    if (!t) return;
    setSaveState('saving');
    try {
      const mine: SeqItem = { id: t.id, etapa: t.etapa, ini, fin };
      const before = [...seqItems, mine];
      const after = t.etapa && seqItems.length ? cascade(before, ETAPAS_OPC, t.etapa, maxKey) : before;
      const writes = after.filter((a, i) => a.id !== t.id && (a.ini !== before[i]!.ini || a.fin !== before[i]!.fin))
        .map((a) => update({ recordId: a.id, fields: { [TAREAS.FECHA]: a.ini, [TAREAS.FECHA_FIN]: a.fin || a.ini } }));
      await Promise.all([update({ recordId: t.id, fields: { [TAREAS.FECHA]: ini || null, [TAREAS.FECHA_FIN]: fin || null } }), ...writes]);
      setSaveState('saved'); onSaved();
    } catch (e) { console.error(e); setSaveState('error'); }
  };
  const persist = async (fields: Record<string, unknown>) => {
    if (!t) return;
    setSaveState('saving');
    try { await update({ recordId: t.id, fields }); setSaveState('saved'); onSaved(); }
    catch (e) { console.error(e); setSaveState('error'); }
  };

  const onPedido = (pid: string) => {
    setPedidoId(pid);
    if (!t && !etapaTouched.current) setEtapa(suggestEtapa(pid));
    if (!t || !pid) return;
    const el = orders.find((o) => o.id === pid)?.elementoId;
    persist({ [TAREAS.PEDIDO]: [pid], [TAREAS.ELEMENTO]: el ? [el] : [], [TAREAS.TITULO]: titleFor(pid, etapa, asig) });
  };
  const onEtapa = (v: string) => {
    const e = v as Etapa | '';
    etapaTouched.current = true; setEtapa(e);
    if (t && e) persist({ [TAREAS.ETAPA]: e, [TAREAS.TITULO]: titleFor(pedidoId, e, asig) });
  };
  const onEmpleado = (id: string) => { setEmpleadoId(id); if (t) persist({ [TAREAS.EMPLEADO]: id ? [id] : [] }); };
  // Start and end stay consistent: moving the start past the end moves the end too, and vice versa.
  const onFecha = (d: string) => {
    if (!d || !inBounds(d)) return;
    setFecha(d);
    const fin = !fechaFin || fechaFin < d ? d : fechaFin;
    setFechaFin(fin);
    if (t) persistDates(d, fin);
  };
  const onFechaFin = (d: string) => {
    if (!d || (maxKey && d > maxKey)) return;
    const ini = fecha && d < fecha ? (inBounds(d) ? d : fecha) : fecha;
    if (d < ini) return;
    setFechaFin(d); setFecha(ini);
    if (t) persistDates(ini, d);
  };
  const clearFecha = (w: 'start' | 'end') => {
    if (w === 'start') { setFecha(''); return; }
    setFechaFin('');
    if (t) persist({ [TAREAS.FECHA_FIN]: null });
  };
  const onEstatus = (s: string) => { setEstatus(s); if (t) persist({ [TAREAS.ESTATUS]: s }); };

  const commitAsignada = () => {
    if (!t) return;
    if (asig <= 0) { setAsignada(String(saved.current.asignada)); return; }
    if (asig === saved.current.asignada) return;
    saved.current.asignada = asig;
    const st = autoStatus(estatus, asig, comp); setEstatus(st);
    persist({ [TAREAS.ASIGNADA]: asig, [TAREAS.TITULO]: titleFor(pedidoId, etapa, asig), [TAREAS.ESTATUS]: st });
  };
  const commitCompletada = (value: number) => {
    const v = Math.max(0, value);
    setCompletada(String(v));
    if (!t || v === saved.current.completada) return;
    saved.current.completada = v;
    const st = autoStatus(estatus, asig, v); setEstatus(st);
    persist({ [TAREAS.COMPLETADA]: v, [TAREAS.ESTATUS]: st });
  };
  const commitNotas = () => {
    if (!t || notas === saved.current.notas) return;
    saved.current.notas = notas;
    persist({ [TAREAS.NOTAS]: notas.trim() || null });
  };

  const buildFields = (qty: number, done: number, emp: string, day: string, dayFin?: string) => {
    const f: Record<string, unknown> = {
      [TAREAS.TITULO]: titleFor(pedidoId, etapa, qty),
      [TAREAS.ETAPA]: etapa || null,
      [TAREAS.EMPLEADO]: emp ? [emp] : [],
      [TAREAS.FECHA]: day || null,
      [TAREAS.FECHA_FIN]: (dayFin && day && dayFin >= day ? dayFin : day) || null,
      [TAREAS.ASIGNADA]: qty,
      [TAREAS.COMPLETADA]: done,
      [TAREAS.ESTATUS]: autoStatus(estatus, qty, done),
      [TAREAS.NOTAS]: notas.trim() || null,
    };
    if (pedidoId) {
      f[TAREAS.PEDIDO] = [pedidoId];
      const el = order?.elementoId ?? t?.elementoId;
      if (el) f[TAREAS.ELEMENTO] = [el];
    }
    return f;
  };

  const createTask = async () => {
    if (!pedidoId && !draft) { setError('Elige un pedido.'); return; }
    if (!etapa) { setError('Elige la etapa.'); return; }
    if (asig <= 0) { setError('Las galletas asignadas deben ser más de 0.'); return; }
    if (!fecha) { setError('Elige la fecha de inicio.'); return; }
    if (!inBounds(fecha)) { setError(minKey && maxKey && maxKey < minKey ? PAST_DUE_MSG : maxKey && fecha > maxKey ? 'La fecha de inicio no puede ser después de la entrega de producción.' : 'La fecha de inicio no puede ser anterior a hoy.'); return; }
    if (fechaFin && maxKey && fechaFin > maxKey) { setError('La fecha de fin no puede ser después de la entrega de producción.'); return; }
    if (draft) {
      if (K) clearDraft(K);
      draft.onDraft({ etapa, empleadoId, fecha, fechaFin: fechaFin && fechaFin >= fecha ? fechaFin : fecha, asignada: asig, notas: notas.trim() });
      onClose(); return;
    }
    setSaving(true); setError('');
    try {
      await create({ ...buildFields(asig, 0, empleadoId, fecha, fechaFin), [TAREAS.ORIGEN]: 'Manual' });
      if (K) clearDraft(K);
      onSaved(); onClose();
    } catch (e) { console.error(e); setError('No se pudo asignar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const doSplit = async () => {
    if (!t) return;
    const n = parseInt(splitQty, 10) || 0;
    if (n <= 0 || n >= asig) { setError(`Mueve entre 1 y ${fmtInt(asig - 1)} galletas.`); return; }
    setSaving(true); setError('');
    try {
      const remaining = asig - n;
      const keepDone = Math.min(comp, remaining);
      const movedDone = Math.max(0, comp - remaining);
      await update({ recordId: t.id, fields: buildFields(remaining, keepDone, empleadoId, fecha, fechaFin) });
      await create({ ...buildFields(n, movedDone, splitEmp, splitFecha || fecha), [TAREAS.ESTATUS]: autoStatus('Pendiente', n, movedDone), [TAREAS.ORIGEN]: 'Manual' });
      onSaved(); onClose();
    } catch (e) { console.error(e); setError('No se pudo dividir la tarea.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="tm-h"
        className={`bg-white w-full sm:max-w-[560px] ${isNew ? 'max-h-[92vh]' : 'h-[92vh] sm:h-[88vh]'} rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]`} onClick={(e: any) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="tm-h" className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">{t ? 'Tarea de producción' : d0 ? 'Editar tarea' : draft ? 'Agregar tarea' : 'Asignar tarea'}</h2>
              {t && pace && <PacePill pace={pace.pace} title={pace.detail} />}
            </div>
            {t && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 h-5" aria-live="polite">
                {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Cambios guardados' : saveState === 'error' ? <span className="text-rose-600">No se pudo guardar el último cambio</span> : 'Los cambios se guardan solos'}
              </p>
            )}
          </div>
          {draft?.onRemove && (
            <button type="button" onClick={() => { draft.onRemove!(); onClose(); }} aria-label="Quitar tarea"
              className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><TrashIcon size={18} /></button>
          )}
          {t && (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Eliminar tarea"
              className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><TrashIcon size={18} /></button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!draft && !lockPedido && <div>
            <div className={lblRow}>
              <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-pedido">Pedido</label>
              <InfoTip text="Los que se entregan antes aparecen primero." />
            </div>
            <FieldSelect id="tm-pedido" value={pedidoId} onChange={onPedido} className={inp} placeholder="Elegir pedido…"
              options={sortedOrders.map((o) => ({ value: o.id, label: `${o.label} · ${fmtInt(o.qty)} galletas${o.due ? ` · ${o.due.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}` : ''}` }))} />
          </div>}

          <div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className={lbl} htmlFor="tm-emp">Empleado</label>
                  <FieldSelect id="tm-emp" value={empleadoId} onChange={onEmpleado} className={inp}
                    options={[{ value: '', label: 'Sin asignar' }, ...emps.map((e) => ({ value: e.id, label: e.name }))]} />
                </div>
                <div className="min-w-0">
                  <div className={lblRow}>
                    <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-etapa">Etapa</label>
                    <InfoTip text="Las etapas dependen del tipo de producto. Si el pedido ya terminó una etapa, se sugiere la siguiente." />
                  </div>
                  <FieldSelect id="tm-etapa" value={etapa} onChange={onEtapa} className={inp} placeholder="Elegir etapa…"
                    options={(t?.etapa && !ETAPAS_OPC.includes(t.etapa as Etapa) ? [t.etapa as Etapa, ...ETAPAS_OPC] : ETAPAS_OPC).map((e) => ({ value: e, label: e }))} />
                </div>
              </div>
              <DateRangeScope start={fecha} end={fechaFin} min={minKey || undefined} max={maxKey || undefined} onStart={onFecha} onEnd={onFechaFin}
                onClear={clearFecha} canClear={(w) => w === 'end' || !t}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={lblRow}>
                    <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-fecha">Fecha de inicio</label>
                    <InfoTip text="Día en que debe empezar. La tarea aparece ese día en Producción." />
                  </div>
                  <RangeTrigger which="start" id="tm-fecha" format="long" placeholder="Elegir día" className={inp} />
                </div>
                <div>
                  <div className={lblRow}>
                    <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-fecha-fin">Fecha de fin</label>
                    <InfoTip text="Día en que se espera terminarla. Con esto se calcula si va a tiempo, retrasada o adelantada." />
                  </div>
                  <RangeTrigger which="end" id="tm-fecha-fin" format="long" placeholder="Elegir día" className={inp} />
                </div>
              </div>
              </DateRangeScope>
              {t && pace && pace.detail && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{pace.detail}</p>
              )}
            </div>
          </div>

          <div className={isNew ? '' : 'grid grid-cols-2 gap-3'}>
            <div>
              <div className={lblRow}>
                <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-asig">Galletas asignadas</label>
              </div>
              <input id="tm-asig" type="number" min="0" inputMode="numeric" value={asignada} onChange={(e: any) => setAsignada(e.target.value)}
                onBlur={commitAsignada} onKeyDown={(e: any) => { if (e.key === 'Enter') e.currentTarget.blur(); }} className={inp} placeholder="0" />
            </div>
            {!isNew && (
              <div>
                <div className={lblRow}>
                  <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-comp">Completadas</label>
                  <InfoTip text="Registra lo que ya se hizo. +10 y +50 suman rápido; Todas la marca como terminada." />
                </div>
                <input id="tm-comp" type="number" min="0" inputMode="numeric" value={completada} onChange={(e: any) => setCompletada(e.target.value)}
                  onBlur={() => commitCompletada(comp)} onKeyDown={(e: any) => { if (e.key === 'Enter') e.currentTarget.blur(); }} className={inp} />
                <div className="mt-1.5 flex gap-1.5">
                  {[10, 50].map((n) => (
                    <button key={n} type="button" onClick={() => commitCompletada(Math.min(asig || Infinity, comp + n))}
                      className="px-2 h-7 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-[#382C2E] dark:text-gray-300 dark:hover:bg-white/5">+{n}</button>
                  ))}
                  <button type="button" onClick={() => commitCompletada(asig)}
                    className="px-2 h-7 rounded-lg border border-green-300 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-500/30 dark:text-green-300 dark:hover:bg-green-500/10">Todas</button>
                </div>
              </div>
            )}
          </div>

          {!isNew && (
            <div>
              <div className={lblRow}>
                <span className="text-sm text-gray-500 dark:text-gray-400">Estatus</span>
                <InfoTip text="Cambia solo al registrar avance. Usa Bloqueado si algo impide seguir." />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ESTATUS_TAREA.map((s) => (
                  <button key={s} type="button" onClick={() => onEstatus(s)} aria-pressed={estatus === s}
                    className={`h-9 rounded-xl border text-sm font-medium transition-colors ${estatus === s ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200' : 'bg-[#F7F2F2] border-gray-300 text-gray-600 hover:bg-gray-100 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-300 dark:hover:bg-white/5'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className={lblRow}>
              <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="tm-notas">Notas</label>
              <InfoTip text="Opcional: diseño, colores o algo que deba saber." />
            </div>
            <textarea id="tm-notas" rows={2} value={notas} onChange={(e: any) => setNotas(e.target.value)} onBlur={commitNotas}
              className="bg-[#F7F2F2] w-full border border-gray-300 rounded-xl px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 resize-none dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100" />
          </div>

          {t && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-[#382C2E]">
              <button type="button" onClick={() => setShowSplit((o) => !o)}
                className="w-full flex items-center gap-2 px-3 h-10 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ScissorsIcon size={16} /> Dividir tarea
                <span className="ml-auto text-xs text-gray-400">mover parte a otro día o persona</span>
              </button>
              {showSplit && (
                <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="number" min="1" value={splitQty} onChange={(e: any) => setSplitQty(e.target.value)} placeholder="Galletas" aria-label="Galletas a mover" className={inp} />
                  <DateField value={splitFecha} onChange={setSplitFecha} ariaLabel="Día destino" className={inp} />
                  <FieldSelect value={splitEmp} onChange={setSplitEmp} className={inp} ariaLabel="Empleado destino"
                    options={[{ value: '', label: 'Sin asignar' }, ...emps.map((e) => ({ value: e.id, label: e.name }))]} />
                  <button type="button" onClick={doSplit} disabled={saving}
                    className="sm:col-span-3 h-10 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900">Dividir</button>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>

        {isNew && (
          <div className="px-5 py-4 border-t border-[#E9D9D9] dark:border-[#382C2E] flex justify-end">
            <button type="button" onClick={createTask} disabled={saving}
              className="px-5 h-10 rounded-xl bg-rose-600 text-white text-base font-medium hover:bg-rose-700 transition-colors disabled:opacity-60">
              {draft ? (d0 ? 'Guardar' : 'Agregar') : saving ? 'Asignando…' : 'Asignar'}
            </button>
          </div>
        )}
      </div>

      {confirmDelete && t && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e: any) => { if (e.target === e.currentTarget) setConfirmDelete(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl p-5 dark:bg-[#251D1F]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#F5F3EF]">¿Eliminar tarea?</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.titulo || 'Esta tarea'} se eliminará.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-4 h-10 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-[#382C2E] dark:hover:bg-white/5">Cancelar</button>
              <button type="button" onClick={() => { onDelete(t.id); onClose(); }} className="px-4 h-10 rounded-xl bg-rose-600 text-white text-base font-medium hover:bg-rose-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
