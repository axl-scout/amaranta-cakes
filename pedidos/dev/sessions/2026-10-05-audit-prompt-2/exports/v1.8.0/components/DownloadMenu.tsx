import React, { useState, useEffect, useRef } from 'react';
import { DownloadSimple as DownloadIcon, SpinnerGap as SpinnerIcon } from '@phosphor-icons/react';
import { useCurrentUser } from '../lib/airtable-hooks';
import { downloadSourcePdf, downloadSourceZip, downloadReadmePdf, downloadReadmeMd } from '../lib/downloads';

const ALLOWED_EMAILS = ['axel.mikey96@gmail.com', 'anava@singularagency.co'];

const OPTIONS: Array<{ label: string; run: () => void | Promise<void> }> = [
  { label: 'source.pdf', run: downloadSourcePdf },
  { label: 'source.zip', run: downloadSourceZip },
  { label: 'readme.pdf', run: downloadReadmePdf },
  { label: 'readme.md', run: downloadReadmeMd },
];

/** Download button with a dropdown (source.pdf, source.zip, readme.pdf, readme.md). Opens upwards. */
export function DownloadMenu({ bare = false, align = 'left' }: { bare?: boolean; align?: 'left' | 'right' }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { currentUser } = useCurrentUser();
  const allowed = !!currentUser?.email && ALLOWED_EMAILS.includes(currentUser.email.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const pick = async (run: () => void | Promise<void>) => {
    setBusy(true);
    try { await run(); } catch (e) { console.error(e); } finally { setBusy(false); }
  };

  if (!allowed) return <></>;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        aria-label="Descargar" title="Descargar código y README"
        className={`flex items-center justify-center h-10 w-10 rounded-xl text-gray-700 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-gray-300 ${bare ? 'hover:bg-gray-100 dark:hover:bg-white/10' : 'border border-[#E5E1DA] bg-white hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#382C2E] dark:hover:bg-white/5'}`}>
        {busy ? <SpinnerIcon size={18} className="animate-spin" /> : <DownloadIcon size={18} />}
      </button>
      {open && (
        <div role="menu" className={`absolute bottom-full mb-2 z-50 min-w-[10rem] rounded-xl border border-[#E5E1DA] bg-white p-1 shadow-lg dark:bg-[#251D1F] dark:border-[#382C2E] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {OPTIONS.map((o) => (
            <button key={o.label} type="button" role="menuitem" onClick={() => pick(o.run)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-rose-50 dark:text-gray-200 dark:hover:bg-white/10">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
