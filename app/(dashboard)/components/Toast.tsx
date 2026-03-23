'use client';

import { useEffect } from 'react';
import { CloseOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface ToastProps {
  type: ToastType;
  title: string;
  description?: string;
  onDismiss: () => void;
  autoDismiss?: number;
}

const icons: Record<ToastType, React.ReactNode> = {
  error: <ExclamationCircleOutlined className="toast__icon" />,
  warning: <WarningOutlined className="toast__icon" />,
  success: <CheckCircleOutlined className="toast__icon" />,
  info: <InfoCircleOutlined className="toast__icon" />,
};

export function Toast({ type, title, description, onDismiss, autoDismiss = 5000 }: ToastProps) {
  useEffect(() => {
    if (autoDismiss) {
      const t = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(t);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert">
      <div className="toast__icon">{icons[type]}</div>
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {description && <p className="toast__desc">{description}</p>}
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={onDismiss}
        aria-label="Хаах"
      >
        <CloseOutlined style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}

export type ToastItem = Omit<ToastProps, 'onDismiss'> & { id: string };

export interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          type={t.type}
          title={t.title}
          description={t.description}
          onDismiss={() => removeToast(t.id)}
          autoDismiss={t.autoDismiss}
        />
      ))}
    </div>
  );
}
