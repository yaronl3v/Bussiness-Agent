## Frontend UI/UX Plan

This plan translates the product spec into concrete screens, flows, and components for the React + Vite SPA. It emphasizes clarity, progressive disclosure, excellent form UX, and a modern chat experience with citations.

### Design Principles
- **Clarity first**: reduce cognitive load; clear headings, helpers, and empty states.
- **Progressive disclosure**: advanced options are collapsed by default.
- **Consistency**: shared components for tables, forms, modals, toasts.
- **Speed**: optimistic UI where safe; skeletons on load; debounce network calls.
- **Accessibility**: WCAG AA, keyboard-first, screen reader labels, focus management.
- **Security/PII**: mask sensitive fields in UI where possible; copy guards.

### Information Architecture & Routes
- **Auth**
  - `/login`
  - `/register`
- **Agents**
  - `/agents` (list)
  - `/agents/:agentId` (detail)
    - `/agents/:agentId/data`
    - `/agents/:agentId/whatsapp`
    - `/agents/:agentId/config`
    - `/agents/:agentId/test-chat`
    - `/agents/:agentId/leads`
    - `/agents/:agentId/conversations`

### Global Layout & Navigation
- **Top bar**: product name, org switcher (if multiple), environment badge, profile menu (logout), help.
- **Secondary nav (Agent Detail)**: horizontal tabs: Data, WhatsApp, Configuration, Test Chat, Leads, Conversations.
- **Content area**: page header with agent name, status pill, quick actions (Activate/Disable), and tab content below.
- **Feedback**: global toast system; inline form errors; confirm dialogs for destructive actions.

### Shared Components
- **Form primitives**: labeled input, select, textarea, checkbox, toggle, date/time, phone (E.164), JSON editor (monaco-lite) for advanced schema edits.
- **Tables**: sortable headers, column filters, pagination, row selection, sticky header.
- **Cards**: for status/info blocks.
- **Empty/Skeleton**: standardized empty-state illustrations and skeleton loaders.
- **Modals/Drawers**: for create/edit flows and details.
- **CopyableText**: value with a copy button and success tooltip.
- **Badge/Pill**: for statuses (active, disabled, indexing, error).
- **Uploader**: drag-drop, file list with progress, type validation.
- **Chat**: message list, input box, streaming indicator, citations toggle, inspector panel.

### Load/Empty/Error States
- Loading: skeleton rows/cards; activity indicators on buttons.
- Empty: concise guidance, CTA buttons (e.g., “Upload documents”).
- Error: non-technical message + “Try again” and support link; preserve user input.

### Forms UX Rules
- Realtime validation on blur; submit-time validation gate; show field-level help.
- Keyboard-friendly: Tab-order, Enter to submit, Esc to close modals.
- Persist unsaved changes warning when navigating away.
- Optimistic UI only for non-destructive idempotent actions; otherwise confirm first.

## Pages & Screens

### Auth: Login (`/login`)
- **Purpose**: authenticate existing users.
- **UI**:
  - Email (required, validated)
  - Password (required)
  - Submit button; “Remember me” optional
  - Link to Register
- **UX**:
  - On success → redirect to `/agents`
  - On error → inline message
- **API**: `POST /api/auth/login`

### Auth: Register (`/register`)
- **Purpose**: create user (and default organization if none).
- **UI**:
  - Organization name
  - Email, Password, Confirm password
  - Submit
- **UX**:
  - Strong password hints; mismatch guard
  - On success → `/agents`
- **API**: `POST /api/auth/register`

### Agents List (`/agents`)
- **Header**: title, Create Agent button.
- **Controls**: search by name, status filter, sort by updated.
- **Content**: card or table layout showing:
  - Agent name, status pill (Active/Disabled), updated time
  - Quick actions: Open, Activate/Disable menu, Delete (with confirm)
- **Empty state**: “No agents yet” + Create Agent CTA.
- **Create Agent modal**:
  - Name (required)
  - Welcome message (optional)
  - Create → go to Agent Detail
- **API**:
  - `GET /api/agents`
  - `POST /api/agents`
  - `PATCH /api/agents/:id` (status)
  - `DELETE /api/agents/:id`

### Agent Detail: Header (all tabs)
- **Left**: Agent name (editable inline), org name, ID (copyable).
- **Right**: Status pill, Activate/Disable button, More menu (Export, Delete).
- **Save feedback**: inline save spinner/success for name edits.
- **API**: `GET /api/agents/:id`, `PATCH /api/agents/:id`

### Data Manager (`/agents/:agentId/data`)
- **Purpose**: upload and manage domain documents.
- **Top actions**: Upload files, Re-index all, Ingestion settings (advanced, collapsed).
- **Uploader**: drag-drop zone with file type/size hints; progress per file.
- **Documents table**:
  - Columns: Title, Source, Size, Uploaded at, Status (uploaded/indexing/indexed/error), Actions
  - Row actions: View meta, Re-index, Delete (confirm)
- **Document drawer**:
  - Metadata (file name, pages, detected headings)
  - Outline preview (if available)
  - Section summaries (if available)
- **Empty state**: guidance + “Upload documents”.
- **API**:
  - `POST /api/agents/:id/documents` (multipart)
  - `GET /api/agents/:id/documents`
  - `DELETE /api/documents/:id`
  - `POST /api/agents/:id/reindex`

### WhatsApp Connection (`/agents/:agentId/whatsapp`)
- **Purpose**: connect Meta WhatsApp Business API.
- **Status card**:
  - Connection status (Connected/Not connected)
  - Webhook verify token (CopyableText; hidden by default)
  - Webhook URL (read-only; CopyableText)
  - Last inbound message time
