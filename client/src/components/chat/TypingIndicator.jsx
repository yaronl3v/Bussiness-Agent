export default function TypingIndicator({ agentName = 'Agent' }) {
  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-white">AI</span>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">{agentName} is typing</span>
          <div className="flex space-x-1 ml-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
