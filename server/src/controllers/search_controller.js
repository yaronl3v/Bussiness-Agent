import Joi from 'joi';
import EmbeddingService from '../services/embedding_service.js';
import RetrieverService from '../services/retriever_service.js';
import LlmService from '../services/llm_service.js';
import loadPrompt from '../services/bot/prompt_loader.js';
import { detectLanguageFromText } from '../utils/language.js';

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

      console.log('[ask] agentId=', agentId, 'question=', value.question);
      const embedder = new EmbeddingService();
      const [queryEmbedding] = await embedder.embedTexts([value.question]);
      console.log('[ask] embedding length=', Array.isArray(queryEmbedding) ? queryEmbedding.length : 'n/a');
      const results = await RetrieverService.searchHybrid({
        agentId,
        question: { text: value.question, embedding: queryEmbedding },
        topN: value.topN,
        topK: value.topK,
        useFTS: value.useFTS,
        useTrigram: value.useTrigram,
        useRerank: value.useRerank
      });
      console.log('[ask] results count=', results.length);

      // Build answer using LLM (conversational when no passages)
      let answer = '';
      let citations = [];
      try {
        const llm = new LlmService();
        const lang = detectLanguageFromText(value.question);
        if (llm.isEnabled()) {
          if (results.length > 0) {
            const contextText = results.map((p, i) => `[${i+1}] ${p.content}`).join('\n');
            const sys = await loadPrompt('qna_system.txt', { agentName: '', userLanguage: lang.languageName, textDirection: lang.textDirection }, lang.locale);
            const usr = `QUESTION: ${value.question}\nCONTEXT:\n${contextText}`;
            const { text } = await llm.chat({ system: sys, user: usr, temperature: 0.1 });
            answer = text || '';
            citations = RetrieverService.toCitations(results);
          } else {
            const sys = await loadPrompt('chat_system.txt', { agentName: '', userLanguage: lang.languageName, textDirection: lang.textDirection }, lang.locale);
            const { text } = await llm.chat({ system: sys, user: value.question, temperature: 0.6 });
            answer = text || '';
          }
        }
      } catch (e) {
        console.log('[ask] llm synthesis error', e?.message);
      }

      return res.json({ data: results, answer, citations });
    } catch (err) { next(err); }
  }
}

export default SearchController;
