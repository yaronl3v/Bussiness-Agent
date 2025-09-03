### Client ↔ Server Quick Guide

This guide shows how the frontend should call the server APIs with minimal friction. It includes endpoint paths, required params, sample payloads, and common pitfalls.

Notes
- All endpoints are under `/api/...`.
- Auth uses JWT in `Authorization: Bearer <token>`.
- IDs are UUIDs (not integers). Ensure you pass the correct `org.id`/`agent.id` returned by the API.
- For request bodies: the server prefers snake_case, but most camelCase aliases are accepted where noted.

Auth
- Register (optionally create org, or accept invite)
  - POST `/api/auth/register`
  - Body examples:
```json
{"email":"user@x.com","password":"12341234","organizationName":"My Org"}
```
```json
{"email":"user@x.com","password":"12341234","inviteToken":"<invite-token>"}
```
  - Response: `{ user, token, organizationId? }`

- Login
  - POST `/api/auth/login`
  - Body: `{ "email":"user@x.com", "password":"12341234" }`
  - Response: `{ user, token }`

- Logout
  - POST `/api/auth/logout`

Session bootstrap (how the client discovers orgs)
- After login, call `GET /api/orgs` to fetch the list of organizations the user belongs to. The login response does not include orgs.
- After register with `organizationName`, the server returns `organizationId` for immediate use; still persist and later fetch `/api/orgs` on app load to refresh.
- Suggested client logic:
```js
// after receiving { token, organizationId? }
localStorage.setItem('token', token);
let selectedOrgId = organizationId || localStorage.getItem('selectedOrgId') || null;
const orgsRes = await fetch('/api/orgs', { headers: { Authorization: `Bearer ${token}` } });
const orgs = (await orgsRes.json()).data || [];
if (!selectedOrgId && orgs.length === 1) selectedOrgId = orgs[0].id;
if (selectedOrgId && !orgs.find(o => o.id === selectedOrgId)) selectedOrgId = null; // stale
if (!selectedOrgId) {
  // show org picker UI or create-org flow
} else {
  localStorage.setItem('selectedOrgId', selectedOrgId);
}
```

Organizations
- List my orgs
  - GET `/api/orgs`

- Create org
  - POST `/api/orgs`
  - Body: `{ "name":"Acme" }`

- Get/Update/Delete org
  - GET `/api/orgs/:id`
  - PATCH `/api/orgs/:id` body: `{ "name":"New Name" }`
  - DELETE `/api/orgs/:id`

- Invites
  - Create invite: POST `/api/orgs/:id/invites` body `{ "email":"invitee@x.com" }`
  - Accept invite: POST `/api/invites/:token/accept`

Agents (scoped by org)
- List agents
  - GET `/api/orgs/:id/agents`

- Create agent
  - POST `/api/orgs/:id/agents`
  - Body (camelCase or snake_case accepted):
```json
{
  "name":"Dev Agent",
  "welcomeMessage":"Hello",       // or "welcome_message"
  "specialInstructions":"",       // or "special_instructions"
  "modules": {}                     // or "modules_jsonb"
}
```

- Get/Update/Delete agent
  - GET `/api/orgs/:id/agents/:agentId`
  - PATCH `/api/orgs/:id/agents/:agentId` body supports:
```json
{
  "name":"New Name",
  "status":"active|disabled",
  "welcomeMessage":"...",                // or welcome_message
  "specialInstructions":"...",           // or special_instructions
  "leadFormSchema": { ... },               // or lead_form_schema_jsonb
  "dynamicInfoSchema": { ... },            // or dynamic_info_schema_jsonb
  "modules": { ... }                       // or modules_jsonb
}
```
  - DELETE `/api/orgs/:id/agents/:agentId`

- Activate agent
  - POST `/api/orgs/:id/agents/:agentId/activate`

- Reindex agent (rebuild embeddings/chunks for all documents)
  - POST `/api/orgs/:id/agents/:agentId/reindex`

Documents (per agent)
- List documents
  - GET `/api/agents/:id/documents`

- Create from text
  - POST `/api/agents/:id/documents`
  - Body:
```json
{
  "title":"Doc Title",
  "raw_text":"Plain text content",
  "source_uri":"optional"
}
```

- Upload file (pdf/docx/html/txt)
  - POST `/api/agents/:id/documents/upload`
  - multipart/form-data with `file`
  - Response: document object

- Ingest (chunk + embed)
  - POST `/api/agents/:id/documents/:docId/ingest`

- Delete document (also removes its chunks)
  - DELETE `/api/agents/:id/documents/:docId`

Search (Hybrid + optional rerank)
- Ask
  - POST `/api/agents/:id/ask`
  - Body:
