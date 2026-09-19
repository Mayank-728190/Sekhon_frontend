// ============================================================
// AEROSCOUT — TOAST NOTIFICATION SYSTEM
// ============================================================
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast ${toast.type}`} role="alert">
      <div className="toast-icon">{toast.icon}</div>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-desc">{toast.desc}</div>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const { state, removeToast } = useApp();

  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {state.toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
