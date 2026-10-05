import { useMemo, createElement } from 'react';
import { choiceStyle, useIsDark } from '../components/airtableColors';
import { useProduccionData, elementoOculto, type Elemento, type Task } from './useProduccionData';
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
  /** Tono fuerte (chip/punto) y suave (fondo de tarjeta): claves de la paleta de Airtable. */
  fuerte: string;
  suave: string;
}

export const SEMAFORO: EstadoSemaforo[] = [
  { nivel: 0, clave: 'No iniciado', fuerte: 'purpleBright', suave: 'purpleLight2' },
  { nivel: 1, clave: 'Horneado listo', fuerte: 'redBright', suave: 'redLight2' },
  { nivel: 2, clave: 'Embetunado listo', fuerte: 'orangeBright', suave: 'orangeLight2' },
  { nivel: 3, clave: 'Decorado listo', fuerte: 'yellowBright', suave: 'yellowLight2' },
  { nivel: 4, clave: 'Empacado listo', fuerte: 'greenLight1', suave: 'greenLight2' },
  { nivel: 5, clave: 'Entregado', fuerte: 'greenBright', suave: 'greenLight1' },
];

/** Sin semáforo (pedido sin elementos con etapas) o aún cargando: único color neutro de la app. */
export const SEMAFORO_NEUTRO = {
  light: { backgroundColor: '#E5E9F0', color: '#1D1F25' },
  dark: { backgroundColor: '#2E2F30', color: '#C4C7CD' },
};
export function semaforoNeutroStyle(dark: boolean) { return dark ? SEMAFORO_NEUTRO.dark : SEMAFORO_NEUTRO.light; }

const NIVEL_ETAPA: Record<string, number> = { Horneado: 1, Embetunado: 2, Glaseado: 2, Decorado: 3, Empacado: 4 };

export interface Semaforo {
  nivel: number;
  /** Nombre de la etapa/estado, p. ej. "Horneado listo", "Glaseado listo", "No iniciado", "Entregado". */
  etapa: string;
  /** Columna del tablero: etapa siguiente a la última completada (0 Horneado, 1 Embetunado/Glaseado, 2 Decorado, 3 Empacado). */
  columna: number;
}

/** Columnas del tablero por etapa. */
export const COLUMNAS_TABLERO = ['Horneado', 'Embetunado / Glaseado', 'Decorado', 'Empacado'];
const COLUMNA_ETAPA: Record<string, number> = { Horneado: 0, Embetunado: 1, Glaseado: 1, Decorado: 2, Empacado: 3 };

function etiqueta(nivel: number, etapaNombre?: string): string {
  if (nivel === 2 && etapaNombre === 'Glaseado') return 'Glaseado listo';
  return SEMAFORO[nivel].clave;
}

export function semaforoStyle(nivel: number, tono: 'fuerte' | 'suave', dark: boolean) {
  const e = SEMAFORO[nivel] ?? SEMAFORO[0];
  return choiceStyle(tono === 'fuerte' ? e.fuerte : e.suave, dark)!;
}

/** Chip único de etapa (tono fuerte del mapa del semáforo). Usado por la lista del Día, Elementos, encabezado del elemento y "Etapa actual…". */
export function EtapaChip({ nivel, etapa }: { nivel: number; etapa: string }) {
  const dark = useIsDark();
  return createElement('span', {
    style: semaforoStyle(nivel, 'fuerte', dark),
    className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium whitespace-nowrap',
  }, etapa);
}

