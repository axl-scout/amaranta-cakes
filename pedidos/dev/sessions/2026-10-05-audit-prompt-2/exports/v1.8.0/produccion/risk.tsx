import { toneStyle, useIsDark } from '../components/airtableColors';
import { ETAPAS, startOfDay, type Etapa } from './constants';
import type { Order, OrderStats } from './useProduccionData';

export type Risk = 'Completado' | 'A tiempo' | 'En riesgo' | 'Retrasado' | 'Sin fecha';
export interface OrderRisk { risk: Risk; detail: string }

const zero = (): Record<Etapa, number> => ({ Horneado: 0, Embetunado: 0, Glaseado: 0, Decorado: 0, Empacado: 0 });
export const statOf = (stats: Map<string, OrderStats>, id: string): OrderStats =>
  stats.get(id) ?? { assigned: zero(), done: zero(), count: 0 };

/**
 * Urgency for every order.
 * - Grandes: earliest-due-first — cumulative remaining decorado vs. the team's decorating capacity until each due date.
 * - Regulares: stages still pending vs. days left (≈ half a day per stage), and anything unplanned close to delivery.
 */
export function computeRisks(
  orders: Order[], stats: Map<string, OrderStats>, today: Date, teamDeco: number,
  workDaysBetween: (a: Date, b: Date) => number,
): Map<string, OrderRisk> {
  const m = new Map<string, OrderRisk>();
  const base = (o: Order): Risk | null => {
    const s = statOf(stats, o.id);
    if (o.qty > 0 && s.done.Empacado >= o.qty) return 'Completado';
    if (!o.due) return 'Sin fecha';
    if (startOfDay(o.due).getTime() < today.getTime()) return 'Retrasado';
    return null;
  };

  let cumulative = 0;
  [...orders].filter((o) => o.big).sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity)).forEach((o) => {
    const s = statOf(stats, o.id);
    cumulative += Math.max(0, o.qty - s.done.Decorado);
    const b = base(o);
    if (b) { m.set(o.id, { risk: b, detail: '' }); return; }
    const avail = workDaysBetween(today, startOfDay(o.due!));
    const need = teamDeco > 0 ? cumulative / teamDeco : Infinity;
    m.set(o.id, {
      risk: need > avail ? 'En riesgo' : 'A tiempo',
      detail: `Decorado restante ≈ ${need === Infinity ? '—' : need.toFixed(1)} días de equipo · ${avail} días hábiles`,
    });
  });

  orders.filter((o) => !o.big).forEach((o) => {
    const b = base(o);
    if (b) { m.set(o.id, { risk: b, detail: '' }); return; }
    const s = statOf(stats, o.id);
    const daysLeft = Math.round((startOfDay(o.due!).getTime() - today.getTime()) / 86400000);
    const stagesLeft = ETAPAS.filter((e) => s.done[e] < o.qty).length;
    const fullyPlanned = ETAPAS.every((e) => s.assigned[e] >= o.qty);
    let risk: Risk = 'A tiempo';
    if (daysLeft < Math.ceil(stagesLeft / 2)) risk = 'En riesgo';
    else if (daysLeft <= 2 && !fullyPlanned) risk = 'En riesgo';
    m.set(o.id, { risk, detail: `${stagesLeft} etapas pendientes · entrega en ${daysLeft} d` });
  });
  return m;
}

export function RiskPill({ risk, size = 'md' }: { risk: Risk; size?: 'sm' | 'md' }) {
  const dark = useIsDark();
  const tone = risk === 'Retrasado' ? toneStyle('red', dark) : risk === 'En riesgo' ? toneStyle('amber', dark) : risk === 'A tiempo' || risk === 'Completado' ? toneStyle('green', dark) : null;
  const cls = tone ? '' : 'border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10';
  return <span style={tone ?? undefined} className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${size === 'sm' ? 'px-1.5 py-px text-xs leading-4' : 'px-2.5 py-0.5 text-sm'} ${cls}`}>{risk}</span>;
}
