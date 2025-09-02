import EmbeddingService from '../embedding_service.js';
import RetrieverService from '../retriever_service.js';
import IntakeService from '../intake_service.js';
import LlmService from '../llm_service.js';
import loadPrompt from './prompt_loader.js';
import { Agent, Lead } from '../../models/index.js';
import ConversationService from '../conversation_service.js';
import VendorService from '../vendor_service.js';

export class BotOrchestrator {
  constructor({ userId, agentId }) {
    this.userId = userId;
    this.agentId = agentId;
    this.llm = new LlmService();
  }

  async chat({ messageText, channel, context }) {
    // Load agent config
    const agent = await Agent.findByPk(this.agentId);
    const leadSchema = agent?.dataValues?.lead_form_schema_jsonb || {};
    const dynSchema = agent?.dataValues?.dynamic_info_schema_jsonb || {};

    // Read conversation meta
    const conversationId = context?.conversationId;
    const convo = conversationId ? await ConversationService.getById(conversationId) : null;
    const meta = convo?.meta_jsonb || { phase: 'intake', stack: [], lead_schema: leadSchema, dyn_schema: dynSchema };

    const isBack = /^\s*back\s*$/i.test(messageText);
    const isSkip = /^\s*skip\s*$/i.test(messageText);

    // Decide phase
    const phase = meta.phase || 'intake';

    if (phase === 'intake') {
      const currentLead = meta.lead_schema || leadSchema;
      const updatedLead = IntakeService.merge(currentLead, []);
      let nextQuestion = findNextRequiredQuestion(updatedLead);
      if (isBack && meta.stack?.length) {
        const lastId = meta.stack.pop();
        markQuestionUndone(updatedLead, lastId);
        nextQuestion = getQuestionById(updatedLead, lastId) || nextQuestion;
      }
      if (nextQuestion) {
        if (isSkip) {
          markQuestionDone(updatedLead, nextQuestion.id);
          await ConversationService.updateMeta(conversationId, { ...meta, lead_schema: updatedLead, stack: meta.stack });
          const following = findNextRequiredQuestion(updatedLead);
          return { uiText: following ? `${following.label}` : 'Thanks. Intake complete. Proceeding...', proposedUpdates: [], nextAction: following ? 'ask' : 'answer', nextQuestionId: following?.id };
        }
        let uiText = `Please provide: ${nextQuestion.label}`;
        if (this.llm.isEnabled()) {
          const sys = await loadPrompt('intake_system.txt', { agentName: agent?.dataValues?.name || '' , businessName: agent?.dataValues?.name || ''});
          const usr = `Question: ${nextQuestion.label}\nUser: ${messageText}\nReturn only the value if detected.`;
          const { text } = await this.llm.chat({ system: sys, user: usr });
          const value = (text || '').trim();
          const merged = IntakeService.merge(updatedLead, value ? [{ questionId: nextQuestion.id, value }] : []);
          if (value) meta.stack = [...(meta.stack || []), nextQuestion.id];
          const following = findNextRequiredQuestion(merged);
          await ConversationService.updateMeta(conversationId, { ...meta, phase: following ? 'intake' : 'dyn', lead_schema: merged, stack: meta.stack });
          return { uiText: following ? `Thanks. ${following.label}` : 'Thanks. Intake complete. Proceeding...', proposedUpdates: [], nextAction: following ? 'ask' : 'answer', nextQuestionId: following?.id };
        }
        await ConversationService.updateMeta(conversationId, { ...meta, phase: 'intake', lead_schema: updatedLead, stack: meta.stack });
        return { uiText, proposedUpdates: [], nextAction: 'ask', nextQuestionId: nextQuestion.id };
      }
      // Lead intake complete → ensure lead then move to dynamic info
      await ensureLeadExists({ agentId: this.agentId, conversationId });
      await ConversationService.updateMeta(conversationId, { ...meta, phase: 'dyn' });
      return { uiText: 'Thanks. Let’s gather a few more details.', nextAction: 'ask' };
    }

    if (meta.phase === 'dyn') {
      const currentDyn = meta.dyn_schema || dynSchema;
      const updatedDyn = IntakeService.merge(currentDyn, []);
      let nextQuestion = findNextRequiredQuestion(updatedDyn);
      if (isBack && meta.stack?.length) {
        const lastId = meta.stack.pop();
        markQuestionUndone(updatedDyn, lastId);
        nextQuestion = getQuestionById(updatedDyn, lastId) || nextQuestion;
      }
      if (nextQuestion) {
        if (isSkip) {
          markQuestionDone(updatedDyn, nextQuestion.id);
          await ConversationService.updateMeta(conversationId, { ...meta, dyn_schema: updatedDyn, stack: meta.stack });
          const following = findNextRequiredQuestion(updatedDyn);
          return { uiText: following ? `${following.label}` : 'All set. I can now answer questions.', proposedUpdates: [], nextAction: following ? 'ask' : 'answer', nextQuestionId: following?.id };
        }
        if (this.llm.isEnabled()) {
          const sys = await loadPrompt('intake_system.txt', { agentName: agent?.dataValues?.name || '' , businessName: agent?.dataValues?.name || ''});
          const usr = `Question: ${nextQuestion.label}\nUser: ${messageText}\nReturn only the value if detected.`;
          const { text } = await this.llm.chat({ system: sys, user: usr });
          const value = (text || '').trim();
          const merged = IntakeService.merge(updatedDyn, value ? [{ questionId: nextQuestion.id, value }] : []);
          if (value) meta.stack = [...(meta.stack || []), nextQuestion.id];
          const following = findNextRequiredQuestion(merged);
          await ConversationService.updateMeta(conversationId, { ...meta, phase: following ? 'dyn' : 'qna', dyn_schema: merged, stack: meta.stack });
          return { uiText: following ? `Thanks. ${following.label}` : 'Thanks. I can answer with more context now.', proposedUpdates: [], nextAction: following ? 'ask' : 'answer', nextQuestionId: following?.id };
        }
        await ConversationService.updateMeta(conversationId, { ...meta, phase: 'dyn', dyn_schema: updatedDyn, stack: meta.stack });
        return { uiText: `Please provide: ${nextQuestion.label}`, proposedUpdates: [], nextAction: 'ask', nextQuestionId: nextQuestion.id };
      }
      // Dynamic info complete → proceed to Q&A
      await ConversationService.updateMeta(conversationId, { ...meta, phase: 'qna' });
    }

    // Q&A with retrieval
    const embedder = new EmbeddingService();
    const [queryEmbedding] = await embedder.embedTexts([messageText]);
    const passages = await RetrieverService.searchHybrid({ agentId: this.agentId, question: { text: messageText, embedding: queryEmbedding }, topN: 200, topK: 10, useFTS: true, useTrigram: true, useRerank: true });
    let answer = '';
    if (this.llm.isEnabled()) {
      const contextText = passages.map((p, i) => `[${i+1}] ${p.content}`).join('\n');
      const sys = await loadPrompt('qna_system.txt', { agentName: agent?.dataValues?.name || '' });
      const usr = `QUESTION: ${messageText}\nCONTEXT:\n${contextText}`;
      const { text } = await this.llm.chat({ system: sys, user: usr, temperature: 0.1 });
      answer = text || '';
    } else {
      answer = `Found ${passages.length} relevant passages.`;
    }
    const citations = RetrieverService.toCitations(passages);
    // Optional vendor suggestion (safe if configs empty)
    const lead = await Lead.findOne({ where: { agent_id: this.agentId, conversation_id: conversationId } });
    const suggestion = await VendorService.selectVendor(this.agentId, lead?.lead_jsonb || {});
    let suggestionText = '';
    if (suggestion) {
      const vendorName = suggestion.vendor_jsonb?.name || 'a specialist';
      suggestionText = '\n\n' + (await loadPrompt('vendor_suggest.txt', { vendorName }));
    }
    return { uiText: `${answer}${suggestionText}`, proposedUpdates: [], nextAction: 'answer', citations };
  }
}

function findNextRequiredQuestion(schema) {
  const sections = schema?.sections || [];
  for (const s of sections) {
    for (const q of s.questions || []) {
      if (q.required && !q.isDone) return q;
    }
  }
  return null;
}

async function ensureLeadExists({ agentId, conversationId }) {
  if (!agentId || !conversationId) return;
  const existing = await Lead.findOne({ where: { agent_id: agentId, conversation_id: conversationId } });
  if (existing) return;
  await Lead.create({ agent_id: agentId, conversation_id: conversationId, lead_jsonb: {}, status: 'new' });
}

export default BotOrchestrator;
