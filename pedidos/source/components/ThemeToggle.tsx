import React, { useState, useEffect } from 'react';
import { Sun as SunIcon, Moon as MoonIcon } from '@phosphor-icons/react';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'pedidos-theme-mode';

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function useThemeMode(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    applyTheme(mode);
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  return [mode, setMode];
}

export function ThemeToggle({ mode, onChange, bare = false }: { mode: ThemeMode; onChange: (m: ThemeMode) => void; bare?: boolean }): React.ReactElement {
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className={`flex items-center justify-center h-10 w-10 flex-shrink-0 rounded-xl text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-gray-300 ${bare ? 'hover:bg-gray-100 dark:hover:bg-white/10' : 'border border-gray-300 bg-white hover:bg-gray-50 dark:bg-[#251D1F] dark:border-[#2E352C] dark:hover:bg-white/5'}`}>
      {isDark ? <MoonIcon size={18} weight="regular" /> : <SunIcon size={18} weight="regular" />}
    </button>
  );
}
