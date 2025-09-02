import Joi from 'joi';
import InviteService from '../services/invite_service.js';

const createSchema = Joi.object({ email: Joi.string().email().required() });

export class InvitesController {
  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: orgId } = req.params;
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const invite = await InviteService.create(orgId, value.email, req.user.id);
      return res.status(201).json(invite);
    } catch (err) { next(err); }
  }

  static async accept(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { token } = req.params;
      const invite = await InviteService.accept(token, req.user.id);
      if (!invite) return res.status(404).json({ error: 'Invalid or expired token' });
      return res.json(invite);
    } catch (err) { next(err); }
  }
}

export default InvitesController;
