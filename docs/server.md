 

### Server Implementation Plan (MVP → v1)

This document specifies the Express + Sequelize + Postgres server we will implement, aligned with `docs/proj.md` and the notes above. It is structured to enable incremental delivery while keeping modules clean and testable later.

## Goals
- Provide REST API for auth, orgs, agents, documents, retrieval (RAG), conversations, leads, vendors, and webhooks.
- Encapsulate bot behavior per agent in clear classes with simple entry points: `new Bot(userId, agentId)`, `bot.chat(userMessage)`, `bot.setSomething(...)`.
- Keep database access via Sequelize models; minimize queries and marshal results to avoid re-querying.
- Pluggable LLM and embeddings providers.

## Environment & Secrets
- Use the following environment variables (already noted above):
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `PG_DATABASE_URL`
  - `OPENAI_API_KEY`
- Later additions (placeholders for provider integrations):
  - `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`
  - `VOYAGE_API_KEY` (for reranking)
- Load via a small config module. Never import inline; imports at top of files only.

## Dependencies (server)
- express, cors, helmet, morgan
- sequelize, pg, pg-hstore
- joi (or zod) for validation
- jsonwebtoken, bcrypt
- multer (uploads), mime-types
- openai (SDK) or simple fetch wrapper; voyageai (required for rerank)
- pdf-parse (PDF), mammoth (DOCX), html-to-text, string-strip-html (HTML cleanup)
- @dqbd/tiktoken (token counting), p-limit (bounded concurrency)
- dotenv (only for local dev)

## Project Structure (server-side)
- All server code will live under `server/`. File names use snake_case.
- We will also add a project-root SQL helper as requested for DB SQL runs.

```
server/
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
      rate_limit.js
    db/
      sequelize.js
      migrations/  (Sequelize migrations)
      seeders/
    models/
      organization.js
      org_user.js
      invite.js
      user.js
      agent.js
      document.js
      chunk.js
      conversation.js
      message.js
      lead.js
      vendor.js
      webhook.js
      api_key.js
      index.js (associations)
    middleware/
      auth_middleware.js
      error_middleware.js
      validation_middleware.js
    services/
      auth_service.js
      org_service.js
      agent_service.js
      document_service.js
      ingestion_service.js
      embedding_service.js
      retriever_service.js
      rerank_service.js (optional, voyage)
      conversation_service.js
      intake_service.js
      lead_service.js
      vendor_service.js
      whatsapp_service.js
      llm_service.js
      bot/
        bot_orchestrator.js
        bot_runtime.js
    controllers/
      auth_controller.js
      orgs_controller.js
      agents_controller.js
      documents_controller.js
      search_controller.js
      conversations_controller.js
      leads_controller.js
      vendors_controller.js
      webhooks_controller.js
    routes/
      auth_routes.js
      orgs_routes.js
      agents_routes.js
      documents_routes.js
      search_routes.js
      conversations_routes.js
      leads_routes.js
      vendors_routes.js
      webhooks_routes.js
    utils/
      id.js
      phone.js
      dates.js
      jsonb.js
      pagination.js
```

Additionally (project root):

```
src/
  tools/
    execute-sql.js  (utility to run arbitrary SQL against PG — required by user rule)
```

## Conventions
- Early returns; avoid nested ifs.
- Class-based modules for complex behavior (bots, services). Simple top-down functional code inside methods; avoid anonymous functions.
- File names in snake_case; JavaScript function and method names in camelCase.
- Minimize DB queries; always marshal and reuse results (`instance.dataValues`).
 - ESM only: use `import`/`export` syntax. Set `"type": "module"` in `package.json`. Import paths include file extensions (e.g., `import x from './file.js'`). Imports at file beginning; never inline.

## Database & Migrations
- Use Sequelize migrations for schema. JSONB for dynamic fields. Vector embeddings via `pgvector`. PostGIS available if needed later.
- Core tables match `docs/proj.md`:
  - `organizations`, `org_users`, `invites`, `users`
  - `agents` (includes: `status`, `welcome_message`, `special_instructions`, `lead_form_schema_jsonb`, `dynamic_info_schema_jsonb`, `modules_jsonb`)
  - `documents`, `chunks` (with `embedding vector(1536)`, `position_jsonb`)
  - `conversations`, `messages`
  - `leads`, `vendors`, `webhooks`, `api_keys`
- Required extensions and indexes (run using the SQL tool below):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
-- PostGIS optional now
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Embedding column and index
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat
  ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
```

Run via the required helper:

```bash
node src/tools/execute-sql.js "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Associations (Sequelize)
- `Organization` hasMany `OrgUser`, `Agent`, `Invite`
- `User` hasMany `OrgUser`; through relation for membership
- `Agent` belongsTo `Organization` and `User`; hasMany `Document`, `Conversation`, `Lead`, `Vendor`, `Webhook`, `ApiKey`
- `Document` hasMany `Chunk`
- `Conversation` hasMany `Message`
- Use explicit foreign keys and indexes for `agent_id`, `document_id`, etc.

