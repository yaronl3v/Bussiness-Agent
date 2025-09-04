import { forwardRef } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const TextArea = forwardRef(({ 
  label,
  error,
  hint,
  showEditIcon = true,
  className = '',
  rows = 3,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="form-label">
          {label}
          {showEditIcon && (
            <PencilIcon className="h-4 w-4 edit-indicator" />
          )}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="editable-field">
        <textarea
          ref={ref}
          rows={rows}
          className={clsx(
            'form-textarea',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="text-sm text-gray-600 mt-2">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
