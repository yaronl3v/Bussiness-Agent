/**
 * Auto-detect API base URL based on current origin
 * If localhost -> use localhost:3000/api
 * Otherwise -> use current origin + /api
 */
function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return 'http://localhost:3000/api';
  }
  
  const currentOrigin = window.location.origin;
  
  if (currentOrigin.includes('localhost')) {
    return 'http://localhost:3000/api';
  } else {
    return `${currentOrigin}/api`;
  }
}

// API Configuration
export const API_CONFIG = {
  // Base URL - automatically detected based on current origin
  BASE_URL: getApiBaseUrl(),
  
  // Timeout settings
  TIMEOUT: 30000, // 30 seconds
  
  // Request retry settings
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Environment detection - check if localhost
  IS_DEVELOPMENT: typeof window !== 'undefined' && window.location.origin.includes('localhost'),
  
  // API versioning
  API_VERSION: 'v1',
  
  // Auth settings
  AUTH_HEADER_NAME: 'Authorization',
  AUTH_TOKEN_PREFIX: 'Bearer',
  AUTH_STORAGE_KEY: 'auth_token',
  
  // Common headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Environment-specific logging
if (API_CONFIG.IS_DEVELOPMENT) {
  console.log('🔧 API running in development mode (localhost detected)');
  console.log('📡 API Base URL:', API_CONFIG.BASE_URL);
} else {
  console.log('🚀 API running in production mode');
  console.log('📡 API Base URL:', API_CONFIG.BASE_URL);
}
