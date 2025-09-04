import axios from 'axios';

// Lightweight OpenRouter client wrapper to mimic the subset of
// the OpenAI SDK surface that this codebase uses.
// - chat.completions.create
// - responses.create (adapts to chat completions under the hood)
// - embeddings.create

function normalizeModel(modelArg) {
  // Accept either a slug string or an object like { apiName, reasoning?, effort? }
  if (!modelArg) return { slug: '', reasoning: null, provider: null };
  if (typeof modelArg === 'string') return { slug: modelArg, reasoning: null, provider: null };
  if (typeof modelArg === 'object') {
    const slug = modelArg.apiName || modelArg.model || '';
    const reasoning = modelArg.reasoning || (modelArg.effort ? { effort: modelArg.effort } : null);
    const provider = modelArg.provider || null;
    return { slug, reasoning: reasoning || null, provider };
  }
  return { slug: String(modelArg), reasoning: null, provider: null };
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
      ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'BusinessAgent',
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
    // Only forward whitelisted keys accepted by chat completions
    const allowedKeys = ['max_tokens','top_p','frequency_penalty','presence_penalty','stop','n','stream','user','tools','tool_choice','response_format','logit_bias'];
    const extra = {};
    for (const k of allowedKeys) if (k in rest) extra[k] = rest[k];
    const { slug, reasoning, provider } = normalizeModel(model);
    const payload = {
      model: slug,
      messages,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      // set reasoning only if provided by model object
      ...(reasoning ? { reasoning } : {}),
      ...(provider ? { provider } : {}),
      ...extra
    };
    return this.#post('/chat/completions', payload);
  }

  async #responsesCreate({ model, input, text: _textCfg, reasoning: _reasoning, tools, store: _store, include: _include, temperature, ...rest }) {
    // Adapt Responses-style input to chat.completions
    const combined = extractTextFromResponsesInput(input);
    const messages = [{ role: 'user', content: combined }];
    // Only forward whitelisted keys; drop Responses-only fields like reasoning/text/store/include
    const allowedKeys = ['max_tokens','top_p','frequency_penalty','presence_penalty','stop','n','stream','user','tools','tool_choice','response_format','logit_bias'];
    const extra = {};
    for (const k of allowedKeys) if (k in rest) extra[k] = rest[k];
    const { slug, reasoning, provider } = normalizeModel(model);
    const body = {
      model: slug,
      messages,
      ...(Array.isArray(tools) && tools.length ? { tools } : {}),
      // Set reasoning only if provided by model object
      ...(reasoning ? { reasoning } : {}),
      ...(provider ? { provider } : {}),
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...extra
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
