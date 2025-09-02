import Joi from 'joi';
import { AgentService } from '../services/agent_service.js';
import IngestionService from '../services/ingestion_service.js';

const createSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  welcome_message: Joi.string().allow(null, ''),
  special_instructions: Joi.string().allow(null, ''),
  modules_jsonb: Joi.object().default({})
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  status: Joi.string().valid('active', 'disabled'),
  welcome_message: Joi.string().allow(null, ''),
  special_instructions: Joi.string().allow(null, ''),
  lead_form_schema_jsonb: Joi.object(),
  dynamic_info_schema_jsonb: Joi.object(),
  modules_jsonb: Joi.object()
});

export class AgentsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId } = req.params;
      const agents = await AgentService.listForOrg(req.user.id, orgId);
      return res.json({ data: agents });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId } = req.params;
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const agent = await AgentService.createForOrg(req.user.id, orgId, value);
      if (!agent) return res.status(403).json({ error: 'Forbidden' });
      return res.status(201).json(agent);
    } catch (err) { next(err); }
  }

  static async get(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      const agent = await AgentService.getByIdForOrg(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const agent = await AgentService.updateForOrg(req.user.id, orgId, agentId, value);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      const ok = await AgentService.removeForOrg(req.user.id, orgId, agentId);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      return res.status(204).send();
    } catch (err) { next(err); }
  }

  static async activate(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      const agent = await AgentService.activate(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      return res.json(agent);
    } catch (err) { next(err); }
  }

  static async reindex(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId, agentId } = req.params;
      const agent = await AgentService.getByIdForOrg(req.user.id, orgId, agentId);
      if (!agent) return res.status(404).json({ error: 'Not found' });
      const result = await IngestionService.reindexAgent({ agentId });
      return res.json(result);
    } catch (err) { next(err); }
  }
}

export default AgentsController;
