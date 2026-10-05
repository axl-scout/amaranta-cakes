import React from 'react';
import { Info as InfoIcon } from '@phosphor-icons/react';

/** Small info icon that reveals a short instruction on hover or keyboard focus. */
export function InfoTip({ text }: { text: string }): React.ReactElement {
  return (
    <span className="relative inline-flex group align-middle">
      <button type="button" tabIndex={0} aria-label={text}
        className="h-4 w-4 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-rose-600 focus-visible:outline-none focus-visible:text-rose-600 dark:text-gray-500">
        <InfoIcon size={14} />
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-max max-w-[240px] rounded-lg border border-[#E9D9D9] bg-white px-2.5 py-1.5 text-xs leading-snug text-gray-700 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-[#4A3A3E] dark:bg-[#3A2E31] dark:text-gray-100">
        {text}
      </span>
    </span>
  );
}
