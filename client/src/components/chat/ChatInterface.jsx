import { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  StopIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import clsx from 'clsx';

export default function ChatInterface({
  agent,
  onSendMessage,
  messages = [],
  isLoading = false,
  onReset,
  onExport,
  showInspector = false,
  onToggleInspector,
  inspectorData = null,
  className = ''
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [showCitations, setShowCitations] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage?.(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const copyMessage = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{agent?.name || 'Agent'}</h3>
            <p className="text-xs text-gray-500">
              {agent?.status === 'active' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCitations(!showCitations)}
            className={clsx(
              'text-xs',
              showCitations ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            )}
          >
            Citations
          </Button>
          
          {onToggleInspector && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleInspector}
              className="lg:hidden"
            >
              Inspector
            </Button>
          )}
          
          <Button size="sm" variant="ghost" onClick={onReset}>
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="ghost" onClick={onExport}>
            <ArrowDownTrayIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin bg-gradient-to-b from-gray-50/30 to-white">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={clsx(
              'flex gap-4',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {/* Avatar */}
            {message.role === 'agent' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Message Content */}
            <div
              className={clsx(
                'group relative max-w-[85%] lg:max-w-[70%]',
                message.role === 'user' ? 'order-1' : 'order-2'
              )}
            >
              <div
                className={clsx(
                  'px-4 py-3 rounded-2xl shadow-sm relative',
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 hover:shadow-md transition-shadow'
                )}
              >
                {/* Message text */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap pr-8">
                  {message.content}
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && showCitations && (
                  <div className={clsx(
                    'mt-3 pt-3 flex flex-wrap gap-1',
                    message.role === 'user' 
                      ? 'border-t border-blue-400/30' 
                      : 'border-t border-gray-200'
                  )}>
                    {message.citations.map((citation, idx) => (
                      <button
                        key={idx}
                        className={clsx(
                          'citation-badge inline-flex items-center px-2 py-1 rounded-full text-xs transition-all',
                          message.role === 'user'
                            ? 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:scale-105'
                        )}
                        onClick={() => {
                          // TODO: Show citation details
                          console.log('Citation clicked:', citation);
                        }}
                      >
                        [{idx + 1}]
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp and Copy Button Row */}
                <div className="mt-2 flex items-center justify-between">
                  <div className={clsx(
                    'text-xs',
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  )}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                  
                  {/* Copy Button with Feedback */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyMessage(message.content, message.id)}
                    className={clsx(
                      'p-1.5 rounded-lg transition-all',
                      copiedMessageId === message.id
                        ? 'bg-green-100 text-green-600'
                        : message.role === 'user' 
                          ? 'text-blue-200 hover:text-white hover:bg-blue-500/20' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    )}
                    title={copiedMessageId === message.id ? "Copied!" : "Copy message"}
                  >
                    {copiedMessageId === message.id ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* User Avatar */}
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
                <span className="text-xs font-medium text-white">You</span>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-gray-100 bg-gradient-to-r from-gray-50/50 to-white p-6">
        {/* Input Container with Enhanced Visual Separation */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-md">
          <div className="flex items-end p-4 space-x-4">
            {/* Text Input Area */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="w-full resize-none border-0 bg-transparent px-0 py-2 text-sm placeholder-gray-400 focus:ring-0 focus:outline-none max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
            </div>
            
            {/* Send Button - Properly Aligned */}
            <div className="flex items-end space-x-2 pb-2">
              {isLoading && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // TODO: Implement stop generation
                    console.log('Stop generation');
                  }}
                  className="h-10 w-10 p-0 rounded-xl"
                >
                  <StopIcon className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim() || isLoading}
                loading={isLoading}
                className="h-10 w-10 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Helper Text */}
          <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className={clsx(
              inputMessage.length > 1800 ? 'text-red-500' : 'text-gray-400'
            )}>
              {inputMessage.length}/2000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
