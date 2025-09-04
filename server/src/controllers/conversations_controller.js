import Joi from 'joi';
import ConversationService from '../services/conversation_service.js';
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';
import { Agent } from '../models/index.js';

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
      const routeStart = Date.now();
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      let { id } = req.params;
      const { error, value } = sendSchema.validate(req.body);
      if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map(d => d.message) });
      const agentId = value.agent_id ?? value.agentId ?? req.query.agent_id ?? req.body.agent_id; // client should send agent id
      const isUuid = (s) => typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);
      let welcomeMsg = null;
      let createdFresh = false;
      if (!isUuid(id)) {
        if (!agentId) return res.status(400).json({ error: 'agent_id is required to start a conversation' });
        // Always start a fresh conversation for the non-UUID path (e.g., 'new')
        const uniqueClientId = `u:${req.user.id}:${Date.now()}`;
        const created = await ConversationService.createNew({ agentId, clientId: uniqueClientId, channel: 'inapp' });
        id = created.id;
        createdFresh = true;
      }
      // Log user query content
        try { console.log('Conversation user message', { conversationId: id, agentId, userId: req.user.id, role: value.role, query: value.content }); } catch {}

      // Store user message first
      const userMsg = await ConversationService.sendMessage({ conversationId: id, role: value.role, content: value.content });

      // If first turn in a fresh conversation, add server-side welcome before invoking LLM
      if (createdFresh) {
        try {
          const agent = await Agent.findByPk(agentId);
          const welcomeText = agent?.dataValues?.welcome_message || 'Hi! I can help with your questions. You can upload documents to improve my answers.';
          welcomeMsg = await ConversationService.sendAssistant({ conversationId: id, text: welcomeText, citations: [] });
        } catch (e) {
          // ignore welcome errors
        }
      }
      const bot = new BotOrchestrator({ userId: req.user.id, agentId });
      const response = await bot.chat({ messageText: value.content, channel: 'inapp', context: { conversationId: id } });
      const assistantMsg = await ConversationService.sendAssistant({ conversationId: id, text: response.uiText || '', citations: response.citations || [] });
      const durationSec = (Date.now() - routeStart) / 1000;
        try { console.log('Conversation response complete', { conversationId: id, agentId, userId: req.user.id, duration_s: Number(durationSec.toFixed(3)) }); } catch {}
      const payload = { user: userMsg, assistant: assistantMsg, citations: response.citations || [], conversationId: id, doneSections: response.doneSections || [] };
      if (createdFresh && welcomeMsg) payload.welcome = welcomeMsg;
      return res.status(201).json(payload);
    } catch (err) { next(err); }
  }
}

export default ConversationsController;
