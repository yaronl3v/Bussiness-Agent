// Centralized LLM + prompt config
// Controls history length, retrieval, and default model settings

const llmconfig = {
  model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
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
  }
};

export default llmconfig;

