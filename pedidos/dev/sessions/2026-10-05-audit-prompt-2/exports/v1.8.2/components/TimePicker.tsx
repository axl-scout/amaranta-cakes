import React, { useState, useEffect, useRef } from 'react';
import { CaretUp as CaretUpIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import {
  to12h, to24h, fmtTimeDisplay, parseTimeValue, snapToValidMinute,
  SPIN_HOURS, SPIN_MINUTE_VALS, SPIN_MINUTES, SPIN_PERIODS,
} from '../utils';

function SpinnerColumn({ values, index, onPrev, onNext }: {
  values: readonly string[]; index: number; onPrev: () => void; onNext: () => void;
}): React.ReactElement {
  const colRef = useRef<any>(null);
  const prevRef = useRef(onPrev);
  const nextRef = useRef(onNext);
  useEffect(() => { prevRef.current = onPrev; nextRef.current = onNext; });
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const handle = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) nextRef.current(); else prevRef.current();
    };
    el.addEventListener('wheel', handle, { passive: false });
    return () => el.removeEventListener('wheel', handle);
  }, []);
  const btnCls = 'p-0.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:hover:text-rose-200 dark:hover:bg-white/5';
  const nc = 'text-lg font-bold text-gray-800 dark:text-gray-200 w-9 text-center tabular-nums select-none';
  return (
    <div ref={colRef} className="flex flex-col items-center select-none" style={{ userSelect: 'none' }}>
      <button type="button" onMouseDown={(e: any) => e.preventDefault()} onClick={onPrev} className={btnCls} aria-label="Anterior"><CaretUpIcon size={13} /></button>
      <div className={nc}>{values[index]}</div>
      <button type="button" onMouseDown={(e: any) => e.preventDefault()} onClick={onNext} className={btnCls} aria-label="Siguiente"><CaretDownIcon size={13} /></button>
    </div>
  );
}

export function CustomTimePicker({ value, onChange, placeholder = 'Hora', bare = false }: {
  value: string; onChange: (value: string) => void; placeholder?: string;
  /** No own border/background — for use inside a combined date + time field. */
  bare?: boolean;
}): React.ReactElement {
  const initParsed = parseTimeValue(value);
  const init12 = initParsed ? to12h(initParsed.h24) : null;
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(initParsed ? fmtTimeDisplay(initParsed.h24, initParsed.m) : '');
  const [selHour12, setSelHour12] = useState<number>(init12?.h ?? 12);
  const [selMinute, setSelMinute] = useState<number>(initParsed ? snapToValidMinute(initParsed.m) : 0);
  const [selPeriod, setSelPeriod] = useState<'AM' | 'PM'>(init12?.p ?? 'AM');
  const containerRef = useRef<any>(null);
  useEffect(() => {
    const parsed = parseTimeValue(value);
    if (parsed) {
      const { h, p } = to12h(parsed.h24);
      setSelHour12(h); setSelMinute(snapToValidMinute(parsed.m)); setSelPeriod(p);
      setInputText(fmtTimeDisplay(parsed.h24, parsed.m));
    } else { setInputText(''); }
  }, [value]);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const hourIdx = selHour12 - 1;
  const minIdx = SPIN_MINUTE_VALS.indexOf(selMinute as 0 | 15 | 30 | 45);
  const periodIdx = selPeriod === 'PM' ? 1 : 0;
  const emitUpdate = (h12: number, m: number, p: 'AM' | 'PM') => {
    const h24 = to24h(h12, p);
    const str = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setInputText(fmtTimeDisplay(h24, m)); onChange(str);
  };
  const safeMinIdx = minIdx >= 0 ? minIdx : 0;
  const prevHour = () => { const n = ((selHour12 - 2 + 12) % 12) + 1; setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const nextHour = () => { const n = (selHour12 % 12) + 1; setSelHour12(n); emitUpdate(n, selMinute, selPeriod); };
  const prevMinute = () => { const i = (safeMinIdx - 1 + 4) % 4; const m = SPIN_MINUTE_VALS[i]!; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
  const nextMinute = () => { const i = (safeMinIdx + 1) % 4; const m = SPIN_MINUTE_VALS[i]!; setSelMinute(m); emitUpdate(selHour12, m, selPeriod); };
  const togglePeriod = () => { const p: 'AM' | 'PM' = selPeriod === 'AM' ? 'PM' : 'AM'; setSelPeriod(p); emitUpdate(selHour12, selMinute, p); };
  const handleInputBlur = () => {
    const text = inputText.trim();
    if (!text) return;
    const m12 = text.match(/^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?$/i);
    if (m12) {
      const h = parseInt(m12[1]!); const m = parseInt(m12[2]!);
      const pStr = (m12[3] ?? '').toLowerCase();
      const p: 'AM' | 'PM' = pStr.startsWith('p') ? 'PM' : pStr.startsWith('a') ? 'AM' : selPeriod;
      if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
        const sm = snapToValidMinute(m); setSelHour12(h); setSelMinute(sm); setSelPeriod(p);
        emitUpdate(h, sm, p); return;
      }
    }
    const prev = parseTimeValue(value);
    setInputText(prev ? fmtTimeDisplay(prev.h24, prev.m) : '');
  };
  return (
    <div ref={containerRef} className="relative">
      <input type="text" value={inputText}
        onChange={(e: any) => setInputText(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        aria-label="Hora"
        className={bare
          ? 'bg-transparent w-full border-0 px-3 py-2 text-base text-gray-900 outline-none dark:text-gray-100 dark:placeholder-gray-600'
          : 'bg-[#F7F2F2] w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-200 transition-colors dark:bg-[#1B1517] dark:border-[#382C2E] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-rose-600'} />
      {open && (
        <div className="absolute top-full right-0 mt-1 z-[70] bg-white border border-[#E9D9D9] rounded-lg shadow-md p-2 flex items-center gap-0.5 dark:bg-[#251D1F] dark:border-[#382C2E]">
          <SpinnerColumn values={SPIN_HOURS} index={hourIdx} onPrev={prevHour} onNext={nextHour} />
          <span className="text-gray-300 text-base font-bold mb-0.5 px-0.5 dark:text-gray-600">:</span>
          <SpinnerColumn values={SPIN_MINUTES} index={safeMinIdx} onPrev={prevMinute} onNext={nextMinute} />
          <div className="w-px h-6 bg-gray-200 mx-1.5 dark:bg-white/10" />
          <SpinnerColumn values={SPIN_PERIODS} index={periodIdx} onPrev={togglePeriod} onNext={togglePeriod} />
        </div>
      )}
    </div>
  );
}
