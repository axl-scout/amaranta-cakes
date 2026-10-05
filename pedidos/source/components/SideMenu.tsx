import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DownloadMenu } from './DownloadMenu';
import { ThemeToggle, useThemeMode } from './ThemeToggle';
import { List as ListIcon, ClipboardText as ClipboardIcon, Cookie as CookieIcon, Wallet as WalletIcon, House as HouseIcon, CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon } from '@phosphor-icons/react';

/** Sections of the app (one page each). */
const SECTIONS: Array<{ key: string; label: string; Icon: any; pages: Array<{ path: string; label: string }> }> = [
  { key: 'inicio', label: 'Inicio', Icon: HouseIcon, pages: [{ path: '/', label: 'Inicio' }] },
  { key: 'pedidos', label: 'Pedidos', Icon: ClipboardIcon, pages: [{ path: '/pedidos', label: 'Pedidos' }] },
  { key: 'produccion', label: 'Producción', Icon: CookieIcon, pages: [{ path: '/produccion', label: 'Producción' }] },
  { key: 'finanzas', label: 'Finanzas', Icon: WalletIcon, pages: [{ path: '/finanzas', label: 'Finanzas' }] },
];
const RAIL_KEY = 'menu-expanded';
const isOn = (pathname: string, path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));
const iconBtn = 'h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600';

/**
 * Left menu panel present on every page (except the landing page).
 * Collapsed: a narrow rail with one icon per section; clicking an icon goes to that page.
 * Expanded: icons with labels. The chevron at the top toggles between both; the choice is remembered.
 * The bottom holds the theme selector.
 */
export function SideRail(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [themeMode, setThemeMode] = useThemeMode();
  const [expanded, setExpanded] = useState<boolean>(() => { try { return localStorage.getItem(RAIL_KEY) === '1'; } catch { return false; } });

  useEffect(() => { try { localStorage.setItem(RAIL_KEY, expanded ? '1' : '0'); } catch { /* ignore */ } }, [expanded]);

  if (location.pathname === '/' || !SECTIONS.some((sec) => sec.pages.some((pg) => pg.path !== '/' && isOn(location.pathname, pg.path)))) return null;

  const go = (path: string) => { if (!isOn(location.pathname, path)) navigate({ pathname: path, search: location.search }); };
  const activeKey = SECTIONS.find((sec) => sec.pages.some((pg) => isOn(location.pathname, pg.path)))?.key;

  return (
    <nav aria-label="Navegación principal"
      className={`relative z-40 h-screen flex-shrink-0 hidden sm:flex flex-col bg-white dark:bg-[#231B1D] border-r border-[#E9D9D9] dark:border-[#382C2E] transition-[width] duration-300 ease-out ${expanded ? 'w-56' : 'w-[3.75rem]'}`}>
      {/* Chevron and section icons share one column with the same spacing (centered on the toolbar height). */}
      <div className="flex-1 py-3 px-2.5 flex flex-col gap-2">
        <div>
          <button type="button" onClick={() => setExpanded((x) => !x)} aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'} aria-expanded={expanded}
            className={`${iconBtn} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10`}>
            {expanded ? <CaretLeftIcon size={18} /> : <CaretRightIcon size={18} />}
          </button>
        </div>
        {SECTIONS.map(({ key, label, Icon, pages }) => {
          const active = key === activeKey;
          const tone = active ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10';
          return (
            <div key={key} className="relative">
              {expanded ? (
                <button type="button" onClick={() => go(pages[0]!.path)} aria-current={active ? 'page' : undefined}
                  className={`w-full h-10 px-2.5 flex items-center gap-3 rounded-xl text-base font-medium whitespace-nowrap overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${tone}`}>
                  <Icon size={19} weight={active ? 'fill' : 'regular'} className="flex-shrink-0" />{label}
                </button>
              ) : (
                <button type="button" onClick={() => go(pages[0]!.path)} aria-label={label} title={label} aria-current={active ? 'page' : undefined}
                  className={`${iconBtn} ${tone}`}>
                  <Icon size={19} weight={active ? 'fill' : 'regular'} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={`flex-shrink-0 p-2.5 border-t border-[#E9D9D9] dark:border-[#382C2E] flex gap-1 ${expanded ? 'flex-row items-center justify-start' : 'flex-col items-start'}`}>
        <ThemeToggle mode={themeMode} onChange={setThemeMode} bare />
        <DownloadMenu bare />
      </div>
    </nav>
  );
}

/** Mobile menu: hamburger button (same height as the toolbar controls) that opens the sections as an overlay panel. */
function MobileMenu(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [themeMode, setThemeMode] = useThemeMode();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open]);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  if (location.pathname === '/' || !SECTIONS.some((sec) => sec.pages.some((pg) => pg.path !== '/' && isOn(location.pathname, pg.path)))) return null;
  const activeKey = SECTIONS.find((sec) => sec.pages.some((pg) => isOn(location.pathname, pg.path)))?.key;
  const go = (path: string) => { setOpen(false); if (!isOn(location.pathname, path)) navigate({ pathname: path, search: location.search }); };
  return (
    <div className="sm:hidden order-first">
      <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open} aria-haspopup="dialog"
        className="h-10 w-10 flex-shrink-0 rounded-xl border border-gray-300 dark:border-[#2E352C] bg-white dark:bg-[#251D1F] text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600">
        <ListIcon size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <nav role="dialog" aria-label="Navegación principal" className="absolute left-0 top-0 h-full w-64 max-w-[80%] flex flex-col bg-white dark:bg-[#231B1D] border-r border-[#E9D9D9] dark:border-[#382C2E] shadow-xl">
            <div className="flex-1 py-3 px-2.5 flex flex-col gap-2">
              {SECTIONS.map(({ key, label, Icon, pages }) => {
                const active = key === activeKey;
                const tone = active ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10';
                return (
                  <button key={key} type="button" onClick={() => go(pages[0]!.path)} aria-current={active ? 'page' : undefined}
                    className={`w-full h-10 px-2.5 flex items-center gap-3 rounded-xl text-base font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${tone}`}>
                    <Icon size={19} weight={active ? 'fill' : 'regular'} className="flex-shrink-0" />{label}
                  </button>
                );
              })}
            </div>
            <div className="flex-shrink-0 p-2.5 border-t border-[#E9D9D9] dark:border-[#382C2E] flex flex-row items-center gap-1">
              <ThemeToggle mode={themeMode} onChange={setThemeMode} bare />
              <DownloadMenu bare />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

/**
 * Page toolbar: the page's tools. Rendered right away (never waits for data),
 * with its own fill and a line separating it from the content.
 */
export function PageToolbar({ children, className = '' }: { children?: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <header className={`relative z-30 flex-shrink-0 bg-white dark:bg-[#231B1D] border-b border-[#E9D9D9] dark:border-[#382C2E] px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 flex-wrap ${className}`}>
      <MobileMenu />
      {children}
    </header>
  );
}
