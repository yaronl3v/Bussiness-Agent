import clsx from 'clsx';

export default function Card({ 
  children, 
  className = '', 
  padding = true,
  hover = false,
  ...props 
}) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200/60 shadow-sm',
        padding && 'p-6',
        hover && 'hover:shadow-md hover:border-gray-300/60 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
