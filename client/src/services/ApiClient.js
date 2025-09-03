import axios from 'axios';
import { API_CONFIG } from './config.js';

/**
 * Centralized API Client Class
 * All HTTP requests go through this single class for easy management
 */
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers[API_CONFIG.AUTH_HEADER_NAME] = `${API_CONFIG.AUTH_TOKEN_PREFIX} ${token}`;
        }

        // Log requests in development
        if (API_CONFIG.IS_DEVELOPMENT) {
          console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
        }

        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors globally
    this.client.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (API_CONFIG.IS_DEVELOPMENT) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      (error) => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle response errors globally
   */
  handleResponseError(error) {
    const { response } = error;

    // Log errors first for debugging
    console.error('❌ API Error:', {
      status: response?.status,
      message: response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });

    if (response?.status === 401) {
      // Only auto-logout for auth-related endpoints, not for agent operations
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (isAuthEndpoint) {
        console.log('🔒 Auth endpoint 401 - logging out');
        this.clearAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        // For non-auth endpoints, just log the error
        console.warn('🔒 401 on non-auth endpoint - check token validity');
        console.warn('Current token:', this.getAuthToken()?.substring(0, 20) + '...');
      }
    }
  }

  /**
   * Auth token management
   */
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

  /**
   * HTTP Methods - All requests go through these methods
   */
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

  /**
   * File upload with progress tracking
   */
  async uploadFiles(url, files, onProgress = null) {
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('file', files);
    }

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

    const response = await this.client.post(url, formData, config);
    return response.data;
  }

  /**
   * Utility methods
   */
  
  // Get current base URL
  getBaseUrl() {
    return API_CONFIG.BASE_URL;
  }

  // Update base URL (useful for switching environments)
  setBaseUrl(newBaseUrl) {
    this.client.defaults.baseURL = newBaseUrl;
    console.log('🔄 API Base URL updated to:', newBaseUrl);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Get API health/status
  async getHealth() {
    try {
      return await this.get('/health');
    } catch (error) {
      throw new Error('API is not responding');
    }
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;
