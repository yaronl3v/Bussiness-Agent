import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { agentsService } from '../../services/index.js';
import { useOrganization } from '../../hooks/useOrganization.js';
import AppLayout from '../../layouts/AppLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function AgentsList() {
  const { orgId, organizations, loading: orgLoading, needsOrgSelection, selectOrganization } = useOrganization();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    if (orgId && !orgLoading) {
      loadAgents();
    }
  }, [orgId, orgLoading]);

  const loadAgents = async () => {
    if (!orgId) {
      console.error('No organization ID available');
      return;
    }
    
    try {
      setLoading(true);
      const data = await agentsService.getAgents(orgId);
      // Ensure we always have an array
      const agentsArray = Array.isArray(data) ? data : (data?.data || []);
      setAgents(agentsArray);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (data) => {
    if (!orgId) {
      console.error('No organization ID available');
      return;
    }
    
    try {
      setActionLoading({ create: true });
      await agentsService.createAgent(orgId, data);
      reset();
      setShowCreateModal(false);
      loadAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleToggleStatus = async (agentId, currentStatus) => {
    if (!orgId) return;
    
    try {
      setActionLoading({ [agentId]: true });
      if (currentStatus === 'active') {
        await agentsService.updateAgent(orgId, agentId, { status: 'disabled' });
      } else {
        await agentsService.activateAgent(orgId, agentId);
      }
      loadAgents();
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
    } finally {
      setActionLoading({ ...actionLoading, [agentId]: false });
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!orgId) return;
    
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading({ [agentId]: true });
      await agentsService.deleteAgent(orgId, agentId);
      loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    } finally {
      setActionLoading({ ...actionLoading, [agentId]: false });
    }
  };

  const filteredAgents = (agents || []).filter(agent => {
    const matchesSearch = agent.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'disabled': return 'disabled';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (orgLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (needsOrgSelection) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Select Organization</h2>
          <p className="text-gray-500 mb-6">Choose an organization to continue</p>
          <div className="space-y-3 max-w-md mx-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => selectOrganization(org.id)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-500">ID: {org.id}</p>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!orgId) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Organization not found</h2>
          <p className="text-gray-500">Please try logging in again.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your AI agents and their configurations
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="sm:w-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="error">Error</option>
            </select>
          </div>
        </Card>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <EmptyState
            icon={PlusIcon}
            title="No agents found"
            description="Get started by creating your first AI agent"
            action={true}
            actionLabel="Create Agent"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => window.location.href = `/agents/${agent.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {agent.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Updated {formatDistanceToNow(new Date(agent.updatedAt))} ago
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {agent.documentsCount || 0} documents
                    </span>
                    <span className="text-xs text-gray-500">
                      {agent.conversationsCount || 0} conversations
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <Link to={`/agents/${agent.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" className="w-full">
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(agent.id, agent.status);
                    }}
                    disabled={actionLoading[agent.id]}
                    className="px-3"
                  >
                    {agent.status === 'active' ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAgent(agent.id);
                    }}
                    disabled={actionLoading[agent.id]}
                    className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Agent Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Agent"
        >
          <form onSubmit={handleSubmit(handleCreateAgent)} className="space-y-4">
            <Input
              label="Agent Name"
              placeholder="Enter agent name"
              {...register('name', {
                required: 'Agent name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              error={errors.name?.message}
            />
            
            <div>
              <label className="form-label">Welcome Message (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter a welcome message for users..."
                {...register('welcomeMessage')}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={actionLoading.create}
                disabled={actionLoading.create}
              >
                Create Agent
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
