import Joi from 'joi';
import ConversationService from '../services/conversation_service.js';
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';
import WhatsAppService from '../services/whatsapp_service.js';

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
      await ConversationService.sendMessage({ conversationId: convo.id, role: 'user', content: text });

      const bot = new BotOrchestrator({ userId: null, agentId });
      const response = await bot.chat({ messageText: text, channel: 'whatsapp', context: { conversationId: convo.id } });

      await ConversationService.sendMessage({ conversationId: convo.id, role: 'assistant', content: response.uiText || '' });

      // send outbound reply stub
      await WhatsAppService.sendText({ to: from, text: response.uiText || '' });

      return res.status(200).json({ status: 'handled' });
    } catch (err) { next(err); }
  }
}

export default WebhooksController;
