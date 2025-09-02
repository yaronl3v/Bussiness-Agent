import { Document, Chunk } from '../models/index.js';
import sequelize from '../db/sequelize.js';
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
    const embeddings = await embedder.embedTextsBatched(chunksText, 64, 3);

    const t = await Chunk.sequelize.transaction();
    try {
      for (let i = 0; i < chunksText.length; i++) {
        await Chunk.create({
          document_id: doc.id,
          agent_id: doc.agent_id,
          content: chunksText[i],
          position_jsonb: { index: i },
          embedding: embeddings[i]
        }, { transaction: t });
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    await IngestionService.tuneVectorIndex();
    return { created: chunksText.length };
  }

  static async reindexAgent({ agentId, targetTokens = 500, overlapTokens = 50 }) {
    const docs = await Document.findAll({ where: { agent_id: agentId } });
    let total = 0;
    for (const d of docs) {
      const t = await Chunk.sequelize.transaction();
      try {
        await Chunk.destroy({ where: { document_id: d.id }, transaction: t });
        const chunksText = tokenizeAndChunk(d.raw_text, targetTokens, overlapTokens);
        const embedder = new EmbeddingService();
        const embeddings = await embedder.embedTextsBatched(chunksText, 64, 3);
        for (let i = 0; i < chunksText.length; i++) {
          await Chunk.create({
            document_id: d.id,
            agent_id: d.agent_id,
            content: chunksText[i],
            position_jsonb: { index: i },
            embedding: embeddings[i]
          }, { transaction: t });
        }
        await t.commit();
        total += chunksText.length;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    await IngestionService.tuneVectorIndex();
    return { created: total };
  }

  static async tuneVectorIndex() {
    // Heuristic for ivfflat lists: sqrt(N) capped
    const [[row]] = await sequelize.query("SELECT COUNT(*)::bigint AS cnt FROM chunks;");
    const count = Number(row?.cnt || 0);
    const lists = Math.max(10, Math.min(2000, Math.floor(Math.sqrt(count || 1))));
    // Recreate index with new lists and analyze
    await sequelize.query('DROP INDEX IF EXISTS chunks_embedding_ivfflat;');
    await sequelize.query(`CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = ${lists});`);
    await sequelize.query('ANALYZE chunks;');
    return { lists, count };
  }
}

export default IngestionService;
