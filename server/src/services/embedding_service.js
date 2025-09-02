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
}

export default EmbeddingService;
