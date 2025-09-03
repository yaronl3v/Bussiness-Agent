import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

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
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'success', message });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'error', message });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'warning', message });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ ...options, type: 'info', message });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}
