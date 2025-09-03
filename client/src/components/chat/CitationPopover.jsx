import { useState } from 'react';
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function CitationPopover({ 
  citation, 
  isOpen, 
  onClose, 
  position = { top: 0, left: 0 } 
}) {
  if (!isOpen || !citation) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Popover */}
      <div 
        className="fixed z-50 w-80 max-w-sm"
        style={{ 
          top: position.top, 
          left: Math.min(position.left, window.innerWidth - 320 - 20) 
        }}
      >
        <Card className="p-0 shadow-xl border-gray-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Source</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="p-1"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {citation.document?.title || 'Document'}
                </h4>
                <p className="text-xs text-gray-500">
                  Page {citation.page || 'Unknown'} • Similarity: {(citation.similarity * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {citation.content || citation.text || 'No preview available'}
                </p>
              </div>

              {citation.position_jsonb && (
                <div className="text-xs text-gray-500">
                  Position: {JSON.stringify(citation.position_jsonb)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
