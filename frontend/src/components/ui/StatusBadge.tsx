import React from 'react';

export type BadgeStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'REQUESTED'
  | 'RESCHEDULED'
  | string;

export const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  PENDING: { label: 'Aguardando confirmação', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  REQUESTED: { label: 'Aguardando confirmação', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  CONFIRMED: { label: 'Confirmado', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  IN_PROGRESS: { label: 'Em atendimento', dot: 'bg-info', text: 'text-info', bg: 'bg-info/10', border: 'border-info/30' },
  COMPLETED: { label: 'Atendido', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  RESCHEDULED: { label: 'Remarcação solicitada', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  CANCELLED: { label: 'Cancelado', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  CANCELED: { label: 'Cancelado', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  NO_SHOW: { label: 'Não compareceu', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
};

export function StatusBadge({ status, className = '' }: { status: BadgeStatus; className?: string }) {
  const normKey = (status || '').toUpperCase();
  const m = STATUS_META[normKey] || {
    label: status,
    dot: 'bg-foreground-subtle',
    text: 'text-foreground-muted',
    bg: 'bg-surface-2',
    border: 'border-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${m.bg} ${m.text} ${m.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

