import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const toastTypes = {
  success: {
    icon: CheckCircleIcon,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-400'
  },
  error: {
    icon: XCircleIcon,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-400'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-400'
  },
  info: {
    icon: InformationCircleIcon,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-400'
  }
};

export default function Toast({ 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const config = toastTypes[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={clsx(
        'rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        config.className
      )}>
        <div className="flex items-start">
          <Icon className={clsx('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 inline-flex rounded-lg p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          autoClose={toast.autoClose}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}
