import api from './api.js';

export const documentsService = {
  async getDocuments(agentId) {
    const response = await api.get(`/agents/${agentId}/documents`);
    return response.data;
  },

  async uploadDocuments(agentId, files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    const response = await api.post(`/agents/${agentId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};
