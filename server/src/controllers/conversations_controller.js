import Joi from 'joi';
import ConversationService from '../services/conversation_service.js';
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';

const sendSchema = Joi.object({
  role: Joi.string().valid('user', 'assistant').required(),
  content: Joi.string().min(1).required(),
  agent_id: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  agentId: Joi.string().uuid({ version: 'uuidv4' }).optional()
}).unknown(true);

export class ConversationsController {
  static async createForAgent(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id: agentId } = req.params;
      const { clientId, channel } = req.body || {};
      const created = await ConversationService.createOrGet({ agentId, clientId: clientId || `u:${req.user.id}`, channel: channel || 'inapp' });
      return res.status(201).json({ id: created.id, agent_id: agentId, client_id: created.client_id, channel: created.channel });
    } catch (err) { next(err); }
  }
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
      let { id } = req.params;
      const { error, value } = sendSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const agentId = value.agent_id ?? value.agentId ?? req.query.agent_id ?? req.body.agent_id; // client should send agent id
      const isUuid = (s) => typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);
      if (!isUuid(id)) {
        if (!agentId) return res.status(400).json({ error: 'agent_id is required to start a conversation' });
        const created = await ConversationService.createOrGet({ agentId, clientId: `u:${req.user.id}`, channel: 'inapp' });
        id = created.id;
      }
      const userMsg = await ConversationService.sendMessage({ conversationId: id, role: value.role, content: value.content });
      const bot = new BotOrchestrator({ userId: req.user.id, agentId });
      const response = await bot.chat({ messageText: value.content, channel: 'inapp', context: { conversationId: id } });
      const assistantMsg = await ConversationService.sendAssistant({ conversationId: id, text: response.uiText || '', citations: response.citations || [] });
      return res.status(201).json({ user: userMsg, assistant: assistantMsg, citations: response.citations || [], conversationId: id });
    } catch (err) { next(err); }
  }
}

export default ConversationsController;
