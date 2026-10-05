import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCreateRecord, useDeleteRecord, useUpdateRecord } from '../lib/airtable-hooks';
import { useEscClose } from '../lib/escStack';
import { useProduccionData, statsFor, type Order, type Task, type Elemento } from './useProduccionData';
import { TAREAS, ETAPAS, ETAPA_STYLE, fmtInt, type Etapa } from './constants';
import { StageTracker, stageStates } from './StageTracker';
import { TaskModal, type TaskModalMode } from './TaskModal';
import { taskPace, PacePill, fmtTaskDay } from './pace';

const th = 'px-3 py-2 text-sm font-semibold text-gray-700 text-left dark:text-gray-300';
const td = 'px-3 py-2 text-base text-gray-700 dark:text-gray-300';

/** Stage-state helper for one element (its own stages + quantity + its tasks). */
function elementStates(el: Elemento, tasks: Task[]) {
  return stageStates(el.cantidad, tasks.filter((t) => t.elementoId === el.id), el.etapas);
}

/** Position of a task's stage within its element's own stage sequence (single source: element.etapas). */
function stageIdx(etapas: Etapa[] | undefined, etapa: string): number {
  const i = (etapas ?? ETAPAS).indexOf(etapa as Etapa);
  return i < 0 ? 99 : i;
}

