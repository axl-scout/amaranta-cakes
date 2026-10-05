import React from 'react';
import { Check as CheckIcon } from '@phosphor-icons/react';
import { ETAPAS, ETAPA_STYLE, type Etapa } from './constants';
import type { Task } from './useProduccionData';

export type StageState = 'done' | 'current' | 'pending';

/**
 * A stage is done when it has tasks and all of them have Estatus = Terminado (C3). The current stage is the first one not done.
 */
export function stageStates(qty: number, tasks: Task[], etapas: Etapa[] = ETAPAS): Record<Etapa, StageState> {
  const res = {} as Record<Etapa, StageState>;
  // C3: a task is complete when its Estatus is Terminado (nothing else).
  const raw = etapas.map((e) => {
    const mine = tasks.filter((t) => t.etapa === e);
    if (mine.length === 0) return false;
    const complete = mine.filter((t) => t.estatus === 'Terminado');
    return complete.length === mine.length;
  });
  // A stage also shows complete when any later stage is complete (visual only).
  const done = etapas.map((_, i) => raw.slice(i).some(Boolean));
  let currentSet = false;
  etapas.forEach((e, i) => {
    if (done[i]) res[e] = 'done';
    else if (!currentSet) { res[e] = 'current'; currentSet = true; }
    else res[e] = 'pending';
  });
  return res;
}

/** One stage: circle + small label under it. */
export function Stage({ etapa, state, onClick }: { etapa: Etapa; state: StageState; onClick?: (anchor: HTMLElement) => void }): React.ReactElement {
  const { hex, text } = ETAPA_STYLE[etapa];
  const Wrap: any = onClick && state !== 'done' ? 'button' : 'div';
  const wrapProps: any = onClick && state !== 'done' ? { type: 'button', onClick: (ev: any) => onClick(ev.currentTarget), title: `Completar ${etapa}`, 'aria-label': `Completar ${etapa}` } : {};
  return (
    <Wrap {...wrapProps} className={`relative flex-shrink-0 ${onClick && state !== 'done' ? 'cursor-pointer rounded-full hover:scale-110 transition-transform' : ''}`}>
      {state === 'done' ? (
        <span className="h-6 w-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: hex }}>
          <CheckIcon size={12} weight="bold" />
        </span>
      ) : state === 'current' ? (
        <span className="h-6 w-6 rounded-full border-[3px] flex items-center justify-center bg-white dark:bg-[#251D1F]" style={{ borderColor: hex }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
        </span>
      ) : (
        <span className="block h-6 w-6 rounded-full border border-gray-300 bg-white dark:border-gray-600 dark:bg-[#251D1F]" />
      )}
      <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-xs whitespace-nowrap ${state === 'pending' ? 'text-gray-400 dark:text-gray-500' : `font-medium ${text}`}`}>
        {etapa}
      </span>
    </Wrap>
  );
}

/** Read-only horizontal tracker of the four production stages. */
export function StageTracker({ states, etapas = ETAPAS, onStageClick }: { states: Record<Etapa, StageState>; etapas?: Etapa[]; onStageClick?: (e: Etapa, anchor: HTMLElement) => void }): React.ReactElement {
  return (
    <div className="flex items-center px-6 pb-6" aria-label={etapas.map((e) => `${e}: ${states[e] === 'done' ? 'completado' : states[e] === 'current' ? 'en curso' : 'pendiente'}`).join(', ')}>
      {etapas.map((e, i) => {
        const next = etapas[i + 1];
        let line: React.CSSProperties | null = null;
        if (next && states[e] === 'done') {
          // The last colored stretch (into the current stage) fades from this stage's color to the next one's.
          line = states[next] === 'done'
            ? { backgroundColor: ETAPA_STYLE[e].hex }
            : { backgroundImage: `linear-gradient(to right, ${ETAPA_STYLE[e].hex}, ${ETAPA_STYLE[next].hex})` };
        }
        return (
          <React.Fragment key={e}>
            <Stage etapa={e} state={states[e]} onClick={onStageClick ? (a) => onStageClick(e, a) : undefined} />
            {next && <span className={`flex-1 h-0.5 mx-1.5 rounded-full ${line ? '' : 'bg-gray-200 dark:bg-white/10'}`} style={line ?? undefined} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
