import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export class EmbeddingService {
  constructor() {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
    this.model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
  }

  async embedTexts(texts) {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    const res = await this.client.embeddings.create({ model: this.model, input: texts });
    return res.data.map(d => d.embedding);
  }

  async embedTextsBatched(texts, batchSize = 64, maxRetries = 3) {
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddingBatch = await this.#withRetry(async () => {
        const res = await this.client.embeddings.create({ model: this.model, input: batch });
        return res.data.map(d => d.embedding);
      }, maxRetries);
      results.push(...embeddingBatch);
    }
    return results;
  }

  async #withRetry(fn, maxRetries = 3) {
    let attempt = 0;
    let delay = 500;
    // exponential backoff with jitter
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt += 1;
        if (attempt > maxRetries) throw err;
        await new Promise(r => setTimeout(r, delay + Math.floor(Math.random() * 250)));
        delay *= 2;
      }
    }
  }
}

export default EmbeddingService;
