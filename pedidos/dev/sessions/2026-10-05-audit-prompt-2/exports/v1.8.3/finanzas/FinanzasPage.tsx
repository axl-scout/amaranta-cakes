import { useUrlParam } from '../lib/useUrlParam';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon, Plus as PlusIcon, CheckCircle as CheckCircleIcon,
  ArrowDown as ArrowDownIcon, Clock as ClockIcon, Warning as WarningIcon, Money as MoneyIcon, CreditCard as CardIcon,
  ArrowCounterClockwise as UndoIcon, ArrowClockwise as RefreshIcon, Scales as ScalesIcon,
} from '@phosphor-icons/react';
import { useBase, useRecords, useCreateRecord, useUpdateRecord } from '../lib/airtable-hooks';
import { PageToolbar } from '../components/SideMenu';
import { MiniCalendar } from '../components/Calendar';
import { toneStyle, useIsDark } from '../components/airtableColors';
import { TABLE_IDS, cv, cvs, readSelect, readLinked } from '../utils';
import { PAGOS, GASTOS, EMP, money, toKey, mondayOf, addDays, fmtShort, type FormaPago } from './constants';
import { readPago, readPedidoInfo, pagadoDe, type Pago } from './pagos';
import { PagoModal } from './PagoModal';
import { PedidoDetailStandalone } from '../components/PedidoDetailStandalone';

const card = 'bg-white border border-[#E5E1DA] rounded-xl dark:bg-[#251D1F] dark:border-[#382C2E]';
const cardHead = 'flex-shrink-0 px-4 h-11 bg-[#9A6B74] text-white dark:bg-[#4A3439] flex items-center justify-between gap-3';
const navBtn = 'h-10 w-10 flex-shrink-0 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 transition-colors flex items-center justify-center';
const bone = 'bg-gray-200/80 dark:bg-white/10 animate-pulse rounded-xl';

