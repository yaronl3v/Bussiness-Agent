import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import Button from './Button.jsx';

export default function CopyableText({ 
  value, 
  label, 
  masked = false, 
  className = '' 
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!masked);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const displayValue = masked && !revealed 
    ? '•'.repeat(Math.min(value.length, 20)) 
    : value;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="form-label">{label}</label>
      )}
      <div className="flex items-center space-x-2">
        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm">
          {displayValue}
        </div>
        {masked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="px-2"
          >
            {revealed ? 'Hide' : 'Show'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="px-2"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