## Core Modules & Responsibilities

### Auth
- JWT-based login/register. Hash passwords with bcrypt.
- `auth_service.js`: register, login, issue tokens, validate token. Roles: user, admin.
- `auth_middleware.js`: parse `Authorization` header, attach `req.user`.

### Orgs & Invites
- CRUD orgs; invites with token + status.
- Ensure multi-tenant filtering by `org_id` for all entity access.

### Agents
- CRUD agents; update config fields: schemas, toggles, special instructions, welcome message; activate/disable.
- `agent_service.js` manages agent configs and status.

### Documents & Ingestion
- Upload files (multer), store on disk (server-side for now), then `ingestion_service.js` extracts text, normalizes, chunks, embeds, stores in `documents` and `chunks`.
- `embedding_service.js` wraps provider (OpenAI by default). Pluggable provider key via `OPENAI_API_KEY`.
- Track `position_jsonb` for precise citations.
 - Normalization/Cleaning (no rephrasing):
   - Extract text with format-aware tools, then normalize while preserving semantics for faithful citations.
   - Steps: remove HTML tags/boilerplate, collapse whitespace, fix broken hyphenation at line breaks, deduplicate headers/footers, preserve paragraphs and lists.
   - Packages: `pdf-parse` (PDF), `mammoth` (DOCX → text/markdown), `html-to-text` (HTML), `string-strip-html` (cleanup). Minimal custom utilities for hyphenation/whitespace.
   - We do not auto-rephrase content. Summarization is a separate optional step and not part of canonical source text used for citations.
 - Chunking:
   - Token-based recursive chunking with small overlap using `@dqbd/tiktoken` for accurate token counts.
   - Default target ~500 tokens per chunk with ~50 token overlap; configurable per agent.

### Retrieval (RAG)
- Framework-light approach for clarity and performance (no LangChain/LlamaIndex in core path):
  - `retriever_service.js`:
    1) Build query embedding via `embedding_service` (OpenAI embeddings by default; provider pluggable).
    2) Single SQL over `pgvector` filtered by `agent_id` to fetch topN (default 200) with content + metadata to avoid re-fetches.
    3) Mandatory rerank: Apply Voyage Rerank-2 (`voyageai`) on topN, keep topK (default 10).
    4) Return marshalled passages with positions for citation.
  - SQL shape (prepared statement):
    ```sql
    SELECT id, document_id, content, position_jsonb,
           1 - (embedding <=> $1) AS similarity
    FROM chunks
    WHERE agent_id = $2
    ORDER BY embedding <-> $1
    LIMIT $3;
    ```
  - Optional keyword retrieval (FTS/trigram) can be added later and fused.
- `rerank_service.js`: Voyage Rerank-2 wrapper; configurable topN/topK and model.
- `llm_service.js`: answer synthesis with strict citation requirement.

### Conversations & Messages
- `conversation_service.js`: map inbound (WhatsApp or in-app) to conversation, maintain state, persist messages with `content_jsonb` and `citations_jsonb`.
- `intake_service.js`: schema-driven intake merge logic (see contract below).

### Leads & Vendors
- `lead_service.js`: persist lead JSON and status; ensure idempotency.
- `vendor_service.js`: CRUD vendors and routing records.

### Webhooks & WhatsApp
- `webhooks_controller.js` exposes `/api/webhooks/whatsapp` for verification and inbound messages.
- `whatsapp_service.js` parses events, maps `from` to `conversation` and `client_id`, calls `BotOrchestrator` for response, and sends replies via provider API.

### Bot Orchestrator
- Encapsulates business and intake logic per agent.
- Public API (class-based):

```js
// server/src/services/bot/bot_orchestrator.js
export class BotOrchestrator {
  constructor({ userId, agentId }) {}
  async chat({ messageText, channel, context }) {}
  async setSomething({ key, value }) {}
}
```

Internally, it coordinates `retriever_service`, `llm_service`, and `intake_service` and writes `messages` and `leads` as needed.

## Request Flow (typical)
1. Auth middleware validates JWT and attaches `req.user`.
2. Controller validates input (Joi) and calls a service.
3. Service performs minimal DB reads/writes (Sequelize) and returns marshalled objects.
4. Controller returns JSON. Errors bubble to centralized error middleware.

