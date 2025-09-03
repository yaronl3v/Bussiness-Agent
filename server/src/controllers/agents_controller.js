import Joi from 'joi';
import { AgentService } from '../services/agent_service.js';
import IngestionService from '../services/ingestion_service.js';
import LlmService from '../services/llm_service.js';

const isUuid = (s) => typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);

const createSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  welcome_message: Joi.string().allow(null, ''),
  welcomeMessage: Joi.string().allow(null, ''),
  special_instructions: Joi.string().allow(null, ''),
  specialInstructions: Joi.string().allow(null, ''),
  modules_jsonb: Joi.object().default({}),
  modules: Joi.object()
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
  lead_form_schema_jsonb: Joi.object(),
  leadFormSchema: Joi.object(),
  dynamic_info_schema_jsonb: Joi.object(),
  dynamicInfoSchema: Joi.object(),
  modules_jsonb: Joi.object(),
  modules: Joi.object()
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
        modules_jsonb: value.modules_jsonb ?? value.modules ?? {}
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
      if (value.welcomeMessage !== undefined && updates.welcome_message === undefined) updates.welcome_message = value.welcomeMessage;
      if (value.specialInstructions !== undefined && updates.special_instructions === undefined) updates.special_instructions = value.specialInstructions;
      if (value.modules !== undefined && updates.modules_jsonb === undefined) updates.modules_jsonb = value.modules;
      if (value.leadFormSchema !== undefined && updates.lead_form_schema_jsonb === undefined) updates.lead_form_schema_jsonb = value.leadFormSchema;
      if (value.dynamicInfoSchema !== undefined && updates.dynamic_info_schema_jsonb === undefined) updates.dynamic_info_schema_jsonb = value.dynamicInfoSchema;

      // Normalize natural text field
      if (value.leadSchemaNaturalText !== undefined && updates.lead_schema_natural_text === undefined) {
        updates.lead_schema_natural_text = value.leadSchemaNaturalText;
      }

      // If natural text provided, parse into JSON schema via LLM
      const providedNatural = updates.lead_schema_natural_text ?? null;
      if (typeof providedNatural === 'string') {
        try {
          const llm = new LlmService();
          if (llm.isEnabled() && providedNatural.trim().length > 0) {
            const system = 'You convert business owners\' free-text descriptions of lead forms into a strict JSON schema. Output JSON only with fields: fields: [ { id, label, type, required, validation? } ]. Types: text, email, tel, number, date, select. Infer required from wording. Add id as snake_case of label. Never include comments.';
            const user = `Create schema from this description:\n\n${providedNatural}\n\nOutput only JSON.`;
            const { text } = await llm.chat({ system, user, model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini', temperature: 0 });
            try {
              const parsed = JSON.parse(text);
              if (parsed && typeof parsed === 'object') {
                updates.lead_form_schema_jsonb = parsed.fields || parsed;
              }
            } catch (e) {
              // Try to extract JSON if wrapped
              const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
              if (match) {
                try {
                  const parsed2 = JSON.parse(match[0]);
                  updates.lead_form_schema_jsonb = parsed2.fields || parsed2;
                } catch (_) {}
              }
            }
          }
        } catch (e) {
          // ignore LLM errors; we still save natural text
        }
      }
      const agent = await AgentService.updateForOrg(req.user.id, orgId, agentId, updates);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
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
