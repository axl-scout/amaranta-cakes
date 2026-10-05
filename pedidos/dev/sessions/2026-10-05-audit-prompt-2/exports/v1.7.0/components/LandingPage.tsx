import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadMenu } from './DownloadMenu';
import { ClipboardText as ClipboardIcon, Cookie as CookieIcon, Wallet as WalletIcon } from '@phosphor-icons/react';

const PAGES = [
  { path: '/pedidos', title: 'Pedidos', desc: 'Calendario de pedidos, cake toppers y recibos.', Icon: ClipboardIcon },
  { path: '/produccion', title: 'Producción', desc: 'Tareas del día por empleado y avance de galletas.', Icon: CookieIcon },
  { path: '/finanzas', title: 'Finanzas', desc: 'Cobros, saldos por cobrar y nómina de cada semana.', Icon: WalletIcon },
];

export function LandingPage(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans antialiased bg-[#F8F2F2] dark:bg-[#1B1517]">
      <div className="flex-1 min-h-0 overflow-y-auto">
      <main className="mx-auto w-[90%] max-w-[1100px] pt-12 sm:pt-16 pb-12">
        <header className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F5F3EF]">Amaranta Cakes</h1>
        </header>

        <section className="mt-12" aria-label="Páginas">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAGES.map(({ path, title, desc, Icon }) => (
              <button key={path} type="button" onClick={() => navigate(path)}
                className="group text-left bg-white border border-[#E5E1DA] rounded-xl p-5 flex items-center gap-4 transition-all hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:bg-[#251D1F] dark:border-[#382C2E] dark:hover:border-rose-500/50">
                <span className="h-[3.9rem] w-[3.9rem] flex-shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center dark:bg-rose-500/15 dark:text-rose-300">
                  <Icon size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">{title}</span>
                  <span className="mt-1 block truncate text-sm text-gray-500 dark:text-gray-400">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
      </div>
      <div className="fixed bottom-4 left-4 z-40"><DownloadMenu /></div>
    </div>
  );
}
