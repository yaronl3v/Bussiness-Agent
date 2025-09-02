import Joi from 'joi';
import { OrgService } from '../services/org_service.js';

const createSchema = Joi.object({ name: Joi.string().min(2).max(255).required() });
const updateSchema = Joi.object({ name: Joi.string().min(2).max(255).optional(), settings_jsonb: Joi.object().optional() });

export class OrgsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const orgs = await OrgService.listForUser(req.user.id);
      return res.json({ data: orgs });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const org = await OrgService.createForUser(req.user.id, value);
      return res.status(201).json(org);
    } catch (err) { next(err); }
  }

  static async get(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const org = await OrgService.getByIdForUser(req.user.id, id);
      if (!org) return res.status(404).json({ error: 'Not found' });
      return res.json(org);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const { id } = req.params;
      const org = await OrgService.updateForUser(req.user.id, id, value);
      if (!org) return res.status(404).json({ error: 'Not found' });
      return res.json(org);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const ok = await OrgService.deleteForUser(req.user.id, id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      return res.status(204).send();
    } catch (err) { next(err); }
  }
}

export default OrgsController;
