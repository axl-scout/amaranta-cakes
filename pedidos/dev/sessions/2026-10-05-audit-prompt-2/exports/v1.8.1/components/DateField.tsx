import React, { useState } from 'react';
import { Calendar as CalendarIcon } from '@phosphor-icons/react';
import { MiniCalendar } from './Calendar';

function parse(v: string): Date | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
function key(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Standard date input for the whole app: a field that opens the shared MiniCalendar popup. Value is YYYY-MM-DD. */
export function DateField({ id, value, onChange, className = '', placeholder = 'Elegir día', ariaLabel, min, max }: {
  id?: string; value: string; onChange: (v: string) => void; className?: string; placeholder?: string; ariaLabel?: string; /** YYYY-MM-DD bounds */ min?: string; max?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const d = parse(value);
  const label = d ? d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <div className="relative">
      <button id={id} type="button" onMouseDown={(e: any) => e.stopPropagation()} onClick={() => setOpen((o) => !o)} aria-label={ariaLabel} aria-expanded={open}
        className={`${className} flex items-center justify-between gap-2 text-left`}>
        <span className={`truncate first-letter:uppercase ${d ? '' : 'text-gray-400'}`}>{label || placeholder}</span>
        <CalendarIcon size={15} className="flex-shrink-0 text-gray-400" />
      </button>
      {open && (
        <MiniCalendar selectedDate={d ?? new Date()} onSelectDate={(nd) => { onChange(key(nd)); setOpen(false); }} onClose={() => setOpen(false)} minKey={min} maxKey={max} />
      )}
    </div>
  );
}
