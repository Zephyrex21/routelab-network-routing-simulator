import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import IconButton from './IconButton.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((items) => [...items, { id, message, tone }].slice(-3));
    return id;
  }, []);
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info;
          return (
            <div
              className={`toast toast-${toast.tone}`}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-atomic="true"
              key={toast.id}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{toast.message}</span>
              <IconButton icon={X} size="sm" label="Dismiss notification" onClick={() => dismiss(toast.id)} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
