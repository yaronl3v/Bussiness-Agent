/**
 * Centralized API Services
 * All API calls are organized here using the centralized ApiClient
 */

import apiClient from './ApiClient.js';
import { API_CONFIG } from './config.js';
import { ENDPOINTS, buildUrl, QUERY_PARAMS } from './endpoints.js';

/**
 * Authentication Service
 */
export const authService = {
  async login(email, password) {
    const data = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    if (data.token) {
      apiClient.setAuthToken(data.token);
    }
    // Login doesn't return organizationId - we'll fetch orgs separately
    return data;
  },

  async register(organizationName, email, password) {
    const data = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
      organizationName,
      email,
      password,
    });
    if (data.token) {
      apiClient.setAuthToken(data.token);
    }
    // Store organization ID from registration response (if provided)
    if (data.organizationId) {
      localStorage.setItem('selected_org_id', data.organizationId);
    }
    return data;
  },

  async bootstrapSession() {
    // Implement the session bootstrap pattern from the docs
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    let selectedOrgId = localStorage.getItem('selected_org_id') || null;
    
    // Fetch user's organizations
    const orgs = await organizationsService.getOrganizations();
    
    // Validate and select organization
    if (!selectedOrgId && orgs.length === 1) {
      selectedOrgId = orgs[0].id;
    }
    
    if (selectedOrgId && !orgs.find(o => o.id === selectedOrgId)) {
      selectedOrgId = null; // stale org ID
    }
    
    if (selectedOrgId) {
      localStorage.setItem('selected_org_id', selectedOrgId);
    }
    
    return {
      organizations: orgs,
      selectedOrgId,
      needsOrgSelection: !selectedOrgId
    };
  },

  async logout() {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearAuthToken();
      localStorage.removeItem('selected_org_id');
    }
  },

  isAuthenticated() {
    return apiClient.isAuthenticated();
  },

  getToken() {
    return apiClient.getAuthToken();
  },

  getCurrentOrgId() {
    return localStorage.getItem('selected_org_id');
  },

  setCurrentOrgId(orgId) {
    localStorage.setItem('selected_org_id', orgId);
  }
};

/**
 * Agents Service
 */
export const agentsService = {
  async getAgents(orgId, params = {}) {
    const url = buildUrl(ENDPOINTS.AGENTS.LIST(orgId), params);
    const response = await apiClient.get(url);
    // Handle both direct array and { data: [...] } response formats
    return Array.isArray(response) ? response : (response?.data || []);
  },

  async getAgent(orgId, agentId) {
    return await apiClient.get(ENDPOINTS.AGENTS.DETAIL(orgId, agentId));
  },

  async createAgent(orgId, data) {
    // Convert camelCase to snake_case for server
    const serverData = {
      name: data.name,
      modules_jsonb: data.modules || {}
    };
    return await apiClient.post(ENDPOINTS.AGENTS.CREATE(orgId), serverData);
  },

  async updateAgent(orgId, agentId, data) {
    // Convert camelCase to snake_case for server
    const serverData = {};
    if (data.name) serverData.name = data.name;
    if (data.status) serverData.status = data.status;
    if (data.welcomeMessage !== undefined) serverData.welcome_message = data.welcomeMessage;
    if (data.specialInstructions !== undefined) serverData.special_instructions = data.specialInstructions;
    if (data.leadSchemaNaturalText !== undefined) serverData.lead_schema_natural_text = data.leadSchemaNaturalText;
    if (data.leadFormSchema !== undefined) serverData.lead_form_schema_jsonb = data.leadFormSchema;
    if (data.dynamicInfoSchema !== undefined) serverData.dynamic_info_schema_jsonb = data.dynamicInfoSchema;
    if (data.dynamicInfoSchemaNaturalText !== undefined) serverData.dynamic_info_schema_natural_text = data.dynamicInfoSchemaNaturalText;
    if (data.postCollectionInformationText !== undefined) serverData.post_collection_information_text = data.postCollectionInformationText;
    if (data.modules !== undefined) serverData.modules_jsonb = data.modules;
    if (data.chatFlow !== undefined) serverData.chat_flow_jsonb = data.chatFlow;
    
    return await apiClient.patch(ENDPOINTS.AGENTS.UPDATE(orgId, agentId), serverData);
  },

  async deleteAgent(orgId, agentId) {
    return await apiClient.delete(ENDPOINTS.AGENTS.DELETE(orgId, agentId));
  },

  async activateAgent(orgId, agentId) {
    return await apiClient.post(ENDPOINTS.AGENTS.ACTIVATE(orgId, agentId));
  },

  async askAgent(agentId, question, options = {}) {
    const requestData = {
      question,
      topN: options.topN || 200,
      topK: options.topK || 10,
      useFTS: options.useFTS !== false,
      useTrigram: options.useTrigram !== false,
      useRerank: options.useRerank !== false
    };
    return await apiClient.post(ENDPOINTS.AGENTS.ASK(agentId), requestData);
  },

  async reindexDocuments(orgId, agentId) {
    return await apiClient.post(ENDPOINTS.AGENTS.REINDEX(orgId, agentId));
  }
};

