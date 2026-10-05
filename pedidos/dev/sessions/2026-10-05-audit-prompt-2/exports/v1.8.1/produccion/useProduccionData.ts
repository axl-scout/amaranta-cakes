import { useMemo, useCallback, useRef, useEffect } from 'react';
import { etapasDeProducto, toKey } from './constants';
import { useBase, useRecords, type AirtableRecord, type Table } from '../lib/airtable-hooks';
import { FIELD_IDS, TABLE_IDS, cv, cvs, readSelect, readLinked } from '../utils';
import {
  TAREAS, CAPACIDAD, EMPLEADOS, HORARIOS, ETAPAS, DEFAULT_RATE, BIG_THRESHOLD,
  type Etapa, parseKey, startOfDay, addDays,
} from './constants';

export interface Emp { id: string; name: string; numero: number; activo: boolean; produccion: boolean }
export interface Order {
  id: string; label: string; cliente: string; due: Date | null; estatus: string;
  qty: number; elementoId: string | null; big: boolean;
}
export interface Task {
  id: string; titulo: string; etapa: Etapa | ''; fecha: string; /** Planned end day; equals fecha when blank. */ fechaFin: string; asignada: number; completada: number;
  estatus: string; origen: string; notas: string; pedidoId: string | null; pedidoName: string;
  elementoId: string | null; empleadoId: string | null;
  /** Day (YYYY-MM-DD, local) the task record was created. */
  creada: string;
}
export interface Elemento {
  id: string; nombre: string; descripcion: string; cantidad: number; productoId: string | null; producto: string;
  pedidoId: string | null; etapas: Etapa[];
}
export interface OrderStats { assigned: Record<Etapa, number>; done: Record<Etapa, number>; count: number }

const zero = (): Record<Etapa, number> => ({ Horneado: 0, Embetunado: 0, Glaseado: 0, Decorado: 0, Empacado: 0 });

const PROD_EVENT = 'prod-data-changed';
/** Tells every mounted Producción data view to reload tasks and elements. */
export function notifyProduccionChanged() { window.dispatchEvent(new Event(PROD_EVENT)); }

