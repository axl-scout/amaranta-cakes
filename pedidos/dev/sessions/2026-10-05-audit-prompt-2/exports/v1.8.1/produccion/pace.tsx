import React from 'react';
import { toneStyle, useIsDark } from '../components/airtableColors';
import { parseKey, startOfDay, fmtInt } from './constants';
import type { Task } from './useProduccionData';

export type Pace = 'Terminada' | 'Por empezar' | 'Sin empezar' | 'Adelantada' | 'A tiempo' | 'Retrasada' | 'Vencida' | 'Sin fecha';
export interface TaskPace { pace: Pace; detail: string }

const DAY = 86400000;

/**
 * Where a task stands against its planned window (start → end, both inclusive).
 * Expected progress grows evenly each day of the window: e.g. a 2-day task of 100 cookies
 * expects 50 done by the end of day 1 and 100 by the end of day 2.
 */
export function taskPace(t: Pick<Task, 'fecha' | 'fechaFin' | 'asignada' | 'completada' | 'estatus'>, today: Date): TaskPace {
  const done = t.estatus === 'Terminado' || (t.asignada > 0 && t.completada >= t.asignada);
  if (done) return { pace: 'Terminada', detail: '' };
  const ini = parseKey(t.fecha);
  if (!ini) return { pace: 'Sin fecha', detail: 'Falta la fecha de inicio' };
  const fin = parseKey(t.fechaFin) ?? ini;
  const d0 = startOfDay(today).getTime();
  const totalDays = Math.max(1, Math.round((fin.getTime() - ini.getTime()) / DAY) + 1);
  const falta = Math.max(0, t.asignada - t.completada);

  if (d0 < ini.getTime()) {
    const inDays = Math.round((ini.getTime() - d0) / DAY);
    if (t.completada > 0) return { pace: 'Adelantada', detail: `Ya lleva ${fmtInt(t.completada)} y empieza en ${inDays} d` };
    return { pace: 'Por empezar', detail: inDays === 1 ? 'Empieza mañana' : `Empieza en ${inDays} días` };
  }
  if (d0 > fin.getTime()) {
    const late = Math.round((d0 - fin.getTime()) / DAY);
    return { pace: 'Vencida', detail: `Debió terminar hace ${late} d · faltan ${fmtInt(falta)}` };
  }
  // Inside the window: compare against what should be done by the end of today.
  const dayIdx = Math.round((d0 - ini.getTime()) / DAY) + 1;
  const expected = Math.round((t.asignada * dayIdx) / totalDays);
  const daysLeft = totalDays - dayIdx + 1;
  const left = daysLeft === 1 ? 'hoy es el último día' : `quedan ${daysLeft} días`;
  if (t.completada === 0 && dayIdx > 1) return { pace: 'Sin empezar', detail: `Debió empezar hace ${dayIdx - 1} d · ${left}` };
  const margin = Math.max(1, Math.round(t.asignada * 0.1));
  const prevExpected = Math.round((t.asignada * (dayIdx - 1)) / totalDays);
  if (t.completada >= expected + margin) return { pace: 'Adelantada', detail: `${fmtInt(t.completada)} de ${fmtInt(expected)} esperadas hoy · ${left}` };
  if (t.completada < prevExpected) return { pace: 'Retrasada', detail: `${fmtInt(t.completada)} de ${fmtInt(expected)} esperadas hoy · ${left}` };
  return { pace: 'A tiempo', detail: `${fmtInt(t.completada)} de ${fmtInt(expected)} esperadas hoy · ${left}` };
}

export function PacePill({ pace, title, size = 'md' }: { pace: Pace; title?: string; size?: 'sm' | 'md' }) {
  const dark = useIsDark();
  const tone = pace === 'Vencida' || pace === 'Retrasada' || pace === 'Sin empezar' ? toneStyle('red', dark)
    : pace === 'Adelantada' || pace === 'Terminada' || pace === 'A tiempo' ? toneStyle('green', dark)
    : null;
  const cls = tone ? '' : 'border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10';
  return <span title={title} style={tone ?? undefined} className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${size === 'sm' ? 'px-1.5 py-px text-xs leading-4' : 'px-2.5 py-0.5 text-sm'} ${cls}`}>{pace}</span>;
}

/** "Lun 28 Sep" style short date for task windows. */
export function fmtTaskDay(key: string): string {
  const d = parseKey(key);
  if (!d) return '—';
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return `${cap(d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').slice(0, 3))} ${d.getDate()} ${cap(d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').slice(0, 3))}`;
}

export function taskWindow(t: Pick<Task, 'fecha' | 'fechaFin'>): string {
  if (!t.fecha) return 'Sin fecha';
  return !t.fechaFin || t.fechaFin === t.fecha ? fmtTaskDay(t.fecha) : `${fmtTaskDay(t.fecha)} – ${fmtTaskDay(t.fechaFin)}`;
}

