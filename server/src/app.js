// Load environment variables first
import './env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { errorHandler, notFoundHandler } from './middleware/error_middleware.js';
import { authenticateToken } from './middleware/auth_middleware.js';
import authRoutes from './routes/auth_routes.js';
import orgsRoutes from './routes/orgs_routes.js';
import agentsRoutes from './routes/agents_routes.js';
import documentsRoutes from './routes/documents_routes.js';
import searchRoutes from './routes/search_routes.js';
import conversationsRoutes from './routes/conversations_routes.js';
import webhooksRoutes from './routes/webhooks_routes.js';
import leadsRoutes from './routes/leads_routes.js';
import vendorsRoutes from './routes/vendors_routes.js';
import apiKeysRoutes from './routes/api_keys_routes.js';
import invitesRoutes from './routes/invites_routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth parsing (attach req.user if token present)
app.use(authenticateToken);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgsRoutes);
app.use('/api/orgs/:id/agents', agentsRoutes);
app.use('/api/agents/:id/documents', documentsRoutes);
app.use('/api/agents/:id/ask', searchRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api', leadsRoutes);
app.use('/api', vendorsRoutes);
app.use('/api', apiKeysRoutes);
app.use('/api', invitesRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
