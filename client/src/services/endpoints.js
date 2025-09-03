/**
 * Centralized API Endpoints Registry
 * All API endpoints are defined here for easy management and maintenance
 */

export const ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // Agent endpoints (organization-scoped)
  AGENTS: {
    LIST: (orgId) => `/orgs/${orgId}/agents`,
    CREATE: (orgId) => `/orgs/${orgId}/agents`,
    DETAIL: (orgId, agentId) => `/orgs/${orgId}/agents/${agentId}`,
    UPDATE: (orgId, agentId) => `/orgs/${orgId}/agents/${agentId}`,
    DELETE: (orgId, agentId) => `/orgs/${orgId}/agents/${agentId}`,
    ACTIVATE: (orgId, agentId) => `/orgs/${orgId}/agents/${agentId}/activate`,
    ASK: (agentId) => `/agents/${agentId}/ask`,
    REINDEX: (orgId, agentId) => `/orgs/${orgId}/agents/${agentId}/reindex`,
  },

  // Document endpoints
  DOCUMENTS: {
    LIST: (agentId) => `/agents/${agentId}/documents`,
    CREATE_TEXT: (agentId) => `/agents/${agentId}/documents`,
    UPLOAD: (agentId) => `/agents/${agentId}/documents/upload`,
    DELETE: (agentId, docId) => `/agents/${agentId}/documents/${docId}`,
    INGEST: (agentId, docId) => `/agents/${agentId}/documents/${docId}/ingest`,
  },

  // Conversation endpoints
  CONVERSATIONS: {
    MESSAGES: (id) => `/conversations/${id}/messages`,
    SEND_MESSAGE: (id) => `/conversations/${id}/messages`,
    SEND_NEW_MESSAGE: '/conversations/new/messages', // Start new conversation
    CREATE: (agentId) => `/agents/${agentId}/conversations`,
    LIST: (agentId) => `/agents/${agentId}/conversations`,
    EXPORT: (id) => `/conversations/${id}/export`,
  },

  // Lead endpoints
  LEADS: {
    LIST: (agentId) => `/agents/${agentId}/leads`,
    UPDATE: (leadId) => `/leads/${leadId}`,
  },

  // Vendor endpoints
  VENDORS: {
    LIST: (agentId) => `/agents/${agentId}/vendors`,
    CREATE: (agentId) => `/agents/${agentId}/vendors`,
    UPDATE: (vendorId) => `/vendors/${vendorId}`,
    DELETE: (vendorId) => `/vendors/${vendorId}`,
    ROUTE: (agentId) => `/agents/${agentId}/route`,
  },

  // API Keys endpoints
  API_KEYS: {
    LIST: (agentId) => `/agents/${agentId}/api-keys`,
    CREATE: (agentId) => `/agents/${agentId}/api-keys`,
    DELETE: (keyId) => `/api-keys/${keyId}`,
  },

  // Webhook endpoints
  WEBHOOKS: {
    WHATSAPP: '/webhooks/whatsapp',
    WHATSAPP_STATUS: '/webhooks/whatsapp/status',
  },

  // Organization endpoints
  ORGANIZATIONS: {
    LIST: '/orgs',
    CREATE: '/orgs',
    DETAIL: (id) => `/orgs/${id}`,
    UPDATE: (id) => `/orgs/${id}`,
    DELETE: (id) => `/orgs/${id}`,
    INVITES_CREATE: (id) => `/orgs/${id}/invites`,
    INVITES_ACCEPT: (token) => `/invites/${token}/accept`,
  },

  // System endpoints
  SYSTEM: {
    HEALTH: '/health',
    VERSION: '/version',
    STATUS: '/status',
  },
};

/**
 * Helper function to build URLs with query parameters
 */
export function buildUrl(endpoint, params = {}) {
  const url = new URL(endpoint, 'http://dummy.com'); // dummy base for URL constructor
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.pathname + url.search;
}

/**
 * Common query parameters
 */
export const QUERY_PARAMS = {
  // Pagination
  PAGE: 'page',
  LIMIT: 'limit',
  OFFSET: 'offset',
  
  // Sorting
  SORT: 'sort',
  ORDER: 'order',
  
  // Filtering
  SEARCH: 'search',
  STATUS: 'status',
  CHANNEL: 'channel',
  DATE_FROM: 'dateFrom',
  DATE_TO: 'dateTo',
  
  // Common filters
  HAS_LEAD: 'hasLead',
  AGENT_ID: 'agentId',
  USER_ID: 'userId',
};
