import Joi from 'joi';
import ConversationService from '../services/conversation_service.js';
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';

const sendSchema = Joi.object({ role: Joi.string().valid('user', 'assistant').required(), content: Joi.string().min(1).required() });

export class ConversationsController {
  static async listMessages(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const messages = await ConversationService.listMessages(id);
      return res.json({ data: messages });
    } catch (err) { next(err); }
  }

  static async sendMessage(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { error, value } = sendSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const userMsg = await ConversationService.sendMessage({ conversationId: id, role: value.role, content: value.content });
      const conv = { id };
      const agentId = req.query.agent_id || req.body.agent_id; // client should send agent_id
      const bot = new BotOrchestrator({ userId: req.user.id, agentId });
      const response = await bot.chat({ messageText: value.content, channel: 'inapp', context: { conversationId: id } });
      const assistantMsg = await ConversationService.sendMessage({ conversationId: id, role: 'assistant', content: response.uiText || '' });
      if (response.citations) {
        // quick update to persist citations
        assistantMsg.citations_jsonb = response.citations;
      }
      return res.status(201).json({ user: userMsg, assistant: assistantMsg, citations: response.citations || [] });
    } catch (err) { next(err); }
  }
}

export default ConversationsController;
