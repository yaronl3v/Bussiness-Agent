import Joi from 'joi';
import LeadService from '../services/lead_service.js';

const updateSchema = Joi.object({ status: Joi.string().valid('new', 'qualified', 'contacted', 'converted', 'rejected').required() });

export class LeadsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const leads = await LeadService.listForAgent(req.user.id, agentId);
      return res.json({ data: leads });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const lead = await LeadService.updateStatus(req.user.id, id, value.status);
      if (!lead) return res.status(404).json({ error: 'Not found' });
      return res.json(lead);
    } catch (err) { next(err); }
  }
}

export default LeadsController;
