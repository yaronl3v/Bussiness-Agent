import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ArrowPathIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { agentsService, conversationsService } from '../../services/index.js';
import Button from '../../components/ui/Button.jsx';
import ChatInterface from '../../components/chat/ChatInterface.jsx';
import Inspector from '../../components/chat/Inspector.jsx';
import clsx from 'clsx';

export default function TestChat() {
  const { agent, orgId } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [inspectorData, setInspectorData] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // Initialize conversation and welcome message
  useEffect(() => {
    if (agent) {
      initializeConversation();
    }
  }, [agent]);

  const initializeConversation = () => {
    // Check if we have a persisted conversation for this agent
    const persistedConvId = localStorage.getItem(`conversation_${agent.id}`);
    
    if (persistedConvId) {
      // Load existing conversation
      setConversationId(persistedConvId);
      loadConversationHistory(persistedConvId);
    } else {
      // Start fresh with welcome message
      setConversationId(null); // Will be set after first message
      setMessages([
        {
          id: 1,
          role: 'agent',
          content: agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  };

  const loadConversationHistory = async (convId) => {
    try {
      setLoading(true);
      const history = await conversationsService.getConversationMessages(convId);
      
      // Convert server messages to our format, handling nested content structure
      const messagesArray = Array.isArray(history) ? history : (history?.data || []);
      const formattedMessages = messagesArray.map(msg => ({
        id: msg.id || Date.now(),
        role: msg.role,
        content: msg.content_jsonb?.text || msg.content || '',
        timestamp: new Date(msg.createdAt || msg.timestamp),
        citations: msg.citations_jsonb || msg.citations || []
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Start fresh if we can't load history
      startNewConversation();
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    // Clear persisted conversation
    localStorage.removeItem(`conversation_${agent.id}`);
    setConversationId(null);
    setMessages([
      {
        id: 1,
        role: 'agent',
        content: agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?',
        timestamp: new Date()
      }
    ]);
    setInspectorData(null);
  };

  const handleSendMessage = async (messageContent) => {
    if (!agent || !messageContent.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response;

      if (!conversationId) {
        // First message - use /conversations/new/messages
        response = await conversationsService.sendFirstMessage(agent.id, messageContent, 'user');
        
        // Store the conversation ID for future messages
        if (response.conversationId) {
          setConversationId(response.conversationId);
          localStorage.setItem(`conversation_${agent.id}`, response.conversationId);
        }
      } else {
        // Subsequent messages - use existing conversation ID
        response = await conversationsService.sendMessage(
          conversationId, 
          agent.id, 
          messageContent, 
          'user'
        );
      }

      // The response should include assistant message with citations
      if (response.assistant) {
        // Extract content from the nested structure
        const assistantContent = 
          response.assistant.content_jsonb?.text || 
          response.assistant.content || 
          'I apologize, but I couldn\'t generate a proper response.';

        const agentResponse = {
          id: Date.now() + 1,
          role: 'agent',
          content: assistantContent,
          timestamp: new Date(response.assistant.createdAt || new Date()),
          citations: response.citations || response.assistant.citations_jsonb || [],
          metadata: {
            messageId: response.assistant.id,
            conversationId: response.conversationId,
            responseTime: response.responseTime,
            tokensUsed: response.tokensUsed,
            model: response.model
          }
        };

        setMessages(prev => [...prev, agentResponse]);

        // Update inspector data with proper citation format
        setInspectorData({
          retrieval: response.citations || [],
          intakeUpdates: response.intakeUpdates || {},
          nextAction: response.nextAction || { type: 'continue', summary: 'Continue conversation' },
          conversationId: response.conversationId,
          lastResponse: response.assistant
        });
      }

    } catch (error) {
      console.error('Failed to get agent response:', error);
      
      let errorMessage = 'Sorry, I encountered an error while processing your message.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please check if you\'re still logged in.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Agent not found or endpoint not available.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      const errorResponse = {
        id: Date.now() + 1,
        role: 'agent',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Start a completely new conversation
    startNewConversation();
  };

  const handleExport = () => {
    const transcript = {
      conversationId,
      agentId: agent?.id,
      agentName: agent?.name,
      exportedAt: new Date().toISOString(),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        citations: msg.citations || []
      }))
    };

    const dataStr = JSON.stringify(transcript, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-transcript-${agent?.name || 'agent'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Test Chat</h2>
          <p className="mt-1 text-sm text-gray-500">
            Test your agent with real-time conversations and see how it responds
          </p>
          {conversationId && (
            <p className="mt-1 text-xs text-blue-600">
              Conversation ID: {conversationId.substring(0, 8)}... (persisted)
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowInspector(!showInspector)}
            className="lg:hidden"
          >
            {showInspector ? (
              <>
                <EyeSlashIcon className="h-4 w-4 mr-2" />
                Hide Inspector
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-2" />
                Show Inspector
              </>
            )}
          </Button>
          
          <Button size="sm" variant="secondary" onClick={handleReset}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          
          <Button size="sm" variant="secondary" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex h-[700px]">
          {/* Chat Interface */}
          <div className={clsx(
            'flex-1 flex flex-col',
            showInspector ? 'lg:border-r lg:border-gray-200' : ''
          )}>
            <ChatInterface
              agent={agent}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onReset={handleReset}
              onExport={handleExport}
              showInspector={showInspector}
              onToggleInspector={() => setShowInspector(!showInspector)}
              inspectorData={inspectorData}
            />
          </div>

          {/* Inspector Panel */}
          {showInspector && (
            <div className="w-80 border-l border-gray-200 bg-gray-50/30 p-4 hidden lg:block">
              <Inspector data={inspectorData} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Inspector */}
      {showInspector && (
        <div className="lg:hidden">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
            <Inspector data={inspectorData} />
          </div>
        </div>
      )}
    </div>
  );
}