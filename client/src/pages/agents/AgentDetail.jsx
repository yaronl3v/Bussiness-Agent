import { useState, useEffect } from 'react';
import { useParams, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  PauseIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { agentsService } from '../../services/index.js';
import { useOrganization } from '../../hooks/useOrganization.js';
import AppLayout from '../../layouts/AppLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import clsx from 'clsx';

const tabs = [
  { id: 'data', name: 'Data', path: 'data' },
  { id: 'whatsapp', name: 'WhatsApp', path: 'whatsapp' },
  { id: 'config', name: 'Configuration', path: 'config' },
  { id: 'test-chat', name: 'Test Chat', path: 'test-chat' },
  { id: 'leads', name: 'Leads', path: 'leads' },
  { id: 'conversations', name: 'Conversations', path: 'conversations' }
];

export default function AgentDetail() {
  const { agentId } = useParams();
  const { orgId, organizations } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const currentTab = location.pathname.split('/').pop();

  useEffect(() => {
    if (orgId && agentId) {
      loadAgent();
    }
  }, [orgId, agentId]);

  const loadAgent = async () => {
    if (!orgId) {
      navigate('/agents');
      return;
    }

    try {
      setLoading(true);
      const data = await agentsService.getAgent(orgId, agentId);
      setAgent(data);
      setNewName(data.name);
    } catch (error) {
      console.error('Failed to load agent:', error);
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (newName.trim() === agent.name || !orgId) {
      setEditingName(false);
      return;
    }

    try {
      setActionLoading({ saveName: true });
      await agentsService.updateAgent(orgId, agentId, { name: newName.trim() });
      setAgent({ ...agent, name: newName.trim() });
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update agent name:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleToggleStatus = async () => {
    if (!orgId) return;

    try {
      setActionLoading({ toggleStatus: true });
      if (agent.status === 'active') {
        await agentsService.updateAgent(orgId, agentId, { status: 'disabled' });
        setAgent({ ...agent, status: 'disabled' });
      } else {
        await agentsService.activateAgent(orgId, agentId);
        setAgent({ ...agent, status: 'active' });
      }
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleDeleteAgent = async () => {
    if (!orgId) return;

    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading({ delete: true });
      await agentsService.deleteAgent(orgId, agentId);
      navigate('/agents');
    } catch (error) {
      console.error('Failed to delete agent:', error);
    } finally {
      setActionLoading({});
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'disabled': return 'disabled';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Agent not found</h2>
          <Link to="/agents" className="text-blue-600 hover:text-blue-500">
            Return to agents list
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm">
          <Link 
            to="/agents" 
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Agents
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{agent.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {editingName ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="form-input flex-1 max-w-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setNewName(agent.name);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      loading={actionLoading.saveName}
                      disabled={actionLoading.saveName}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(agent.name);
                      }}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingName(true)}
                      className="p-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>ID: {agent.id}</span>
                <span>•</span>
                <span>
                  Organization: {
                    organizations.find(org => org.id === orgId)?.name || 
                    agent.organization?.name || 
                    agent.organizationName || 
                    'Unknown Organization'
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={getStatusVariant(agent.status)}>
                {agent.status}
              </Badge>
              
              <Button
                variant="secondary"
                onClick={handleToggleStatus}
                loading={actionLoading.toggleStatus}
                disabled={actionLoading.toggleStatus}
              >
                {agent.status === 'active' ? (
                  <>
                    <PauseIcon className="h-4 w-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </Button>
                {/* TODO: Add dropdown menu */}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
          {/* Mobile tab selector */}
          <div className="sm:hidden border-b border-gray-200">
            <select
              value={currentTab}
              onChange={(e) => navigate(`/agents/${agentId}/${e.target.value}`)}
              className="form-select border-none bg-transparent p-4 w-full"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.path}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop tabs */}
          <div className="hidden sm:block border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={`/agents/${agentId}/${tab.path}`}
                  className={clsx(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    currentTab === tab.path
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            <Outlet context={{ agent, orgId, loadAgent }} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
