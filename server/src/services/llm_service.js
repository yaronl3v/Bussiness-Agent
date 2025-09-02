import OpenAI from 'openai';

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

  async chat({ system, user, model = DEFAULT_MODEL, temperature = 0.2 }) {
    if (!this.enabled) {
      return { text: '' };
    }
    const resp = await this.client.chat.completions.create({
      model,
      temperature,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: user }
      ]
    });
    const text = resp.choices?.[0]?.message?.content || '';
    return { text };
  }
}

export default LlmService;


