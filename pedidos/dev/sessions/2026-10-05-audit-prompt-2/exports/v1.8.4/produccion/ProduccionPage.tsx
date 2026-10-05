import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon, Plus as PlusIcon, MagnifyingGlass as MagnifyingGlassIcon,
  Check as CheckIcon, Warning as WarningIcon,
} from '@phosphor-icons/react';
import { useDeleteRecord, useUpdateRecord } from '../lib/airtable-hooks';
import { PageToolbar } from '../components/SideMenu';
import { FilterDropdown, SelectDropdown } from '../components/Dropdowns';
import { useProduccionData, statsFor, type Order, type Task } from './useProduccionData';
import {
  ETAPAS, ETAPA_STYLE, type Etapa, toKey, parseKey, mondayOf, addDays, fmtInt, startOfDay,
} from './constants';
import { TaskModal, type TaskModalMode } from './TaskModal';
import { useUrlParam } from '../lib/useUrlParam';
import { DayView } from './DayView';
import { PedidoProduccionModal } from './PedidoProduccionModal';
import { computeRisks, RiskPill, type Risk } from './risk';
import { TAREAS } from './constants';
import { MiniCalendar } from '../components/Calendar';
import { toneStyle, useIsDark } from '../components/airtableColors';
import { PedidoSearch } from '../components/PedidoSearch';
import { ProduccionContentSkeleton } from '../components/Skeletons';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
type Vista = 'dia' | 'todos' | 'grandes' | 'regulares';
const VISTAS: Array<{ v: Vista; label: string }> = [{ v: 'dia', label: 'Día' }, { v: 'todos', label: 'Todos' }, { v: 'grandes', label: 'Grandes' }, { v: 'regulares', label: 'Regulares' }];

function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try { const s = window.localStorage.getItem(key); if (s != null) return JSON.parse(s) as T; } catch { /* ignore */ }
    return initial;
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

const card = 'bg-white border border-[#E5E1DA] rounded-xl dark:bg-[#251D1F] dark:border-[#382C2E]';
const navBtn = 'h-10 w-10 flex-shrink-0 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 transition-colors flex items-center justify-center';

