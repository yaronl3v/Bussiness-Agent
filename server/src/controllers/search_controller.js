import Joi from 'joi';
import EmbeddingService from '../services/embedding_service.js';
import RetrieverService from '../services/retriever_service.js';

const askSchema = Joi.object({
  question: Joi.string().min(1).required(),
  topN: Joi.number().integer().min(1).max(400).default(200),
  topK: Joi.number().integer().min(1).max(50).default(10),
  useFTS: Joi.boolean().default(true),
  useTrigram: Joi.boolean().default(true),
  useRerank: Joi.boolean().default(true)
});

export class SearchController {
  static async ask(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { error, value } = askSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });

      const embedder = new EmbeddingService();
      const [queryEmbedding] = await embedder.embedTexts([value.question]);
      const results = await RetrieverService.searchHybrid({
        agentId,
        question: { text: value.question, embedding: queryEmbedding },
        topN: value.topN,
        topK: value.topK,
        useFTS: value.useFTS,
        useTrigram: value.useTrigram,
        useRerank: value.useRerank
      });
      return res.json({ data: results });
    } catch (err) { next(err); }
  }
}

export default SearchController;
