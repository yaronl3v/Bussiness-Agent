import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { agentsService } from '../../services/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function Configuration() {
  const { agent, orgId, loadAgent } = useOutletContext();
  const [config, setConfig] = useState({
    welcomeMessage: '',
    specialInstructions: '',
    modules: {
      qna: true,
      recommendations: true,
      vendorRouting: false,
      whatsappEnabled: false
    },
    leadSchemaNaturalText: '',
    leadForm: [],
    dynamicSchema: {
      sections: [
        {
          id: 'contact',
          title: 'Contact Information',
          questions: [
            { id: 'company', label: 'Company Name', type: 'text', required: false },
            { id: 'role', label: 'Job Title', type: 'text', required: false }
          ]
        }
      ]
    }
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize config from agent data
  useEffect(() => {
    if (agent) {
      // Lead schema natural text and current parsed schema
      const leadSchemaNaturalText = agent.lead_schema_natural_text || agent.leadSchemaNaturalText || '';
      let leadFormData = agent.lead_form_schema_jsonb || agent.leadFormSchema;
      if (!Array.isArray(leadFormData)) {
        leadFormData = [];
      }

      // Ensure modules is always an object
      let modulesData = agent.modules_jsonb || agent.modules;
      if (!modulesData || typeof modulesData !== 'object') {
        modulesData = {
          qna: true,
          recommendations: true,
          vendorRouting: false,
          whatsappEnabled: false
        };
      }

      // Ensure dynamicSchema is always properly structured
      let dynamicSchemaData = agent.dynamic_info_schema_jsonb || agent.dynamicInfoSchema;
      if (!dynamicSchemaData || typeof dynamicSchemaData !== 'object' || !Array.isArray(dynamicSchemaData.sections)) {
        dynamicSchemaData = {
          sections: [
            {
              id: 'contact',
              title: 'Contact Information',
              questions: [
                { id: 'company', label: 'Company Name', type: 'text', required: false },
                { id: 'role', label: 'Job Title', type: 'text', required: false }
              ]
            }
          ]
        };
      }

      setConfig({
        welcomeMessage: agent.welcome_message || agent.welcomeMessage || '',
        specialInstructions: agent.special_instructions || agent.specialInstructions || '',
        modules: modulesData,
        leadSchemaNaturalText,
        leadForm: leadFormData,
        dynamicSchema: dynamicSchemaData
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!orgId || !agent) return;

    try {
      setSaving(true);
      await agentsService.updateAgent(orgId, agent.id, {
        welcomeMessage: config.welcomeMessage,
        specialInstructions: config.specialInstructions,
        modules: config.modules,
        leadSchemaNaturalText: config.leadSchemaNaturalText,
        dynamicInfoSchema: config.dynamicSchema
      });
      setHasUnsavedChanges(false);
      loadAgent(); // Refresh agent data
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    // Reset to agent data with proper type safety
    if (agent) {
      const leadSchemaNaturalText = agent.lead_schema_natural_text || agent.leadSchemaNaturalText || '';
      let leadFormData = agent.lead_form_schema_jsonb || agent.leadFormSchema;
      if (!Array.isArray(leadFormData)) {
        leadFormData = [];
      }

      // Ensure modules is always an object
      let modulesData = agent.modules_jsonb || agent.modules;
      if (!modulesData || typeof modulesData !== 'object') {
        modulesData = {
          qna: true,
          recommendations: true,
          vendorRouting: false,
          whatsappEnabled: false
        };
      }

      // Ensure dynamicSchema is always properly structured
      let dynamicSchemaData = agent.dynamic_info_schema_jsonb || agent.dynamicInfoSchema;
      if (!dynamicSchemaData || typeof dynamicSchemaData !== 'object' || !Array.isArray(dynamicSchemaData.sections)) {
        dynamicSchemaData = {
          sections: [
            {
              id: 'contact',
              title: 'Contact Information',
              questions: [
                { id: 'company', label: 'Company Name', type: 'text', required: false },
                { id: 'role', label: 'Job Title', type: 'text', required: false }
              ]
            }
          ]
        };
      }

      setConfig({
        welcomeMessage: agent.welcome_message || agent.welcomeMessage || '',
        specialInstructions: agent.special_instructions || agent.specialInstructions || '',
        modules: modulesData,
        leadSchemaNaturalText,
        leadForm: leadFormData,
        dynamicSchema: dynamicSchemaData
      });
    }
    setHasUnsavedChanges(false);
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Agent Configuration</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your agent's behavior and data collection
        </p>
      </div>

      {/* Welcome Message */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome Message</h3>
        <textarea
          className="form-textarea w-full"
          rows={3}
          placeholder="Enter a welcome message for users..."
          value={config.welcomeMessage}
          onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
        />
      </Card>

      {/* Special Instructions */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Special Instructions</h3>
        <textarea
          className="form-textarea w-full"
          rows={4}
          placeholder="Enter special instructions for the agent..."
          value={config.specialInstructions}
          onChange={(e) => updateConfig('specialInstructions', e.target.value)}
        />
        <p className="mt-2 text-sm text-gray-500">
          These instructions will guide how the agent responds to users
        </p>
      </Card>

      {/* Modules */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enabled Modules</h3>
        <div className="space-y-4">
          {Object.entries(config.modules).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {key === 'qna' && 'Q&A Module'}
                  {key === 'recommendations' && 'Recommendations'}
                  {key === 'vendorRouting' && 'Vendor Routing'}
                  {key === 'whatsappEnabled' && 'WhatsApp Integration'}
                </h4>
                <p className="text-sm text-gray-500">
                  {key === 'qna' && 'Allow users to ask questions about documents'}
                  {key === 'recommendations' && 'Provide recommendations based on user input'}
                  {key === 'vendorRouting' && 'Route qualified leads to vendors'}
                  {key === 'whatsappEnabled' && 'Enable WhatsApp messaging'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={value}
                  onChange={(e) => updateConfig(`modules.${key}`, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Lead Schema (Natural Language) */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Schema (Natural Language)</h3>
        <p className="text-sm text-gray-500 mb-3">Describe the lead fields you want to collect. Example: "Full name (required), Phone number - 9 digits (required), Email, Budget range"</p>
        <textarea
          className="form-textarea w-full"
          rows={5}
          placeholder="Full name, Phone number - 9 digits, Email, ..."
          value={config.leadSchemaNaturalText}
          onChange={(e) => updateConfig('leadSchemaNaturalText', e.target.value)}
        />
        {Array.isArray(config.leadForm) && config.leadForm.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900">Current Parsed Fields</h4>
            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
              {config.leadForm.map((f) => (
                <li key={f.id}>{f.label} ({f.type}) {f.required ? '- required' : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Save Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={handleDiscard} disabled={saving}>
                Discard
              </Button>
              <Button onClick={handleSave} loading={saving} disabled={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
