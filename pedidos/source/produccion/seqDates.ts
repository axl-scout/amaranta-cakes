/** Sequential dates between the stages of one element: a stage can't start before the end of the previous stage that has dates. */
export interface SeqItem { id: string; etapa: string; ini: string; fin: string }

const endOf = (i: SeqItem) => i.fin && i.fin > i.ini ? i.fin : i.ini;

/** Latest end among the tasks of the stage (items without a start are ignored). */
function stageEnd(items: SeqItem[], etapa: string): string {
  return items.filter((i) => i.etapa === etapa && i.ini).reduce((m, i) => (endOf(i) > m ? endOf(i) : m), '');
}

/** Earliest day a stage may start because of the previous stages ('' when no previous stage has dates). `etapas` is the element's own sequence. */
export function prevEnd(items: SeqItem[], etapas: string[], etapa: string, maxKey = ''): string {
  const idx = etapas.indexOf(etapa);
  for (let k = idx - 1; k >= 0; k--) {
    const e = stageEnd(items, etapas[k]!);
    if (e) return maxKey && e > maxKey ? maxKey : e;
  }
  return '';
}

/** After `fromEtapa` changed, pushes the later stages' dates forward so they stay consistent. Returns every item (changed ones have new dates). */
export function cascade(items: SeqItem[], etapas: string[], fromEtapa: string, maxKey = ''): SeqItem[] {
  const out = items.map((i) => ({ ...i }));
  let m = stageEnd(out, fromEtapa);
  const idx = etapas.indexOf(fromEtapa);
  if (idx < 0) return out;
  for (let j = idx + 1; j < etapas.length; j++) {
    const e = etapas[j]!;
    if (m) {
      const floor = maxKey && m > maxKey ? maxKey : m;
      out.forEach((i) => {
        if (i.etapa !== e || !i.ini) return;
        if (i.ini < floor) i.ini = floor;
        if (i.fin && i.fin < i.ini) i.fin = i.ini;
      });
    }
    const end = stageEnd(out, e);
    if (end) m = end;
  }
  return out;
}
