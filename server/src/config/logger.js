// Simple logger configuration
// Can be enhanced later with winston or similar

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    if (error) {
      // Pass the error object so Node prints the full stack
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, meta);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
    }
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};