/**
 * Documents Service
 */
export const documentsService = {
  async getDocuments(agentId, params = {}) {
    const url = buildUrl(ENDPOINTS.DOCUMENTS.LIST(agentId), params);
    return await apiClient.get(url);
  },

  async createTextDocument(agentId, data) {
    const serverData = {
      title: data.title,
      raw_text: data.rawText,
      source_uri: data.sourceUri || null
    };
    return await apiClient.post(ENDPOINTS.DOCUMENTS.CREATE_TEXT(agentId), serverData);
  },

  async uploadDocuments(agentId, files, onProgress = null) {
    // Upload single file (the API expects single file)
    const file = Array.isArray(files) ? files[0] : files;
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      };
    }

    const response = await apiClient.client.post(ENDPOINTS.DOCUMENTS.UPLOAD(agentId), formData, config);
    return response.data;
  },

  async ingestDocument(agentId, docId) {
    return await apiClient.post(ENDPOINTS.DOCUMENTS.INGEST(agentId, docId));
  },

  async deleteDocument(agentId, docId) {
    return await apiClient.delete(ENDPOINTS.DOCUMENTS.DELETE(agentId, docId));
  }
};

/**
 * Conversations Service
 */
export const conversationsService = {
  async getConversationMessages(conversationId, params = {}) {
    const url = buildUrl(ENDPOINTS.CONVERSATIONS.MESSAGES(conversationId), params);
    return await apiClient.get(url);
  },

  async sendMessage(conversationId, agentId, content, role = 'user') {
    const messageData = {
      role,
      content,
      agentId: agentId  // Use camelCase as server expects
    };
    return await apiClient.post(ENDPOINTS.CONVERSATIONS.SEND_MESSAGE(conversationId), messageData, { timeout: API_CONFIG.CHAT_TIMEOUT_MS });
  },

  async sendFirstMessage(agentId, content, role = 'user') {
    // Send first message without conversation ID - server will create one
    const messageData = {
      role,
      content,
      agentId: agentId
    };
    return await apiClient.post(ENDPOINTS.CONVERSATIONS.SEND_NEW_MESSAGE, messageData, { timeout: API_CONFIG.CHAT_TIMEOUT_MS });
  },

  async createConversation(agentId, clientId = null, channel = 'inapp') {
    const conversationData = {
      clientId,
      channel
    };
    return await apiClient.post(ENDPOINTS.CONVERSATIONS.CREATE(agentId), conversationData);
  },

  async getConversations(agentId, params = {}) {
    const url = buildUrl(ENDPOINTS.CONVERSATIONS.LIST(agentId), params);
    return await apiClient.get(url);
  },

  async exportConversation(conversationId, format = 'json') {
    return await apiClient.get(ENDPOINTS.CONVERSATIONS.EXPORT(conversationId), { 
      format 
    });
  }
};

/**
 * Leads Service
 */
