import React from 'react';

const bone = 'bg-gray-200/80 dark:bg-white/10 animate-pulse';
const shell = 'h-screen overflow-hidden bg-[#F8F2F2] dark:bg-[#1B1517]';
const hdr = 'pl-[44px] pr-3 sm:pl-[40px] sm:pr-5 lg:px-7 pt-4 sm:pt-5 pb-3 flex items-center gap-2 sm:gap-3';
const panel = 'bg-white border border-[#E5E1DA] rounded-xl dark:bg-[#251D1F] dark:border-[#382C2E]';

function Bar({ w, h = 'h-10', r = 'rounded-xl', className = '' }: { w: string; h?: string; r?: string; className?: string }) {
  return <div className={`${bone} ${w} ${h} ${r} ${className}`} />;
}

/** Content-only skeleton for Pedidos (the toolbar is always real). */
export function PedidosContentSkeleton(): React.ReactElement {
  return (
    <div className="flex-1 min-h-0" aria-busy="true" aria-label="Cargando pedidos" role="status">
      <div className={`${panel} overflow-hidden`}>
        <div className="h-10 bg-gray-100 dark:bg-[#2C2325] px-3 flex items-center gap-6">
          {Array.from({ length: 7 }).map((_, i) => <Bar key={i} w="w-16" h="h-3" r="rounded" />)}
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="px-3 h-12 flex items-center gap-6 border-t border-gray-100 dark:border-white/5">
            <Bar w="w-12" h="h-3" r="rounded" /><Bar w="w-40" h="h-3" r="rounded" /><Bar w="w-20" h="h-5" r="rounded-full" />
            <Bar w="w-10" h="h-3" r="rounded" /><Bar w="w-24" h="h-3" r="rounded" className="hidden md:block" />
            <Bar w="w-16" h="h-3" r="rounded" className="hidden md:block" /><Bar w="w-28" h="h-3" r="rounded" className="hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PedidosSkeleton(): React.ReactElement {
  return (
    <div className={shell} aria-busy="true" aria-label="Cargando pedidos" role="status">
      <div className="fixed top-4 left-4 sm:top-5 sm:left-5"><Bar w="w-10" /></div>
      <div className="mx-auto w-[90%] h-full flex flex-col">
        <div className={hdr}>
          <Bar w="w-56" className="hidden sm:block" />
          <Bar w="w-10" /><Bar w="w-44" /><Bar w="w-10" />
          <Bar w="w-28" className="hidden sm:block" />
          <div className="ml-auto flex gap-2 sm:gap-3"><Bar w="w-60" className="hidden md:block" /><Bar w="w-10" /><Bar w="w-32" /></div>
        </div>
        <div className="px-3 sm:px-5 lg:px-7 pb-6 flex-1 min-h-0">
          <div className={`${panel} overflow-hidden`}>
            <div className="h-10 bg-gray-100 dark:bg-[#2C2325] px-3 flex items-center gap-6">
              {Array.from({ length: 7 }).map((_, i) => <Bar key={i} w="w-16" h="h-3" r="rounded" />)}
            </div>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="px-3 h-12 flex items-center gap-6 border-t border-gray-100 dark:border-white/5">
                <Bar w="w-12" h="h-3" r="rounded" /><Bar w="w-40" h="h-3" r="rounded" /><Bar w="w-20" h="h-5" r="rounded-full" />
                <Bar w="w-10" h="h-3" r="rounded" /><Bar w="w-24" h="h-3" r="rounded" className="hidden md:block" />
                <Bar w="w-16" h="h-3" r="rounded" className="hidden md:block" /><Bar w="w-28" h="h-3" r="rounded" className="hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProduccionSkeleton(): React.ReactElement {
  return (
    <div className={shell} aria-busy="true" aria-label="Cargando producción" role="status">
      <div className="fixed top-4 left-4 sm:top-5 sm:left-5"><Bar w="w-10" /></div>
      <div className="mx-auto w-[90%] h-full flex flex-col">
        <div className={hdr}>
          <Bar w="w-72" /><Bar w="w-10" /><Bar w="w-44" /><Bar w="w-10" />
          <div className="ml-auto flex gap-2 sm:gap-3"><Bar w="w-32" className="hidden sm:block" /><Bar w="w-10" /><Bar w="w-36" /></div>
        </div>
        <div className="px-3 sm:px-5 lg:px-7 pb-6 grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          <div className="xl:col-span-2 space-y-3">
            <Bar w="w-64" h="h-4" r="rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${panel} p-4 space-y-3`}>
                  <div className="flex justify-between"><Bar w="w-28" h="h-4" r="rounded" /><Bar w="w-20" h="h-3" r="rounded" /></div>
                  <Bar w="w-full" h="h-1.5" r="rounded-full" />
                  <Bar w="w-40" h="h-3" r="rounded" />
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="flex items-center gap-2.5 pt-1"><Bar w="w-6" h="h-6" r="rounded-full" /><Bar w="w-48" h="h-3" r="rounded" /></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={`${panel} p-4 space-y-4`}>
            <Bar w="w-28" h="h-4" r="rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2"><div className="flex gap-2"><Bar w="w-32" h="h-4" r="rounded" /><Bar w="w-16" h="h-4" r="rounded-full" /></div><Bar w="w-44" h="h-3" r="rounded" /><Bar w="w-24" h="h-7" r="rounded-lg" /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Content-only skeleton for Producción (the toolbar is always real). */
export function ProduccionContentSkeleton(): React.ReactElement {
  return (
    <div aria-busy="true" aria-label="Cargando producción" role="status">
      <div className="pb-6 grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
      <div className="xl:col-span-2 space-y-3">
        <Bar w="w-64" h="h-4" r="rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${panel} p-4 space-y-3`}>
              <div className="flex justify-between"><Bar w="w-28" h="h-4" r="rounded" /><Bar w="w-20" h="h-3" r="rounded" /></div>
              <Bar w="w-full" h="h-1.5" r="rounded-full" />
              <Bar w="w-40" h="h-3" r="rounded" />
              {Array.from({ length: 2 }).map((__, j) => (
                <div key={j} className="flex items-center gap-2.5 pt-1"><Bar w="w-6" h="h-6" r="rounded-full" /><Bar w="w-48" h="h-3" r="rounded" /></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={`${panel} p-4 space-y-4`}>
        <Bar w="w-28" h="h-4" r="rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2"><div className="flex gap-2"><Bar w="w-32" h="h-4" r="rounded" /><Bar w="w-16" h="h-4" r="rounded-full" /></div><Bar w="w-44" h="h-3" r="rounded" /><Bar w="w-24" h="h-7" r="rounded-lg" /></div>
        ))}
      </div>
    </div>
    </div>
  );
}