/** "Lun 23 Sep, 2026" */
function fmtEntrega(d: Date): string {
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const wd = cap(d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').slice(0, 3));
  const mo = cap(d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').slice(0, 3));
  return `${wd} ${d.getDate()} ${mo}, ${d.getFullYear()}`;
}

interface Nomina { id: string; empId: string | null; empName: string; monto: number; pagado: boolean; forma: string; semana: string }

/** Content-only skeleton: 4 summary tiles, "Próximas semanas" strip and the two lists (the toolbar is always real). */
function FinanzasContentSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4" aria-busy="true" role="status" aria-label="Cargando finanzas">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className={`${bone} h-[6.25rem]`} />)}</div>
      <div>
        <div className={`${bone} h-3.5 w-32 mb-2 rounded`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className={`${bone} h-[4.9rem]`} />)}</div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-[320px]">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-[#E5E1DA] dark:border-[#382C2E] flex flex-col">
            <div className={`${bone} !rounded-none h-11 flex-shrink-0`} />
            <div className="flex-1 p-4 space-y-4">{[0, 1, 2, 3, 4].map((j) => <div key={j} className={`${bone} h-8 rounded-lg`} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Defined at module level (not inside the page) so React keeps the same DOM node and the CSS transition can run.
// Summary tile: shows title + amount; click/tap expands it (the others shrink to make room) to reveal the detail.
// Expanding uses flex-grow inside a fixed-width row, so even the last tile grows toward the left and never leaves the content.
function Tile({ open, onToggle, title, amount, tone, Icon, children, signed = false }: { open: boolean; onToggle: () => void; title: string; amount: number; tone: React.CSSProperties; Icon: any; children: React.ReactNode; signed?: boolean }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open}
      style={{ flexGrow: open ? 2.2 : 1, flexBasis: 0, transition: 'flex-grow 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms, box-shadow 300ms' }}
      className={`${card} min-w-0 text-left px-3.5 py-3 h-[6.25rem] flex items-start overflow-hidden hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${open ? '!border-rose-300 dark:!border-rose-500/40 shadow-sm' : ''}`}>
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 h-7">
          <span className="h-7 w-7 rounded-lg flex items-center justify-center" style={tone}><Icon size={14} weight="bold" /></span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{title}</span>
        </div>
        <div className={`mt-2 text-[1.65rem] leading-9 font-bold tabular-nums whitespace-nowrap ${signed ? (amount >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-gray-900 dark:text-[#F5F3EF]'}`}>{signed ? (amount >= 0 ? '+' : '−') : ''}{money(Math.abs(amount))}</div>
      </div>
      <div aria-hidden={!open}
        className={`ml-auto pl-4 pt-1 overflow-hidden text-sm leading-5 text-gray-500 dark:text-gray-400 whitespace-nowrap ${open ? 'max-w-[20rem] opacity-100' : 'max-w-0 opacity-0'}`}
        style={{ transition: open ? 'max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease 0.15s' : 'max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease' }}>
        <div className="space-y-1">{children}</div>
      </div>
    </button>
  );
}

export function FinanzasPage(): React.ReactElement {
  const isDark = useIsDark();
  const { base, loading: baseLoading } = useBase();
  const pedT = base?.getTableById(TABLE_IDS.pedidos) ?? null;
  const pagT = base?.getTableById(PAGOS.TABLE) ?? null;
  const gasT = base?.getTableById(GASTOS.TABLE) ?? null;
  const empT = base?.getTableById(EMP.TABLE) ?? null;
  const pedR = useRecords(pedT);
  const pagR = useRecords(pagT);
  const gasR = useRecords(gasT);
  const empR = useRecords(empT);
  const { mutate: updateGasto } = useUpdateRecord(gasT);
  const { mutate: createGasto } = useCreateRecord(gasT);

  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [showCal, setShowCal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshAll = async () => {
    setRefreshing(true);
    try { await Promise.all([pedR.refetch(), pagR.refetch(), gasR.refetch(), empR.refetch()]); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };
  const [pagoFor, setPagoFor] = useState<string | null | undefined>(undefined); // undefined = closed, null = no preset
  const [payMenu, setPayMenu] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [detailId, setDetailId] = useUrlParam('pedido');
  const [openTile, setOpenTile] = useState<number | null>(null);
  // Order names in "Por cobrar" have priority: if they don't fit, the page's side margins shrink (1), then disappear (2).
  // Only if they still don't fit are names truncated.
  const [fit, setFit] = useState(0);
  const [truncate, setTruncate] = useState(false);
  const cobrarWrap = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const onResize = () => { setFit(0); setTruncate(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useLayoutEffect(() => { setFit(0); setTruncate(false); }, [week]);
  useLayoutEffect(() => {
    const el = cobrarWrap.current;
    if (!el || truncate) return;
    if (el.scrollWidth > el.clientWidth + 1) { if (fit < 2) setFit(fit + 1); else setTruncate(true); }
  });

  const pedidos = useMemo(() => pedR.records.map((r) => ({ info: readPedidoInfo(r, pedT) })), [pedR.records, pedT]);
  const pagos = useMemo(() => pagR.records.map((r) => readPago(r, pagT)), [pagR.records, pagT]);
  const pagosByPedido = useMemo(() => {
    const m = new Map<string, Pago[]>();
    pagos.forEach((p) => { if (!p.pedidoId) return; if (!m.has(p.pedidoId)) m.set(p.pedidoId, []); m.get(p.pedidoId)!.push(p); });
    return m;
  }, [pagos]);
  const empName = useMemo(() => new Map(empR.records.map((r) => [r.id, (cvs(r, empT, EMP.NOMBRE) || '').trim()])), [empR.records, empT]);
  const nominas: Nomina[] = useMemo(() => gasR.records
    .filter((r) => readSelect(cv(r, gasT, GASTOS.TIPO)) === 'Nómina')
    .map((r) => {
      const empId = readLinked(cv(r, gasT, GASTOS.EMPLEADO))[0]?.id ?? null;
      return {
        id: r.id, empId, empName: (empId && empName.get(empId)) || cvs(r, gasT, GASTOS.DESCRIPCION),
        monto: Number(cv(r, gasT, GASTOS.MONTO) ?? 0) || 0,
        pagado: readSelect(cv(r, gasT, GASTOS.ESTATUS)) === 'Pagado',
        forma: readSelect(cv(r, gasT, GASTOS.FORMA)),
        semana: String(cv(r, gasT, GASTOS.SEMANA) ?? '').slice(0, 10),
      };
    }), [gasR.records, gasT, empName]);

  // ── Weekly summary ──
  const summarize = (monday: Date) => {
    const start = monday.getTime(); const end = addDays(monday, 7).getTime(); const key = toKey(monday);
    const cobradoList = pagos.filter((p) => { const d = p.fecha ? new Date(p.fecha + 'T12:00:00').getTime() : NaN; return d >= start && d < end; });
    const cobrado = cobradoList.reduce((s, p) => s + p.monto, 0);
    const efectivo = cobradoList.filter((p) => p.forma === 'Efectivo').reduce((s, p) => s + p.monto, 0);
    const transfer = cobradoList.filter((p) => p.forma === 'Tarjeta / Transferencia').reduce((s, p) => s + p.monto, 0);
    const porCobrarList = pedidos
      .filter(({ info }) => info.due && info.due.getTime() >= start && info.due.getTime() < end)
      .map(({ info }) => { const pagado = pagadoDe(info, pagosByPedido.get(info.id) ?? []); return { info, pagado, restante: Math.max(0, info.total - pagado) }; })
      .filter((x) => x.restante > 0 || x.info.total === 0)
      .sort((a, b) => a.info.due!.getTime() - b.info.due!.getTime());
    const porCobrar = porCobrarList.reduce((s, x) => s + x.restante, 0);
    const nom = nominas.filter((n) => n.semana === key);
    const nomTotal = nom.reduce((s, n) => s + n.monto, 0);
    const nomPend = nom.filter((n) => !n.pagado).reduce((s, n) => s + n.monto, 0);
    return { key, cobrado, efectivo, transfer, sinForma: cobrado - efectivo - transfer, porCobrarList, porCobrar, nom, nomTotal, nomPend, balance: cobrado + porCobrar - nomTotal };
  };
  const S = useMemo(() => summarize(week), [week, pagos, pedidos, pagosByPedido, nominas]); // eslint-disable-line react-hooks/exhaustive-deps
  const thisMonday = mondayOf(new Date());
  const next = useMemo(() => [0, 1, 2, 3].map((i) => ({ monday: addDays(thisMonday, i * 7), s: summarize(addDays(thisMonday, i * 7)) })), [pagos, pedidos, pagosByPedido, nominas]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = baseLoading || (pedR.loading && pedR.records.length === 0) || (pagR.loading && pagR.records.length === 0) || (gasR.loading && gasR.records.length === 0);
  // The toolbar renders right away; only the content waits for data.

  const markPaid = async (n: Nomina, forma: FormaPago | null) => {
    setPayMenu(null);
    await updateGasto({ recordId: n.id, fields: forma
      ? { [GASTOS.ESTATUS]: 'Pagado', [GASTOS.FORMA]: forma, [GASTOS.FECHA]: new Date().toISOString() }
      : { [GASTOS.ESTATUS]: 'Proyectado', [GASTOS.FORMA]: null } });
    gasR.refetch();
  };
  const saveMonto = async (n: Nomina, v: string) => {
    const x = parseFloat(v);
    if (!(x >= 0) || x === n.monto) return;
    await updateGasto({ recordId: n.id, fields: { [GASTOS.MONTO]: x } });
    gasR.refetch();
  };
  const generarNomina = async (monday: Date) => {
    const key = toKey(monday);
    setGenerating(key);
    try {
      const ya = new Set(nominas.filter((n) => n.semana === key).map((n) => n.empId));
      for (const r of empR.records) {
        const activo = readSelect(cv(r, empT, EMP.ESTATUS)) === 'Activo';
        const sal = Number(cv(r, empT, EMP.SEMANAL) ?? 0) || 0;
        if (!activo || sal <= 0 || cv(r, empT, EMP.SOCIA) || ya.has(r.id)) continue;
        const sat = addDays(monday, 5); sat.setHours(12, 0, 0, 0);
        await createGasto({
          [GASTOS.DESCRIPCION]: `Nómina · ${(cvs(r, empT, EMP.NOMBRE) || '').trim()} · semana ${fmtShort(monday)}`,
          [GASTOS.TIPO]: 'Nómina', [GASTOS.ESTATUS]: 'Proyectado', [GASTOS.SEMANA]: key, [GASTOS.EMPLEADO]: [r.id],
          [GASTOS.MONTO]: sal, [GASTOS.FECHA]: sat.toISOString(), [GASTOS.CATEGORIA]: 'Nómina',
        });
      }
      gasR.refetch();
    } catch (e) { console.error(e); } finally { setGenerating(null); }
  };

  const isThisWeek = week.getTime() === thisMonday.getTime();
  const weekLabel = `${fmtShort(week)} – ${fmtShort(addDays(week, 6))}`;
  const green = toneStyle('green', isDark), amber = toneStyle('amber', isDark), red = toneStyle('red', isDark);

  return (
    <div className="h-screen overflow-hidden font-sans antialiased bg-[#F8F2F2] dark:bg-[#1B1517] flex flex-col">
        <PageToolbar>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setWeek(addDays(week, -7))} className={navBtn} aria-label="Semana anterior"><CaretLeftIcon size={13} /></button>
            <div className="relative">
              <button type="button" onClick={() => setShowCal((o) => !o)} onMouseDown={(e: any) => e.stopPropagation()}
                className="h-10 px-3 min-w-[170px] rounded-xl border border-gray-300 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-200">
                Semana {weekLabel}
              </button>
              {showCal && <MiniCalendar selectedDate={week} onSelectDate={(d) => { setWeek(mondayOf(d)); setShowCal(false); }} onClose={() => setShowCal(false)} />}
            </div>
            <button type="button" onClick={() => setWeek(addDays(week, 7))} className={navBtn} aria-label="Semana siguiente"><CaretRightIcon size={13} /></button>
            {!isThisWeek && (
              <button type="button" onClick={() => setWeek(thisMonday)} className="h-10 px-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-300">Hoy</button>
            )}
          </div>
          <button type="button" onClick={refreshAll} disabled={refreshing} aria-label="Actualizar datos" title="Actualizar datos"
            className="ml-auto h-10 w-10 flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#251D1F] dark:border-[#2E352C] dark:text-gray-300 dark:hover:bg-white/5">
            <RefreshIcon size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={() => setPagoFor(null)}
            className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
            <PlusIcon size={16} /><span className="hidden sm:inline">Registrar pago</span>
          </button>
        </PageToolbar>
      <div className={`flex-1 min-h-0 mx-auto flex flex-col overflow-hidden ${fit === 0 ? 'w-[90%]' : 'w-full'}`}>
        <main className={`flex-1 min-h-0 overflow-y-auto ${fit === 2 ? 'px-5' : 'px-3 sm:px-5 lg:px-7'} pt-4 pb-5 xl:[@media(min-height:720px)]:overflow-hidden`}>
          {loading ? <FinanzasContentSkeleton /> : (
          <div className="h-full flex flex-col gap-4">
            {/* Three big numbers */}
            <section className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 xl:flex gap-3" aria-label="Resumen de la semana">
              <Tile open={openTile === 0} onToggle={() => setOpenTile(openTile === 0 ? null : 0)} title="Cobrado" amount={S.cobrado} tone={green} Icon={CheckCircleIcon}>
                <div className="w-[14rem] space-y-1">
                  <div className="flex items-center gap-1.5"><MoneyIcon size={14} /> Efectivo <b className="ml-auto tabular-nums text-gray-700 dark:text-gray-300">{money(S.efectivo)}</b></div>
                  <div className="flex items-center gap-1.5"><CardIcon size={14} /> Tarjeta/Transferencia <b className="ml-auto tabular-nums text-gray-700 dark:text-gray-300">{money(S.transfer)}</b></div>
                  {S.sinForma > 0 && <div className="flex items-center gap-1.5 text-gray-400"><WarningIcon size={14} /> Sin especificar <span className="ml-auto tabular-nums">{money(S.sinForma)}</span></div>}
                </div>
              </Tile>
              <Tile open={openTile === 1} onToggle={() => setOpenTile(openTile === 1 ? null : 1)} title="Por cobrar" amount={S.porCobrar} tone={amber} Icon={ClockIcon}>
                <div>{S.porCobrarList.length} pedidos con saldo</div>
              </Tile>
              <Tile open={openTile === 2} onToggle={() => setOpenTile(openTile === 2 ? null : 2)} title="Nómina por pagar" amount={S.nomPend} tone={red} Icon={ArrowDownIcon}>
                <div>{S.nom.filter((n) => !n.pagado).length} de {S.nom.length} pendientes</div>
                <div>Total {money(S.nomTotal)}</div>
              </Tile>
              <Tile open={openTile === 3} onToggle={() => setOpenTile(openTile === 3 ? null : 3)} title="Balance de la semana" amount={S.balance} signed tone={S.balance >= 0 ? green : red} Icon={ScalesIcon}>
                <div className="w-[13rem] space-y-1 tabular-nums">
                  <div className="flex gap-3"><span>+ Cobrado</span><span className="ml-auto">{money(S.cobrado)}</span></div>
                  <div className="flex gap-3"><span>+ Por cobrar</span><span className="ml-auto">{money(S.porCobrar)}</span></div>
                  <div className="flex gap-3"><span>− Nómina</span><span className="ml-auto">{money(S.nomTotal)}</span></div>
                </div>
              </Tile>
            </section>


            {/* Next weeks */}
            <section className="flex-shrink-0" aria-labelledby="next-h">
              <h2 id="next-h" className="mb-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300">Próximas semanas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {next.map(({ monday, s }, i) => {
                  const active = monday.getTime() === week.getTime();
                  const missing = s.nom.length === 0;
                  return (
                    <button key={s.key} type="button" onClick={() => setWeek(monday)}
                      className={`${card} text-left px-3 py-2 transition-all hover:shadow-md ${active ? '!border-rose-400 ring-1 ring-rose-300 dark:ring-rose-500/40' : ''}`}>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{i === 0 ? 'Esta semana' : `${fmtShort(monday)} – ${fmtShort(addDays(monday, 6))}`}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums">Entra {money(s.cobrado + s.porCobrar)} · Nómina {money(s.nomTotal)}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-base font-bold tabular-nums ${s.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{s.balance >= 0 ? '+' : '−'}{money(Math.abs(s.balance))}</span>
                        {missing && <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><WarningIcon size={12} /> sin nómina</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:flex-1 xl:min-h-[320px]">
              {/* Por cobrar */}
              <section className={`${card} overflow-hidden flex flex-col max-h-[70vh] xl:max-h-none xl:min-h-0`} aria-labelledby="cobrar-h">
                <div className={cardHead}>
                  <h2 id="cobrar-h" className="text-sm font-semibold">Por cobrar esta semana</h2>
                  <span className="text-sm text-white/80 tabular-nums">{money(S.porCobrar)}</span>
                </div>
                {S.porCobrarList.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No hay saldos pendientes de pedidos que se entregan esta semana.</div>
                ) : (
                  <div ref={cobrarWrap} className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[#F3E7E9] dark:bg-[#2C2325]">
                        <tr className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                          <th scope="col" className="w-full pl-4 pr-2 py-2 font-semibold">Pedido</th>
                          <th scope="col" className="px-2 py-2 font-semibold whitespace-nowrap">Entrega</th>
                          <th scope="col" className="px-2 py-2 font-semibold text-right">Total</th>
                          <th scope="col" className="px-2 py-2 font-semibold text-right">Pagado</th>
                          <th scope="col" className="px-2 py-2 font-semibold text-right">Restante</th>
                          <th scope="col" className="pl-2 pr-4 py-2"><span className="sr-only">Acciones</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {S.porCobrarList.map(({ info, pagado, restante }) => (
                          <tr key={info.id} className="align-middle">
                            <td className={`pl-4 pr-2 py-2.5 ${truncate ? 'max-w-0 w-full' : 'whitespace-nowrap'}`}>
                              <button type="button" onClick={() => setDetailId(info.id)} title={info.label}
                                className={`block max-w-full text-left font-semibold text-gray-900 dark:text-gray-100 ${truncate ? 'truncate' : 'whitespace-nowrap'} hover:text-rose-600 dark:hover:text-rose-400 transition-colors`}>{info.label}</button>
                            </td>
                            <td className="px-2 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums">{fmtEntrega(info.due!)}</td>
                            {info.total === 0 ? (
                              <td colSpan={3} className="px-2 py-2.5 text-right whitespace-nowrap text-amber-700 dark:text-amber-300">
                                <span className="inline-flex items-center gap-1"><WarningIcon size={13} /> Sin precio</span>
                              </td>
                            ) : (<>
                              <td className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums text-gray-600 dark:text-gray-300">{money(info.total)}</td>
                              <td className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums text-gray-600 dark:text-gray-300">{money(pagado)}</td>
                              <td className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100">{money(restante)}</td>
                            </>)}
                            <td className="pl-2 pr-4 py-2 text-right whitespace-nowrap">
                              {info.total > 0 && (
                                <button type="button" onClick={() => setPagoFor(info.id)}
                                  className="h-8 px-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-rose-400 hover:text-rose-600 transition-colors dark:border-[#382C2E] dark:text-gray-300">
                                  Registrar pago
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Nómina */}
              <section className={`${card} overflow-hidden flex flex-col max-h-[70vh] xl:max-h-none xl:min-h-0`} aria-labelledby="nom-h">
                <div className={cardHead}>
                  <h2 id="nom-h" className="text-sm font-semibold">Nómina de la semana</h2>
                  <span className="text-sm text-white/80 tabular-nums">{money(S.nomTotal)}</span>
                </div>
                {S.nom.length === 0 ? (
                  <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Esta semana todavía no tiene nómina proyectada.</p>
                    <button type="button" onClick={() => generarNomina(week)} disabled={generating === S.key}
                      className="h-10 px-4 flex items-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-60">
                      <PlusIcon size={16} /> {generating === S.key ? 'Generando…' : 'Generar nómina con salarios semanales'}
                    </button>
                  </div>
                ) : (
                  <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                    {[...S.nom].sort((a, b) => Number(a.pagado) - Number(b.pagado) || a.empName.localeCompare(b.empName)).map((n) => (
                      <li key={n.id} className="px-4 py-2.5 flex items-center gap-3">
                        <span className={`flex-1 min-w-0 truncate font-medium ${n.pagado ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{n.empName}</span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                          <input key={`${n.id}-${n.monto}`} type="number" min="0" defaultValue={n.monto} disabled={n.pagado} aria-label={`Monto de ${n.empName}`}
                            onBlur={(e: any) => saveMonto(n, e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            className="bg-[#F7F2F2] w-full h-9 border border-gray-300 rounded-lg pl-6 pr-2 text-right text-base tabular-nums outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 disabled:bg-transparent disabled:border-transparent disabled:text-gray-400 dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:disabled:bg-transparent" />
                        </div>
                        <div className="relative min-w-[10rem] flex justify-end">
                          {n.pagado ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={green}>
                                {n.forma === 'Efectivo' ? <MoneyIcon size={12} /> : <CardIcon size={12} />} Pagado
                              </span>
                              <button type="button" onClick={() => markPaid(n, null)} title="Deshacer" aria-label={`Deshacer pago de ${n.empName}`}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5"><UndoIcon size={13} /></button>
                            </span>
                          ) : payMenu === n.id ? (
                            <span className="inline-flex gap-1">
                              <button type="button" onClick={() => markPaid(n, 'Efectivo')} className="h-8 px-2 rounded-lg border border-gray-300 text-xs font-medium inline-flex items-center gap-1 hover:border-rose-400 dark:border-[#382C2E] dark:text-gray-200"><MoneyIcon size={13} /> Efectivo</button>
                              <button type="button" onClick={() => markPaid(n, 'Tarjeta / Transferencia')} className="h-8 px-2 rounded-lg border border-gray-300 text-xs font-medium inline-flex items-center gap-1 hover:border-rose-400 dark:border-[#382C2E] dark:text-gray-200"><CardIcon size={13} /> Tarjeta/Transferencia</button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setPayMenu(n.id)}
                              className="h-8 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-rose-400 hover:text-rose-600 dark:border-[#382C2E] dark:text-gray-300">Marcar pagado</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
          )}
        </main>
      </div>

      {detailId && pedT && pedR.records.find((r) => r.id === detailId) && (
        <PedidoDetailStandalone record={pedR.records.find((r) => r.id === detailId)!} pedidosTable={pedT}
          onClose={() => setDetailId(null)} onDataChange={() => { pedR.refetch(); pagR.refetch(); }} />
      )}
      {pagoFor !== undefined && pagT && pedT && (
        <PagoModal pedidos={pedidos.map((p) => p.info)} pagosByPedido={pagosByPedido} presetPedidoId={pagoFor} pagosT={pagT} pedidosT={pedT}
          onClose={() => setPagoFor(undefined)} onSaved={() => { pagR.refetch(); pedR.refetch(); }} />
      )}
    </div>
  );
}
