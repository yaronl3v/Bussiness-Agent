import OpenAI from 'openai';
import { logLlmInteraction } from '../utils/llm_debug.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

export class LlmService {
  constructor() {
    if (!OPENAI_API_KEY) {
      this.enabled = false;
      return;
    }
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
    this.enabled = true;
  }

  isEnabled() {
    return this.enabled;
  }

  async chat({ system, user, model = DEFAULT_MODEL, temperature = 0.2, promptName = 'prompt' }) {
    // Backward-compatible wrapper to the centralized call
    return this.makeLlmCall({ system, user, model, temperature, promptName });
  }

  async makeLlmCall({ system, user, model = DEFAULT_MODEL, temperature = 0.2, promptName = 'prompt' }) {
    if (!this.enabled) {
      return { text: '' };
    }
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ];
    const resp = await this.client.chat.completions.create({
      model,
      temperature,
      messages
    });
    const text = resp.choices?.[0]?.message?.content || '';

    // Best-effort debug logging (non-blocking errors)
    try {
      const promptText = `${system ? `SYSTEM:\n${system}\n\n` : ''}USER:\n${user}`;
      await logLlmInteraction({
        promptName,
        promptText,
        rawResponse: resp
      });
    } catch {
      // ignore logging failures
    }

    return { text };
  }
}

export default LlmService;


