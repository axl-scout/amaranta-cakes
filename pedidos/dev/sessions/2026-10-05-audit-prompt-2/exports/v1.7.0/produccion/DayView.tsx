import React, { useMemo, useState, useEffect } from 'react';
import { useEscClose } from '../lib/escStack';
import {
  Plus as PlusIcon, Check as CheckIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon,
  CaretRight as CaretRightIcon,
} from '@phosphor-icons/react';
import { ETAPAS, ETAPA_STYLE, type Etapa, toKey, startOfDay, fmtInt } from './constants';
import type { Emp, Order, OrderStats, Task } from './useProduccionData';
import { taskPace, PacePill, taskWindow } from './pace';
import { RiskPill, statOf, type OrderRisk } from './risk';
import type { TaskModalMode } from './TaskModal';

const VERB: Record<Etapa, string> = { Horneado: 'Hornear', Embetunado: 'Embetunar', Glaseado: 'Glasear', Decorado: 'Decorar', Empacado: 'Empacar' };
const card = 'bg-white border border-[#E5E1DA] rounded-xl dark:bg-[#251D1F] dark:border-[#382C2E]';
// Layering: dark summary bar → light column headers → white rows.
const cardHead = 'flex-shrink-0 px-4 h-11 bg-[#9A6B74] text-white dark:bg-[#4A3439] flex items-center justify-between gap-3';
const colHead = 'bg-[#F3E7E9] dark:bg-[#2C2325]';

