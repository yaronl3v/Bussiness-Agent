import api from './api.js';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    return { token, user };
  },

  async register(organizationName, email, password) {
    const response = await api.post('/auth/register', {
      organizationName,
      email,
      password,
    });
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    return { token, user };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  getToken() {
    return localStorage.getItem('auth_token');
  }
};
