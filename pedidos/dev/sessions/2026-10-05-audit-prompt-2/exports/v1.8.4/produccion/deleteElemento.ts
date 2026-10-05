import { useCallback, useEffect, useRef, useState } from 'react';
import { useBase, useRecords } from '../lib/airtable-hooks';
import { TABLE_IDS } from '../utils';
import { fetchTableNow, deleteRecordStrict, tasksLinkedTo } from './airtableDirect';
import { TAREAS } from './constants';
import { setTaskOverlay, setElementTasksHidden, notifyProduccionChanged } from './useProduccionData';

/**
 * Deleting an element also deletes its production tasks: first the tasks, then the element.
 * `hide` removes the element's tasks from every view instantly (and `restore` brings them back, e.g. on "Deshacer");
 * `run` does the real deletion in Airtable and reports what was and wasn't deleted if something fails.
 */
export function useElementoDelete() {
  const { base } = useBase();
  const tareasT = base?.getTableById(TAREAS.TABLE) ?? null;
  const tareasR = useRecords(tareasT);
  const [notice, setNotice] = useState('');
  const refetchRef = useRef(tareasR.refetch);
  refetchRef.current = tareasR.refetch;
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 12000);
    return () => clearTimeout(t);
  }, [notice]);

  const hide = useCallback((elementoId: string) => { setTaskOverlay(elementoId, null); setElementTasksHidden(elementoId, true); }, []);
  const restore = useCallback((elementoId: string) => { setElementTasksHidden(elementoId, false); setTaskOverlay(elementoId, null); }, []);

  const run = useCallback(async (elementoId: string): Promise<boolean> => {
    const etapaDe = (f: Record<string, any>) => {
      const name = (tareasT?.getFieldById(TAREAS.ETAPA) as any)?.name as string | undefined;
      const v = f[TAREAS.ETAPA] ?? (name ? f[name] : undefined);
      return (typeof v === 'string' ? v : v?.name) || 'Tarea';
    };
    const deleted: string[] = []; const failed: string[] = [];
    let ok = false;
    try {
      // 1) Read the tasks straight from Airtable at this moment.
      const mine = tasksLinkedTo(await fetchTableNow(TAREAS.TABLE), tareasT, TAREAS.ELEMENTO, elementoId);
      // 2) Delete them (each one confirmed by Airtable).
      for (const t of mine) {
        try { await deleteRecordStrict(TAREAS.TABLE, t.id); deleted.push(etapaDe(t.fields)); }
        catch (e) { console.error(e); failed.push(etapaDe(t.fields)); }
      }
      // 3) Read again and make sure none is left before deleting the element.
      const left = tasksLinkedTo(await fetchTableNow(TAREAS.TABLE), tareasT, TAREAS.ELEMENTO, elementoId);
      if (left.length === 0) {
        await deleteRecordStrict(TABLE_IDS.elementos, elementoId);
        ok = true;
      } else {
        const leftNames = left.map((t) => etapaDe(t.fields));
        const gone = deleted.filter((n) => !leftNames.includes(n));
        setNotice(`No se eliminó el elemento. Tareas eliminadas: ${gone.join(', ') || 'ninguna'}. No se pudieron eliminar: ${leftNames.join(', ')}.`);
      }
    } catch (e) {
      console.error(e);
      setNotice(`No se eliminó el elemento. Tareas eliminadas: ${deleted.join(', ') || 'ninguna'}.${failed.length ? ` No se pudieron eliminar: ${failed.join(', ')}.` : ' Intenta de nuevo.'}`);
    }
    notifyProduccionChanged();
    try { await refetchRef.current(); } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, 600)); // let the views load the real data before dropping the instant view
    setElementTasksHidden(elementoId, false);
    setTaskOverlay(elementoId, null);
    return ok;
  }, [tareasT]);

  return { hide, restore, run, notice, clearNotice: () => setNotice('') };
}