export function useProduccionData() {
  const { base, loading: baseLoading, error: baseError } = useBase();
  const pedidosT = base?.getTableById(TABLE_IDS.pedidos) ?? null;
  const elementosT = base?.getTableById(TABLE_IDS.elementos) ?? null;
  const empT = base?.getTableById(EMPLEADOS.TABLE) ?? null;
  const horT = base?.getTableById(HORARIOS.TABLE) ?? null;
  const tareasT = base?.getTableById(TAREAS.TABLE) ?? null;
  const capT = base?.getTableById(CAPACIDAD.TABLE) ?? null;

  const pedidosR = useRecords(pedidosT);
  const elementosR = useRecords(elementosT);
  const empR = useRecords(empT);
  const horR = useRecords(horT);
  const tareasR = useRecords(tareasT);
  const capR = useRecords(capT);

  // Only the first load shows the skeleton; later refetches (e.g. after creating a task) keep the page as is,
  // even when a table is still empty.
  const firstLoadDone = useRef(false);
  const stillLoading = baseLoading || pedidosR.loading || tareasR.loading || empR.loading;
  if (!stillLoading && pedidosR.records.length > 0 && empR.records.length > 0) firstLoadDone.current = true;
  const loading = !firstLoadDone.current && (stillLoading || pedidosR.records.length === 0 || empR.records.length === 0) && !pedidosR.error && !tareasR.error && !baseError;
  const error = baseError || tareasR.error || pedidosR.error || null;

  const emps: Emp[] = useMemo(() => empR.records.map((r) => ({
    id: r.id,
    name: (cvs(r, empT, EMPLEADOS.NOMBRE) || '').trim() || 'Sin nombre',
    numero: Number(cv(r, empT, EMPLEADOS.NUMERO) ?? 999),
    activo: readSelect(cv(r, empT, EMPLEADOS.ESTATUS)) === 'Activo',
    produccion: EMPLEADOS.PRODUCCION ? !!cv(r, empT, EMPLEADOS.PRODUCCION) : true,
  })), [empR.records, empT]);

  const allActiveEmps = useMemo(() => emps.filter((e) => e.activo).sort((a, b) => a.numero - b.numero || a.name.localeCompare(b.name)), [emps]);
  // Only people who take part in cookie production appear in planning.
  const activeEmps = useMemo(() => allActiveEmps.filter((e) => e.produccion), [allActiveEmps]);
  const empName = useMemo(() => new Map(emps.map((e) => [e.id, e.name])), [emps]);

  // Horarios: latest vigencia per employee that started on/before a date.
  const horariosByEmp = useMemo(() => {
    const m = new Map<string, Array<{ desde: Date; rec: AirtableRecord }>>();
    for (const r of horR.records) {
      const empId = readLinked(cv(r, horT, HORARIOS.EMPLEADO))[0]?.id;
      if (!empId) continue;
      const desde = parseKey(cv(r, horT, HORARIOS.DESDE) as string) ?? new Date(2000, 0, 1);
      if (!m.has(empId)) m.set(empId, []);
      m.get(empId)!.push({ desde, rec: r });
    }
    m.forEach((arr) => arr.sort((a, b) => b.desde.getTime() - a.desde.getTime()));
    return m;
  }, [horR.records, horT]);

  // Shift (entrada/salida in seconds from midnight) for an employee on a date, or null if they don't work.
  const shiftFor = useCallback((empId: string, date: Date): { start: number; end: number } | null => {
    const arr = horariosByEmp.get(empId);
    if (!arr || arr.length === 0) return null;
    const h = arr.find((x) => x.desde.getTime() <= date.getTime()) ?? arr[arr.length - 1]!;
    const dow = (date.getDay() + 6) % 7;
    const [inF, outF] = HORARIOS.DAYS[dow]!;
    const a = cv(h.rec, horT, inF) as number | null;
    const b = cv(h.rec, horT, outF) as number | null;
    if (a == null || b == null || b <= a) return null;
    return { start: a, end: b };
  }, [horariosByEmp, horT]);

  const hoursFor = useCallback((empId: string, date: Date): number => {
    const s = shiftFor(empId, date);
    return s ? (s.end - s.start) / 3600 : 0;
  }, [shiftFor]);

  const capacity = useMemo(() => {
    const m = new Map<string, { id: string; gpd: number | null }>();
    for (const r of capR.records) {
      const empId = readLinked(cv(r, capT, CAPACIDAD.EMPLEADO))[0]?.id;
      const etapa = readSelect(cv(r, capT, CAPACIDAD.ETAPA));
      if (!empId || !etapa) continue;
      m.set(`${empId}|${etapa}`, { id: r.id, gpd: (cv(r, capT, CAPACIDAD.GPD) as number | null) ?? null });
    }
    return m;
  }, [capR.records, capT]);

  const rateFor = useCallback((empId: string | null, etapa: Etapa | ''): number => {
    if (!etapa) return DEFAULT_RATE.Decorado;
    const c = empId ? capacity.get(`${empId}|${etapa}`) : undefined;
    return c && c.gpd && c.gpd > 0 ? c.gpd : DEFAULT_RATE[etapa];
  }, [capacity]);

  // Cookie orders (pedidos with at least one "Galletas" elemento).
  const orders = useMemo(() => {
    const pedidoById = new Map(pedidosR.records.map((r) => [r.id, r]));
    const m = new Map<string, Order>();
    for (const el of elementosR.records) {
      const prod = readLinked(cv(el, elementosT, FIELD_IDS.EL_PRODUCTO))[0]?.name ?? cvs(el, elementosT, FIELD_IDS.EL_NOMBRE);
      if (!/galleta/i.test(prod || '')) continue;
      const pedidoId = readLinked(cv(el, elementosT, FIELD_IDS.EL_PEDIDOS))[0]?.id;
      if (!pedidoId) continue;
      const p = pedidoById.get(pedidoId);
      if (!p) continue;
      const qty = Number(cv(el, elementosT, FIELD_IDS.EL_CANTIDAD) ?? 0) || 0;
      const existing = m.get(pedidoId);
      if (existing) { existing.qty += qty; continue; }
      const dueRaw = cv(p, pedidosT, FIELD_IDS.FECHA_ENTREGA) as string | null;
      m.set(pedidoId, {
        id: pedidoId,
        label: cvs(p, pedidosT, FIELD_IDS.PEDIDO_ID) || 'Sin ID',
        cliente: cvs(p, pedidosT, FIELD_IDS.CLIENTE),
        due: dueRaw ? new Date(dueRaw) : null,
        estatus: readSelect(cv(p, pedidosT, FIELD_IDS.ESTATUS)),
        qty,
        elementoId: el.id,
        big: false,
      });
    }
    m.forEach((o) => { o.big = o.qty >= BIG_THRESHOLD; });
    return m;
  }, [pedidosR.records, elementosR.records, pedidosT, elementosT]);

  const tasks: Task[] = useMemo(() => tareasR.records.map((r) => {
    const ped = readLinked(cv(r, tareasT, TAREAS.PEDIDO))[0];
    return {
      id: r.id,
      titulo: cvs(r, tareasT, TAREAS.TITULO),
      etapa: (readSelect(cv(r, tareasT, TAREAS.ETAPA)) as Etapa) || '',
      fecha: String(cv(r, tareasT, TAREAS.FECHA) ?? '').slice(0, 10),
      fechaFin: String(cv(r, tareasT, TAREAS.FECHA_FIN) ?? cv(r, tareasT, TAREAS.FECHA) ?? '').slice(0, 10),
      asignada: Number(cv(r, tareasT, TAREAS.ASIGNADA) ?? 0) || 0,
      completada: Number(cv(r, tareasT, TAREAS.COMPLETADA) ?? 0) || 0,
      estatus: readSelect(cv(r, tareasT, TAREAS.ESTATUS)) || 'Pendiente',
      origen: readSelect(cv(r, tareasT, TAREAS.ORIGEN)),
      notas: cvs(r, tareasT, TAREAS.NOTAS),
      pedidoId: ped?.id ?? null,
      pedidoName: ped ? (orders.get(ped.id)?.label ?? ped.name) : '',
      elementoId: readLinked(cv(r, tareasT, TAREAS.ELEMENTO))[0]?.id ?? null,
      empleadoId: readLinked(cv(r, tareasT, TAREAS.EMPLEADO))[0]?.id ?? null,
      creada: r.createdTime ? toKey(new Date(r.createdTime)) : '',
    };
  }), [tareasR.records, tareasT, orders]);

  /** Every element of every order, with the stages its product type goes through. */
  const elementos: Elemento[] = useMemo(() => elementosR.records.map((el) => {
    const prod = readLinked(cv(el, elementosT, FIELD_IDS.EL_PRODUCTO))[0];
    const producto = prod?.name ?? '';
    return {
      id: el.id,
      nombre: cvs(el, elementosT, FIELD_IDS.EL_NOMBRE) || producto,
      descripcion: cvs(el, elementosT, FIELD_IDS.EL_DESCRIPCION),
      cantidad: Number(cv(el, elementosT, FIELD_IDS.EL_CANTIDAD) ?? 0) || 0,
      productoId: prod?.id ?? null,
      producto,
      pedidoId: readLinked(cv(el, elementosT, FIELD_IDS.EL_PEDIDOS))[0]?.id ?? null,
      etapas: etapasDeProducto(producto),
    };
  }), [elementosR.records, elementosT]);
  const elementoById = useMemo(() => new Map(elementos.map((e) => [e.id, e])), [elementos]);

  /** Order info for any order (not only cookies): ID text and production delivery day. */
  const pedidoInfo = useMemo(() => {
    const m = new Map<string, { label: string; dueKey: string }>();
    for (const p of pedidosR.records) {
      const raw = cv(p, pedidosT, FIELD_IDS.FECHA_ENTREGA) as string | null;
      m.set(p.id, { label: cvs(p, pedidosT, FIELD_IDS.PEDIDO_ID) || 'Sin ID', dueKey: raw ? (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : toKey(new Date(raw))) : '' });
    }
    return m;
  }, [pedidosR.records, pedidosT]);

  const today = startOfDay(new Date());

  // Active = not delivered and due no earlier than a week ago (or has any task).
  const activeOrders = useMemo(() => {
    const withTasks = new Set(tasks.map((t) => t.pedidoId).filter(Boolean) as string[]);
    const cutoff = addDays(today, -7);
    return Array.from(orders.values()).filter((o) =>
      o.estatus !== 'Entregado' && (withTasks.has(o.id) || (o.due && o.due.getTime() >= cutoff.getTime())));
  }, [orders, tasks, today.getTime()]);

  const teamRateFor = useCallback((etapa: Etapa) => activeEmps.reduce((s, e) => s + rateFor(e.id, etapa), 0), [activeEmps, rateFor]);

  const workDaysBetween = useCallback((from: Date, to: Date) => {
    let n = 0;
    for (let d = startOfDay(from); d.getTime() <= to.getTime(); d = addDays(d, 1)) {
      if (activeEmps.some((e) => hoursFor(e.id, d) > 0)) n++;
      if (n > 400) break;
    }
    return n;
  }, [activeEmps, hoursFor]);

  const rawRefetch = useCallback(() => { tareasR.refetch(); elementosR.refetch(); }, [tareasR.refetch, elementosR.refetch]);
  // Every refetch is broadcast so other mounted views (e.g. the order detail under the element detail) refresh too.
  const refetch = useCallback(() => { rawRefetch(); notifyProduccionChanged(); }, [rawRefetch]);
  useEffect(() => {
    window.addEventListener(PROD_EVENT, rawRefetch);
    return () => window.removeEventListener(PROD_EVENT, rawRefetch);
  }, [rawRefetch]);
  const refetchCap = useCallback(() => { capR.refetch(); }, [capR.refetch]);
  const refetchEmps = useCallback(() => { empR.refetch(); }, [empR.refetch]);

  return {
    loading, error, tareasT: tareasT as Table | null, capT: capT as Table | null, empT: empT as Table | null, allActiveEmps, refetchEmps,
    emps, activeEmps, empName, hoursFor, shiftFor, capacity, rateFor, teamRateFor, workDaysBetween,
    orders, activeOrders, tasks, today, refetch, refetchCap, elementos, elementoById, pedidoInfo,
  };
}

export function statsFor(tasks: Task[]): Map<string, OrderStats> {
  const m = new Map<string, OrderStats>();
  for (const t of tasks) {
    if (!t.pedidoId || !t.etapa) continue;
    if (!m.has(t.pedidoId)) m.set(t.pedidoId, { assigned: zero(), done: zero(), count: 0 });
    const s = m.get(t.pedidoId)!;
    s.assigned[t.etapa] += t.asignada;
    s.done[t.etapa] += Math.min(t.completada, t.asignada || t.completada);
    s.count++;
  }
  return m;
}

export { ETAPAS };
