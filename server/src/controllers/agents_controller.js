import Joi from 'joi';
import { AgentService } from '../services/agent_service.js';
import IngestionService from '../services/ingestion_service.js';
import LlmService from '../services/llm_service.js';
import SchemaBuilderService from '../services/schema_builder_service.js';

const isUuid = (s) => typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);

const flowItem = Joi.string().valid('DYNAMIC_INFO_SCHEMA_STATE', 'POST_COLLECTION_INFORMATION', 'LEAD_SCHEMA_STATE');

const createSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  welcome_message: Joi.string().allow(null, ''),
  welcomeMessage: Joi.string().allow(null, ''),
  special_instructions: Joi.string().allow(null, ''),
  specialInstructions: Joi.string().allow(null, ''),
  modules_jsonb: Joi.object().default({}),
  modules: Joi.object(),
  chat_flow_jsonb: Joi.array().items(flowItem),
  chatFlow: Joi.array().items(flowItem)
}).unknown(true);

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  status: Joi.string().valid('active', 'disabled'),
  welcome_message: Joi.string().allow(null, ''),
  welcomeMessage: Joi.string().allow(null, ''),
  special_instructions: Joi.string().allow(null, ''),
  specialInstructions: Joi.string().allow(null, ''),
  lead_schema_natural_text: Joi.string().allow(null, ''),
  leadSchemaNaturalText: Joi.string().allow(null, ''),
  dynamic_info_schema_natural_text: Joi.string().allow(null, ''),
  dynamicInfoSchemaNaturalText: Joi.string().allow(null, ''),
  post_collection_information_text: Joi.string().allow(null, ''),
  postCollectionInformationText: Joi.string().allow(null, ''),
  lead_form_schema_jsonb: Joi.object(),
  leadFormSchema: Joi.object(),
  dynamic_info_schema_jsonb: Joi.object(),
  dynamicInfoSchema: Joi.object(),
  modules_jsonb: Joi.object(),
  modules: Joi.object(),
  chat_flow_jsonb: Joi.array().items(flowItem),
  chatFlow: Joi.array().items(flowItem)
}).unknown(true);

export class AgentsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const agents = await AgentService.listForOrg(req.user.id, orgId);
      return res.json({ data: agents });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const payload = {
        name: value.name,
        welcome_message: value.welcome_message ?? value.welcomeMessage ?? null,
        special_instructions: value.special_instructions ?? value.specialInstructions ?? null,
        modules_jsonb: value.modules_jsonb ?? value.modules ?? {},
        chat_flow_jsonb: value.chat_flow_jsonb ?? value.chatFlow ?? ['DYNAMIC_INFO_SCHEMA_STATE', 'POST_COLLECTION_INFORMATION', 'LEAD_SCHEMA_STATE']
      };
      const agent = await AgentService.createForOrg(req.user.id, orgId, payload);
      if (!agent) return res.status(403).json({ error: 'Forbidden' });
      return res.status(201).json(agent);
    } catch (err) { next(err); }
  }

  static async get(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const agent = await AgentService.getByIdForOrg(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const updates = { ...value };

      // Fetch current agent to compare for change detection
      const currentAgent = await AgentService.getByIdForOrg(req.user.id, orgId, agentId);
      if (!currentAgent) return res.status(404).json({ error: 'Not found' });
      if (value.welcomeMessage !== undefined && updates.welcome_message === undefined) updates.welcome_message = value.welcomeMessage;
      if (value.specialInstructions !== undefined && updates.special_instructions === undefined) updates.special_instructions = value.specialInstructions;
      if (value.modules !== undefined && updates.modules_jsonb === undefined) updates.modules_jsonb = value.modules;
      if (value.leadFormSchema !== undefined && updates.lead_form_schema_jsonb === undefined) updates.lead_form_schema_jsonb = value.leadFormSchema;
      if (value.dynamicInfoSchema !== undefined && updates.dynamic_info_schema_jsonb === undefined) updates.dynamic_info_schema_jsonb = value.dynamicInfoSchema;
      if (value.chatFlow !== undefined && updates.chat_flow_jsonb === undefined) updates.chat_flow_jsonb = value.chatFlow;

      // Normalize natural text field
      if (value.leadSchemaNaturalText !== undefined && updates.lead_schema_natural_text === undefined) {
        updates.lead_schema_natural_text = value.leadSchemaNaturalText;
      }
      if (value.dynamicInfoSchemaNaturalText !== undefined && updates.dynamic_info_schema_natural_text === undefined) {
        updates.dynamic_info_schema_natural_text = value.dynamicInfoSchemaNaturalText;
      }
      // Normalize post-collection information text
      if (value.postCollectionInformationText !== undefined && updates.post_collection_information_text === undefined) {
        updates.post_collection_information_text = value.postCollectionInformationText;
      }

      // Decide if background rebuilds are needed (when natural text changed)
      const newLeadText = updates.lead_schema_natural_text;
      const newDynText = updates.dynamic_info_schema_natural_text;
      const changedLeadText = typeof newLeadText === 'string' && newLeadText !== (currentAgent.lead_schema_natural_text || '');
      const changedDynText = typeof newDynText === 'string' && newDynText !== (currentAgent.dynamic_info_schema_natural_text || '');
            // If the new natural text was cleared, also clear schema immediately
      if (changedLeadText && typeof newLeadText === 'string' && newLeadText.trim().length === 0) {
          updates.lead_form_schema_jsonb = [];
          console.log('Lead schema cleared due to empty natural text', { agentId });
      }
      if (changedDynText && typeof newDynText === 'string' && newDynText.trim().length === 0) {
          updates.dynamic_info_schema_jsonb = { sections: [] };
          console.log('Dynamic schema cleared due to empty natural text', { agentId });
      }

      const agent = await AgentService.updateForOrg(req.user.id, orgId, agentId, updates);
      if (!agent) return res.status(404).json({ error: 'Not found' });

      // Respond quickly; schedule background schema rebuilds if needed
      res.json({ ...agent, background: { leadSchemaRebuild: changedLeadText, dynamicSchemaRebuild: changedDynText } });

      // Fire-and-forget background tasks
      try {
        if (changedLeadText && newLeadText && newLeadText.trim().length > 0) {
            try { console.log('Scheduling background lead schema rebuild', { agentId }); } catch {}
            setImmediate(() => SchemaBuilderService.rebuildLeadSchema(agentId, newLeadText).then(() => console.log('Background lead schema rebuild complete', { agentId })).catch(e => console.error('Lead rebuild async error', e, { agentId })));
        }
        if (changedDynText && newDynText && newDynText.trim().length > 0) {
            try { console.log('Scheduling background dynamic schema rebuild', { agentId }); } catch {}
            setImmediate(() => SchemaBuilderService.rebuildDynamicSchema(agentId, newDynText).then(() => console.log('Background dynamic schema rebuild complete', { agentId })).catch(e => console.error('Dynamic rebuild async error', e, { agentId })));
        }
      } catch (e) {
          console.warn('Background rebuild scheduling failed', { error: e?.message });
      }
      return;
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const ok = await AgentService.removeForOrg(req.user.id, orgId, agentId);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      return res.status(204).send();
    } catch (err) { next(err); }
  }

  static async activate(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const agent = await AgentService.activate(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
    } catch (err) { next(err); }
  }

  static async reindex(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      if (!isUuid(orgId)) return res.status(400).json({ error: 'Invalid org id' });
      const agent = await AgentService.getByIdForOrg(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      const result = await IngestionService.reindexAgent({ agentId });
      return res.json(result);
    } catch (err) { next(err); }
  }
}

export default AgentsController;



