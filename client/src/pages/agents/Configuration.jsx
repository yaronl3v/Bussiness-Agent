import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { agentsService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.jsx';
import { UI_CONFIG } from '../../services/config.js';
import JsonEditor from '../../components/ui/JsonEditor.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import TextArea from '../../components/ui/TextArea.jsx';

const DEFAULT_FLOW = ['DYNAMIC_INFO_SCHEMA_STATE', 'POST_COLLECTION_INFORMATION', 'LEAD_SCHEMA_STATE'];
const SECTION_LABELS = {
  DYNAMIC_INFO_SCHEMA_STATE: 'Additional Questions',
  POST_COLLECTION_INFORMATION: 'Post-Collection Message',
  LEAD_SCHEMA_STATE: 'Lead Details'
};

export default function Configuration() {
  const { agent, orgId } = useOutletContext();
  const { success, error } = useToast();
  const [config, setConfig] = useState({
    welcomeMessage: '',
    specialInstructions: '',
    postCollectionInformationText: '',
    modules: {
      qna: true,
      recommendations: true,
      vendorRouting: false,
      whatsappEnabled: false,
      allowQuestionsBeforeGathering: true
    },
    leadSchemaNaturalText: '',
    leadForm: [],
    dynamicNaturalText: '',
    dynamicSchema: { sections: [] },
    chatFlow: DEFAULT_FLOW
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

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
          whatsappEnabled: false,
          allowQuestionsBeforeGathering: true
        };
      }
      if (modulesData.allowQuestionsBeforeGathering === undefined) {
        modulesData.allowQuestionsBeforeGathering = true;
      }

      // Ensure dynamicSchema is always properly structured
      let dynamicSchemaData = agent.dynamic_info_schema_jsonb || agent.dynamicInfoSchema;
      if (!dynamicSchemaData || typeof dynamicSchemaData !== 'object' || !Array.isArray(dynamicSchemaData.sections)) {
        dynamicSchemaData = { sections: [] };
      }

      const chatFlowData = Array.isArray(agent.chat_flow_jsonb || agent.chatFlow) && (agent.chat_flow_jsonb || agent.chatFlow).length > 0
        ? (agent.chat_flow_jsonb || agent.chatFlow)
        : DEFAULT_FLOW;

      setConfig({
        welcomeMessage: agent.welcome_message || agent.welcomeMessage || '',
        specialInstructions: agent.special_instructions || agent.specialInstructions || '',
        postCollectionInformationText: agent.post_collection_information_text || agent.postCollectionInformationText || '',
        modules: modulesData,
        leadSchemaNaturalText,
        leadForm: leadFormData,
        dynamicNaturalText: agent.dynamic_info_schema_natural_text || agent.dynamicInfoSchemaNaturalText || '',
        dynamicSchema: dynamicSchemaData,
        chatFlow: chatFlowData
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
        postCollectionInformationText: config.postCollectionInformationText,
        modules: config.modules,
        leadSchemaNaturalText: config.leadSchemaNaturalText,
        dynamicInfoSchemaNaturalText: config.dynamicNaturalText,
        dynamicInfoSchema: config.dynamicSchema,
        chatFlow: config.chatFlow
      });
      setHasUnsavedChanges(false);
      success('Configuration saved');
      // Background: poll schema refresh a few times to allow async rebuild
      const pollSchemaRefresh = async () => {
        const attempts = Number(UI_CONFIG.SCHEMA_REFRESH_ATTEMPTS) || 3;
        const delay = Number(UI_CONFIG.SCHEMA_REFRESH_DELAY_MS) || 10000;
        let anySuccess = false;

        for (let i = 0; i < attempts; i++) {
          // wait before each attempt (first attempt waits as well, matching previous behavior)
          await new Promise((resolve) => setTimeout(resolve, delay));
          try {
            const fresh = await agentsService.getAgent(orgId, agent.id);
            const leadFormData = Array.isArray(fresh.lead_form_schema_jsonb) ? fresh.lead_form_schema_jsonb : [];
            const dynamicSchemaData = (fresh.dynamic_info_schema_jsonb && Array.isArray(fresh.dynamic_info_schema_jsonb.sections)) ? fresh.dynamic_info_schema_jsonb : { sections: [] };
            setConfig(prev => ({
              ...prev,
              leadForm: leadFormData,
              dynamicSchema: dynamicSchemaData
            }));
            anySuccess = true;
          } catch (e) {
            console.warn(`Schema refresh attempt ${i + 1} failed:`, e);
          }
        }

        if (!anySuccess) {
          error('Saved, but refresh failed');
        }
      };

      // Fire and forget; do not block UI on background polling
      pollSchemaRefresh();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      error('Failed to save configuration');
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
        dynamicSchemaData = { sections: [] };
      }

      const chatFlowData = Array.isArray(agent.chat_flow_jsonb || agent.chatFlow) && (agent.chat_flow_jsonb || agent.chatFlow).length > 0
        ? (agent.chat_flow_jsonb || agent.chatFlow)
        : DEFAULT_FLOW;

      setConfig({
        welcomeMessage: agent.welcome_message || agent.welcomeMessage || '',
        specialInstructions: agent.special_instructions || agent.specialInstructions || '',
        postCollectionInformationText: agent.post_collection_information_text || agent.postCollectionInformationText || '',
        modules: modulesData,
        leadSchemaNaturalText,
        leadForm: leadFormData,
        dynamicNaturalText: agent.dynamic_info_schema_natural_text || agent.dynamicInfoSchemaNaturalText || '',
        dynamicSchema: dynamicSchemaData,
        chatFlow: chatFlowData
      });
    }
    setHasUnsavedChanges(false);
  };

  const handleFlowDrop = (index) => {
    if (dragIndex === null) return;
    const newOrder = [...config.chatFlow];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    setDragIndex(null);
    updateConfig('chatFlow', newOrder);
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
        <TextArea
          label="Welcome Message"
          rows={3}
          placeholder="Enter a welcome message for users..."
          value={config.welcomeMessage}
          onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
          hint="This message will be shown to users when they first interact with your agent"
        />
      </Card>

      {/* Special Instructions */}
      <Card>
        <TextArea
          label="Special Instructions"
          rows={4}
          placeholder="Enter special instructions for the agent..."
          value={config.specialInstructions}
          onChange={(e) => updateConfig('specialInstructions', e.target.value)}
          hint="These instructions will guide how the agent responds to users"
        />
      </Card>

      {/* Post-Collection Information */}
      <Card>
        <TextArea
          label="Post-Collection Message"
          rows={5}
          placeholder="Write the message to send after all required details are collected."
          value={config.postCollectionInformationText}
          onChange={(e) => updateConfig('postCollectionInformationText', e.target.value)}
          hint="After collecting the user's details, the bot will send this message tailored to the user's attributes (e.g., gender), in their language."
        />
      </Card>

      {/* Conversation Flow */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation Flow</h3>
        <p className="text-sm text-gray-500 mb-3">Drag to set the order in which the bot handles each section.</p>
        <ul>
          {config.chatFlow.map((id, index) => (
            <li
              key={id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleFlowDrop(index)}
              onDragEnd={() => setDragIndex(null)}
              className="p-2 mb-2 bg-gray-50 border rounded flex items-center justify-between cursor-move"
            >
              <span>{SECTION_LABELS[id] || id}</span>
              <span className="text-gray-400">⋮⋮</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Conversation Behavior */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Conversation Behavior</h3>
          <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Flow</span>
        </div>
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-purple-200 transition-colors">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">Allow questions before gathering info</h4>
            <p className="text-sm text-gray-600 mt-1">
              When enabled, the agent may answer user questions even if required intake fields are still missing, then continue collecting details.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!config.modules.allowQuestionsBeforeGathering}
              onChange={(e) => updateConfig('modules.allowQuestionsBeforeGathering', e.target.checked)}
            />
            <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 shadow-sm"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {config.modules.allowQuestionsBeforeGathering ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </Card>

      {/* Modules */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Enabled Modules</h3>
          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Interactive</span>
        </div>
        <div className="space-y-6">
          {Object.entries(config.modules).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-blue-200 transition-colors">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {key === 'qna' && '💬 Q&A Module'}
                  {key === 'recommendations' && '🎯 Recommendations'}
                  {key === 'vendorRouting' && '🔄 Vendor Routing'}
                  {key === 'whatsappEnabled' && '📱 WhatsApp Integration'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {key === 'qna' && 'Allow users to ask questions about documents'}
                  {key === 'recommendations' && 'Provide recommendations based on user input'}
                  {key === 'vendorRouting' && 'Route qualified leads to vendors'}
                  {key === 'whatsappEnabled' && 'Enable WhatsApp messaging'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={value}
                  onChange={(e) => updateConfig(`modules.${key}`, e.target.checked)}
                />
                <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {value ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Lead Details (Natural Language) */}
      <Card>
        <TextArea
          label="Lead Details (Natural Language)"
          rows={5}
          placeholder="Full name, Phone number - 9 digits, Email, ..."
          value={config.leadSchemaNaturalText}
          onChange={(e) => updateConfig('leadSchemaNaturalText', e.target.value)}
          hint='Describe the lead fields you want to collect. Example: "Full name (required), Phone number - 9 digits (required), Email, Budget range"'
        />
        {Array.isArray(config.leadForm) && config.leadForm.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
              ✅ Current Parsed Fields
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Auto-generated</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {config.leadForm.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm text-green-700 bg-white px-3 py-2 rounded-md border border-green-200">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-green-600">({f.type})</span>
                  {f.required && <span className="text-red-600 text-xs font-semibold">REQUIRED</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Additional Questions (Natural Language) */}
      <Card>
        <TextArea
          label="Additional Questions (Natural Language)"
          rows={5}
          placeholder="Do you have kids?; Preferred contact time; Budget range..."
          value={config.dynamicNaturalText}
          onChange={(e) => updateConfig('dynamicNaturalText', e.target.value)}
          hint='Describe additional questions or fields to collect. You can also write explicit questions like "Do you have kids?"'
        />
      </Card>

      {/* Additional Questions (JSON Editor) */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Questions Schema (JSON)</h3>
        <p className="text-sm text-gray-500 mb-3">Structure: {`{ sections: [ { id, title, questions: [ { id, label, type, required?, question? } ] } ] }`}</p>
        <JsonEditor
          value={config.dynamicSchema}
          onChange={(val) => updateConfig('dynamicSchema', val)}
          label="Additional Questions Schema"
          height="240px"
        />
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

