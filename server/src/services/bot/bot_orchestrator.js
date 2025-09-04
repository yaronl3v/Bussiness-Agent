import EmbeddingService from '../embedding_service.js';
import RetrieverService from '../retriever_service.js';
import IntakeService from '../intake_service.js';
import LlmService from '../llm_service.js';
import { Agent, Lead, Document } from '../../models/index.js';
import ConversationService from '../conversation_service.js';
import VendorService from '../vendor_service.js';
import { buildSinglePrompt } from './prompt_builder.js';
import { extractFirstJson } from '../../utils/json_parse.js';
import llmconfig from '../../config/llmconfig.js';

export class BotOrchestrator {
  constructor({ userId, agentId }) {
    this.userId = userId;
    this.agentId = agentId;
    this.llm = new LlmService();
  }

  async chat({ messageText, channel, context }) {
    const conversationId = context?.conversationId;
    const agent = await Agent.findByPk(this.agentId);
    const baseLeadSchema = normalizeIntakeSchema(agent?.dataValues?.lead_form_schema_jsonb || {});
    const baseDynSchema = normalizeIntakeSchema(agent?.dataValues?.dynamic_info_schema_jsonb || {});

    // Read + initialize conversation meta with schema states and section status
    const convo = conversationId ? await ConversationService.getById(conversationId) : null;
    const meta = convo?.meta_jsonb || {};
    const currentLead = normalizeIntakeSchema(meta.lead_schema || baseLeadSchema);
    const currentDyn = normalizeIntakeSchema(meta.dyn_schema || baseDynSchema);
    const completedSections = Array.isArray(meta.completed_sections) ? meta.completed_sections : [];

    // Pull history (capped)
    const historyTurns = Math.max(0, Number(llmconfig.history?.turns || 8));
    const history = conversationId ? await ConversationService.getRecentMessages(conversationId, historyTurns * 2) : [];

    // Handle simple navigation commands
    const isBack = /^\s*back\s*$/i.test(messageText || '');

    // Decide if retrieval is needed (only if agent has docs)
    let passages = [];
    let citations = [];
    if (llmconfig.retrieval.enabledByDefault) {
      const docsCount = await Document.count({ where: { agent_id: this.agentId } });
      if (docsCount > 0) {
        try {
          const embedSvc = new EmbeddingService();
          const [qEmbedding] = await embedSvc.embedTexts([messageText]);
          const hybrid = await RetrieverService.searchHybrid({
            agentId: this.agentId,
            question: { text: messageText, embedding: qEmbedding },
            topN: llmconfig.retrieval.topN,
            topK: llmconfig.retrieval.topK,
            useFTS: llmconfig.retrieval.useFTS,
            useTrigram: llmconfig.retrieval.useTrigram,
            useRerank: llmconfig.retrieval.useRerank
          });
          passages = Array.isArray(hybrid) ? hybrid : [];
          citations = RetrieverService.toCitations(passages);
        } catch {
          // Fail open: continue without passages
          passages = [];
          citations = [];
        }
      }
    }

    // Build a single big prompt with sections
    const { promptText } = await buildSinglePrompt({
      agent,
      history,
      userMessage: messageText,
      leadSchema: currentLead,
      dynSchema: currentDyn,
      passages,
      includeBackHint: Boolean(llmconfig.prompt?.includeBackHint),
      completedSections
    });

    let assistant = '';
    let leadUpdates = [];
    let dynUpdates = [];
    let intakeCompleteFlag = false;
    let doneSections = [];

    if (this.llm.isEnabled()) {
      const { text } = await this.llm.makeLlmCall({
        system: '',
        user: promptText,
        model: llmconfig.model,
        temperature: llmconfig.temperature,
        promptName: 'single_prompt.txt'
      });
      const json = extractFirstJson(text || '') || {};
      assistant = typeof json.assistant === 'string' && json.assistant.trim() ? json.assistant.trim() : '';
      if (Array.isArray(json.lead_updates)) leadUpdates = json.lead_updates;
      if (Array.isArray(json.dyn_updates)) dynUpdates = json.dyn_updates;
      if (typeof json.intake_complete === 'boolean') intakeCompleteFlag = json.intake_complete;
      if (Array.isArray(json.done_sections)) doneSections = json.done_sections;
    }

    // Support "back": undo the last answered question
    const stack = Array.isArray(meta.stack) ? [...meta.stack] : [];
    if (isBack && stack.length > 0) {
      const lastId = stack.pop();
      clearQuestion(currentLead, lastId);
      clearQuestion(currentDyn, lastId);
    }

    // Merge updates into schema state
    const mergedLead = IntakeService.merge(currentLead, leadUpdates, { createMissing: false });
    const mergedDyn = IntakeService.merge(currentDyn, dynUpdates, { createMissing: true });

    // Push updated question IDs onto stack (to enable back)
    for (const u of leadUpdates) if (u?.questionId) stack.push(u.questionId);
    for (const u of dynUpdates) if (u?.questionId) stack.push(u.questionId);

    // Persist updated schema states on conversation meta
    if (conversationId) {
      const completedSet = new Set(completedSections);
      for (const s of doneSections) completedSet.add(s);
      const nextMeta = { ...meta, lead_schema: mergedLead, dyn_schema: mergedDyn, stack, completed_sections: Array.from(completedSet) };
      await ConversationService.updateMeta(conversationId, nextMeta);
    }

    // Upsert lead snapshot each turn; mark status based on completeness of lead-required fields
    if (conversationId) {
      const leadAnswers = flattenAnswers(mergedLead);
      const dynAnswers = flattenAnswers(mergedDyn);
      const payload = { ...leadAnswers, ...dynAnswers };
      const leadRequiredComplete = areRequiredCollected(mergedLead);
      const finalComplete = Boolean(intakeCompleteFlag) || Boolean(leadRequiredComplete);
      await upsertLead({ agentId: this.agentId, conversationId, payload, status: finalComplete ? 'qualified' : 'new' });
    }

    // Optional vendor suggestion (unchanged behavior)
    let suggestionText = '';
    try {
      const lead = conversationId ? await Lead.findOne({ where: { agent_id: this.agentId, conversation_id: conversationId } }) : null;
      const suggestion = await VendorService.selectVendor(this.agentId, lead?.lead_jsonb || {});
      if (suggestion) {
        const vendorName = suggestion.vendor_jsonb?.name || 'a specialist';
        suggestionText = `\n\nWould you like me to connect you with our vendor: ${vendorName}?`;
      }
    } catch {
      // ignore vendor errors
    }

    // Fallbacks when LLM disabled or produced empty content
    if (!assistant) {
      if (passages.length > 0) {
        assistant = `I found ${passages.length} relevant passages. What would you like to know about them?`;
      } else {
        assistant = agent?.dataValues?.welcome_message || 'Hi! I can help with your questions. You can upload documents to improve my answers.';
      }
    }

    return {
      uiText: `${assistant}${suggestionText}`,
      proposedUpdates: [], // kept for backward-compat with UI; updates are applied server-side
      nextAction: 'answer',
      citations,
      doneSections
    };
  }
}