/** Estado de un elemento: última etapa completa (Estatus = Terminado). Entregado si el pedido lo está. */
export function calcSemaforoElemento(el: Pick<Elemento, 'etapas'>, tasksDelElemento: Task[], pedidoEntregado: boolean): Semaforo | null {
  if (!el.etapas.length) return null; // C1: solo Pastel, Plancha de cupcakes y Galletas
  if (pedidoEntregado) return { nivel: 5, etapa: 'Entregado', columna: 3 };
  let nivel = 0; let nombre: Etapa | undefined; let ultima = -1;
  el.etapas.forEach((e, i) => {
    const mine = tasksDelElemento.filter((t) => t.etapa === e);
    if (mine.length > 0 && mine.every((t) => t.estatus === 'Terminado') && (NIVEL_ETAPA[e] ?? 0) >= nivel) { nivel = NIVEL_ETAPA[e] ?? 0; nombre = e; ultima = i; }
  });
  // Misma función que da color y etapa: la columna es la etapa siguiente a la última completada.
  const siguiente = el.etapas[ultima + 1];
  const columna = ultima < 0 ? 0 : siguiente ? (COLUMNA_ETAPA[siguiente] ?? 0) : 3;
  return { nivel, etapa: etiqueta(nivel, nombre), columna };
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

export interface TarjetaTablero { elemento: Elemento; nivel: number; etapa: string; columna: number }

/** Último valor conocido por pedido: se conserva mientras se recargan los datos. */
const ultimo = new Map<string, Semaforo & { elemento: Elemento }>();
const ultimoTablero = new Map<string, TarjetaTablero[]>();
const ultimoElemento = new Map<string, TarjetaTablero>();

/** Hook compartido: se recalcula solo cuando cambian las tareas (incluye cambios instantáneos). */
export function useSemaforo() {
  const D = useProduccionData();
  return useMemo(() => {
    const porPedido = new Map<string, Elemento[]>();
    for (const el of D.elementos) if (el.pedidoId) { const a = porPedido.get(el.pedidoId) ?? []; a.push(el); porPedido.set(el.pedidoId, a); }
    const porElemento = new Map<string, Task[]>();
    for (const t of D.tasks) if (t.elementoId) { const a = porElemento.get(t.elementoId) ?? []; a.push(t); porElemento.set(t.elementoId, a); }
    const entregado = (estatus: string | null | undefined) => estatus === 'Entregado';
    const listo = D.dataReady;
    const incompleto = (els: Elemento[] | undefined) => !listo || !els || els.some((e) => e.productoPendiente);
    return {
      loading: D.loading,
      listo,
      pedido: (pedidoId: string, estatus: string | null | undefined) => {
        const els = porPedido.get(pedidoId);
        if (incompleto(els)) return ultimo.get(pedidoId) ?? null;
        const r = calcSemaforoPedido(els!, (id) => porElemento.get(id) ?? [], entregado(estatus));
        if (r) ultimo.set(pedidoId, r); else ultimo.delete(pedidoId);
        return r;
      },
      /** Tarjetas del tablero (una por elemento con etapas). Conserva el último valor mientras carga. */
      tarjetas: (pedidoId: string, estatus: string | null | undefined): TarjetaTablero[] => {
        if (!listo) return ultimoTablero.get(pedidoId) ?? [];
        // Pedido sin elementos (p. ej. se eliminó el último): no hay tarjetas ni valor conservado.
        const els = (porPedido.get(pedidoId) ?? []).filter((e) => !elementoOculto(e.id));
        const ent = entregado(estatus);
        const out: TarjetaTablero[] = [];
        for (const el of els) {
          const sem = el.productoPendiente ? null : calcSemaforoElemento(el, porElemento.get(el.id) ?? [], ent);
          if (sem) {
            const t = { elemento: el, nivel: sem.nivel, etapa: sem.etapa, columna: sem.columna };
            ultimoElemento.set(el.id, t); out.push(t);
          } else if (el.productoPendiente) {
            // Solo ese elemento conserva su último valor; los demás se calculan con datos actuales.
            const prev = ultimoElemento.get(el.id);
            if (prev) out.push({ ...prev, elemento: el });
          }
        }
        if (out.length) ultimoTablero.set(pedidoId, out); else ultimoTablero.delete(pedidoId);
        return out;
      },
      /** true mientras el semáforo del pedido todavía no puede calcularse (estado de carga neutro). */
      pendiente: (pedidoId: string) => !listo || (porPedido.get(pedidoId) ?? []).some((e) => e.productoPendiente),
      elemento: (elementoId: string, estatus: string | null | undefined) => {
        const el = D.elementoById.get(elementoId);
        return el && !el.productoPendiente && listo ? calcSemaforoElemento(el, porElemento.get(el.id) ?? [], entregado(estatus)) : null;
      },
    };
  }, [D.elementos, D.tasks, D.loading, D.dataReady, D.elementoById]);
}
export type SemaforoApi = ReturnType<typeof useSemaforo>;
