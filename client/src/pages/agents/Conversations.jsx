import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function Conversations() {
  const { agent, orgId } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [agent.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // TODO: Implement conversations API call
      // For now, using mock data
      setConversations([
        {
          id: 1,
          clientId: 'user123',
          channel: 'whatsapp',
          lastMessage: 'Thank you for the information!',
          updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          messageCount: 8,
          hasLead: true
        },
        {
          id: 2,
          clientId: 'user456',
          channel: 'in-app',
          lastMessage: 'Can you help me with pricing?',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          messageCount: 3,
          hasLead: false
        }
      ]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return PhoneIcon;
      case 'in-app':
        return ComputerDesktopIcon;
      default:
        return ChatBubbleLeftRightIcon;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return 'text-green-600 bg-green-100';
      case 'in-app':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all conversations ({conversations.length} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              className="form-select w-full sm:w-auto"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">All channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="in-app">In-App</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                Has lead
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <EmptyState
          icon={ChatBubbleLeftRightIcon}
          title={conversations.length === 0 ? "No conversations yet" : "No conversations found"}
          description={
            conversations.length === 0 
              ? "Conversations will appear here when users interact with your agent"
              : "Try adjusting your search or filter criteria"
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => {
            const ChannelIcon = getChannelIcon(conversation.channel);
            
            return (
              <Card key={conversation.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${getChannelColor(conversation.channel)}`}>
                      <ChannelIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">
                          {conversation.clientId}
                        </h3>
                        {conversation.hasLead && (
                          <Badge variant="success" size="sm">Lead</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>
                          {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(conversation.updatedAt)} ago
                        </span>
                        <span>•</span>
                        <span className="capitalize">{conversation.channel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setShowConversationDetail(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <Button size="sm" variant="ghost">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Conversation Detail Drawer */}
      <Drawer
        isOpen={showConversationDetail}
        onClose={() => setShowConversationDetail(false)}
        title="Conversation Details"
        size="lg"
      >
        {selectedConversation && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client ID</label>
                  <p className="text-gray-900">{selectedConversation.clientId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Channel</label>
                  <p className="text-gray-900 capitalize">{selectedConversation.channel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Messages</label>
                  <p className="text-gray-900">{selectedConversation.messageCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Activity</label>
                  <p className="text-gray-900">
                    {formatDistanceToNow(selectedConversation.updatedAt)} ago
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Message History</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto scrollbar-thin">
                {/* Mock messages - in real implementation, these would be loaded from API */}
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-2 max-w-xs">
                      <p className="text-sm text-gray-900">Hello! How can I help you today?</p>
                      <p className="text-xs text-gray-500 mt-1">Agent • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-xs">
                      <p className="text-sm">{selectedConversation.lastMessage}</p>
                      <p className="text-xs text-blue-200 mt-1">User • 1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Full conversation history would be loaded from the API in a real implementation.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Transcript
              </Button>
              <Button>
                Open in Test Chat
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
