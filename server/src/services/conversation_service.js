import { Conversation, Message } from '../models/index.js';

export class ConversationService {
  static async getById(conversationId) {
    const convo = await Conversation.findByPk(conversationId);
    return convo ? convo.dataValues : null;
  }

  static async updateMeta(conversationId, meta) {
    await Conversation.update({ meta_jsonb: meta }, { where: { id: conversationId } });
    const convo = await Conversation.findByPk(conversationId);
    return convo ? convo.dataValues : null;
  }
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

  static async sendAssistant({ conversationId, text, citations }) {
    const payload = { conversation_id: conversationId, role: 'assistant', content_jsonb: { text }, citations_jsonb: citations || [] };
    const message = await Message.create(payload);
    return message.dataValues;
  }

  static async updateCitations(messageId, citations) {
    await Message.update({ citations_jsonb: citations || [] }, { where: { id: messageId } });
    const msg = await Message.findByPk(messageId);
    return msg ? msg.dataValues : null;
  }
}

export default ConversationService;