const fmtTime = (secs: number) => { const h = Math.floor(secs / 3600); const m = Math.round((secs % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}`; };

function daysUntil(due: Date | null, from: Date): number | null {
  return due ? Math.round((startOfDay(due).getTime() - from.getTime()) / 86400000) : null;
}
/** Long form, used inside task rows: "se entrega mañana". */
function relDay(due: Date | null, from: Date): string {
  const d = daysUntil(due, from);
  if (d === null) return 'sin fecha';
  if (d < 0) return `venció hace ${-d} d`;
  if (d === 0) return 'se entrega hoy';
  if (d === 1) return 'se entrega mañana';
  if (d < 7) return `se entrega el ${due!.toLocaleDateString('es-MX', { weekday: 'long' })}`;
  return `entrega ${due!.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
}
/** Short form, used in "Por atender": "Mañana", "Viernes", "15 oct". */
function shortDay(due: Date | null, from: Date): string {
  const d = daysUntil(due, from);
  if (d === null) return 'Sin fecha';
  if (d < 0) return `Venció hace ${-d} d`;
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  const s = d < 7 ? due!.toLocaleDateString('es-MX', { weekday: 'long' }) : due!.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface DayViewProps {
  day: Date;
  today: Date;
  tasks: Task[];
  emps: Emp[];
  orders: Map<string, Order>;
  activeOrders: Order[];
  stats: Map<string, OrderStats>;
  risks: Map<string, OrderRisk>;
  shiftFor: (empId: string, d: Date) => { start: number; end: number } | null;
  rateFor: (empId: string | null, etapa: Etapa | '') => number;
  workDaysBetween: (a: Date, b: Date) => number;
  completing: Set<string>;
  onComplete: (t: Task) => void;
  openModal: (m: TaskModalMode) => void;
  openPedido: (id: string) => void;
}

type Row = { emp: Emp | null; list: Task[]; shift: { start: number; end: number } | null; load: number; off: boolean };

function LoadBar({ load }: { load: number }) {
  const barCls = load > 110 ? 'bg-red-500' : load > 90 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 min-w-0" title="Qué tanto de su día ocupan las tareas, según su capacidad">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full ${barCls}`} style={{ width: `${Math.min(100, load)}%` }} />
      </div>
      <span className={`w-11 text-right text-sm tabular-nums ${load > 110 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{load}%</span>
    </div>
  );
}

export function DayView(p: DayViewProps): React.ReactElement {
  const { day, tasks, emps, orders, stats, risks } = p;
  const dayKey = toKey(day);
  const dayTasks = useMemo(() => tasks.filter((t) => t.fecha === dayKey), [tasks, dayKey]);
  const [detail, setDetail] = useState<string | null>(null); // employee id, or 'none' for unassigned
  const [showStale, setShowStale] = useState(false);

  const rows: Row[] = useMemo(() => {
    const mk = (emp: Emp | null): Row => {
      const list = dayTasks.filter((t) => (emp ? t.empleadoId === emp.id : !t.empleadoId));
      const shift = emp ? p.shiftFor(emp.id, day) : null;
      const load = emp ? Math.round(list.reduce((s, t) => s + t.asignada / p.rateFor(emp.id, t.etapa), 0) * 100) : 0;
      return { emp, list, shift, load, off: !!emp && !shift };
    };
    const r = emps.map(mk);
    const working = r.filter((x) => !x.off || x.list.length > 0);
    const resting = r.filter((x) => x.off && x.list.length === 0);
    const none = mk(null);
    return [...(none.list.length ? [none] : []), ...working, ...resting];
  }, [emps, dayTasks, day, p.shiftFor, p.rateFor]);

  const totAsg = dayTasks.reduce((s, t) => s + t.asignada, 0);
  const totDone = dayTasks.reduce((s, t) => s + Math.min(t.completada, t.asignada), 0);
  const unassignedCount = dayTasks.filter((t) => !t.empleadoId).length;

  // ── What needs attention, relative to the selected day ──
  const attention = useMemo(() => {
    let stale = 0;
    type Item = {
      o: Order; r: OrderRisk; next: Etapa | null; nextLeft: number; unplanned: number;
      goal: { target: number; planned: number; gap: number } | null; score: number;
    };
    const out: Item[] = [];
    const staleList: Item[] = [];
    for (const o of p.activeOrders) {
      const r = risks.get(o.id);
      if (!r || r.risk === 'Completado') continue;
      const s = statOf(stats, o.id);
      const dueDay = o.due ? startOfDay(o.due) : null;
      const dLeft = daysUntil(o.due, day);
      const next = ETAPAS.find((e) => s.done[e] < o.qty) ?? null;
      const nextLeft = next ? o.qty - s.done[next] : 0;
      const unplanned = next ? Math.max(0, o.qty - s.assigned[next]) : 0;
      let goal: { target: number; planned: number; gap: number } | null = null;
      if (o.big && dueDay && dLeft !== null && dLeft >= 0) {
        const wd = Math.max(1, p.workDaysBetween(day, dueDay));
        const target = Math.ceil(Math.max(0, o.qty - s.done.Decorado) / wd);
        const planned = dayTasks.filter((t) => t.pedidoId === o.id && t.etapa === 'Decorado').reduce((a, t) => a + t.asignada, 0);
        goal = { target, planned, gap: Math.max(0, target - planned) };
      }
      const urgent = r.risk === 'Retrasado' || r.risk === 'En riesgo';
      const soonUnplanned = dLeft !== null && dLeft <= 2 && unplanned > 0;
      const behindGoal = !!goal && goal.gap > 0;
      if (!urgent && !soonUnplanned && !behindGoal) continue;
      const score = (r.risk === 'Retrasado' ? 0 : r.risk === 'En riesgo' ? 1 : 2) * 1000 + (dLeft ?? 999);
      if (dLeft !== null && dLeft < 0 && s.count === 0) { stale++; staleList.push({ o, r, next, nextLeft, unplanned, goal, score }); continue; }
      out.push({ o, r, next, nextLeft, unplanned, goal, score });
    }
    return { list: out.sort((a, b) => a.score - b.score), stale, staleList: staleList.sort((a, b) => b.score - a.score) };
  }, [p.activeOrders, risks, stats, day, dayTasks, p.workDaysBetween]);

  const detailRow = detail ? rows.find((r) => (r.emp ? r.emp.id : 'none') === detail) ?? null : null;
  const detailEmp = detail && detail !== 'none' ? emps.find((e) => e.id === detail) ?? null : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
      {/* Team table */}
      <section className={`${card} xl:col-span-2 overflow-hidden`} aria-label="Equipo">
        <div className={cardHead}>
          <p className="text-sm text-white/80 truncate">
            {dayTasks.length === 0 ? 'Sin tareas este día' : <>
              <b className="text-white tabular-nums">{fmtInt(totAsg)}</b> galletas ·{' '}
              <b className="text-white tabular-nums">{totAsg > 0 ? Math.round((totDone / totAsg) * 100) : 0}%</b> hecho
              {unassignedCount > 0 && <> · <span className="text-amber-300">{unassignedCount} sin asignar</span></>}
            </>}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse table-fixed">
            <colgroup><col className="w-[30%]" /><col className="w-[25%]" /><col /><col className="w-12" /></colgroup>
            <thead className={colHead}>
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre</th>
                <th className="text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"># Tareas</th>
                <th className="text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Horario</th>
                <th aria-label="Agregar tarea" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const id = r.emp ? r.emp.id : 'none';
                const done = r.list.filter((t) => t.estatus === 'Terminado' || p.completing.has(t.id)).length;
                return (
                  <tr key={id} onClick={() => setDetail(id)} tabIndex={0}
                    onKeyDown={(e: any) => { if (e.key === 'Enter') setDetail(id); }}
                    className={`group border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#251D1F] cursor-pointer transition-colors hover:bg-rose-50/50 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:bg-rose-50/60 ${!r.emp ? '!bg-amber-50 dark:!bg-amber-500/10' : ''}`}>
                    <td className={`px-4 h-12 text-base font-medium ${!r.emp ? 'text-amber-800 dark:text-amber-200' : r.off ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {r.emp ? r.emp.name : 'Sin asignar'}
                    </td>
                    <td className="px-3 text-base tabular-nums text-gray-800 dark:text-gray-200">
                      {r.list.length === 0 ? <span className="text-gray-300 dark:text-gray-600">—</span> : <>
                        {r.list.length}
                        {done > 0 && <span className="ml-1.5 text-sm text-emerald-600 dark:text-emerald-400">{done === r.list.length ? '✓' : `${done} hecha${done > 1 ? 's' : ''}`}</span>}
                      </>}
                    </td>
                    <td className="px-3 text-sm tabular-nums text-gray-500 dark:text-gray-400">
                      {r.emp ? (r.shift ? `${fmtTime(r.shift.start)}–${fmtTime(r.shift.end)}` : 'Descanso') : ''}
                    </td>
                    <td className="pr-3 text-right">
                      {r.emp && (
                        <button type="button" aria-label={`Asignar tarea a ${r.emp.name}`} title="Asignar tarea"
                          onClick={(e: any) => { e.stopPropagation(); p.openModal({ kind: 'new', empleadoId: r.emp!.id, fecha: dayKey }); }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                          <PlusIcon size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Por atender */}
      <section className={`${card} overflow-hidden xl:sticky xl:top-0 flex flex-col max-h-[calc(100dvh-7rem)]`} aria-labelledby="att-h">
        <div className={cardHead}>
          <h2 id="att-h" className="text-sm font-semibold text-white">Por atender</h2>
          <span className="text-sm text-white/70">{attention.list.length} pedidos</span>
        </div>
        {attention.list.length === 0 && !showStale ? (
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <CheckCircleIcon size={28} className="text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Todo en orden: los pedidos próximos están asignados y los grandes van en meta.</p>
          </div>
        ) : (
          <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
            {[...attention.list, ...(showStale ? attention.staleList : [])].map(({ o, r, next, nextLeft, unplanned, goal }) => {
              const prefill: TaskModalMode = goal && goal.gap > 0
                ? { kind: 'new', empleadoId: null, fecha: dayKey, pedidoId: o.id, etapa: 'Decorado', asignada: goal.gap }
                : { kind: 'new', empleadoId: null, fecha: dayKey, pedidoId: o.id, etapa: next ?? 'Horneado', asignada: unplanned || nextLeft };
              return (
                <li key={o.id} className="relative pl-4 pr-12 py-2.5 cursor-pointer hover:bg-rose-50/40 dark:hover:bg-white/5 transition-colors" onClick={() => p.openPedido(o.id)}>
                  <button type="button" onClick={(e: any) => { e.stopPropagation(); p.openModal(prefill); }} aria-label={`Asignar tarea para ${o.label}`} title="Asignar tarea"
                    className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                    <PlusIcon size={15} />
                  </button>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[1.1rem] font-semibold text-gray-900 dark:text-gray-100">{o.label}</span>
                    <RiskPill risk={r.risk} />
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {shortDay(o.due, day)} · {fmtInt(o.qty)} galletas
                    {!goal && next && (
                      unplanned > 0
                        ? <> · <span className="text-gray-800 dark:text-gray-200">{VERB[next]} {fmtInt(unplanned)} sin asignar</span></>
                        : <> · Sigue {VERB[next].toLowerCase()} {fmtInt(nextLeft)}</>
                    )}
                  </p>
                  {goal && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${goal.target > 0 ? Math.min(100, (goal.planned / goal.target) * 100) : 100}%` }} />
                      </div>
                      <span className={`text-sm tabular-nums whitespace-nowrap ${goal.gap > 0 ? 'text-gray-800 dark:text-gray-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        Decorar {fmtInt(goal.planned)}/{fmtInt(goal.target)} hoy
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {attention.stale > 0 && (
          <p className="px-4 py-2.5 border-t border-gray-100 dark:border-white/5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {attention.stale} pedidos vencidos sin tareas {showStale ? 'se muestran al final' : 'no se muestran'} (probablemente ya se entregaron; márcalos como Entregado en Pedidos).{' '}
            <button type="button" onClick={() => setShowStale((v) => !v)} className="font-normal text-rose-600 hover:underline dark:text-rose-400">{showStale ? 'Ocultar' : 'Mostrar'}</button>
          </p>
        )}
      </section>

      {detail && (
        <EmployeeDayModal emp={detailEmp} row={detailRow} day={day} orders={orders} risks={risks}
          completing={p.completing} onComplete={p.onComplete} openModal={p.openModal} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function EmployeeDayModal({ emp, row, day, orders, risks, completing, onComplete, openModal, onClose }: {
  emp: Emp | null; row: Row | null; day: Date; orders: Map<string, Order>; risks: Map<string, OrderRisk>;
  completing: Set<string>; onComplete: (t: Task) => void; openModal: (m: TaskModalMode) => void; onClose: () => void;
}): React.ReactElement {
  useEscClose(onClose);
  const list = row?.list ?? [];
  const asg = list.reduce((s, t) => s + t.asignada, 0);
  const done = list.reduce((s, t) => s + Math.min(t.completada, t.asignada), 0);
  const dayLabel = day.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="emp-day-h"
        className="bg-white w-full sm:max-w-[620px] h-[92vh] sm:h-[88vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]">
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="emp-day-h" className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">{emp ? emp.name : 'Tareas sin asignar'}</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="capitalize">{dayLabel}</span>
                {emp && <> · {row?.shift ? `${fmtTime(row.shift.start)}–${fmtTime(row.shift.end)}` : 'Descanso'}</>}
              </p>
            </div>
            {emp && list.length > 0 && (
              <button type="button" onClick={() => openModal({ kind: 'new', empleadoId: emp.id, fecha: toKey(day) })}
                className="h-10 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                <PlusIcon size={16} /><span className="hidden sm:inline">Asignar tarea</span>
              </button>
            )}
          </div>
          {list.length > 0 && <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avance del día</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${asg > 0 ? (done / asg) * 100 : 0}%` }} />
                </div>
                <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(done)}/{fmtInt(asg)}</span>
              </div>
            </div>
          </div>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{emp ? 'Sin tareas este día.' : 'No hay tareas sin asignar este día.'}</p>
              {emp && (
                <button type="button" onClick={() => openModal({ kind: 'new', empleadoId: emp.id, fecha: toKey(day) })}
                  className="h-10 px-4 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                  <PlusIcon size={16} /> Asignar tarea
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {list.map((t) => {
                const st = t.etapa ? ETAPA_STYLE[t.etapa] : ETAPA_STYLE.Decorado;
                const o = t.pedidoId ? orders.get(t.pedidoId) : undefined;
                const isDone = t.estatus === 'Terminado' || completing.has(t.id);
                const pct = t.asignada > 0 ? Math.min(100, ((isDone ? t.asignada : t.completada) / t.asignada) * 100) : 0;
                const risk = t.pedidoId ? risks.get(t.pedidoId)?.risk : undefined;
                return (
                  <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                    <button type="button" onClick={() => { if (!isDone) onComplete(t); }} disabled={isDone}
                      aria-label={isDone ? 'Tarea terminada' : 'Marcar como hecha'} title={isDone ? 'Terminada' : 'Marcar como hecha'}
                      className={`h-7 w-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 dark:border-gray-600 dark:hover:bg-emerald-500/10'}`}>
                      {isDone && <CheckIcon size={13} weight="bold" />}
                    </button>
                    <button type="button" onClick={() => openModal({ kind: 'edit', task: t })} className="min-w-0 flex-1 text-left group">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                        <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{VERB[t.etapa as Etapa] ?? 'Tarea'} {fmtInt(t.asignada)}</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate">· {t.pedidoName || 'Sin pedido'}</span>
                        {t.estatus === 'Bloqueado' && <WarningIcon size={12} weight="fill" className="flex-shrink-0 text-red-600" />}
                        {!isDone && (() => { const p = taskPace(t, new Date()); return <span className="ml-auto flex-shrink-0"><PacePill pace={p.pace} title={p.detail} size="sm" /></span>; })()}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div className={`h-full ${st.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtInt(isDone ? t.asignada : t.completada)}/{fmtInt(t.asignada)}</span>
                      </div>
                      <div className={`mt-1 text-xs ${risk === 'Retrasado' || risk === 'En riesgo' ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t.fechaFin && t.fechaFin !== t.fecha ? `${taskWindow(t)} · ` : ''}{relDay(o?.due ?? null, day)}{t.estatus !== 'Pendiente' && !isDone ? ` · ${t.estatus}` : ''}
                      </div>
                    </button>
                    <CaretRightIcon size={14} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
