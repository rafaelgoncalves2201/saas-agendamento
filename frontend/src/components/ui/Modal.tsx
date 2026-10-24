import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted || !open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  } as const;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-3xl border border-border bg-surface shadow-elevated sm:rounded-3xl animate-scale-in flex flex-col ${widths[size]}`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 shrink-0 bg-surface">
            <div>
              {title && <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>}
              {description && (
                <p className="mt-1 text-sm text-foreground-muted">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-foreground-subtle transition hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 flex-1">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-2 px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
