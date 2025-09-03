import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  DocumentIcon, 
  ArrowUpTrayIcon, 
  TrashIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { documentsService } from '../../services/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function DataManager() {
  const { agent, orgId } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadDocuments();
  }, [agent.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsService.getDocuments(agent.id);
      // Ensure we always have an array
      const documentsArray = Array.isArray(data) ? data : (data?.data || []);
      setDocuments(documentsArray);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      await documentsService.uploadDocuments(agent.id, files);
      loadDocuments();
    } catch (error) {
      console.error('Failed to upload documents:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setActionLoading({ [documentId]: true });
      await documentsService.deleteDocument(agent.id, documentId);
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setActionLoading({ ...actionLoading, [documentId]: false });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'indexed': return 'success';
      case 'indexing': return 'indexing';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h2 className="text-lg font-semibold text-gray-900">Document Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage domain documents for your agent
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={loadDocuments}
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Re-index All
          </Button>
          
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button loading={uploading} disabled={uploading}>
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </label>
        </div>
      </div>

      {/* Upload Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <DocumentIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Supported File Types
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              PDF, Word documents (.doc, .docx), text files (.txt), and Markdown (.md) files up to 10MB each.
            </p>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      {documents.length === 0 ? (
        <EmptyState
          icon={DocumentIcon}
          title="No documents uploaded"
          description="Upload your first document to get started with your agent's knowledge base"
          action={true}
          actionLabel="Upload Documents"
          onAction={() => document.querySelector('input[type="file"]').click()}
        />
      ) : (
        <div className="space-y-4">
          {(documents || []).map((document) => (
            <Card key={document.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {document.title || document.filename}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(document.size)}</span>
                      <span>•</span>
                      <span>
                        Uploaded {formatDistanceToNow(new Date(document.createdAt))} ago
                      </span>
                      {document.pages && (
                        <>
                          <span>•</span>
                          <span>{document.pages} pages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusVariant(document.status)}>
                    {document.status}
                  </Badge>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-2"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDocument(document.id)}
                      loading={actionLoading[document.id]}
                      disabled={actionLoading[document.id]}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
