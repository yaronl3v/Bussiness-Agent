import OpenRouterClient from './open_router/openRouter.js';
import { ModelsConfig } from './open_router/models.js';
import { logLlmInteraction } from '../utils/llm_debug.js';
import llmconfig from '../config/llmconfig.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

function buildResponsesInput({ system, user }) {
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
  try { if (resp && resp.output_text) return String(resp.output_text); } catch {}
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
    this.defaultModel = llmconfig.model || 'GPT5_MINI';
  }

  isEnabled() { return this.enabled; }

  async chat({ system, user, model = this.defaultModel, temperature = llmconfig.temperature || 0.2, promptName = 'prompt' }) {
    return this.makeLlmCall({ system, user, model, temperature, promptName });
  }

  async makeLlmCall({ system, user, model = this.defaultModel, temperature = llmconfig.temperature || 0.2, promptName = 'prompt' }) {
    if (!this.enabled) return { text: '' };

    const resolveModel = (m) => {
      if (!m) return 'openai/gpt-5-mini';
      if (typeof m === 'object' && m.apiName) return m;
      if (typeof m === 'string') {
        if (Object.prototype.hasOwnProperty.call(ModelsConfig, m)) {
          const cfg = ModelsConfig[m] || {};
          const out = { apiName: cfg.apiName };
          if (cfg.reasoning && typeof cfg.reasoning === 'object') out.reasoning = cfg.reasoning;
          if (cfg.effort) out.effort = cfg.effort;
          if (cfg.provider) out.provider = cfg.provider;
          return out;
        }
        return m; // treat as provider slug
      }
      return 'openai/gpt-5-mini';
    };

    const modelArg = resolveModel(model);

    // Responses-like path (default enabled); routed via OpenRouter chat under the hood
    if (llmconfig.responses?.enabled) {
      const t0 = Date.now();
      const input = buildResponsesInput({ system, user });
      const payload = {
        model: modelArg,
        input,
        // Reasoning will be set by OpenRouter client only if present on the model object
        tools: llmconfig.responses.tools || []
      };
      if (llmconfig.responses?.sendTemperature && typeof temperature === 'number') {
        payload.temperature = temperature;
      }

      try {
        const resp = await this.client.responses.create(payload);
        const text = extractTextFromResponses(resp);
        try { console.log('LLM call complete (Responses)', { model, promptName, duration_s: Number(((Date.now() - t0) / 1000).toFixed(3)) }); } catch {}
        try {
          const promptText = `${system ? `SYSTEM:\n${system}\n\n` : ''}USER:\n${user}`;
          await logLlmInteraction({ promptName, promptText, rawResponse: resp });
        } catch {}
        return { text };
      } catch (e) {
        try { console.error('LLM call error (Responses)', { model, promptName, error: e?.message }); } catch {}
        return { text: '' };
      }
    }

    // Legacy Chat Completions path (also routed via OpenRouter)
    const t0 = Date.now();
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ];
    try {
      const ccPayload = { model: modelArg, temperature, messages };
      const resp = await this.client.chat.completions.create(ccPayload);
      const text = resp.choices?.[0]?.message?.content || '';
      try { console.log('LLM call complete (ChatCompletions)', { model, promptName, duration_s: Number(((Date.now() - t0) / 1000).toFixed(3)) }); } catch {}
      try {
        const promptText = `${system ? `SYSTEM:\n${system}\n\n` : ''}USER:\n${user}`;
        await logLlmInteraction({ promptName, promptText, rawResponse: resp });
      } catch {}
      return { text };
    } catch (e) {
      try { console.error('LLM call error (ChatCompletions)', { model, promptName, error: e?.message }); } catch {}
      return { text: '' };
    }
  }
}

export default LlmService;
