import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon =
    toast.type === 'warning'
      ? AlertCircle
      : toast.type === 'info'
      ? Info
      : CheckCircle2;

  const iconColor =
    toast.type === 'warning'
      ? 'text-amber-400'
      : toast.type === 'info'
      ? 'text-indigo-400'
      : 'text-emerald-400';

  return (
    <div className="pointer-events-auto p-4 rounded-2xl bg-[#0f1220]/95 border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">{toast.title}</h4>
          {toast.description && (
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{toast.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