- **Setup steps** (checklist):
  - Set verify token in Meta
  - Add webhook URL
  - Add access token
  - Send a test message
- **Access tokens**: input with mask, Save button.
- **Inbound log (compact table)**: timestamp, from, snippet, status.
- **API**:
  - `GET /api/webhooks/whatsapp` (verify via GET, shown as instructions)
  - `POST /api/webhooks/whatsapp` (handled by backend; we display status)

### Configuration (`/agents/:agentId/config`)
- **Purpose**: configure agent behavior and intake schemas.
- **Sections**:
  - Lead Form (minimal contact fields)
  - Dynamic Info Schema (multi-section, questions)
  - Special Instructions (textarea)
  - Welcome Message (textarea)
  - Modules (toggles): Q&A, recommendations, vendor routing, WhatsApp enabled
- **Lead Form**:
  - Fields table: Label, Type (text/email/tel/date/select), Required, Actions
  - Add/Edit field modal: id (auto), label, type, required, hint, options (when select)
- **Dynamic Info Schema**:
  - Section list (sortable); add/edit section (id, title)
  - Questions per section: table with id, label, type, required, deps, hint
  - Add/Edit question modal with type-specific inputs
  - JSON view toggle for advanced users (two-way bound)
- **Save bar**: sticky bottom bar with Unsaved changes, Save, Discard.
- **API**: `PATCH /api/agents/:id/config`

### Test Chat (`/agents/:agentId/test-chat`)
- **Purpose**: test the agent end-to-end with citations and intake updates.
- **Layout**: two columns (responsive to single column on mobile)
  - Left: Chat transcript
  - Right: Inspector panel (collapsible)
- **Chat transcript**:
  - Bubbles with role (You/Agent), timestamps
  - Streaming indicator while awaiting reply
  - Citations toggle: show [1][2][3] anchors; clicking opens source excerpt popover
  - Message actions: Copy, Retry last
  - Controls: Reset conversation, Export transcript (JSON/Markdown)
- **Input**: multiline with Enter to send, Shift+Enter newline; Attachments disabled in MVP.
- **Inspector panel**:
  - Last retrieval: top chunks with doc, score, snippet
  - Proposed intake updates (questionId → value)
  - Next action summary (ask/confirm/store)
- **API**:
-  - `POST /api/agents/:id/ask`
  - `GET /api/conversations/:id/messages` (when testing a specific conversation)
  - Persists via backend services; UI is stateless aside from local transcript view when not bound to a saved conversation.

### Leads (`/agents/:agentId/leads`)
- **Header**: count, export button (CSV/JSON).
- **Filters**: date range, status, search.
- **Table**: Lead ID, Created, Status, Key fields (name/email/phone), Source conversation, Actions.
- **Row click**: opens drawer with full `lead_jsonb` pretty view and timeline of changes.
- **Actions**: Update status (dropdown), Add note, Route to vendor (opens vendor routing modal).
- **API**: `GET /api/agents/:id/leads`, `PATCH /api/leads/:id`

### Conversations (`/agents/:agentId/conversations`)
- **Filters**: date, channel (whatsapp/in-app), has lead, search by client id/phone.
- **Table**: Conversation ID, Client, Channel, Last message, Updated, Actions.
- **Row click**: details drawer with full message list and citations per message.
- **Actions**: Open in Test Chat (read-only replay), Export transcript.
- **API**: `GET /api/conversations/:id/messages`

## Modals & Drawers
- **Confirm**: destructive actions (delete document/agent) need explicit confirmation with text echo.
- **Create/Edit Field/Question**: full-screen on mobile, centered modal on desktop.
- **Details Drawers**: slide-in from right for documents, leads, conversations.

## Notifications & Feedback
- **Toasts**: success, warning, error; auto-dismiss with focus-trap for screen readers.
- **Inline banners**: for WhatsApp setup warnings or indexing in progress.

## Accessibility & Internationalization
- Semantic HTML, ARIA roles; visible focus rings; keyboard shortcuts for chat.
- Phone input normalized to E.164; dates in ISO; locale-aware display later.

## Responsive Behavior
- Breakpoints: mobile (<640px), tablet (≥640px), desktop (≥1024px).
- Tables collapse to card lists on mobile; drawer becomes full-screen.
- Agent detail tabs become a select dropdown on mobile.

## Security & Privacy in UI
- Mask tokens/PII by default; reveal-on-click with timeout.
- Copy-to-clipboard confirms and re-masks values.
- Avoid rendering full raw document text outside controlled inspectors.

## Future: Embeddable Chat (Roadmap, not in MVP)
- Widget script loader → iframe sandbox → postMessage API.
- Separate embed key per agent; minimal UI, brandable theme.

## Endpoint Mapping Reference (Frontend → Backend)
- Auth: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`
- Agents: `GET/POST /api/agents`, `GET/PATCH/DELETE /api/agents/:id`, `POST /api/agents/:id/activate`, `PATCH /api/agents/:id/config`
- Documents: `POST /api/agents/:id/documents`, `GET /api/agents/:id/documents`, `DELETE /api/documents/:id`, `POST /api/agents/:id/reindex`
- Search/RAG: `POST /api/agents/:id/ask`
- Conversations: `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`
- Leads: `GET /api/agents/:id/leads`, `PATCH /api/leads/:id`
- Vendors: `GET/POST /api/agents/:id/vendors`, `PATCH/DELETE /api/vendors/:id`, `POST /api/agents/:id/route`
- Webhooks: `GET/POST /api/webhooks/whatsapp`


