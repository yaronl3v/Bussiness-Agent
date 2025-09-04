import OpenRouterClient from './open_router/openRouter.js';
import { logLlmInteraction } from '../utils/llm_debug.js';
import llmconfig from '../config/llmconfig.js';
import { logger } from '../config/logger.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

function buildResponsesInput({ system, user }) {
  // Fold system into the single input block to keep logic simple
  const combined = system ? `SYSTEM:\n${system}\n\nUSER:\n${user}` : String(user || '');
  return [
    {
      role: 'user',
      content: [
        { type: 'input_text', text: combined }
      ]
    }
  ];
}

function extractTextFromResponses(resp) {
  // Try the convenience field first
  try {
    if (resp && resp.output_text) return String(resp.output_text);
  } catch {}
  // Walk output -> content -> text
  try {
    const out = resp?.output;
    if (Array.isArray(out)) {
      const texts = [];
      for (const item of out) {
        const content = item?.content;
        if (!Array.isArray(content)) continue;
        for (const piece of content) {
          const t = piece?.text || piece?.value || '';
          if (t) texts.push(String(t));
        }
      }
      if (texts.length) return texts.join('\n');
    }
  } catch {}
  return '';
}

export class LlmService {
  constructor() {
    if (!OPENROUTER_API_KEY) {
      this.enabled = false;
      return;
    }
    this.client = new OpenRouterClient({ apiKey: OPENROUTER_API_KEY });
    this.enabled = true;
    this.defaultModel = llmconfig.model || 'openai/o5-mini';
  }

  isEnabled() {
    return this.enabled;
  }

  async chat({ system, user, model = this.defaultModel, temperature = llmconfig.temperature || 0.2, promptName = 'prompt' }) {
    // Backward-compatible wrapper to the centralized call
    return this.makeLlmCall({ system, user, model, temperature, promptName });
  }

  async makeLlmCall({ system, user, model = this.defaultModel, temperature = llmconfig.temperature || 0.2, promptName = 'prompt' }) {
    if (!this.enabled) {
      return { text: '' };
    }

    // Prefer Responses API if enabled; otherwise, fallback to Chat Completions
    if (llmconfig.responses?.enabled) {
      const t0 = Date.now();
      const input = buildResponsesInput({ system, user });
      const payload = {
        model,
        input,
        text: llmconfig.responses.text,
        reasoning: llmconfig.responses.reasoning,
        tools: llmconfig.responses.tools || [],
        store: Boolean(llmconfig.responses.store),
        include: llmconfig.responses.include || []
      };
      // Include temperature only if explicitly enabled for Responses API models
      if (llmconfig.responses?.sendTemperature && typeof temperature === 'number') {
        payload.temperature = temperature;
      }

      const resp = await this.client.responses.create(payload);
      const text = extractTextFromResponses(resp);
      try {
        const durationSec = (Date.now() - t0) / 1000;
        logger.info('LLM call complete (Responses)', { model, promptName, duration_s: Number(durationSec.toFixed(3)) });
      } catch {}

      try {
        const promptText = `${system ? `SYSTEM:\n${system}\n\n` : ''}USER:\n${user}`;
        await logLlmInteraction({ promptName, promptText, rawResponse: resp });
      } catch {}

      return { text };
    }

    // Legacy Chat Completions path
    const t0 = Date.now();
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ];
    const resp = await this.client.chat.completions.create({ model, temperature, messages });
    const text = resp.choices?.[0]?.message?.content || '';
    try {
      const durationSec = (Date.now() - t0) / 1000;
      logger.info('LLM call complete (ChatCompletions)', { model, promptName, duration_s: Number(durationSec.toFixed(3)) });
    } catch {}

    try {
      const promptText = `${system ? `SYSTEM:\n${system}\n\n` : ''}USER:\n${user}`;
      await logLlmInteraction({ promptName, promptText, rawResponse: resp });
    } catch {}

    return { text };
  }
}

export default LlmService;


