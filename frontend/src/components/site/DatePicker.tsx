import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function DatePicker({
  value,
  onChange,
  maxDays = 60,
}: {
  value: string;
  onChange: (iso: string) => void;
  maxDays?: number;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const initial = new Date(`${value || today}T00:00:00`);
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const maxDate = format(addDays(new Date(), maxDays), 'yyyy-MM-dd');

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(iso);
  }

  const canPrev = view.y > initial.getFullYear() || view.m > initial.getMonth();
  const canNext = (() => {
    const next = new Date(view.y, view.m + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01` <= maxDate;
  })();

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-muted disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {MONTHS[view.m]} {view.y}
        </p>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-muted disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((w, i) => (
          <div key={i} className="py-1 text-[11px] font-medium text-foreground-subtle">
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const isPast = iso < today;
          const isMax = iso > maxDate;
          const disabled = isPast || isMax;
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={`relative aspect-square rounded-xl text-sm transition cursor-pointer flex items-center justify-center ${
                disabled
                  ? 'cursor-not-allowed text-foreground-subtle/30 pointer-events-none'
                  : !selected
                  ? 'text-foreground hover:bg-surface-2 hover:border-accent'
                  : 'bg-accent font-semibold text-accent-foreground shadow-soft'
              }`}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