function StageBar({ etapa, done, assigned, total }: { etapa: Etapa; done: number; assigned: number; total: number }) {
  const pDone = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  const pAsg = total > 0 ? Math.min(100, (assigned / total) * 100) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{etapa}</span>
        <span className="tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(done)}<span className="text-gray-400">/{fmtInt(total)}</span></span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 relative overflow-hidden" title={`${fmtInt(assigned)} planeadas · ${fmtInt(done)} hechas`}>
        <div className={`absolute inset-y-0 left-0 ${ETAPA_STYLE[etapa].bar} opacity-30`} style={{ width: `${pAsg}%` }} />
        <div className={`absolute inset-y-0 left-0 ${ETAPA_STYLE[etapa].bar}`} style={{ width: `${pDone}%` }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' | 'bad' | 'ok' }) {
  const toneCls = tone === 'bad' ? 'text-red-600 dark:text-red-400' : tone === 'warn' ? 'text-amber-600 dark:text-amber-300' : tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-[#F5F3EF]';
  return (
    <div className={`${card} px-4 py-3`}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{sub}</div>}
    </div>
  );
}

export function ProduccionPage(): React.ReactElement {
  const D = useProduccionData();
  const isDark = useIsDark();
  const { mutate: deleteApi } = useDeleteRecord(D.tareasT);
  const { mutate: updateApi } = useUpdateRecord(D.tareasT);

  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const weekStart = useMemo(() => mondayOf(anchor), [anchor]);
  const [vista, setVista] = usePersisted<Vista>('prod-vista', 'dia');
  const tipo = vista === 'dia' ? 'todos' : vista;
  const [showPicker, setShowPicker] = useState(false);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [etapaFilter, setEtapaFilter] = usePersisted<string[]>('prod-etapas', []);
  const [empFilter, setEmpFilter] = usePersisted<string[]>('prod-empleados', []);
  const [newModal, setNewModal] = useState<TaskModalMode | null>(null);
  const [taskId, setTaskId] = useUrlParam('task');
  const [pedidoDetail, setPedidoDetail] = useUrlParam('pedido');
  const editTask = taskId ? D.tasks.find((t) => t.id === taskId) ?? null : null;
  const modal: TaskModalMode | null = editTask ? { kind: 'edit', task: editTask } : newModal;
  const setModal = (m: TaskModalMode | null) => {
    if (m && m.kind === 'edit') { setNewModal(null); setTaskId(m.task.id); }
    else { setNewModal(m); if (editTask) setTaskId(null); }
  };

  // Soft delete with 10s undo
  const [pending, setPending] = useState<Array<{ key: string; id: string }>>([]);
  const timers = useRef<Record<string, any>>({});
  const hidden = useMemo(() => new Set(pending.map((p) => p.id)), [pending]);
  const requestDelete = useCallback((id: string) => {
    const key = `${id}-${Date.now()}`;
    setPending((p) => [...p, { key, id }]);
    timers.current[key] = setTimeout(() => {
      delete timers.current[key];
      setPending((p) => p.filter((x) => x.key !== key));
      Promise.resolve(deleteApi(id)).then(() => D.refetch()).catch((e) => console.error(e));
    }, 10000);
  }, [deleteApi, D.refetch]);
  const undo = (key: string) => { clearTimeout(timers.current[key]); delete timers.current[key]; setPending((p) => p.filter((x) => x.key !== key)); };
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  const tasks = useMemo(() => D.tasks.filter((t) => !hidden.has(t.id)), [D.tasks, hidden]);
  const stats = useMemo(() => statsFor(tasks), [tasks]);
  const today = D.today;
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekKeys = useMemo(() => new Set(days.map(toKey)), [days]);

  const risks = useMemo(() => computeRisks(D.activeOrders, stats, today, D.teamRateFor('Decorado'), D.workDaysBetween),
    [D.activeOrders, stats, today, D.teamRateFor, D.workDaysBetween]);

  const completeTask = useCallback((t: Task) => {
    setCompleting((s) => new Set(s).add(t.id));
    Promise.resolve(updateApi({ recordId: t.id, fields: { [TAREAS.COMPLETADA]: t.asignada, [TAREAS.ESTATUS]: 'Terminado' } }))
      .then(() => D.refetch())
      .catch((e) => { console.error(e); setCompleting((s) => { const n = new Set(s); n.delete(t.id); return n; }); });
  }, [updateApi, D.refetch]);

  // ── Large orders with EDF feasibility against team decorating capacity ──
  const bigOrders = useMemo(() => D.activeOrders.filter((o) => o.big)
    .sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity))
    .map((o) => {
      const s = stats.get(o.id);
      const done = s?.done ?? { Horneado: 0, Embetunado: 0, Glaseado: 0, Decorado: 0, Empacado: 0 };
      const assigned = s?.assigned ?? { Horneado: 0, Embetunado: 0, Glaseado: 0, Decorado: 0, Empacado: 0 };
      const r = risks.get(o.id) ?? { risk: 'Sin fecha' as Risk, detail: '' };
      const coverage = o.qty > 0 ? Math.min(100, Math.round((assigned.Decorado / o.qty) * 100)) : 0;
      return { o, done, assigned, risk: r.risk, detail: r.detail, coverage };
    }), [D.activeOrders, stats, risks]);

  // ── Regular orders due in the next 7 days ──
  const regularOrders = useMemo(() => {
    const end = addDays(today, 7);
    return D.activeOrders
      .filter((o) => !o.big && o.due && o.due.getTime() >= today.getTime() && startOfDay(o.due).getTime() <= end.getTime())
      .sort((a, b) => a.due!.getTime() - b.due!.getTime())
      .map((o) => {
        const s = stats.get(o.id);
        const decoAsg = s?.assigned.Decorado ?? 0;
        const empDone = s?.done.Empacado ?? 0;
        const status = empDone >= o.qty && o.qty > 0 ? 'Listo' : decoAsg >= o.qty ? 'Planificado' : (s?.count ?? 0) > 0 ? 'Parcial' : 'Sin planificar';
        return { o, status, risk: risks.get(o.id)?.risk ?? ('A tiempo' as Risk) };
      });
  }, [D.activeOrders, stats, today, risks]);

  // ── KPIs for the selected week ──
  const kpis = useMemo(() => {
    const wk = tasks.filter((t) => weekKeys.has(t.fecha));
    const deco = wk.filter((t) => t.etapa === 'Decorado');
    const decoPlan = deco.reduce((s, t) => s + t.asignada, 0);
    const decoDone = deco.reduce((s, t) => s + Math.min(t.completada, t.asignada), 0);
    const asg = wk.reduce((s, t) => s + t.asignada, 0);
    const done = wk.reduce((s, t) => s + Math.min(t.completada, t.asignada), 0);
    let personDays = 0;
    D.activeEmps.forEach((e) => days.forEach((d) => { if (D.hoursFor(e.id, d) > 0) personDays++; }));
    const loadDays = wk.reduce((s, t) => s + (t.asignada / D.rateFor(t.empleadoId, t.etapa)), 0);
    return {
      decoPlan, decoDone,
      pct: asg > 0 ? Math.round((done / asg) * 100) : 0,
      loadPct: personDays > 0 ? Math.round((loadDays / personDays) * 100) : 0,
      unassigned: wk.filter((t) => !t.empleadoId).length,
      atRisk: bigOrders.filter((b) => b.risk === 'En riesgo' || b.risk === 'Retrasado').length,
      noPlan: regularOrders.filter((r) => r.status === 'Sin planificar').length,
    };
  }, [tasks, weekKeys, D.activeEmps, D.hoursFor, D.rateFor, days, bigOrders, regularOrders]);

  // ── Board filters ──
  const orderOf = (t: Task): Order | undefined => (t.pedidoId ? D.orders.get(t.pedidoId) : undefined);
  const passes = (t: Task) => {
    if (etapaFilter.length && !etapaFilter.includes(t.etapa)) return false;
    if (tipo !== 'todos') { const big = orderOf(t)?.big ?? false; if (tipo === 'grandes' ? !big : big) return false; }
    return true;
  };
  const empIdsSel = new Set(D.activeEmps.filter((e) => empFilter.includes(e.name)).map((e) => e.id));
  const filterEmp = empFilter.length > 0;
  const viewTasks = filterEmp ? tasks.filter((t) => !!t.empleadoId && empIdsSel.has(t.empleadoId)) : tasks;
  const viewEmps = filterEmp ? D.activeEmps.filter((e) => empFilter.includes(e.name)) : D.activeEmps;
  const boardTasks = viewTasks.filter((t) => weekKeys.has(t.fecha) && passes(t));
  const empNames = D.activeEmps.map((e) => e.name);
  const rows = viewEmps;
  const unassignedInWeek = boardTasks.filter((t) => !t.empleadoId);

  const modalOrders = useMemo(() => {
    const m = new Map(D.activeOrders.map((o) => [o.id, o]));
    if (modal?.kind === 'edit' && modal.task.pedidoId) { const o = D.orders.get(modal.task.pedidoId); if (o) m.set(o.id, o); }
    return Array.from(m.values());
  }, [D.activeOrders, D.orders, modal]);

  const isDay = vista === 'dia';
  const isCurrentWeek = weekStart.getTime() === mondayOf(new Date()).getTime();
  const isCurrent = isDay ? anchor.getTime() === today.getTime() : isCurrentWeek;
  const dayLabel = anchor.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
  const weekEnd = addDays(weekStart, 6);
  const fmtShort = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const weekLabel = `${fmtShort(weekStart)} – ${fmtShort(weekEnd)} ${weekEnd.getFullYear()}`;

  // The toolbar renders right away; only the content waits for data.
  const dataError = !D.loading && (D.error || !D.tareasT);

  const renderChip = (t: Task) => {
    const st = t.etapa ? ETAPA_STYLE[t.etapa] : ETAPA_STYLE.Decorado;
    const done = t.estatus === 'Terminado';
    return (
      <button key={t.id} type="button" onClick={(e: any) => { e.stopPropagation(); setModal({ kind: 'edit', task: t }); }}
        title={`${t.pedidoName} · ${t.etapa} · ${t.completada}/${t.asignada}`}
        className={`w-full text-left px-1.5 py-1 rounded-lg border text-xs leading-tight transition-opacity hover:opacity-80 ${st.chip} ${done ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-1 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
          <span className="font-semibold truncate">{t.pedidoName || 'Sin pedido'}</span>
          {t.estatus === 'Bloqueado' && <WarningIcon size={11} weight="fill" className="flex-shrink-0 text-red-600" />}
          {done && <CheckIcon size={11} weight="bold" className="flex-shrink-0" />}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1 opacity-80">
          <span>{st.short}</span>
          <span className="tabular-nums">{fmtInt(t.completada)}/{fmtInt(t.asignada)}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="h-screen overflow-hidden font-sans antialiased bg-[#F8F2F2] dark:bg-[#1B1517] flex flex-col">
        <PageToolbar>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setAnchor(addDays(anchor, isDay ? -1 : -7))} className={navBtn} aria-label={isDay ? 'Día anterior' : 'Semana anterior'}><CaretLeftIcon size={13} /></button>
            <div className="relative">
              <button type="button" onClick={() => setShowPicker((o) => !o)} onMouseDown={(e: any) => e.stopPropagation()} aria-label="Elegir fecha"
                className="h-10 px-3 min-w-[170px] flex items-center justify-center rounded-xl border border-gray-300 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-200 first-letter:uppercase">
                <span className="first-letter:uppercase">{isDay ? dayLabel : weekLabel}</span>
              </button>
              {showPicker && (
                <MiniCalendar selectedDate={anchor} onSelectDate={(d) => { setAnchor(startOfDay(d)); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
              )}
            </div>
            <button type="button" onClick={() => setAnchor(addDays(anchor, isDay ? 1 : 7))} className={navBtn} aria-label={isDay ? 'Día siguiente' : 'Semana siguiente'}><CaretRightIcon size={13} /></button>
            {!isCurrent && (
              <button type="button" onClick={() => setAnchor(startOfDay(new Date()))}
                className="h-10 px-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-300">Hoy</button>
            )}
          </div>
          <PedidoSearch items={Array.from(D.orders.values())} onSelect={setPedidoDetail} />
          <FilterDropdown label="" values={empFilter} options={empNames} onChange={setEmpFilter} allLabel="Todo el equipo" />
          {!isDay && <>
            <FilterDropdown label="" values={etapaFilter} options={ETAPAS} onChange={setEtapaFilter} allLabel="Todas las etapas" />
          </>}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <SelectDropdown value={vista} options={VISTAS.map((x) => ({ value: x.v, label: x.label }))} ariaLabel="Vista"
              onChange={(v) => { setVista(v); setShowPicker(false); }} />
            {/* Capacidades: oculto por ahora (la lógica y los datos se conservan). */}

            <button type="button" onClick={() => setModal({ kind: 'new', empleadoId: null, fecha: toKey(isDay ? anchor : isCurrentWeek ? today : weekStart) })}
              className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
              <PlusIcon size={16} /><span className="hidden sm:inline">Asignar tarea</span>
            </button>
          </div>
        </PageToolbar>
      <div className="flex-1 min-h-0 mx-auto w-[90%] flex flex-col overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 lg:px-7 pt-4 pb-6 space-y-5">
          {D.loading ? <ProduccionContentSkeleton /> : dataError ? (
            <div className="py-20 text-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F5F3EF]">No se pudo cargar la producción</h2>
              <p className="mt-1 text-gray-500 dark:text-gray-400">{D.error?.message || 'No se encontró la tabla de tareas.'}</p>
            </div>
          ) : (
          <div key={vista} className="anim-view space-y-5">
          {isDay ? (
            <DayView day={anchor} today={today} tasks={viewTasks} emps={viewEmps} orders={D.orders} activeOrders={D.activeOrders}
              stats={stats} risks={risks} shiftFor={D.shiftFor} rateFor={D.rateFor} workDaysBetween={D.workDaysBetween}
              completing={completing} onComplete={completeTask} openModal={setModal} openPedido={setPedidoDetail} />
          ) : (<>
          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3" aria-label="Resumen de la semana">
            <Kpi label="Decorado de la semana" value={`${fmtInt(kpis.decoDone)} / ${fmtInt(kpis.decoPlan)}`} sub="galletas hechas / planeadas" />
            <Kpi label="Avance de tareas" value={`${kpis.pct}%`} sub="de lo asignado esta semana" tone={kpis.pct >= 80 ? 'ok' : undefined} />
            <Kpi label="Tareas sin asignar" value={String(kpis.unassigned)} sub="de la semana" tone={kpis.unassigned > 0 ? 'warn' : 'ok'} />
            <Kpi label="Pedidos grandes en riesgo" value={String(kpis.atRisk)} sub={`de ${bigOrders.length} activos`} tone={kpis.atRisk > 0 ? 'bad' : 'ok'} />
            <Kpi label="Regulares sin planificar" value={String(kpis.noPlan)} sub="próximos 7 días" tone={kpis.noPlan > 0 ? 'warn' : 'ok'} />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            {/* Big orders */}
            {tipo !== 'regulares' && (
              <section className={`${card} ${tipo === 'grandes' ? 'xl:col-span-3' : 'xl:col-span-2'} overflow-hidden`} aria-labelledby="big-h">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-baseline justify-between gap-3">
                  <h2 id="big-h" className="text-base font-semibold text-gray-900 dark:text-[#F5F3EF]">Pedidos grandes</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">200+ galletas · barra clara = planeado, sólida = hecho</span>
                </div>
                {bigOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay pedidos grandes activos.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {bigOrders.map(({ o, done, assigned, risk, detail, coverage }) => {
                      const daysLeft = o.due ? Math.round((startOfDay(o.due).getTime() - today.getTime()) / 86400000) : null;
                      return (
                        <li key={o.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <button type="button" onClick={() => setPedidoDetail(o.id)} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{o.label}</button>
                            <RiskPill risk={risk} size="sm" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {fmtInt(o.qty)} galletas · entrega {o.due ? o.due.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}
                              {daysLeft !== null && daysLeft >= 0 && ` (en ${daysLeft} d)`}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">· plan de decorado {coverage}%</span>
                            <button type="button" onClick={() => setModal({ kind: 'new', empleadoId: null, fecha: toKey(today), pedidoId: o.id })}
                              className="ml-auto h-8 px-2.5 flex items-center gap-1 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-[#382C2E] dark:text-gray-300 dark:hover:bg-white/5">
                              <PlusIcon size={12} /> Asignar
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                            {ETAPAS.map((e) => <StageBar key={e} etapa={e} done={done[e]} assigned={assigned[e]} total={o.qty} />)}
                          </div>
                          {detail && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{detail}</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Regular orders */}
            {tipo !== 'grandes' && (
              <section className={`${card} ${tipo === 'regulares' ? 'xl:col-span-3' : ''} overflow-hidden`} aria-labelledby="reg-h">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-baseline justify-between gap-3">
                  <h2 id="reg-h" className="text-base font-semibold text-gray-900 dark:text-[#F5F3EF]">Pedidos regulares</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">próximos 7 días</span>
                </div>
                {regularOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay pedidos regulares de galletas en los próximos 7 días.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/5 max-h-[420px] overflow-y-auto" tabIndex={0}>
                    {regularOrders.map(({ o, status, risk }) => {
                      const tone = status === 'Sin planificar' ? toneStyle('red', isDark) : status === 'Parcial' ? toneStyle('amber', isDark) : toneStyle('green', isDark);
                      const cls = '';
                      return (
                        <li key={o.id} className="px-4 py-2.5 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => setPedidoDetail(o.id)} className="block max-w-full text-left text-sm font-medium text-gray-900 truncate hover:underline dark:text-gray-100">{o.label}</button>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fmtInt(o.qty)} galletas · {o.due!.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                          <RiskPill risk={risk} size="sm" />
                          <span style={tone ?? undefined} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{status}</span>
                          <button type="button" onClick={() => setModal({ kind: 'new', empleadoId: null, fecha: toKey(today), pedidoId: o.id })}
                            aria-label={`Asignar tarea a ${o.label}`}
                            className="h-8 w-8 flex-shrink-0 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:border-[#382C2E] dark:hover:bg-white/5"><PlusIcon size={13} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Weekly board */}
          <section className={`${card} overflow-hidden`} aria-labelledby="board-h">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="board-h" className="text-base font-semibold text-gray-900 dark:text-[#F5F3EF]">Tablero de la semana</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {ETAPAS.map((e) => <span key={e} className="inline-flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${ETAPA_STYLE[e].dot}`} />{e}</span>)}
              </div>
            </div>
            {boardTasks.length === 0 && (
              <p className="px-4 pt-3 text-sm text-gray-500 dark:text-gray-400">No hay tareas en esta semana con los filtros actuales. La automatización las creará aquí, o haz clic en una celda para asignar una.</p>
            )}
            <div className="overflow-x-auto" tabIndex={0}>
              <table className="w-full min-w-[980px] border-collapse table-fixed">
                <colgroup><col style={{ width: 150 }} />{days.map((d) => <col key={toKey(d)} />)}</colgroup>
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#2C2325]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Empleado</th>
                    {days.map((d, i) => {
                      const isToday = toKey(d) === toKey(today);
                      return (
                        <th key={toKey(d)} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {DAY_NAMES[i]} <span className={`ml-1 inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? 'bg-rose-600 text-white' : ''}`}>{d.getDate()}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {unassignedInWeek.length > 0 && (
                    <tr className="border-t border-gray-100 dark:border-white/5 bg-amber-50/40 dark:bg-amber-500/5">
                      <td className="px-3 py-2 align-top text-sm font-semibold text-amber-800 dark:text-amber-200">Sin asignar</td>
                      {days.map((d) => (
                        <td key={toKey(d)} className="px-1.5 py-1.5 align-top border-l border-gray-100 dark:border-white/5">
                          <div className="space-y-1">{unassignedInWeek.filter((t) => t.fecha === toKey(d)).map(renderChip)}</div>
                        </td>
                      ))}
                    </tr>
                  )}
                  {rows.map((e) => {
                    const empTasks = boardTasks.filter((t) => t.empleadoId === e.id);
                    return (
                      <tr key={e.id} className="border-t border-gray-100 dark:border-white/5">
                        <td className="px-3 py-2 align-top">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{e.name}</div>
                        </td>
                        {days.map((d) => {
                          const key = toKey(d);
                          const hrs = D.hoursFor(e.id, d);
                          const cellTasks = empTasks.filter((t) => t.fecha === key);
                          const off = hrs <= 0;
                          return (
                            <td key={key}
                              onClick={() => setModal({ kind: 'new', empleadoId: e.id, fecha: key })}
                              className={`px-1.5 py-1.5 align-top border-l border-gray-100 dark:border-white/5 cursor-pointer transition-colors hover:bg-rose-50/60 dark:hover:bg-white/5 ${off ? 'bg-gray-50 dark:bg-black/20' : ''}`}
                              title={off ? 'No trabaja este día según su horario' : `${hrs.toFixed(1)} h disponibles`}>
                              {off && <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Descanso</div>}
                              <div className="space-y-1 min-h-[28px]">{cellTasks.map(renderChip)}</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          </>)}
          </div>
          )}
        </main>
      </div>

      {modal && D.tareasT && (
        <TaskModal mode={modal} orders={modalOrders} emps={D.activeEmps} rateFor={D.rateFor} tareasT={D.tareasT} stats={stats}
          etapas={modal.kind === 'edit' ? (modal.task.elementoId ? D.elementoById.get(modal.task.elementoId)?.etapas : undefined) : undefined}
          dueKeyFor={(id) => D.pedidoInfo.get(id)?.dueKey ?? ''}
          onClose={() => setModal(null)} onSaved={D.refetch} onDelete={requestDelete} />
      )}
      {pedidoDetail && D.orders.get(pedidoDetail) && (
        <PedidoProduccionModal order={D.orders.get(pedidoDetail)!} tasks={tasks} stats={stats} risk={risks.get(pedidoDetail)}
          empName={D.empName} today={today} openModal={setModal} onClose={() => setPedidoDetail(null)} />
      )}

      {pending.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[140] flex flex-col gap-2">
          {pending.map((p) => (
            <div key={p.key} className="w-72 max-w-[85vw] bg-white border border-[#E9D9D9] rounded-lg shadow-xl overflow-hidden dark:bg-[#251D1F] dark:border-[#382C2E]">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Tarea eliminada</span>
                <button type="button" onClick={() => undo(p.key)} className="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400">Deshacer</button>
              </div>
              <div className="h-1 bg-gray-100 dark:bg-white/10"><div className="h-full bg-rose-500 origin-left" style={{ animation: 'toastProgress 10s linear forwards' }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { parseKey };
