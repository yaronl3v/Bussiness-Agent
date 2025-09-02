import { Document, Chunk } from '../models/index.js';
import EmbeddingService from './embedding_service.js';
import { tokenizeAndChunk } from '../utils/chunking.js';

export class IngestionService {
  static async ingestDocument({ documentId, targetTokens = 500, overlapTokens = 50 }) {
    const doc = await Document.findByPk(documentId);
    if (!doc) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }

    const chunksText = tokenizeAndChunk(doc.raw_text, targetTokens, overlapTokens);
    const embedder = new EmbeddingService();
    const embeddings = await embedder.embedTexts(chunksText);

    for (let i = 0; i < chunksText.length; i++) {
      await Chunk.create({
        document_id: doc.id,
        agent_id: doc.agent_id,
        content: chunksText[i],
        position_jsonb: { index: i },
        embedding: embeddings[i]
      });
    }

    return { created: chunksText.length };
  }

  static async reindexAgent({ agentId, targetTokens = 500, overlapTokens = 50 }) {
    const docs = await Document.findAll({ where: { agent_id: agentId } });
    let total = 0;
    for (const d of docs) {
      await Chunk.destroy({ where: { document_id: d.id } });
      const chunksText = tokenizeAndChunk(d.raw_text, targetTokens, overlapTokens);
      const embedder = new EmbeddingService();
      const embeddings = await embedder.embedTexts(chunksText);
      for (let i = 0; i < chunksText.length; i++) {
        await Chunk.create({
          document_id: d.id,
          agent_id: d.agent_id,
          content: chunksText[i],
          position_jsonb: { index: i },
          embedding: embeddings[i]
        });
      }
      total += chunksText.length;
    }
    return { created: total };
  }
}

export default IngestionService;
