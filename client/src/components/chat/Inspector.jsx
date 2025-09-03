import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { DocumentTextIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';

export default function Inspector({ 
  data = null,
  className = ''
}) {
  const { retrieval, intakeUpdates, nextAction } = data || {};

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <CogIcon className="w-5 h-5 mr-2" />
        Inspector
      </h3>

      {/* Last Retrieval */}
      <Card>
        <div className="flex items-center space-x-2 mb-3">
          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900">Last Retrieval</h4>
        </div>
        
        {retrieval && retrieval.length > 0 ? (
          <div className="space-y-3">
            {retrieval.slice(0, 3).map((chunk, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    {chunk.document?.title || `Document ${index + 1}`}
                  </span>
                  <Badge variant="default" size="sm">
                    {(chunk.similarity * 100).toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {chunk.content?.substring(0, 120)}
                  {chunk.content?.length > 120 && '...'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No retrieval data available</p>
        )}
      </Card>

      {/* Intake Updates */}
      <Card>
        <div className="flex items-center space-x-2 mb-3">
          <UserIcon className="w-4 h-4 text-green-600" />
          <h4 className="font-medium text-gray-900">Intake Updates</h4>
        </div>
        
        {intakeUpdates && Object.keys(intakeUpdates).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(intakeUpdates).map(([field, value]) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span className="text-xs text-gray-900 max-w-32 truncate">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No intake updates</p>
        )}
      </Card>

      {/* Next Action */}
      <Card>
        <div className="flex items-center space-x-2 mb-3">
          <CogIcon className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-gray-900">Next Action</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600">Action:</span>
            <Badge 
              variant={
                nextAction?.type === 'ask' ? 'default' :
                nextAction?.type === 'confirm' ? 'warning' :
                nextAction?.type === 'store' ? 'success' : 'default'
              }
              size="sm"
            >
              {nextAction?.type || 'continue'}
            </Badge>
          </div>
          
          {nextAction?.summary && (
            <p className="text-xs text-gray-700">
              {nextAction.summary}
            </p>
          )}
        </div>
      </Card>

      {/* Agent Status */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-3">Agent Status</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Response Time:</span>
            <span className="text-gray-900">~1.2s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Documents:</span>
            <span className="text-gray-900">5 indexed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="text-gray-900">GPT-4</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
