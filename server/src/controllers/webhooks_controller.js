import Joi from 'joi';
import ConversationService from '../services/conversation_service.js';
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';
import WhatsAppService from '../services/whatsapp_service.js';
import { Agent } from '../models/index.js';

const verifySchema = Joi.object({ 'hub.mode': Joi.string(), 'hub.challenge': Joi.string(), 'hub.verify_token': Joi.string() }).unknown(true);

export class WebhooksController {
  static async whatsappVerify(req, res) {
    const { value } = verifySchema.validate(req.query);
    const token = process.env.WHATSAPP_VERIFY_TOKEN || '';
    if (value['hub.mode'] === 'subscribe' && value['hub.verify_token'] === token) {
      return res.status(200).send(value['hub.challenge']);
    }
    return res.status(403).send('Forbidden');
  }

  static async whatsappInbound(req, res, next) {
    try {
      const body = req.body;
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message) return res.status(200).json({ status: 'ok' });

      const from = message.from;
      const text = message.text?.body || '';
      const agentId = req.query.agent_id || change?.value?.metadata?.agent_id || null;
      if (!agentId) return res.status(400).json({ error: 'agent_id missing' });

      const convo = await ConversationService.createOrGet({ agentId, clientId: from, channel: 'whatsapp' });

      // Determine if this is a new conversation (no prior messages)
      let isNew = false;
      try {
        const prior = await ConversationService.getRecentMessages(convo.id, 1);
        isNew = (Array.isArray(prior) && prior.length === 0);
      } catch {}

      // Store inbound user message first
      await ConversationService.sendMessage({ conversationId: convo.id, role: 'user', content: text });

      // Send welcome next if this is a new conversation (before LLM)
      if (isNew) {
        try {
          const agent = await Agent.findByPk(agentId);
          const welcomeText = agent?.dataValues?.welcome_message || 'Hi! I can help with your questions. You can upload documents to improve my answers.';
          await ConversationService.sendAssistant({ conversationId: convo.id, text: welcomeText, citations: [] });
          await WhatsAppService.sendText({ to: from, text: welcomeText });
        } catch {}
      }

      const bot = new BotOrchestrator({ userId: null, agentId });
      const response = await bot.chat({ messageText: text, channel: 'whatsapp', context: { conversationId: convo.id } });

      const assistant = await ConversationService.sendMessage({ conversationId: convo.id, role: 'assistant', content: response.uiText || '' });
      if (response.citations) assistant.citations_jsonb = response.citations;

      // send outbound reply stub
      await WhatsAppService.sendText({ to: from, text: response.uiText || '' });

      return res.status(200).json({ status: 'handled' });
    } catch (err) { next(err); }
  }
}

export default WebhooksController;
