import axios from 'axios';
import { API_CONFIG } from './config.js';

// Centralized API Client
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request: attach token + log
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers[API_CONFIG.AUTH_HEADER_NAME] = `${API_CONFIG.AUTH_TOKEN_PREFIX} ${token}`;
        }
        if (API_CONFIG.IS_DEVELOPMENT) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
        }
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response: log and propagate; handle errors via helper
    this.client.interceptors.response.use(
      (response) => {
        if (API_CONFIG.IS_DEVELOPMENT) {
          console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      (error) => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  handleResponseError(error) {
    const { response } = error || {};
    console.error('[API] Error:', {
      status: response?.status,
      message: response?.data?.message || error?.message,
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers,
    });
    if (response?.status === 401) {
      const isAuthEndpoint = error?.config?.url?.includes('/auth/');
      if (isAuthEndpoint) {
        console.log('[API] Auth endpoint 401 - logging out');
        this.clearAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        console.warn('[API] 401 on non-auth endpoint - check token validity');
        const token = this.getAuthToken();
        if (token) console.warn('Current token (prefix):', token.substring(0, 20) + '...');
      }
    }
  }

  // Auth token management
  getAuthToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(API_CONFIG.AUTH_STORAGE_KEY);
  }
  setAuthToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_CONFIG.AUTH_STORAGE_KEY, token);
  }
  clearAuthToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(API_CONFIG.AUTH_STORAGE_KEY);
  }

  // HTTP helpers
  async get(url, params = {}, config = {}) {
    const response = await this.client.get(url, { params, ...config });
    return response.data;
  }
  async post(url, data = {}, config = {}) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }
  async put(url, data = {}, config = {}) {
    const response = await this.client.put(url, data, config);
    return response.data;
  }
  async patch(url, data = {}, config = {}) {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
  async delete(url, config = {}) {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload
  async uploadFiles(url, files, onProgress = null) {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('file', files);
    }
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (onProgress) {
      config.onUploadProgress = (evt) => {
        const progress = Math.round((evt.loaded * 100) / evt.total);
        onProgress(progress);
      };
    }
    const response = await this.client.post(url, formData, config);
    return response.data;
  }

  // Utilities
  getBaseUrl() {
    return API_CONFIG.BASE_URL;
  }
  setBaseUrl(newBaseUrl) {
    this.client.defaults.baseURL = newBaseUrl;
    console.log('[API] Base URL updated to:', newBaseUrl);
  }
  isAuthenticated() {
    return !!this.getAuthToken();
  }
  async getHealth() {
    try {
      return await this.get('/health');
    } catch (error) {
      throw new Error('API is not responding');
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;

