# Centralized API Services

This directory contains a centralized, manageable API layer for the WiseChat frontend application.

## Architecture Overview

```
services/
├── config.js          # API configuration and environment settings
├── ApiClient.js        # Centralized HTTP client with interceptors
├── endpoints.js        # All API endpoints in one place
├── index.js           # Main services export (use this in components)
└── README.md          # This documentation
```

## Key Features

### 🔧 **Easy Configuration Management**
- **Single source of truth** for API settings in `config.js`
- **Automatic environment detection** - no environment variables needed!
- **Smart domain switching** - localhost → `localhost:3000/api`, production → `{origin}/api`
- **Timeout and retry settings** centrally managed

### 🌐 **Centralized HTTP Client**
- **Single ApiClient class** handles all HTTP requests
- **Automatic authentication** token injection
- **Global error handling** with automatic logout on 401
- **Request/response logging** in development mode
- **File upload support** with progress tracking

### 📍 **Organized Endpoints**
- **All endpoints** defined in `endpoints.js`
- **Dynamic URL building** with parameter substitution
- **Query parameter helpers** for common use cases
- **Easy to maintain** and update

### 🎯 **Service Layer**
- **Organized by domain** (auth, agents, documents, etc.)
- **Consistent API** across all services
- **Error handling** built into each service
- **TypeScript-ready** structure

## Usage Examples

### Basic Usage
```javascript
// Import services from the main index file
import { authService, agentsService } from '../services/index.js';

// Use services in components
const handleLogin = async () => {
  try {
    const result = await authService.login(email, password);
    // Token is automatically stored
  } catch (error) {
    // Error is automatically logged and handled
  }
};

const loadAgents = async () => {
  const agents = await agentsService.getAgents({
    page: 1,
    limit: 10,
    status: 'active'
  });
};
```

### File Upload with Progress
```javascript
import { documentsService } from '../services/index.js';

const handleUpload = async (files) => {
  await documentsService.uploadDocuments(
    agentId, 
    files, 
    (progress) => console.log(`Upload: ${progress}%`)
  );
};
```

### Direct API Client Access
```javascript
import { apiClient } from '../services/index.js';

// For custom requests not covered by services
const customRequest = await apiClient.get('/custom-endpoint');

// Change API base URL
apiClient.setBaseUrl('https://api.production.com/api');
```

## Configuration

### Automatic Environment Detection
**No environment variables needed!** The API automatically detects the correct base URL:

```javascript
// Automatic detection logic:
// - If current URL contains 'localhost' → http://localhost:3000/api  
// - Otherwise → {current-origin}/api

// Examples:
// http://localhost:3000 → http://localhost:3000/api
// https://myapp.com → https://myapp.com/api
// https://staging.myapp.com → https://staging.myapp.com/api
```

### Runtime Configuration
```javascript
import { apiClient } from '../services/index.js';

// Manual override if needed (rare)
apiClient.setBaseUrl('https://custom-api.example.com/api');

// Check authentication
if (apiClient.isAuthenticated()) {
  // User is logged in
}

// Manual token management
apiClient.setAuthToken('your-token');
apiClient.clearAuthToken();
```

## Available Services

### 🔐 **authService**
- `login(email, password)` - Authenticate user
- `register(orgName, email, password)` - Register new user
- `logout()` - Sign out user
- `isAuthenticated()` - Check auth status
- `getToken()` - Get current token

### 🤖 **agentsService**
- `getAgents(params)` - List agents with filtering
- `getAgent(id)` - Get single agent
- `createAgent(data)` - Create new agent
- `updateAgent(id, data)` - Update agent
- `deleteAgent(id)` - Delete agent
- `activateAgent(id)` - Activate agent
- `updateConfig(id, config)` - Update agent config
- `askAgent(id, message)` - Send message to agent
- `reindexDocuments(id)` - Reindex agent documents

### 📄 **documentsService**
- `getDocuments(agentId, params)` - List documents
- `uploadDocuments(agentId, files, onProgress)` - Upload files
- `deleteDocument(id)` - Delete document
- `getDocumentDetail(id)` - Get document details
- `downloadDocument(id)` - Download document

### 💬 **conversationsService**
- `getConversationMessages(id, params)` - Get messages
- `sendMessage(id, message)` - Send message
- `getConversations(agentId, params)` - List conversations
- `exportConversation(id, format)` - Export conversation

### 👥 **leadsService**
- `getLeads(agentId, params)` - List leads
- `updateLead(id, data)` - Update lead
- `deleteLead(id)` - Delete lead
- `exportLeads(agentId, format)` - Export leads
- `addNote(id, note)` - Add note to lead

### 🏢 **vendorsService**
- `getVendors(agentId)` - List vendors
- `createVendor(agentId, data)` - Create vendor
- `updateVendor(id, data)` - Update vendor
- `deleteVendor(id)` - Delete vendor
- `routeToVendor(agentId, leadId, vendorId, notes)` - Route lead

### 🔗 **webhooksService**
- `getWhatsAppStatus()` - Get WhatsApp connection status
- `updateWhatsAppConfig(config)` - Update WhatsApp settings

### 🏢 **organizationsService**
- `getOrganizations()` - List organizations
- `switchOrganization(id)` - Switch active organization
- `getOrganizationMembers(id)` - Get org members

### ⚙️ **systemService**
- `getHealth()` - Check API health
- `getVersion()` - Get API version
- `getStatus()` - Get system status

## Error Handling

The API client automatically handles common errors:

- **401 Unauthorized**: Automatically clears token and redirects to login
- **Network errors**: Logged with context information
- **Request failures**: Detailed error logging in development

## Development Features

- **Request/response logging** in development mode
- **Automatic token injection** for authenticated requests
- **Global error handling** with user-friendly messages
- **Progress tracking** for file uploads
- **Health checks** for API connectivity

## Best Practices

1. **Always use services** instead of direct API calls
2. **Import from index.js** for consistency
3. **Handle errors gracefully** in components
4. **No environment setup needed** - API URL is auto-detected
5. **Check authentication** before protected operations

## Extending the API

### Adding New Endpoints
1. Add endpoint to `endpoints.js`
2. Create service method in `index.js`
3. Export from main services object

### Adding New Services
1. Create service object with methods
2. Export from `index.js`
3. Update this documentation

This centralized approach makes the API layer easy to maintain, debug, and extend while providing a consistent interface for all frontend components.
