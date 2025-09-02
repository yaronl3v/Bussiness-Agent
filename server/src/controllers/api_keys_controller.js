import Joi from 'joi';
import ApiKeysService from '../services/api_keys_service.js';

const createSchema = Joi.object({ provider: Joi.string().min(1).required(), key_ref: Joi.string().min(1).required() });

export class ApiKeysController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const keys = await ApiKeysService.list(agentId);
      return res.json({ data: keys });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const key = await ApiKeysService.create(agentId, value);
      return res.status(201).json(key);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { keyId } = req.params;
      await ApiKeysService.remove(keyId);
      return res.status(204).send();
    } catch (err) { next(err); }
  }
}

export default ApiKeysController;
