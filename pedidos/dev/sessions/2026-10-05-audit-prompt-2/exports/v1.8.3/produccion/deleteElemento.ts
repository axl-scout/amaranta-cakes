import { useCallback, useEffect, useRef, useState } from 'react';
import { useBase, useRecords, useDeleteRecord } from '../lib/airtable-hooks';
import { TABLE_IDS, cv, readLinked, readSelect } from '../utils';
import { TAREAS } from './constants';
import { setTaskOverlay, notifyProduccionChanged } from './useProduccionData';

/**
 * Deleting an element also deletes its production tasks: first the tasks, then the element.
 * `hide` removes the element's tasks from every view instantly (and `restore` brings them back, e.g. on "Deshacer");
 * `run` does the real deletion in Airtable and reports what was and wasn't deleted if something fails.
 */
export function useElementoDelete() {
  const { base } = useBase();
  const tareasT = base?.getTableById(TAREAS.TABLE) ?? null;
  const elementosT = base?.getTableById(TABLE_IDS.elementos) ?? null;
  const tareasR = useRecords(tareasT);
  const recRef = useRef(tareasR.records);
  recRef.current = tareasR.records;
  const { mutate: deleteTask } = useDeleteRecord(tareasT);
  const { mutate: deleteEl } = useDeleteRecord(elementosT);
  const [notice, setNotice] = useState('');
  const refetchRef = useRef(tareasR.refetch);
  refetchRef.current = tareasR.refetch;
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 12000);
    return () => clearTimeout(t);
  }, [notice]);

  const hide = useCallback((elementoId: string) => setTaskOverlay(elementoId, []), []);
  const restore = useCallback((elementoId: string) => setTaskOverlay(elementoId, null), []);

  const run = useCallback(async (elementoId: string): Promise<boolean> => {
    await refetchRef.current();
    await new Promise((r) => setTimeout(r, 60));
    const mine = recRef.current
      .filter((r) => readLinked(cv(r, tareasT, TAREAS.ELEMENTO)).some((l) => l.id === elementoId))
      .map((r) => ({ id: r.id, etapa: readSelect(cv(r, tareasT, TAREAS.ETAPA)) || 'Tarea' }));
    const deleted: string[] = []; const failed: string[] = [];
    for (const t of mine) {
      try { await deleteTask(t.id); deleted.push(t.etapa); }
      catch (e) { console.error(e); failed.push(t.etapa); }
    }
    let ok = failed.length === 0;
    if (ok) {
      try { await deleteEl(elementoId); }
      catch (e) { console.error(e); ok = false; setNotice('No se pudo eliminar el elemento. Sus tareas sí se eliminaron.'); }
    } else {
      setNotice(`No se eliminó el elemento. Tareas eliminadas: ${deleted.join(', ') || 'ninguna'}. No se pudieron eliminar: ${failed.join(', ')}.`);
    }
    notifyProduccionChanged();
    try { await refetchRef.current(); } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, 500)); // let the other views load the real data before dropping the instant view
    setTaskOverlay(elementoId, null);
    return ok;
  }, [tareasT, deleteTask, deleteEl]);

  return { hide, restore, run, notice, clearNotice: () => setNotice('') };
}
