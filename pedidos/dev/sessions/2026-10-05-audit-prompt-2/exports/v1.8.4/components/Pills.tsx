import React from 'react';
import { estatusStyle, toneStyle, useIsDark } from './airtableColors';

export function ContactoPill({ value, large = false }: { value: string | null | undefined; large?: boolean }): React.ReactElement {
  const dark = useIsDark();
  if (!value) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const lower = value.toLowerCase();
  let classes = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10';
  if (lower === 'whatsapp') classes = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
  else if (lower === 'facebook') classes = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
  else if (lower === 'instagram') classes = 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30';
  const sizeClass = large ? 'px-4 py-1.5 text-base font-semibold' : 'px-2.5 py-0.5 text-sm font-medium';
  if (lower === 'whatsapp') return <span style={toneStyle('green', dark)} className={`inline-flex items-center rounded-full whitespace-nowrap ${sizeClass}`}>{value}</span>;
  return <span className={`inline-flex items-center rounded-full border whitespace-nowrap ${sizeClass} ${classes}`}>{value}</span>;
}

/** Estatus chip using the choice color configured in Airtable (no border, Airtable fill/text). */
export function EstatusPill({ value, large = false }: { value: string | null | undefined; large?: boolean }): React.ReactElement {
  const dark = useIsDark();
  const style = estatusStyle(value, dark);
  const size = large ? 'px-4 py-1.5 text-base font-semibold' : 'px-2.5 py-0.5 text-sm font-medium';
  return (
    <span style={style ?? undefined}
      className={`inline-flex items-center rounded-full whitespace-nowrap ${size} ${style ? '' : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'}`}>
      {value || 'Sin estatus'}
    </span>
  );
}

/** Small color dot for an estatus option, using its Airtable color. */
export function EstatusDot({ value }: { value: string }): React.ReactElement {
  const dark = useIsDark();
  const style = estatusStyle(value, dark);
  return <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-300" style={style ? { backgroundColor: style.backgroundColor } : undefined} />;
}

export function ImpresoPill({ value }: { value: boolean | null | undefined }): React.ReactElement {
  const isImpreso = Boolean(value);
  const classes = isImpreso
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30'
    : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/10 dark:text-gray-500 dark:border-white/10';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border whitespace-nowrap ${classes}`}>{isImpreso ? 'Impreso' : 'No impreso'}</span>;
}
