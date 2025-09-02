import Joi from 'joi';
import { AuthService } from '../services/auth_service.js';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export class AuthController {
  static async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      }
      const result = await AuthService.register(value);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      }
      const result = await AuthService.login(value);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      return res.status(200).json({ ok: true });
    } catch (err) { next(err); }
  }
}

export default AuthController;
