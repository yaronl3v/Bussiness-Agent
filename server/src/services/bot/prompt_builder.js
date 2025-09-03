import { detectLanguageFromText } from '../../utils/language.js';
import loadPrompt from './prompt_loader.js';

function formatHistory(messages = []) {
  // messages are [{ role:'user'|'assistant'|'system', content_jsonb:{text}, ... }]
  const lines = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'ASSISTANT' : m.role === 'user' ? 'USER' : 'SYSTEM';
    const text = (m.content_jsonb && m.content_jsonb.text) ? String(m.content_jsonb.text) : '';
    if (!text) continue;
    lines.push(`${role}: ${text}`);
  }
  return lines.join('\n');
}

function redactNulls(obj) {
  if (obj == null) return undefined;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return undefined;
  }
}

function schemaToReadable(schema) {
  const safe = redactNulls(schema) || { sections: [] };
  const sections = safe.sections || [];
  const lines = [];
  for (const s of sections) {
    lines.push(`Section: ${s.title || s.id || 'Untitled'}`);
    for (const q of (s.questions || [])) {
      const parts = [];
      parts.push(`- id: ${q.id}`);
      if (q.label) parts.push(`label: ${q.label}`);
      if (q.type) parts.push(`type: ${q.type}`);
      if (q.required) parts.push('required: true');
      // always include collected flag
      const collected = (typeof q.collected === 'boolean') ? q.collected : Boolean(q.answer && String(q.answer).trim() !== '');
      parts.push(`collected: ${collected ? 'true' : 'false'}`);
      if (q.description) parts.push(`desc: ${q.description}`);
      if (q.answer) parts.push(`answer: ${q.answer}`);
      if (q.isDone) parts.push('done: true');
      lines.push(parts.join(', '));
    }
  }
  return lines.join('\n');
}

function formatContextPassages(passages = []) {
  if (!passages || passages.length === 0) return '';
  const blocks = passages.map((p, idx) => `[#${idx + 1}]\n${p.content}`);
  return blocks.join('\n\n');
}

export async function buildSinglePrompt({
  agent,
  history = [],
  userMessage = '',
  leadSchema,
  dynSchema,
  passages = [],
  includeBackHint = true
}) {
  const agentName = agent?.dataValues?.name || '';
  const businessName = agentName;
  const specialInstructions = agent?.dataValues?.special_instructions || '';
  const lang = detectLanguageFromText(
    userMessage || history?.[history.length - 1]?.content_jsonb?.text || ''
  );

  const variables = {
    agentName: agentName,
    businessName: businessName,
    languageName: lang.languageName,
    textDirection: lang.textDirection,
    specialInstructions: specialInstructions || '',
    leadSchemaState: leadSchema ? schemaToReadable(leadSchema) : '',
    dynamicInfoSchemaState: dynSchema ? schemaToReadable(dynSchema) : '',
    contextPassages: formatContextPassages(passages) || '',
    chatHistory: formatHistory(history) || '',
    backHint: includeBackHint ? 'Users may type "back" to revisit the previous question or "skip" to skip the current one.' : '',
    currentUserMessage: userMessage || ''
  };

  const promptText = await loadPrompt('single_prompt.txt', variables, lang.locale);
  return { promptText, locale: lang.locale };
}

export default buildSinglePrompt;
