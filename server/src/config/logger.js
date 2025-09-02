// Simple logger configuration
// Can be enhanced later with winston or similar

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, { error: error?.message || error, stack: error?.stack, ...meta });
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
