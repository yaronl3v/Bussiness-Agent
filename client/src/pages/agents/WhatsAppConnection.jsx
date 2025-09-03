import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function WhatsAppConnection() {
  const { agent, orgId } = useOutletContext();
  const [showToken, setShowToken] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken] = useState('ba_verify_' + Math.random().toString(36).substr(2, 9));
  const [webhookUrl] = useState(`https://api.yourdomain.com/api/webhooks/whatsapp`);

  const connectionStatus = 'disconnected'; // This would come from the agent data
  const lastMessage = null; // This would come from the agent data

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  const handleSaveToken = () => {
    // TODO: Save access token
    console.log('Saving access token:', accessToken);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect your agent to WhatsApp Business API
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {connectionStatus === 'connected' ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </h3>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'connected' 
                  ? 'Your agent is ready to receive WhatsApp messages'
                  : 'Complete the setup steps below to connect WhatsApp'
                }
              </p>
            </div>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'success' : 'error'}>
            {connectionStatus}
          </Badge>
        </div>

        {lastMessage && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Last inbound message: {new Date(lastMessage.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </Card>

      {/* Setup Instructions */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Instructions</h3>
        
        <div className="space-y-6">
          {/* Step 1: Webhook URL */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Webhook URL</h4>
              <p className="mt-1 text-sm text-gray-600">
                Add this URL to your WhatsApp Business API webhook configuration
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono">
                  {webhookUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyToClipboard(webhookUrl)}
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Verify Token */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Verify Token</h4>
              <p className="mt-1 text-sm text-gray-600">
                Use this token when setting up the webhook in Meta Developer Console
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono">
                  {showToken ? verifyToken : '•'.repeat(verifyToken.length)}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyToClipboard(verifyToken)}
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Access Token */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Access Token</h4>
              <p className="mt-1 text-sm text-gray-600">
                Enter your WhatsApp Business API access token
              </p>
              <div className="mt-2 space-y-3">
                <Input
                  type="password"
                  placeholder="Enter your access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <Button
                  onClick={handleSaveToken}
                  disabled={!accessToken.trim()}
                  size="sm"
                >
                  Save Token
                </Button>
              </div>
            </div>
          </div>

          {/* Step 4: Test */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              4
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Test Connection</h4>
              <p className="mt-1 text-sm text-gray-600">
                Send a test message to your WhatsApp number to verify the connection
              </p>
              <Button size="sm" variant="secondary" className="mt-2">
                Send Test Message
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Messages */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Inbound Messages</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No messages received yet</p>
          <p className="text-sm mt-1">Messages will appear here once WhatsApp is connected</p>
        </div>
      </Card>
    </div>
  );
}
