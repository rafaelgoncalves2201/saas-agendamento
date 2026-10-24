import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted transition hover:text-foreground hover:shadow-soft cursor-pointer ${className}`}
      title={isDark ? 'Modo Claro' : 'Modo Escuro'}
    >
      <span className="flex transition-transform duration-300 transform group-hover:scale-110">
        {isDark ? (
          <Moon className="h-[18px] w-[18px] text-accent" />
        ) : (
          <Sun className="h-[18px] w-[18px] text-accent" />
        )}
      </span>
    </button>
  );
}
