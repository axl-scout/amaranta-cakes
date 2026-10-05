import React, { useEffect, useMemo } from 'react';
import { useEscClose } from '../lib/escStack';
import { Plus as PlusIcon, Check as CheckIcon, Warning as WarningIcon, CaretRight as CaretRightIcon } from '@phosphor-icons/react';
import { ETAPAS, ETAPA_STYLE, type Etapa, fmtInt, parseKey, toKey } from './constants';
import type { Order, OrderStats, Task } from './useProduccionData';
import { RiskPill, statOf, type OrderRisk } from './risk';
import { taskPace, PacePill, taskWindow } from './pace';
import type { TaskModalMode } from './TaskModal';

const VERB: Record<Etapa, string> = { Horneado: 'Hornear', Embetunado: 'Embetunar', Glaseado: 'Glasear', Decorado: 'Decorar', Empacado: 'Empacar' };

/** Detail page for one order: how its production is split into tasks, by stage and by day. */
export function PedidoProduccionModal({ order, tasks, stats, risk, empName, today, openModal, onClose }: {
  order: Order;
  tasks: Task[];
  stats: Map<string, OrderStats>;
  risk: OrderRisk | undefined;
  empName: Map<string, string>;
  today: Date;
  openModal: (m: TaskModalMode) => void;
  onClose: () => void;
}): React.ReactElement {
  useEscClose(onClose);

  const s = statOf(stats, order.id);
  const mine = useMemo(() => tasks.filter((t) => t.pedidoId === order.id), [tasks, order.id]);
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    [...mine].sort((a, b) => a.fecha.localeCompare(b.fecha) || ETAPAS.indexOf(a.etapa as Etapa) - ETAPAS.indexOf(b.etapa as Etapa))
      .forEach((t) => { const k = t.fecha || 'sin-fecha'; if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); });
    return Array.from(m.entries());
  }, [mine]);
  const nextStage = ETAPAS.find((e) => s.assigned[e] < order.qty) ?? ETAPAS.find((e) => s.done[e] < order.qty) ?? 'Horneado';
  const suggested = Math.max(0, order.qty - s.assigned[nextStage]) || Math.max(0, order.qty - s.done[nextStage]);
  const assign = () => openModal({ kind: 'new', empleadoId: null, fecha: toKey(today), pedidoId: order.id, etapa: nextStage, asignada: suggested || undefined });
  const dueLabel = order.due ? order.due.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sin fecha';

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ped-prod-h"
        className="bg-white w-full sm:max-w-[680px] h-[92vh] sm:h-[88vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-[#251D1F]">
        <div className="px-5 pt-5 pb-4 border-b border-[#E9D9D9] dark:border-[#382C2E]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="ped-prod-h" className="text-xl font-bold text-gray-900 dark:text-[#F5F3EF]">{order.label}</h2>
                {risk && <RiskPill risk={risk.risk} />}
                {order.big && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-gray-200 bg-gray-100 text-gray-600 dark:bg-white/10 dark:border-white/10 dark:text-gray-300">Pedido Grande</span>}
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="first-letter:uppercase inline-block">{dueLabel}</span> · {fmtInt(order.qty)} galletas
              </p>
            </div>
            {byDay.length > 0 && <button type="button" onClick={assign}
              className="h-10 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
              <PlusIcon size={16} /><span className="hidden sm:inline">Asignar tarea</span>
            </button>}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            {ETAPAS.map((e) => {
              const pAsg = order.qty > 0 ? Math.min(100, (s.assigned[e] / order.qty) * 100) : 0;
              const pDone = order.qty > 0 ? Math.min(100, (s.done[e] / order.qty) * 100) : 0;
              const missing = Math.max(0, order.qty - s.assigned[e]);
              return (
                <div key={e} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <span className={`w-2 h-2 rounded-full ${ETAPA_STYLE[e].dot}`} />{e}
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 relative overflow-hidden" title={`${fmtInt(s.assigned[e])} asignadas · ${fmtInt(s.done[e])} hechas`}>
                    <div className={`absolute inset-y-0 left-0 ${ETAPA_STYLE[e].bar} opacity-30`} style={{ width: `${pAsg}%` }} />
                    <div className={`absolute inset-y-0 left-0 ${ETAPA_STYLE[e].bar}`} style={{ width: `${pDone}%` }} />
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {fmtInt(s.done[e])}/{fmtInt(order.qty)} hechas
                    {missing > 0 && <span className="block text-gray-700 dark:text-gray-300">{fmtInt(missing)} sin asignar</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Barra clara = asignado · sólida = hecho{risk?.detail ? ` · ${risk.detail}` : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {byDay.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Este pedido todavía no tiene tareas asignadas.</p>
              <button type="button" onClick={assign}
                className="h-10 px-4 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                <PlusIcon size={16} /> Asignar tarea
              </button>
            </div>
          ) : byDay.map(([k, list]) => {
            const d = parseKey(k);
            const isToday = d && toKey(d) === toKey(today);
            const label = d ? d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Sin día';
            return (
              <section key={k}>
                <h3 className="sticky top-0 z-10 px-5 py-1.5 bg-[#F3E7E9] text-sm font-semibold text-gray-700 dark:bg-[#2C2325] dark:text-gray-200">
                  <span className="first-letter:uppercase inline-block">{label}</span>{isToday && <span className="ml-2 text-xs font-medium text-rose-600 dark:text-rose-400">Hoy</span>}
                </h3>
                <ul className="divide-y divide-gray-100 dark:divide-white/5">
                  {list.map((t) => {
                    const st = t.etapa ? ETAPA_STYLE[t.etapa] : ETAPA_STYLE.Decorado;
                    const done = t.estatus === 'Terminado';
                    const pct = t.asignada > 0 ? Math.min(100, ((done ? t.asignada : t.completada) / t.asignada) * 100) : 0;
                    return (
                      <li key={t.id}>
                        <button type="button" onClick={() => openModal({ kind: 'edit', task: t })}
                          className="w-full px-5 py-2.5 flex items-center gap-3 text-left hover:bg-rose-50/40 dark:hover:bg-white/5 transition-colors">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{VERB[t.etapa as Etapa] ?? 'Tarea'} {fmtInt(t.asignada)}</span>
                              <span className={`truncate ${t.empleadoId ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 font-medium dark:text-gray-100'}`}>
                                · {t.empleadoId ? empName.get(t.empleadoId) ?? '—' : 'Sin asignar'}
                              </span>
                              {t.estatus === 'Bloqueado' && <WarningIcon size={12} weight="fill" className="flex-shrink-0 text-red-600" />}
                              {!done && (() => { const p = taskPace(t, today); return <span className="ml-auto flex-shrink-0"><PacePill pace={p.pace} title={p.detail} size="sm" /></span>; })()}
                            </div>
                            {t.fechaFin && t.fechaFin !== t.fecha && <div className="text-xs text-gray-500 dark:text-gray-400">{taskWindow(t)}</div>}
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                <div className={`h-full ${st.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-24 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">{fmtInt(done ? t.asignada : t.completada)}/{fmtInt(t.asignada)}</span>
                            </div>
                          </div>
                          {done ? <CheckIcon size={15} weight="bold" className="flex-shrink-0 text-emerald-500" /> : <CaretRightIcon size={14} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
