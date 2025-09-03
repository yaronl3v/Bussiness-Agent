import { useState } from 'react';
import { 
  DocumentDuplicateIcon, 
  CheckIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button.jsx';
import CitationPopover from './CitationPopover.jsx';
import clsx from 'clsx';

export default function MessageBubble({ 
  message, 
  showCitations = true,
  onCitationClick 
}) {
  const [showCopied, setShowCopied] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [citationPosition, setCitationPosition] = useState({ top: 0, left: 0 });

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleCitationClick = (citation, event) => {
    const rect = event.target.getBoundingClientRect();
    setCitationPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setSelectedCitation(citation);
    onCitationClick?.(citation);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div className={clsx(
        'flex gap-4',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}>
        {/* Agent Avatar */}
        {message.role === 'agent' && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Message Content */}
        <div className={clsx(
          'group relative max-w-[85%] lg:max-w-[70%]',
          message.role === 'user' ? 'order-1' : 'order-2'
        )}>
          <div className={clsx(
            'px-4 py-3 rounded-2xl shadow-sm relative',
            message.role === 'user'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          )}>
            {/* Message Text */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>

            {/* Citations */}
            {message.citations && message.citations.length > 0 && showCitations && (
              <div className={clsx(
                'mt-3 pt-3 flex flex-wrap gap-1',
                message.role === 'user' 
                  ? 'border-t border-blue-500/30' 
                  : 'border-t border-gray-200'
              )}>
                {message.citations.map((citation, idx) => (
                  <button
                    key={idx}
                    className={clsx(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs transition-colors',
                      message.role === 'user'
                        ? 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    )}
                    onClick={(e) => handleCitationClick(citation, e)}
                  >
                    [{idx + 1}]
                  </button>
                ))}
              </div>
            )}

            {/* Timestamp & Actions */}
            <div className="mt-2 flex items-center justify-between">
              <div className={clsx(
                'text-xs',
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              )}>
                {formatTimestamp(message.timestamp)}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={copyMessage}
                className={clsx(
                  'opacity-0 group-hover:opacity-100 transition-opacity p-1',
                  message.role === 'user' 
                    ? 'text-blue-200 hover:text-white hover:bg-blue-500/20' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
              >
                {showCopied ? (
                  <CheckIcon className="w-3 h-3" />
                ) : (
                  <DocumentDuplicateIcon className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* User Avatar */}
        {message.role === 'user' && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Citation Popover */}
      <CitationPopover
        citation={selectedCitation}
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        position={citationPosition}
      />
    </>
  );
}
