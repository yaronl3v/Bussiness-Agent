import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-lg', container: 'h-8' },
    md: { icon: 'h-8 w-8', text: 'text-xl', container: 'h-10' },
    lg: { icon: 'h-12 w-12', text: 'text-3xl', container: 'h-16' },
    xl: { icon: 'h-16 w-16', text: 'text-4xl', container: 'h-20' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${currentSize.container} flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg`}>
        <div className="relative">
          <ChatBubbleLeftRightIcon className={`${currentSize.icon} text-white`} />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 animate-pulse"></div>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.text} font-bold text-gray-900 leading-none`} style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            WhatsUp
          </span>
          <span className={`text-sm font-semibold text-green-600 leading-none`} style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            Worker
          </span>
        </div>
      )}
    </div>
  );
}

// Alternative compact logo for smaller spaces
export function CompactLogo({ className = '' }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg ${className}`}>
      <div className="relative">
        <span className="text-white font-bold text-sm">WW</span>
        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
      </div>
    </div>
  );
}
