import React, { useMemo } from 'react';
import { useSemaforo, semaforoStyle, EtapaChip, COLUMNAS_TABLERO, type TarjetaTablero } from '../produccion/semaforo';
import { useIsDark } from './airtableColors';
import { formatFriendlyDateTime, toTitleCase } from '../utils';

export interface PedidoTablero { id: string; pid: string; fecha: string | null; estatus: string }

/** Tablero de solo lectura: una tarjeta por elemento, una columna por etapa. */
export function TableroEtapas({ pedidos, loading, onOpen }: { pedidos: PedidoTablero[]; loading: boolean; onOpen: (pedidoId: string) => void }) {
  const semaforo = useSemaforo();
  const dark = useIsDark();
  const columnas = useMemo(() => {
    const cols: { p: PedidoTablero; t: TarjetaTablero }[][] = COLUMNAS_TABLERO.map(() => []);
    for (const p of pedidos) for (const t of semaforo.tarjetas(p.id, p.estatus)) cols[t.columna]!.push({ p, t });
    const ms = (f: string | null) => { const n = f ? new Date(f).getTime() : NaN; return isNaN(n) ? Infinity : n; };
    cols.forEach((c) => c.sort((a, b) => { const x = ms(a.p.fecha), y = ms(b.p.fecha); return x === y ? 0 : x < y ? -1 : 1; }));
    return cols;
  }, [pedidos, semaforo]);
  const cargando = loading || !semaforo.listo;
  const hayAlgo = columnas.some((c) => c.length > 0);

  return (
    <div className="flex-1 min-h-0 px-4 sm:px-7 pb-5 flex gap-3 overflow-x-auto snap-x snap-mandatory sm:snap-none">
      {COLUMNAS_TABLERO.map((titulo, i) => (
        <section key={titulo} className="snap-start flex-shrink-0 w-[85%] sm:w-auto sm:flex-1 sm:min-w-[220px] flex flex-col min-h-0 rounded-xl bg-white/60 border border-[#E5E1DA] dark:bg-[#251D1F]/60 dark:border-[#382C2E]">
          <header className="flex items-center justify-between px-3 py-2 border-b border-[#E5E1DA] dark:border-[#382C2E]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{titulo}</h3>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{cargando && !hayAlgo ? '' : columnas[i]!.length}</span>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {cargando && !hayAlgo
              ? [0, 1, 2].map((k) => <div key={k} aria-hidden className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />)
              : columnas[i]!.length === 0
                ? <p className="text-sm text-gray-400 dark:text-gray-600 px-1 py-2">Sin elementos.</p>
                : columnas[i]!.map(({ p, t }) => (
                  <button key={p.id + t.elemento.id} type="button" onClick={() => onOpen(p.id)}
                    style={semaforoStyle(t.nivel, 'suave', dark)}
                    className="w-full text-left rounded-xl p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="font-bold text-base">{toTitleCase(p.pid || 'Sin ID')}</div>
                    <div className="text-sm mt-0.5 opacity-90">{t.elemento.nombre || 'Elemento'}{t.elemento.cantidad ? ` × ${t.elemento.cantidad}` : ''}</div>
                    <div className="text-sm mt-1 opacity-75">{formatFriendlyDateTime(p.fecha)}</div>
                    <div className="mt-2"><EtapaChip nivel={t.nivel} etapa={t.etapa} /></div>
                  </button>
                ))}
          </div>
        </section>
      ))}
    </div>
  );
}
