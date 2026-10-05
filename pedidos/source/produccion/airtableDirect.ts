import { BASE_ID, PROJECT_ID } from '../lib/airtable-hooks';
import type { Table } from '../lib/airtable-hooks';
import { readLinked } from '../utils';

declare const __GENERATION_ID__: string | null;
declare const __COMPILE_ID__: string | null;
const API = '/canvas/api/proxy';

function call(url: string, init?: RequestInit): Promise<Response> {
  const h = new Headers(init?.headers);
  if (PROJECT_ID) h.set('X-Project-Id', PROJECT_ID);
  if (typeof __GENERATION_ID__ !== 'undefined' && __GENERATION_ID__) h.set('X-Generation-Id', __GENERATION_ID__);
  if (typeof __COMPILE_ID__ !== 'undefined' && __COMPILE_ID__) h.set('X-Compile-Id', __COMPILE_ID__);
  return fetch(url, { ...init, cache: 'no-store', headers: h });
}

/** Reads a table straight from Airtable right now (never from data already on screen). Throws on failure. */
export async function fetchTableNow(tableId: string): Promise<Array<{ id: string; fields: Record<string, any> }>> {
  const out: Array<{ id: string; fields: Record<string, any> }> = [];
  let offset = '';
  for (let i = 0; i < 50; i++) {
    const res = await call(`${API}/bases/${BASE_ID}/tables/${tableId}/records${offset ? `?offset=${encodeURIComponent(offset)}` : ''}`);
    if (!res.ok) throw new Error(`No se pudo leer la tabla (${res.status})`);
    const data = await res.json();
    out.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
  }
  return out;
}

/** Deletes one record and throws if Airtable did not confirm it (unlike the hook, which swallows errors). */
export async function deleteRecordStrict(tableId: string, recordId: string): Promise<void> {
  const res = await call(`${API}/bases/${BASE_ID}/tables/${tableId}/records/${recordId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`No se pudo eliminar (${res.status})`);
  const data = await res.json().catch(() => ({}));
  if (data && data.deleted === false) throw new Error('No se pudo eliminar');
}

/** Tasks in a freshly-read table whose "Elemento" link contains the element. */
export function tasksLinkedTo(
  records: Array<{ id: string; fields: Record<string, any> }>, table: Table | null, fieldId: string, elementoId: string,
): Array<{ id: string; fields: Record<string, any> }> {
  const name = (table?.getFieldById(fieldId) as any)?.name as string | undefined;
  return records.filter((r) => {
    const v = r.fields[fieldId] ?? (name ? r.fields[name] : undefined);
    return readLinked(v).some((l) => l.id === elementoId);
  });
}
