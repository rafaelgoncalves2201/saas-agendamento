import React from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2, X } from 'lucide-react';

export type ActionVariant = 'danger' | 'success' | 'warning' | 'info';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: ActionVariant;
  showReasonInput?: boolean;
  reasonValue?: string;
  onReasonChange?: (val: string) => void;
  reasonPlaceholder?: string;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  loading = false,
  confirmText = 'Confirmar',
  cancelText = 'Voltar',
  variant = 'danger',
  showReasonInput = false,
  reasonValue = '',
  onReasonChange,
  reasonPlaceholder = 'Informe o motivo (opcional)...',
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle size={24} className="stroke-[2.2]" />,
      iconBox: 'bg-red-50 border-red-100 text-red-600 shadow-red-100',
      dot: 'bg-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
    },
    success: {
      icon: <CheckCircle size={24} className="stroke-[2.2]" />,
      iconBox: 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100',
      dot: 'bg-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    },
    warning: {
      icon: <AlertTriangle size={24} className="stroke-[2.2]" />,
      iconBox: 'bg-amber-50 border-amber-100 text-amber-600 shadow-amber-100',
      dot: 'bg-amber-500',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    },
    info: {
      icon: <Info size={24} className="stroke-[2.2]" />,
      iconBox: 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-100',
      dot: 'bg-indigo-500',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm ${variantStyles.iconBox}`}>
              {variantStyles.icon}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">{title}</h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {description}
          </p>

          {itemName && (
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${variantStyles.dot}`}></span>
              <span className="truncate">{itemName}</span>
            </div>
          )}

          {showReasonInput && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                rows={2}
                value={reasonValue}
                onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${variantStyles.button}`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

