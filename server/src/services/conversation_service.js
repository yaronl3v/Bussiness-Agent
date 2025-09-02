import { Conversation, Message } from '../models/index.js';

export class ConversationService {
  static async listMessages(conversationId) {
    const messages = await Message.findAll({ where: { conversation_id: conversationId }, order: [['created_at', 'ASC']] });
    return messages.map(m => m.dataValues);
  }

  static async createOrGet({ agentId, clientId, channel = 'inapp' }) {
    let convo = await Conversation.findOne({ where: { agent_id: agentId, client_id: clientId } });
    if (convo) return convo.dataValues;
    convo = await Conversation.create({ agent_id: agentId, client_id: clientId, channel, meta_jsonb: {} });
    return convo.dataValues;
  }

  static async sendMessage({ conversationId, role, content }) {
    const message = await Message.create({ conversation_id: conversationId, role, content_jsonb: { text: content }, citations_jsonb: [] });
    return message.dataValues;
  }
}

export default ConversationService;