function TaskTable({ tasks, D, showElemento, onOpen }: {
  tasks: Task[]; D: ReturnType<typeof useProduccionData>; showElemento: boolean; onOpen: (t: Task) => void;
}): React.ReactElement {
  const heads = ['Etapa', ...(showElemento ? ['Elemento'] : []), 'Empleado', 'Inicio', 'Fin', 'Avance', 'Ritmo'];
  return (
    <div className="w-full rounded-xl border border-[#E5E1DA] overflow-x-auto dark:border-[#382C2E] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full min-w-[560px]">
        <thead className="bg-gray-50 border-b border-gray-200 dark:bg-white/5 dark:border-white/10">
          <tr>{heads.map((h) => <th key={h} className={th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {D.loading ? (
            <tr><td colSpan={heads.length} className="px-3 py-3"><div className="h-5 rounded bg-gray-100 dark:bg-white/10 animate-pulse" /></td></tr>
          ) : tasks.length === 0 ? (
            <tr><td colSpan={heads.length} className="px-3 py-3 text-sm text-gray-400 text-center dark:text-gray-600">Sin tareas.</td></tr>
          ) : tasks.map((t) => {
            const done = t.estatus === 'Terminado';
            const p = taskPace(t, D.today);
            return (
              <tr key={t.id} onClick={() => onOpen(t)} title="Clic para editar"
                className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-rose-50 transition-colors dark:border-white/5 dark:hover:bg-white/5">
                <td className={td}>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.etapa ? ETAPA_STYLE[t.etapa].hex : '#9ca3af' }} />{t.etapa || '—'}
                  </span>
                </td>
                {showElemento && <td className={td}>{t.elementoId ? D.elementoById.get(t.elementoId)?.nombre || '—' : '—'}</td>}
                <td className={`${td} whitespace-nowrap`}>{t.empleadoId ? D.empName.get(t.empleadoId) ?? '—' : <span className="text-gray-400 dark:text-gray-500">Sin asignar</span>}</td>
                <td className={`${td} whitespace-nowrap`}>{t.fecha ? fmtTaskDay(t.fecha) : '—'}</td>
                <td className={`${td} whitespace-nowrap`}>{t.fechaFin ? fmtTaskDay(t.fechaFin) : '—'}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{fmtInt(done ? t.asignada : t.completada)}/{fmtInt(t.asignada)}</td>
                <td className={td}><PacePill pace={p.pace} title={p.detail} size="sm" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function useTaskEditing(D: ReturnType<typeof useProduccionData>) {
  const { mutate: deleteTask } = useDeleteRecord(D.tareasT);
  const [modal, setModal] = useState<TaskModalMode | null>(null);
  const stats = useMemo(() => statsFor(D.tasks), [D.tasks]);
  return { modal, setModal, stats, deleteTask };
}

/** Order detail: all the order's tasks (with the element each belongs to) + a line with the most delayed element's current stage. */
export function PedidoTareasSection({ pedidoId, pedidoLabel }: { pedidoId: string; pedidoLabel: string }): React.ReactElement {
  const D = useProduccionData();
  const { modal, setModal, stats, deleteTask } = useTaskEditing(D);

  const order: Order = D.orders.get(pedidoId) ?? { id: pedidoId, label: pedidoLabel, cliente: '', due: null, estatus: '', qty: 0, elementoId: null, big: false };
  const groups = useMemo(() => {
    const byStage = (a: Task, b: Task, etapas?: Etapa[]) => stageIdx(etapas, a.etapa) - stageIdx(etapas, b.etapa) || a.fecha.localeCompare(b.fecha);
    const mine = D.tasks.filter((t) => t.pedidoId === pedidoId);
    const els = D.elementos.filter((el) => el.pedidoId === pedidoId);
    const out: { key: string; name: string; tasks: Task[] }[] = els.map((el) => ({
      key: el.id, name: el.nombre || 'Elemento',
      tasks: mine.filter((t) => t.elementoId === el.id).sort((a, b) => byStage(a, b, el.etapas)),
    }));
    const loose = mine.filter((t) => !t.elementoId || !els.some((el) => el.id === t.elementoId)).sort((a, b) => byStage(a, b));
    if (loose.length > 0) out.push({ key: 'sin-elemento', name: 'Sin elemento', tasks: loose });
    return out;
  }, [D.tasks, D.elementos, pedidoId]);

  // Most delayed element = the one whose current stage is the earliest in its own sequence.
  const delayed = useMemo(() => {
    let best: { el: Elemento; etapa: Etapa; idx: number } | null = null;
    D.elementos.filter((el) => el.pedidoId === pedidoId && el.etapas.length > 0).forEach((el) => {
      const st = elementStates(el, D.tasks);
      const idx = el.etapas.findIndex((e) => st[e] === 'current');
      if (idx >= 0 && (!best || idx < best.idx)) best = { el, etapa: el.etapas[idx], idx };
    });
    return best as { el: Elemento; etapa: Etapa; idx: number } | null;
  }, [D.elementos, D.tasks, pedidoId]);

  return (
    <div>
      {delayed && (
        <p className="mb-3 text-base text-gray-700 dark:text-gray-300">
          Etapa actual del elemento más atrasado:{' '}
          <span className="font-semibold" style={{ color: ETAPA_STYLE[delayed.etapa].hex }}>{delayed.etapa}</span>
          <span className="text-gray-500 dark:text-gray-400"> · {delayed.el.nombre || 'Elemento'}</span>
        </p>
      )}
      {groups.length === 0 ? (
        <TaskTable tasks={[]} D={D} showElemento={false} onOpen={() => {}} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <h4 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-200">{g.name}</h4>
              <TaskTable tasks={g.tasks} D={D} showElemento={false} onOpen={(t) => setModal({ kind: 'edit', task: t })} />
            </div>
          ))}
        </div>
      )}
      {modal && D.tareasT && (
        <TaskModal mode={modal} orders={[order]} emps={D.activeEmps} rateFor={D.rateFor} tareasT={D.tareasT} stats={stats} lockPedido siblings={D.tasks}
          etapas={modal.kind === 'edit' && modal.task.elementoId ? D.elementoById.get(modal.task.elementoId)?.etapas : undefined}
          dueKeyFor={(id) => D.pedidoInfo.get(id)?.dueKey ?? ''}
          onClose={() => setModal(null)} onSaved={D.refetch}
          onDelete={(id) => { Promise.resolve(deleteTask(id)).then(() => D.refetch()).catch((e) => console.error(e)); }} />
      )}
    </div>
  );
}

/** Element detail: stage tracker (click a stage to complete it) + only this element's tasks. */
export function ElementoTareasSection({ elementoId, reloadToken }: { elementoId: string; reloadToken?: unknown }): React.ReactElement {
  const D = useProduccionData();
  const { modal, setModal, stats, deleteTask } = useTaskEditing(D);
  const { mutate: createTask } = useCreateRecord(D.tareasT);
  const { mutate: updateTask } = useUpdateRecord(D.tareasT);
  const [ask, setAsk] = useState<{ etapa: Etapa; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  /** Optimistic view of this element's tasks while writes are in flight (cleared once the real data is refetched). */
  const [opt, setOpt] = useState<Task[] | null>(null);

  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } D.refetch(); }, [reloadToken]); // eslint-disable-line

  useEscClose(() => setAsk(null), !!ask);

  const el = D.elementoById.get(elementoId);
  const order: Order | undefined = el ? D.orders.get(el.pedidoId ?? '') : undefined;
  const tasks = useMemo(() => (opt ?? D.tasks.filter((t) => t.elementoId === elementoId)).slice().sort((a, b) =>
    (el ? el.etapas.indexOf(a.etapa as Etapa) - el.etapas.indexOf(b.etapa as Etapa) : 0) || a.fecha.localeCompare(b.fecha)), [D.tasks, elementoId, el, opt]);

  if (!el) return <div className="h-5 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />;
  const states = elementStates(el, tasks);
  const label = D.pedidoInfo.get(el.pedidoId ?? '')?.label ?? '';

  const answer = async (etapa: Etapa, complete: boolean) => {
    setAsk(null); setBusy(true); setNotice('');
    const saved: Etapa[] = [];
    const list = complete ? el.etapas.slice(0, el.etapas.indexOf(etapa) + 1) : [etapa];
    // Instant UI: show the expected result right away; real data replaces it after the refetch.
    {
      let next = tasks.slice();
      list.forEach((e, i) => {
        const mine = next.filter((t) => t.etapa === e);
        if (mine.length === 0) {
          next.push({ id: `tmp-${e}-${i}`, titulo: '', etapa: e, fecha: '', fechaFin: '', asignada: el.cantidad, completada: complete ? el.cantidad : 0,
            estatus: complete ? 'Terminado' : 'Pendiente', origen: 'Manual', notas: '', pedidoId: el.pedidoId, pedidoName: '', elementoId: el.id, empleadoId: null, creada: '' });
        } else if (complete) {
          next = next.map((t) => (t.etapa === e ? { ...t, estatus: 'Terminado', completada: t.asignada } : t));
        }
      });
      setOpt(next);
    }
    try {
      for (const e of list) {
        const mine = tasks.filter((t) => t.etapa === e);
        if (mine.length === 0) {
          await createTask({
            [TAREAS.TITULO]: `${label} · ${e} · ${el.cantidad}`,
            [TAREAS.ETAPA]: e,
            [TAREAS.ASIGNADA]: el.cantidad,
            [TAREAS.COMPLETADA]: complete ? el.cantidad : 0,
            [TAREAS.ESTATUS]: complete ? 'Terminado' : 'Pendiente',
            [TAREAS.ORIGEN]: 'Manual',
            ...(el.pedidoId ? { [TAREAS.PEDIDO]: [el.pedidoId] } : {}),
            [TAREAS.ELEMENTO]: [el.id],
          });
        } else if (complete) {
          for (const t of mine) {
            if (t.estatus === 'Terminado' && t.completada >= t.asignada) continue;
            await updateTask({ recordId: t.id, fields: { [TAREAS.ESTATUS]: 'Terminado', [TAREAS.COMPLETADA]: t.asignada } });
          }
        }
        saved.push(e);
      }
    } catch (err) {
      console.error(err);
      setNotice(`No se pudo ${complete ? 'completar la etapa' : 'crear la tarea'}.${saved.length ? ` Se guardaron: ${saved.join(', ')}.` : ''} Inténtalo de nuevo.`);
    }
    try { await D.refetch(); } finally { setOpt(null); setBusy(false); }
  };

  return (
    <div>
      <div className="pt-2 mb-4">
        {el.etapas.length > 0
          ? <StageTracker states={states} etapas={el.etapas} onStageClick={busy ? undefined : (e, a) => { const r = a.getBoundingClientRect(); setAsk({ etapa: e, x: r.left + r.width / 2, y: r.bottom }); }} />
          : <p className="text-sm text-gray-400 dark:text-gray-500">Este producto no tiene etapas de producción.</p>}
      </div>
      {notice && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{notice}</p>}
      <TaskTable tasks={tasks} D={D} showElemento={false} onOpen={(t) => { if (!t.id.startsWith('tmp-')) setModal({ kind: 'edit', task: t }); }} />

      {ask && (() => {
        const W = 256;
        const left = Math.max(8, Math.min(window.innerWidth - W - 8, ask.x - W / 2));
        const flip = ask.y + 140 > window.innerHeight;
        const top = flip ? Math.max(8, ask.y - 24 - 96) : ask.y + 28;
        return (
          <div className="fixed inset-0 z-[90]" onMouseDown={() => setAsk(null)}>
            <div role="dialog" aria-label="¿Completar tarea?" onMouseDown={(e: any) => e.stopPropagation()}
              className="absolute rounded-xl border border-[#E9D9D9] bg-white shadow-xl p-4 dark:bg-[#251D1F] dark:border-[#382C2E]" style={{ left, top, width: W }}>
              <p className="font-semibold text-base text-gray-900 dark:text-[#F5F3EF]">¿Completar tarea?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => answer(ask.etapa, true)} className="h-9 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700">Sí</button>
                <button type="button" onClick={() => answer(ask.etapa, false)} className="h-9 rounded-lg border border-[#E9D9D9] text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-[#382C2E] dark:text-gray-300 dark:hover:bg-white/5">No</button>
              </div>
            </div>
          </div>
        );
      })()}
      {modal && D.tareasT && order && (
        <TaskModal mode={modal} orders={[order]} emps={D.activeEmps} rateFor={D.rateFor} tareasT={D.tareasT} stats={stats} lockPedido
          etapas={el.etapas} siblings={D.tasks} dueKeyFor={(id) => D.pedidoInfo.get(id)?.dueKey ?? ''}
          onClose={() => setModal(null)} onSaved={D.refetch}
          onDelete={(id) => { Promise.resolve(deleteTask(id)).then(() => D.refetch()).catch((e) => console.error(e)); }} />
      )}
    </div>
  );
}