```json
{
  "question":"What are the fees?",
  "topN":200,
  "topK":10,
  "useFTS":true,
  "useTrigram":true,
  "useRerank":true
}
```
  - Response: `{ data: [ { id, document_id, content, position_jsonb, similarity } ] }`

Conversations & Chat
- List messages
  - GET `/api/conversations/:id/messages`

- Send message (in‑app chat)
  - POST `/api/conversations/:id/messages`
  - Body:
```json
{
  "role":"user",
  "content":"Hello",
  "agent_id":"<agent-uuid>" // required so bot knows which agent to use
}
```
  - Response includes `{ user, assistant, citations }`

- Start a conversation for an agent (get a conversation id)
  - POST `/api/agents/:id/conversations`
  - Body (optional): `{ "clientId":"<external-user-id>", "channel":"inapp|whatsapp" }`
  - Response: `{ id, agent_id, client_id, channel }`
  - Client flow:
```js
// 1) create/retrieve a conversation for the agent
const { id: conversationId } = await (await fetch(`/api/agents/${agentId}/conversations`, {
  method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` },
  body: JSON.stringify({ channel:'inapp' })
})).json();

// 2) send messages reusing the same conversationId
await fetch(`/api/conversations/${conversationId}/messages`, {
  method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` },
  body: JSON.stringify({ role:'user', content:'Hi', agentId })
});
```

- One-call start (no conversation id yet)
  - You can POST to `/api/conversations/new/messages` (or any non-UUID in place of `:id`).
  - Body must include `agentId` (or `agent_id`) so the server knows which agent to use.
  - The server will open a conversation automatically and return `conversationId` in the response, which you should persist and reuse.
  - Example:
```js
// send first message without a conversation id
const first = await (await fetch('/api/conversations/new/messages', {
  method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` },
  body: JSON.stringify({ role:'user', content:'Shalom', agentId })
})).json();
const conversationId = first.conversationId;

// next turns reuse the conversation id
await fetch(`/api/conversations/${conversationId}/messages`, {
  method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` },
  body: JSON.stringify({ role:'user', content:'Thanks!' , agentId })
});
```

Leads & Vendors
- Leads
  - GET `/api/agents/:id/leads`
  - PATCH `/api/leads/:id` body `{ "status":"new|qualified|contacted|converted|rejected" }`

- Vendors
  - GET `/api/agents/:id/vendors`
  - POST `/api/agents/:id/vendors` body `{ "vendor_jsonb": { "name":"Vendor A", "criteria":[{"field":"locale","equals":"he"}] } }`
  - PATCH `/api/vendors/:id` body `{ "vendor_jsonb":{...}, "status":"active|inactive" }`
  - DELETE `/api/vendors/:id`
  - Route a lead: POST `/api/agents/:id/route` body `{ "leadId":"<lead-uuid>" }`

API Keys
- GET `/api/agents/:id/api-keys`
- POST `/api/agents/:id/api-keys` body `{ "provider":"openai", "key_ref":"kv:openai:prod" }`
- DELETE `/api-keys/:keyId`

Webhooks (WhatsApp)
- GET `/api/webhooks/whatsapp` (verify)
- POST `/api/webhooks/whatsapp` (inbound message)

HTTP Headers
- Always send JWT on protected routes:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Common Pitfalls
- UUIDs: org and agent ids are UUIDs; do not use integers like `/api/orgs/1/...`.
- Field names: server prefers snake_case, but camelCase aliases are accepted for agent fields and schemas.
- After register: if you passed `organizationName`, keep the returned `organizationId` for scoping agent routes.
- Conversations: send `agent_id` in the body of POST `/api/conversations/:id/messages`.
- Search: make sure documents are ingested; otherwise results may be empty.

Minimal fetch examples
```js
// Register + store token
const r = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, organizationName })
});
const { token, organizationId } = await r.json();

// Create agent under org
await fetch(`/api/orgs/${organizationId}/agents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: 'Dev', welcomeMessage: 'שלום' })
});

// Upload and ingest document
const fd = new FormData();
fd.append('file', file);
const up = await fetch(`/api/agents/${agentId}/documents/upload`, { method:'POST', headers:{ 'Authorization':`Bearer ${token}` }, body: fd });
const doc = await up.json();
await fetch(`/api/agents/${agentId}/documents/${doc.id}/ingest`, { method:'POST', headers:{ 'Authorization':`Bearer ${token}` }});

// Ask
await fetch(`/api/agents/${agentId}/ask`, { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ question: 'כמה זה עולה?', useRerank:true }) });

// In-app chat
await fetch(`/api/conversations/${conversationId}/messages`, { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ role:'user', content:'שלום', agent_id: agentId }) });
```


