import { Agent } from '../models/index.js';
import LlmService from './llm_service.js';
import { logger } from '../config/logger.js';

export class SchemaBuilderService {
  static async rebuildLeadSchema(agentId, naturalText) {
    try {
      const llm = new LlmService();
      if (!llm.isEnabled()) return;
      if (!naturalText || !naturalText.trim()) return;
      const system = "You convert business owners' free-text descriptions of lead forms into a strict JSON schema. Output JSON only with fields: fields: [ { id, label, type, required, validation? } ]. Types: text, email, tel, number, date, select, boolean. Infer required from wording. Add id as snake_case of label. Never include comments.";
      const user = `Create schema from this description:\n\n${naturalText}\n\nOutput only JSON.`;
      const t0 = Date.now();
      const { text } = await llm.chat({ system, user, temperature: 0, promptName: 'lead_schema_from_text' });
      const duration = ((Date.now() - t0) / 1000).toFixed(3);
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text && text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }
      if (parsed && typeof parsed === 'object') {
        const fields = Array.isArray(parsed.fields) ? parsed.fields : (Array.isArray(parsed) ? parsed : null);
        if (fields) {
          await Agent.update({ lead_form_schema_jsonb: fields }, { where: { id: agentId } });
          logger.info('Lead schema rebuilt', { agentId, duration_s: Number(duration) });
        }
      }
    } catch (err) {
      logger.error('Lead schema rebuild failed', err, { agentId });
    }
  }

  static async rebuildDynamicSchema(agentId, naturalText) {
    try {
      const llm = new LlmService();
      if (!llm.isEnabled()) return;
      if (!naturalText || !naturalText.trim()) return;
      const system = 'You convert free-text descriptions of additional intake questions into a strict JSON schema. Output JSON only with fields: sections: [ { id, title, questions: [ { id, label, type, required?, question? } ] } ]. Types: text, email, tel, number, date, select, boolean. Add id as snake_case of label or question. Never include comments.';
      const user = `Create dynamic info schema from this description:\n\n${naturalText}\n\nOutput only JSON.`;
      const t0 = Date.now();
      const { text } = await llm.chat({ system, user, temperature: 0, promptName: 'dynamic_schema_from_text' });
      const duration = ((Date.now() - t0) / 1000).toFixed(3);
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text && text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }
      if (parsed && typeof parsed === 'object') {
        let schema = null;
        if (Array.isArray(parsed.sections)) {
          schema = parsed;
        } else if (Array.isArray(parsed.questions)) {
          schema = { sections: [{ id: 'details', title: 'Details', questions: parsed.questions }] };
        } else if (Array.isArray(parsed.fields)) {
          schema = { sections: [{ id: 'details', title: 'Details', questions: parsed.fields }] };
        }
        if (schema) {
          await Agent.update({ dynamic_info_schema_jsonb: schema }, { where: { id: agentId } });
          logger.info('Dynamic schema rebuilt', { agentId, duration_s: Number(duration) });
        }
      }
    } catch (err) {
      logger.error('Dynamic schema rebuild failed', err, { agentId });
    }
  }
}

export default SchemaBuilderService;

