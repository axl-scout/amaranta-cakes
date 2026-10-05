import { useMemo } from 'react';
import { choiceStyle } from '../components/airtableColors';
import { useProduccionData, type Elemento, type Task } from './useProduccionData';
import type { Etapa } from './constants';

/**
 * SEMÁFORO DE AVANCE — única fuente de verdad (solo frontend, sin campos calculados en Airtable).
 *
 * 1) MAPA ÚNICO: estado → nombre de color de Airtable → valores claro/oscuro (de la paleta de Airtable).
 *    Ninguna vista define colores propios: todas leen de aquí.
 * 2) FUNCIÓN ÚNICA: `calcSemaforoElemento` / `calcSemaforoPedido` (C4). Etapas y tipos de producto
 *    vienen de `etapasDeProducto` (C1, vía `Elemento.etapas`); una etapa está completa cuando su tarea
 *    tiene Estatus = Terminado (C3).
 */
export interface EstadoSemaforo {
  /** 0 = menos avance … 5 = Entregado. */
  nivel: number;
  /** Nombre corto del estado (para comparar). */
  clave: string;
  /** Color de opción select de Airtable (nombre original). */
  airtable: string;
  /** Tono fuerte (chip/punto) y suave (fondo de tarjeta): claves de la paleta de Airtable. */
  fuerte: string;
  suave: string;
}

export const SEMAFORO: EstadoSemaforo[] = [
  { nivel: 0, clave: 'No iniciado', airtable: 'purple', fuerte: 'purpleBright', suave: 'purpleLight2' },
  { nivel: 1, clave: 'Horneado listo', airtable: 'red', fuerte: 'redBright', suave: 'redLight2' },
  { nivel: 2, clave: 'Embetunado listo', airtable: 'orange', fuerte: 'orangeBright', suave: 'orangeLight2' },
  { nivel: 3, clave: 'Decorado listo', airtable: 'yellow', fuerte: 'yellowBright', suave: 'yellowLight2' },
  { nivel: 4, clave: 'Empacado listo', airtable: 'greenLight1', fuerte: 'greenLight1', suave: 'greenLight2' },
  { nivel: 5, clave: 'Entregado', airtable: 'green', fuerte: 'greenBright', suave: 'greenLight1' },
];

const NIVEL_ETAPA: Record<string, number> = { Horneado: 1, Embetunado: 2, Glaseado: 2, Decorado: 3, Empacado: 4 };

export interface Semaforo {
  nivel: number;
  /** Nombre de la etapa/estado, p. ej. "Horneado listo", "Glaseado listo", "No iniciado", "Entregado". */
  etapa: string;
}

function etiqueta(nivel: number, etapaNombre?: string): string {
  if (nivel === 2 && etapaNombre === 'Glaseado') return 'Glaseado listo';
  return SEMAFORO[nivel].clave;
}

export function semaforoStyle(nivel: number, tono: 'fuerte' | 'suave', dark: boolean) {
  const e = SEMAFORO[nivel] ?? SEMAFORO[0];
  return choiceStyle(tono === 'fuerte' ? e.fuerte : e.suave, dark)!;
}

/** Estado de un elemento: última etapa completa (Estatus = Terminado). Entregado si el pedido lo está. */
export function calcSemaforoElemento(el: Pick<Elemento, 'etapas'>, tasksDelElemento: Task[], pedidoEntregado: boolean): Semaforo | null {
  if (!el.etapas.length) return null; // C1: solo Pastel, Plancha de cupcakes y Galletas
  if (pedidoEntregado) return { nivel: 5, etapa: 'Entregado' };
  let nivel = 0; let nombre: Etapa | undefined;
  el.etapas.forEach((e) => {
    const mine = tasksDelElemento.filter((t) => t.etapa === e);
    if (mine.length > 0 && mine.every((t) => t.estatus === 'Terminado') && (NIVEL_ETAPA[e] ?? 0) >= nivel) { nivel = NIVEL_ETAPA[e] ?? 0; nombre = e; }
  });
  return { nivel, etapa: etiqueta(nivel, nombre) };
}

/** Estado de un pedido: el del elemento más atrasado (menor avance). null si no tiene elementos con etapas. */
export function calcSemaforoPedido(elementos: Elemento[], tasksDe: (elementoId: string) => Task[], pedidoEntregado: boolean): (Semaforo & { elemento: Elemento }) | null {
  let best: (Semaforo & { elemento: Elemento }) | null = null;
  for (const el of elementos) {
    const s = calcSemaforoElemento(el, tasksDe(el.id), pedidoEntregado);
    if (s && (!best || s.nivel < best.nivel)) best = { ...s, elemento: el };
  }
  return best;
}

/** Hook compartido: se recalcula solo cuando cambian las tareas (incluye cambios instantáneos). */
export function useSemaforo() {
  const D = useProduccionData();
  return useMemo(() => {
    const porPedido = new Map<string, Elemento[]>();
    for (const el of D.elementos) if (el.pedidoId) { const a = porPedido.get(el.pedidoId) ?? []; a.push(el); porPedido.set(el.pedidoId, a); }
    const porElemento = new Map<string, Task[]>();
    for (const t of D.tasks) if (t.elementoId) { const a = porElemento.get(t.elementoId) ?? []; a.push(t); porElemento.set(t.elementoId, a); }
    const entregado = (estatus: string | null | undefined) => estatus === 'Entregado';
    return {
      loading: D.loading,
      pedido: (pedidoId: string, estatus: string | null | undefined) => {
        const els = porPedido.get(pedidoId);
        if (!els) return null;
        return calcSemaforoPedido(els, (id) => porElemento.get(id) ?? [], entregado(estatus));
      },
      elemento: (elementoId: string, estatus: string | null | undefined) => {
        const el = D.elementoById.get(elementoId);
        return el ? calcSemaforoElemento(el, porElemento.get(el.id) ?? [], entregado(estatus)) : null;
      },
    };
  }, [D.elementos, D.tasks, D.loading, D.elementoById]);
}
export type SemaforoApi = ReturnType<typeof useSemaforo>;
