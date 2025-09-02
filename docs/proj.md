### Agent Business Platform – Project Spec

## Stack
- Node.js (Express)
- Postgres with `pgvector` (and PostGIS available if needed later)
- Any LLM provider (pluggable via API key, start w gpt5)
- Frontend: React + Vite
- Optional: LangChain.js for orchestration where helpful; otherwise keep code simple and explicit

## One-liner
Users create domain-specific WhatsApp agents. Agents answer questions from provided domain data, collect leads and structured user info, and can route to vendors/professionals as configured.

## High-level Overview
- Business users onboard and configure agents from the app.
- Agents converse with end-clients via WhatsApp and/or in-app chat.
- Agent answers with citations from uploaded domain data (RAG over `pgvector`).
- Agent collects structured data (lead/contact + dynamic info) using a schema-driven flow.

## Roles
- User (business owner)
- Admin (super user)

## Primary Use Case (v1): Divorce Lawyer
- Domain data: intake forms, service descriptions, fee structure, jurisdiction info, FAQ.
- Goals: qualify leads, collect details, answer FAQs with citations, optionally schedule/route to a vendor (e.g., paralegal) or create a callback task.
- Sensitive data: store PII with care; minimize exposure to the LLM and log only necessary fields.

## User Flows

### Onboarding (Business User)
- Upload business/domain data as files or pasted text.
- Connect WhatsApp (Meta WhatsApp Business Cloud API).
- Configure features (All optional):
    - Collect Leads: define minimal fields (e.g., name, email, phone in E.164).
    - Collect Dynamic Info: define a multi-section schema for further intake.
    - Special Instructions: free text to steer tone/guardrails.
    - Welcome Message: first message agent sends.
    - Enable/Disable modules (Q&A, recommendations, vendor routing). + enable disable the entire bot from whatsup

### Client Flow (End-client on WhatsApp or in-app chat)
- Client messages the agent.
- Agent maintains conversation state, asks for required fields, accepts extra details, and answers questions with citations.
- When ready, agent stores leads/intake in DB and optionally routes to a professional/vendor.

### App (Business User)
- Login/Register.
- Create/Manage many agents.
- For each agent:
    - Upload and manage domain data
    - Connect WhatsApp
    - Activate/Disable
    - In-app chat for testing
    - View leads/intake and conversation history

## System Architecture

### Frontend (React + Vite)
- React + Vite SPA (SSR optional later for SEO).
- Pages/sections:
    - Auth: login/register
    - Agents List: create/manage
    - Agent Detail:
        - Data Manager (upload/paste, file listing, re-index)
        - WhatsApp Connection (status, webhooks)
        - Configuration (lead form, dynamic info schema, special instructions, welcome message, toggles)
        - Test Chat (debug panel with citations)
        - Leads & Conversations (search/filter/export)
- Component Guidelines:
    - Typed forms for schema editing
    - Chat UI that renders citations and schema progress

#### Chat Component (now) and Embeddable Chat (later)
- Modern chat component: streaming responses, markdown rendering, code/text blocks, copy button, retry.
- Conversation controls: reset, export transcript, show/hide citations.
- Intent buttons (optional): back/skip/confirm for schema-driven flows.
- Embeddable roadmap (not implementing now):
    - Lightweight `<script>` widget with iframe-based embed and postMessage API.
    - Sandbox origin with limited capabilities and token-based auth.
    - The same backend conversation endpoints; separate embed key per agent.

### Backend (high-level spec)
- Express API (REST). Key areas:
    - Auth: sessions/JWT, roles
    - Orgs & Invites: multi-tenant orgs, user membership, invitations
    - Agents: CRUD, settings, status (agent belongs to an org)
    - Documents: upload, parse, chunk, embed, store
    - Search/RAG: query over `pgvector`, return answers with citations
    - Conversations: message ingestion (WhatsApp webhook + in-app), state, history
    - Leads/Intake: store/update JSON schema answers, validation
    - Vendors/Routing: optional handoff creation
    - Admin: usage metrics, throttling
- Webhooks:
    - WhatsApp inbound message webhook (Meta Cloud API)
    - Delivery status (optional)

