import Joi from 'joi';
import VendorService from '../services/vendor_service.js';

const createSchema = Joi.object({ vendor_jsonb: Joi.object().required() });
const updateSchema = Joi.object({ vendor_jsonb: Joi.object(), status: Joi.string().valid('active','inactive') });

export class VendorsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const vendors = await VendorService.listForAgent(req.user.id, agentId);
      return res.json({ data: vendors });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const vendor = await VendorService.create(req.user.id, agentId, value.vendor_jsonb);
      return res.status(201).json(vendor);
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const vendor = await VendorService.update(req.user.id, id, value);
      if (!vendor) return res.status(404).json({ error: 'Not found' });
      return res.json(vendor);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      await VendorService.remove(req.user.id, id);
      return res.status(204).send();
    } catch (err) { next(err); }
  }

  static async route(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { leadId } = req.body;
      const result = await VendorService.routeLead({ userId: req.user.id, agentId, leadId });
      return res.json(result);
    } catch (err) { next(err); }
  }
}

export default VendorsController;
