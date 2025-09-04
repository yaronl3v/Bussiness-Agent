// Centralized LLM + prompt config
// Controls history length, retrieval, and default model settings

const llmconfig = {
  // Default chat model used for LLM calls (OpenRouter slugs supported)
  // Examples: 'openai/o5-mini', 'openai/gpt-4o', 'x-ai/grok-4'.
  // Backwards-compat: also accepts 'gpt-5-mini' and 'gpt-4o-mini'.
  model: process.env.LLM_MODEL || process.env.OPENROUTER_MODEL || process.env.OPENAI_CHAT_MODEL || 'openai/o5-mini',

  // Sampling temperature: higher = more creative, lower = more deterministic
  // Used for Chat Completions; may be ignored by Responses API depending on model
  temperature: Number(process.env.OPENAI_TEMPERATURE || 0.6),

  history: {
    // Number of previous user+assistant turns to include in the big prompt
    turns: Number(process.env.LLM_HISTORY_TURNS || 8)
  },

  retrieval: {
    // If true, use retrieval when the agent has uploaded documents
    enabledByDefault: process.env.LLM_RETRIEVAL_ENABLED === 'false' ? false : true,
    topN: Number(process.env.LLM_RETRIEVAL_TOPN || 200),
    topK: Number(process.env.LLM_RETRIEVAL_TOPK || 8),
    useFTS: process.env.LLM_RETRIEVAL_USE_FTS === 'false' ? false : true,
    useTrigram: process.env.LLM_RETRIEVAL_USE_TRIGRAM === 'false' ? false : true,
    useRerank: process.env.LLM_RETRIEVAL_USE_RERANK === 'false' ? false : true
  },

  prompt: {
    // Whether to include a tiny hint about back/skip in the prompt
    includeBackHint: process.env.LLM_INCLUDE_BACK_HINT === 'false' ? false : true
  },

  // Responses API configuration (OpenAI SDK: openai.responses.create)
  // Toggle to use the Responses API instead of Chat Completions.
  // If disabled, the server uses the legacy Chat Completions path.
  responses: {
    // Enable the Responses API (true) or keep using Chat Completions (false)
    enabled: process.env.OPENAI_USE_RESPONSES === 'false' ? false : true,

    // Some Responses models (e.g., gpt-5-mini) do not accept 'temperature'.
    // Set to true only for models that support it. Default false to avoid errors.
    sendTemperature: process.env.OPENAI_RESPONSES_SEND_TEMPERATURE === 'true',

    // Text output formatting preferences
    // format.type: output modality (e.g., 'text')
    // verbosity: controls level of detail ('low'|'medium'|'high')
    text: {
      format: { type: process.env.OPENAI_TEXT_FORMAT || 'text' },
      verbosity: process.env.OPENAI_TEXT_VERBOSITY || 'medium'
    },

    // Reasoning controls: effort and summarization guidance for models that support it
    // effort: how much internal reasoning effort to spend ('low'|'medium'|'high')
    // summary: whether to auto-summarize reasoning traces ('auto'|'always'|'never')
    reasoning: {
      effort: process.env.OPENAI_REASONING_EFFORT || 'medium',
      summary: process.env.OPENAI_REASONING_SUMMARY || 'auto'
    },

    // Tools array for function/tool calling (empty by default)
    tools: [],

    // Store responses on provider side for later inspection (privacy-sensitive)
    // Default false to avoid retaining PII unless explicitly enabled
    store: process.env.OPENAI_STORE_RESPONSES === 'true',

    // Include extra fields from the model output (advanced debugging/telemetry)
    // Example: ['reasoning.encrypted_content', 'web_search_call.action.sources']
    include: (process.env.OPENAI_RESPONSES_INCLUDE || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
};

export default llmconfig;