## Data Model (Postgres)
- Prefer JSONB for dynamic schemas; minimal fixed columns for indexing/relations.
- Tables (indicative, can merge/split during implementation):
    - `organizations`: id, name, owner_user_id, settings_jsonb
    - `org_users`: id, org_id, user_id, role
    - `invites`: id, org_id, email, inviter_user_id, token, status, expires_at
    - `users`: id, email, role, profile_jsonb
    - `agents`: id, org_id, user_id, name, status, welcome_message, special_instructions, lead_form_schema_jsonb, dynamic_info_schema_jsonb, modules_jsonb
    - `documents`: id, agent_id, title, source_uri, raw_text, meta_jsonb
    - `chunks`: id, document_id, agent_id, content, vector embedding, position_jsonb (page/line/char ranges)
    - `conversations`: id, agent_id, client_id, channel, meta_jsonb
    - `messages`: id, conversation_id, role, content_jsonb, citations_jsonb, created_at
    - `leads`: id, agent_id, conversation_id, lead_jsonb, status
    - `vendors`: id, agent_id, vendor_jsonb, status
    - `webhooks`: id, agent_id, config_jsonb
    - `api_keys`: id, agent_id, provider, key_ref
- `pgvector` index example:
    - `CREATE EXTENSION IF NOT EXISTS vector;`
    - `ALTER TABLE chunks ADD COLUMN embedding vector(1536);`
    - `CREATE INDEX ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);`

## LLM Contract (Schema-driven Intake)
- Agent never mutates the schema; it only proposes updates.
- Idempotent: same user turn can be retried safely.
- Prefill: if user provides extra known fields, accept them.
- Back/Skip: treat as intents; adjust required-unanswered; keep a stack for "back".
- Locales: normalize in controller (E.164 phones, ISO dates).

Schema example (stored in `agents.dynamic_info_schema_jsonb`):
```
{
  "sections": [
    {
      "id": "contact",
      "title": "Contact Details",
      "questions": [
        {"id": "full_name", "label": "Full name", "type": "text", "required": true, "isDone": false, "answer": ""},
        {"id": "email", "label": "Email", "type": "email", "required": true, "isDone": false, "answer": ""},
        {"id": "phone", "label": "Phone", "type": "tel", "required": false, "deps": [], "hint": "E.164, e.g. +14155550123", "isDone": false, "answer": ""}
      ]
    }
  ]
}
```

