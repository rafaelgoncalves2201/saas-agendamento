import React from 'react';

export function PageHeader({
  title,
  description,
  actions,
  className = '',
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'accent',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: any;
  accent?: 'accent' | 'success' | 'warning' | 'info' | 'danger';
}) {
  const accents = {
    accent: 'bg-accent-soft text-accent ring-1 ring-accent/30',
    success: 'bg-success/10 text-success ring-1 ring-success/30',
    warning: 'bg-warning/10 text-warning ring-1 ring-warning/30',
    info: 'bg-info/10 text-info ring-1 ring-info/30',
    danger: 'bg-danger/10 text-danger ring-1 ring-danger/30',
  } as const;

  return (
    <div className="card p-5 transition hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-foreground tracking-tight">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

