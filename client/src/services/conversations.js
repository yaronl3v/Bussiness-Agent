import api from './api.js';

export const conversationsService = {
  async getConversationMessages(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(conversationId, message) {
    const response = await api.post(`/conversations/${conversationId}/messages`, { message });
    return response.data;
  }
};
