'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { ToastContainer, type ToastItem, type ToastType } from './Toast';

interface ToastContextValue {
  addToast: (opts: { type: ToastType; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;
function nextId() {
  return `toast-${++toastId}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (opts: { type: ToastType; title: string; description?: string }) => {
      const id = nextId();
      setToasts((prev) => [
        ...prev,
        {
          id,
          type: opts.type,
          title: opts.title,
          description: opts.description,
          autoDismiss: 5000,
        },
      ]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {} };
  return ctx;
}
