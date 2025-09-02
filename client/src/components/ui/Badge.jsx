import clsx from 'clsx';

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    active: 'bg-emerald-100 text-emerald-800',
    disabled: 'bg-gray-100 text-gray-500',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    indexing: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
