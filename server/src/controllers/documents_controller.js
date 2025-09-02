import Joi from 'joi';
import { Document } from '../models/index.js';
import { extractTextFromFile, normalizeText } from '../utils/text_extraction.js';

const createSchema = Joi.object({
  title: Joi.string().min(1).max(512).required(),
  raw_text: Joi.string().min(1).required(),
  source_uri: Joi.string().allow('', null)
});

export class DocumentsController {
  static async list(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const docs = await Document.findAll({ where: { agent_id: agentId } });
      return res.json({ data: docs.map(d => d.dataValues) });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const doc = await Document.create({ agent_id: agentId, ...value, meta_jsonb: {} });
      return res.status(201).json(doc.dataValues);
    } catch (err) { next(err); }
  }

  static async upload(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      const text = await extractTextFromFile(req.file.path, req.file.mimetype);
      const normalized = normalizeText(text);
      const title = req.file.originalname;
      const doc = await Document.create({ agent_id: agentId, title, source_uri: req.file.path, raw_text: normalized, meta_jsonb: { mimetype: req.file.mimetype, size: req.file.size } });
      return res.status(201).json(doc.dataValues);
    } catch (err) { next(err); }
  }

  static async remove(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { docId } = req.params;
      await Document.destroy({ where: { id: docId } });
      return res.status(204).send();
    } catch (err) { next(err); }
  }
}

export default DocumentsController;
