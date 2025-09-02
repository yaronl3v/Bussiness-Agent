import api from './api.js';

export const agentsService = {
  async getAgents() {
    const response = await api.get('/agents');
    return response.data;
  },

  async getAgent(id) {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  async createAgent(data) {
    const response = await api.post('/agents', data);
    return response.data;
  },

  async updateAgent(id, data) {
    const response = await api.patch(`/agents/${id}`, data);
    return response.data;
  },

  async deleteAgent(id) {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  },

  async activateAgent(id) {
    const response = await api.post(`/agents/${id}/activate`);
    return response.data;
  },

  async updateConfig(id, config) {
    const response = await api.patch(`/agents/${id}/config`, config);
    return response.data;
  },

  async askAgent(id, message) {
    const response = await api.post(`/agents/${id}/ask`, { message });
    return response.data;
  },

  async getLeads(id) {
    const response = await api.get(`/agents/${id}/leads`);
    return response.data;
  },

  async reindexDocuments(id) {
    const response = await api.post(`/agents/${id}/reindex`);
    return response.data;
  }
};