export const leadsService = {
  async getLeads(agentId, params = {}) {
    const url = buildUrl(ENDPOINTS.LEADS.LIST(agentId), params);
    const response = await apiClient.get(url);
    // Normalize to array
    const raw = Array.isArray(response) ? response : (response?.data || []);
    // Map snake_case to camelCase fields the UI expects
    return raw.map(item => {
      const leadJsonb = item.leadJsonb || item.lead_jsonb || {};
      const name = leadJsonb.full_name || leadJsonb.name || [leadJsonb.first_name, leadJsonb.last_name].filter(Boolean).join(' ').trim() || '';
      const email = leadJsonb.email || leadJsonb.email_address || '';
      const phone = leadJsonb.phone || leadJsonb.phone_number || '';
      return {
        ...item,
        leadJsonb,
        name,
        email,
        phone,
        conversationId: item.conversationId || item.conversation_id || null
      };
    });
  },

  async updateLead(leadId, data) {
    return await apiClient.patch(ENDPOINTS.LEADS.UPDATE(leadId), data);
  },

  async deleteLead(leadId) {
    return await apiClient.delete(ENDPOINTS.LEADS.DELETE(leadId));
  },

  async exportLeads(agentId, format = 'csv') {
    return await apiClient.get(ENDPOINTS.LEADS.EXPORT(agentId), { format });
  },

  async addNote(leadId, note) {
    return await apiClient.post(ENDPOINTS.LEADS.ADD_NOTE(leadId), { note });
  }
};

/**
 * Vendors Service
 */
export const vendorsService = {
  async getVendors(agentId) {
    return await apiClient.get(ENDPOINTS.VENDORS.LIST(agentId));
  },

  async createVendor(agentId, vendorData) {
    const serverData = {
      vendor_jsonb: vendorData
    };
    return await apiClient.post(ENDPOINTS.VENDORS.CREATE(agentId), serverData);
  },

  async updateVendor(vendorId, vendorData, status = 'active') {
    const serverData = {
      vendor_jsonb: vendorData,
      status
    };
    return await apiClient.patch(ENDPOINTS.VENDORS.UPDATE(vendorId), serverData);
  },

  async deleteVendor(vendorId) {
    return await apiClient.delete(ENDPOINTS.VENDORS.DELETE(vendorId));
  },

  async routeToVendor(agentId, leadId) {
    return await apiClient.post(ENDPOINTS.VENDORS.ROUTE(agentId), {
      leadId
    });
  }
};

/**
 * Webhooks Service
 */
export const webhooksService = {
  async getWhatsAppStatus() {
    return await apiClient.get(ENDPOINTS.WEBHOOKS.WHATSAPP_STATUS);
  },

  async updateWhatsAppConfig(config) {
    return await apiClient.post(ENDPOINTS.WEBHOOKS.WHATSAPP, config);
  }
};

/**
 * Organizations Service
 */
export const organizationsService = {
  async getOrganizations() {
    const response = await apiClient.get(ENDPOINTS.ORGANIZATIONS.LIST);
    // The API returns { data: [...] } format
    return response.data || response;
  },

  async createOrganization(name) {
    return await apiClient.post(ENDPOINTS.ORGANIZATIONS.CREATE, { name });
  },

  async getOrganization(orgId) {
    return await apiClient.get(ENDPOINTS.ORGANIZATIONS.DETAIL(orgId));
  },

  async updateOrganization(orgId, data) {
    return await apiClient.patch(ENDPOINTS.ORGANIZATIONS.UPDATE(orgId), data);
  },

  async deleteOrganization(orgId) {
    return await apiClient.delete(ENDPOINTS.ORGANIZATIONS.DELETE(orgId));
  },

  async createInvite(orgId, email) {
    return await apiClient.post(ENDPOINTS.ORGANIZATIONS.INVITES_CREATE(orgId), { email });
  },

  async acceptInvite(token) {
    return await apiClient.post(ENDPOINTS.ORGANIZATIONS.INVITES_ACCEPT(token));
  }
};

/**
 * System Service
 */
export const systemService = {
  async getHealth() {
    return await apiClient.getHealth();
  },

  async getVersion() {
    return await apiClient.get(ENDPOINTS.SYSTEM.VERSION);
  },

  async getStatus() {
    return await apiClient.get(ENDPOINTS.SYSTEM.STATUS);
  }
};

// Export the API client for direct access if needed
export { apiClient };

// Export query parameters for easy use
export { QUERY_PARAMS };

