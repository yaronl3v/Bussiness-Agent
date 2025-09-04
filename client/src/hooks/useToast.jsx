import { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast.jsx';

const ToastContext = createContext(null);

function useToastInternal() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: 'info',
      autoClose: true,
      duration: 5000,
      ...toast
    };
    setToasts(prev => [...prev, newToast]);
    if (newToast.autoClose) {
      setTimeout(() => removeToast(id), newToast.duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((message, options = {}) => addToast({ ...options, type: 'success', message }), [addToast]);
  const error = useCallback((message, options = {}) => addToast({ ...options, type: 'error', message }), [addToast]);
  const warning = useCallback((message, options = {}) => addToast({ ...options, type: 'warning', message }), [addToast]);
  const info = useCallback((message, options = {}) => addToast({ ...options, type: 'info', message }), [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info };
}

export function ToastProvider({ children }) {
  const api = useToastInternal();
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={api.toasts} removeToast={api.removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || useToastInternal();
}

export { ToastContext };