## Endpoints (v1)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- Orgs: `GET/POST /api/orgs`, `GET/PATCH/DELETE /api/orgs/:id`, `POST /api/orgs/:id/invites`, `POST /api/invites/:token/accept`
- Agents: `GET/POST /api/agents`, `GET/PATCH/DELETE /api/agents/:id`, `POST /api/agents/:id/activate`, `PATCH /api/agents/:id/config`
- Documents: `POST /api/agents/:id/documents` (upload), `GET /api/agents/:id/documents`, `DELETE /api/documents/:id`, `POST /api/agents/:id/reindex`
- Search/RAG: `POST /api/agents/:id/ask`
- Conversations: `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`
- Leads: `GET /api/agents/:id/leads`, `PATCH /api/leads/:id`
- Vendors: `GET/POST /api/agents/:id/vendors`, `PATCH/DELETE /api/vendors/:id`, `POST /api/agents/:id/route`
- Webhooks: `GET/POST /api/webhooks/whatsapp` (verify + inbound)

## WhatsApp Webhook Flow (MVP)
- `GET /api/webhooks/whatsapp`: verify using `hub.verify_token` against `WHATSAPP_VERIFY_TOKEN`.
- `POST /api/webhooks/whatsapp`: parse message event, map to `conversation` by `from` and `agent_id`, call `BotOrchestrator.chat`, then send reply via provider API.
- Store inbound/outbound messages with timestamps; include `citations_jsonb` in assistant messages.

## Intake Schema Contract
- Stored at `agents.dynamic_info_schema_jsonb`.
- Bot responses input/output shape:

```json
{
  "uiText": "Thanks Jane. What's your date of birth (YYYY-MM-DD)?",
  "proposedUpdates": [
    {"questionId": "full_name", "value": "Jane Doe"},
    {"questionId": "email", "value": "jane@x.com"},
    {"questionId": "phone", "value": "+442071234567"}
  ],
  "nextAction": "ask",
  "nextQuestionId": "dob"
}
```

- `intake_service.js` merges updates idempotently, normalizes types (E.164 phones, ISO dates), tracks `isDone`, and computes next required question. Back/Skip handled via a simple stack in conversation `meta_jsonb`.

## Validation & Middleware
- `validation_middleware.js` wraps Joi schemas and returns early on errors.
- `error_middleware.js` centralizes error handling; no sensitive details in responses.
- `rate_limit.js` basic IP+agent rate limits; per-agent quotas later.

## Security, Logging, Observability
- `helmet`, CORS rules, strict JSON size limits.
- Mask PII in logs; redact tokens.
- Audit key configuration changes (agent config, org settings).

## File Uploads & Storage
- Store uploads on the server filesystem under `server/uploads/{orgId}/{agentId}/...`.
- Persist file metadata in `documents`.
- Processing happens server-side post-upload; background queue optional later.

## Running Required SQL (per user rule)
- Always run DDL and index changes using:

```bash
node server/src/tools/execute-sql.js "<YOUR SQL HERE>"
```

Examples:

```bash
node server/src/tools/execute-sql.js "CREATE EXTENSION IF NOT EXISTS vector;";
node server/src/tools/execute-sql.js "ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);";
node server/src/tools/execute-sql.js "CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);";
```

## Implementation Steps (Order)
1. Boot server skeleton: `app.js`, `server.js`, CORS/helmet/morgan, health route.
2. DB: `sequelize.js` connect, migrations folder, base models for `users`, `organizations`, `agents`.
3. Auth: register/login, JWT middleware.
4. Orgs & Agents: CRUD + config update; enforce multi-tenant scoping.
5. Documents: upload endpoint, storage, `documents` model.
6. Ingestion: extraction (txt/pdf initial), chunking, embeddings, `chunks` model, vector index.
7. Retrieval: ANN search + basic cite assembly; `POST /api/agents/:id/ask`.
8. Conversations & Messages: persistence and listing.
9. Intake service: schema merge + normalization.
10. WhatsApp webhook: verify + inbound flow, provider send stub.
11. Leads & Vendors: endpoints and services.
12. Admin hooks (basic): rate limits, audit of config changes.

## Milestones
- M0 (skeleton): healthcheck, auth, orgs, basic agents CRUD.
- M1 (documents + ingestion): upload, extract, embed, search top-k without rerank.
- M2 (conversations + intake): schema-driven flow, message history, citations persisted.
- M3 (WhatsApp webhook): end-to-end from inbound to reply using orchestrator.
- M4 (leads/vendors): CRUD + routing endpoint; export leads.

## Example Usage (conceptual)

```js
import { BotOrchestrator } from '../services/bot/bot_orchestrator.js';

export async function handleInbound(userId, agentId, text) {
  const bot = new BotOrchestrator({ userId, agentId });
  const response = await bot.chat({ messageText: text, channel: 'whatsapp' });
  return response; // includes uiText, citations, intake updates, etc.
}
```

This plan incorporates `docs/proj.md` and the initial notes above. We will implement incrementally, keeping modules small and class-encapsulated, with minimal DB round-trips and clear separation between controllers and services.