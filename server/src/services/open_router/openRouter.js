import axios from 'axios';

// Lightweight OpenRouter client wrapper to mimic the subset of
// the OpenAI SDK surface that this codebase uses.
// - chat.completions.create
// - responses.create (adapts to chat completions under the hood)
// - embeddings.create

function mapModelName(model) {
  if (!model) return model;
  const m = String(model);
  // Minimal compatibility mapping for a few common aliases
  const aliases = new Map([
    ['gpt-4o-mini', 'openai/o4-mini'],
    ['o4-mini', 'openai/o4-mini'],
    ['gpt-4o', 'openai/gpt-4o'],
    ['gpt-5-mini', 'openai/o5-mini'],
    ['o5-mini', 'openai/o5-mini']
  ]);
  return aliases.get(m) || m;
}

function extractTextFromResponsesInput(input) {
  try {
    // input is an array of blocks with role + content[] (type: input_text)
    const blocks = Array.isArray(input) ? input : [];
    const texts = [];
    for (const b of blocks) {
      const content = Array.isArray(b?.content) ? b.content : [];
      for (const c of content) {
        const t = c?.text || c?.value || '';
        if (t) texts.push(String(t));
      }
    }
    return texts.join('\n');
  } catch {
    return '';
  }
}

export default class OpenRouterClient {
  constructor({ apiKey = process.env.OPENROUTER_API_KEY, baseURL = 'https://openrouter.ai/api/v1', headers = {} } = {}) {
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.defaultHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...headers
    };

    // Expose OpenAI-like namespaces
    this.chat = {
      completions: { create: (args) => this.#chatCompletionsCreate(args) }
    };
    this.responses = { create: (args) => this.#responsesCreate(args) };
    this.embeddings = { create: (args) => this.#embeddingsCreate(args) };
  }

  async #post(path, body) {
    const url = `${this.baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await axios.post(url, body, { headers: this.defaultHeaders });
    return res.data;
  }

  async #chatCompletionsCreate({ model, messages, temperature, ...rest }) {
    const payload = { model: mapModelName(model), messages, ...(typeof temperature === 'number' ? { temperature } : {}), ...rest };
    return this.#post('/chat/completions', payload);
  }

  async #responsesCreate({ model, input, text: _textCfg, reasoning, tools, store: _store, include: _include, temperature, ...rest }) {
    // Adapt Responses-style input to chat.completions
    const combined = extractTextFromResponsesInput(input);
    const messages = [{ role: 'user', content: combined }];
    const body = {
      model: mapModelName(model),
      messages,
      ...(Array.isArray(tools) && tools.length ? { tools } : {}),
      ...(reasoning ? { reasoning } : {}),
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...rest
    };
    const data = await this.#post('/chat/completions', body);
    const content = data?.choices?.[0]?.message?.content || '';
    // Return a shape compatible with code that reads Responses API
    return {
      output_text: typeof content === 'string' ? content : '',
      output: [
        {
          content: [
            { type: 'output_text', text: typeof content === 'string' ? content : '' }
          ]
        }
      ],
      raw: data
    };
  }

  async #embeddingsCreate({ model, input, ...rest }) {
    const payload = { model: mapModelName(model), input, ...rest };
    return this.#post('/embeddings', payload);
  }
}