function normalizeIntakeSchema(schema) {
  if (!schema) return { sections: [] };
  if (typeof schema === 'object' && Array.isArray(schema.sections)) return schema;
  if (Array.isArray(schema)) {
    const looksLikeQuestions = schema.every(q => q && typeof q === 'object' && (q.label || q.id));
    if (looksLikeQuestions) {
      return { sections: [{ id: 'default', title: 'Details', questions: schema }] };
    }
  }
  return { sections: [] };
}

function clearQuestion(schema, questionId) {
  if (!schema || !questionId) return;
  for (const s of schema.sections || []) {
    for (const q of s.questions || []) {
      if (q.id === questionId) {
        delete q.answer;
        q.isDone = false;
        q.collected = false;
        return;
      }
    }
  }
}

async function ensureLeadExists({ agentId, conversationId }) {
  if (!agentId || !conversationId) return;
  const existing = await Lead.findOne({ where: { agent_id: agentId, conversation_id: conversationId } });
  if (existing) return;
  await Lead.create({ agent_id: agentId, conversation_id: conversationId, lead_jsonb: {}, status: 'new' });
}

function flattenAnswers(schema) {
  const out = {};
  if (!schema || !Array.isArray(schema.sections)) return out;
  for (const s of schema.sections) {
    for (const q of s.questions || []) {
      const has = q && q.id && (q.answer !== undefined && q.answer !== null && String(q.answer).trim() !== '');
      if (has) out[q.id] = q.answer;
    }
  }
  return out;
}

function areRequiredCollected(schema) {
  if (!schema || !Array.isArray(schema.sections)) return true;
  for (const s of schema.sections) {
    for (const q of s.questions || []) {
      if (q && q.required) {
        const has = q.answer !== undefined && q.answer !== null && String(q.answer).trim() !== '';
        if (!has) return false;
      }
    }
  }
  return true;
}

async function upsertLead({ agentId, conversationId, payload, status = 'new' }) {
  if (!agentId || !conversationId) return;
  const existing = await Lead.findOne({ where: { agent_id: agentId, conversation_id: conversationId } });
  if (!existing) {
    await Lead.create({ agent_id: agentId, conversation_id: conversationId, lead_jsonb: payload || {}, status });
    return;
  }
  const next = { ...(existing.lead_jsonb || {}), ...(payload || {}) };
  await Lead.update({ lead_jsonb: next, status }, { where: { id: existing.id } });
}

export default BotOrchestrator;
