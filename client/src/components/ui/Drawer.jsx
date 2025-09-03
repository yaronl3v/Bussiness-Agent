import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button.jsx';
import clsx from 'clsx';

export default function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  position = 'right'
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const positionClasses = {
    right: 'right-0',
    left: 'left-0'
  };

  const slideClasses = {
    right: 'translate-x-0',
    left: '-translate-x-0'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className={clsx('fixed inset-y-0 flex', positionClasses[position])}>
          <div className={clsx(
            'w-screen transform transition-transform',
            sizeClasses[size]
          )}>
            <div className="flex h-full flex-col bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
