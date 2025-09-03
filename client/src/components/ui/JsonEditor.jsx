import { useState } from 'react';
import Button from './Button.jsx';
import { EyeIcon, EyeSlashIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export default function JsonEditor({ 
  value, 
  onChange, 
  label = "JSON Editor",
  height = "300px" 
}) {
  const [showJson, setShowJson] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState('');

  const handleToggleView = () => {
    if (!showJson) {
      // Switching to JSON view
      setJsonValue(JSON.stringify(value, null, 2));
      setError('');
    } else {
      // Switching back to form view - validate JSON
      try {
        const parsed = JSON.parse(jsonValue);
        onChange(parsed);
        setError('');
      } catch (err) {
        setError('Invalid JSON syntax');
        return;
      }
    }
    setShowJson(!showJson);
  };

  const handleJsonChange = (newValue) => {
    setJsonValue(newValue);
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="form-label">{label}</label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleToggleView}
          className="flex items-center space-x-2"
        >
          {showJson ? (
            <>
              <EyeSlashIcon className="h-4 w-4" />
              <span>Form View</span>
            </>
          ) : (
            <>
              <CodeBracketIcon className="h-4 w-4" />
              <span>JSON View</span>
            </>
          )}
        </Button>
      </div>

      {showJson ? (
        <div className="space-y-2">
          <textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="form-textarea font-mono text-sm"
            style={{ height }}
            placeholder="Enter valid JSON..."
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowJson(false);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleToggleView}
              disabled={!!error}
            >
              Apply JSON
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <p className="mb-2">Current schema structure:</p>
          <pre className="text-xs font-mono bg-white rounded border p-2 overflow-auto max-h-32">
            {JSON.stringify(value, null, 2)}
          </pre>
          <p className="mt-2 text-xs text-gray-500">
            Click "JSON View" to edit the raw JSON structure
          </p>
        </div>
      )}
    </div>
  );
}