Bot response example (controller merges and persists):
```
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

## Data Ingestion, Retrieval, and Citations (pgvector)

### Ingestion Pipeline (per agent)
- Accept files (PDF, DOCX, PPTX, TXT, HTML) or pasted text.
- Extract text and metadata (file name, page numbers, headings when available).
- Normalize text: remove boilerplate, fix broken hyphenation, preserve paragraphs.
- Chunking: semantic or recursive token-based chunking (e.g., ~300–800 tokens) with small overlap.
- Embeddings: default to OpenAI `text-embedding-3-large` (best-in-class); alternatives: Cohere `embed-english-v3.0`/`embed-multilingual-v3.0`, or open-source `bge-large-en`.
- Store positions in `chunks.position_jsonb` (page, paragraph, line/char ranges) to enable precise citations.

### Ingestion Limits & Summarization
- Limits (MVP): up to 50 MB total content per agent (configurable). Large PDFs supported; other formats allowed (DOCX, PPTX, TXT, HTML).
- Summarization step (recommended):
    - Auto-outline per document (extract headings, TOC when available).
    - Section-level canonicalization (normalize lists/tables, unify headings).
    - Hierarchical summaries: document → section → chunk key sentences.
    - Store `doc_summary` and `section_summaries` in `documents.meta_jsonb` for retrieval and UI previews.
    - Optional glossary/definitions extraction for improved recall.

### Retrieval (RAG)
- Build a query vector for user question + conversation context.
- ANN search over `chunks.embedding` with filtering by `agent_id` and optional metadata (e.g., jurisdiction).
- Rerank with Voyage Rerank-2 and assemble a grounded context window.
- Generate an answer with a strict instruction to cite sources and not invent facts.

### Citations Strategy
- Each cited span returns: `document_id`, `chunk_id`, and `loc` from `position_jsonb`.
- Messages store citations in `messages.citations_jsonb` so the UI can render anchors.
- UI shows numbered citations that open the source excerpt with highlighting.

## WhatsApp Integration
- Use Meta WhatsApp Business Cloud API.
- Expose a webhook endpoint for inbound messages; verify and parse message events.
- Map `from` to a `conversation` and `client_id`; create if missing.
- Respond via provider API; handle delivery status callbacks.

## Backend Endpoints (indicative)
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
- Orgs: `/api/orgs` (CRUD), `/api/orgs/:id/invites` (create/accept)
- Agents: `/api/agents` (CRUD), `/api/agents/:id/activate`, `/api/agents/:id/config`
- Documents: `/api/agents/:id/documents` (upload/list/delete), `/api/agents/:id/reindex`
- Search/RAG: `/api/agents/:id/ask` (query, returns answer + citations)
- Conversations: `/api/conversations/:id/messages` (list/send), `/api/webhooks/whatsapp`
- Leads: `/api/agents/:id/leads` (list), `/api/leads/:id` (update/status)
- Vendors: `/api/agents/:id/vendors` (CRUD), `/api/agents/:id/route`

## Best-in-class RAG Strategy (LlamaIndex/LangChain)
- Indexing/Parsing:
    - Title-aware chunking with small overlaps; include section headers in chunk metadata.
    - Sentence-window retrieval (neighboring sentences preserved for coherence).
    - Store page/line positions to enable exact citation highlighting.
- Hybrid Retrieval (dense + keyword):
    - Dense: `pgvector` ANN over embeddings.
    - Keyword: Postgres FTS (`tsvector` + `ts_rank`) and/or trigram (`pg_trgm`).
    - Fuse via Reciprocal Rank Fusion (RRF) for robustness.
- Query Rewriting/Expansion:
    - Multi-query expansion (generate paraphrases).
    - HyDE (hypothetical answer) for sparse data.
    - Optional query decomposition for multi-hop questions.
- Reranking:
    - Voyage Rerank-2 as hosted cross-encoder.
    - Keep top 5–10 passages.
- Context Compression:
    - Extractive compression before LLM call.
    - LangChain: `ContextualCompressionRetriever` with `VoyageRerank2` (custom wrapper) or `LLMChainExtractor`.
    - LlamaIndex: `SentenceWindowNodePostprocessor` / `ContextFilter`.
- Answer Synthesis with Citations:
    - Deterministic prompt: no claim without citation.
    - Map-reduce or refine synthesis to handle many sources.
    - Calibrated threshold: ask clarifying Q or say "I don't know" if low evidence.
- Evaluation & Monitoring:
    - Track Hits@K, MRR, and faithfulness; maintain small eval set per agent.
    - Log retrieval diagnostics (which sources contributed to the final answer).

Components mapping:
- LlamaIndex: `PGVectorStore`, `VectorStoreIndex`, `HyDEQueryTransform`, `SentenceWindowNodeParser`, `ResponseSynthesizer(Refine/Tree)`, `SimilarityPostprocessor`.
- LangChain: `MultiQueryRetriever`, `EnsembleRetriever` (VectorStore + FTS), `ContextualCompressionRetriever`, `VoyageRerank2`, `ParentDocumentRetriever`.

## Cost Estimates (MVP ballpark)
- Assumptions:
    - Total corpus per agent: up to 50 MB of clean text (~13M tokens at 4 chars/token).
    - Chunk size: ~500 tokens (for reranker input), 100 docs per rerank call.
    - Reranker: Voyage Rerank-2, priced per 1,000 queries (each with up to 100 docs).
- Voyage Rerank-2 cost:
    - Documents for rerank ≈ 13,000,000 / 500 ≈ 26,000 docs.
    - Queries needed (100 docs per query) ≈ 260 queries.
    - If price is ~$2 per 1,000 queries, cost ≈ 0.26k × $2 ≈ $0.52 per full-corpus pass.
    - Runtime strategy: rerank only top-k ANN results (e.g., 200–400) per user query → cost per user query is tiny (~$0.0004–$0.0008 if priced per 1k queries at $2).
- Embedding cost:
    - Example with OpenAI `text-embedding-3-large`: tokens × price_per_token. Substitute current unit price when finalizing vendor.
    - One-time on upload; re-run on file updates only.

## Divorce Lawyer Intake Considerations (As a first test case, should be good for any business)
- Required fields: full name, contact, location, opposing party, marriage date, children, assets/debts overview.
- Jurisdiction/locale normalization (e.g., date formats, counties).
- Guardrails: disclaimers that responses are informational, not legal advice.
- Sensitive topics: avoid storing freeform highly sensitive details unless necessary; prefer structured forms.
- Citations: statutes, FAQs, firm docs; always cite source document and location.

## Observability & Safety (MVP)
- Audit log on admin actions and configuration changes.
- Rate limiting and per-agent message quotas.
- Basic PII protection: mask in logs where possible; encrypt key fields at rest if needed.

## Open Questions
- SPA only or add SSR now (for SEO on marketing pages)?
- Chosen reranker provider: Voyage Rerank-2.
- Summarization budget limits (per MB) and run on upload vs async background?

