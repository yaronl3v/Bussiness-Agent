import sequelize from '../db/sequelize.js';
import RerankService from './rerank_service.js';

function reciprocalRankFusion(lists, topK = 10) {
  const scores = new Map();
  lists.forEach(list => {
    list.forEach((item, idx) => {
      const key = item.id;
      const score = 1 / (60 + idx + 1);
      scores.set(key, (scores.get(key) || 0) + score);
    });
  });
  const merged = Array.from(scores.entries()).map(([id, score]) => ({ id, score }));
  merged.sort((a, b) => b.score - a.score);
  const idSet = new Set(merged.slice(0, topK).map(m => m.id));
  // Return unique items preserving highest score, with payloads from the first list containing them
  const byId = new Map();
  lists.flat().forEach(item => { if (idSet.has(item.id) && !byId.has(item.id)) byId.set(item.id, item); });
  return Array.from(byId.values());
}

export class RetrieverService {
  static async searchVector({ agentId, queryEmbedding, topN = 200 }) {
    const [rows] = await sequelize.query(
      `SELECT id, document_id, content, position_jsonb,
              1 - (embedding <=> CAST($1 AS vector)) AS similarity
       FROM chunks
       WHERE agent_id = $2
       ORDER BY embedding <-> CAST($1 AS vector)
       LIMIT $3;`,
      { bind: [queryEmbedding, agentId, topN] }
    );
    return rows;
  }

  static async searchFTS({ agentId, query, topN = 200 }) {
    const [rows] = await sequelize.query(
      `SELECT id, document_id, content, position_jsonb,
              ts_rank_cd(content_tsv, plainto_tsquery('simple', $1)) AS similarity
       FROM chunks
       WHERE agent_id = $2 AND content_tsv @@ plainto_tsquery('simple', $1)
       ORDER BY similarity DESC
       LIMIT $3;`,
      { bind: [query, agentId, topN] }
    );
    return rows;
  }

  static async searchTrigram({ agentId, query, topN = 200 }) {
    const [rows] = await sequelize.query(
      `SELECT id, document_id, content, position_jsonb,
              similarity(content, $1) AS similarity
       FROM chunks
       WHERE agent_id = $2
       ORDER BY content <-> $1
       LIMIT $3;`,
      { bind: [query, agentId, topN] }
    );
    return rows;
  }

  static async searchHybrid({ agentId, question, topN = 200, topK = 10, useFTS = true, useTrigram = true, useRerank = true }) {
    const results = [];

    // Vector
    const vectorQueryEmbedding = question.embedding; // caller must embed
    const vec = await this.searchVector({ agentId, queryEmbedding: vectorQueryEmbedding, topN });
    results.push(vec);

    // FTS
    if (useFTS) {
      const fts = await this.searchFTS({ agentId, query: question.text, topN });
      results.push(fts);
    }

    // Trigram
    if (useTrigram) {
      const tri = await this.searchTrigram({ agentId, query: question.text, topN });
      results.push(tri);
    }

    const merged = reciprocalRankFusion(results, topK);

    if (!useRerank || merged.length === 0) {
      return merged;
    }

    const docs = merged.map(m => m.content);
    const reranked = await RerankService.rerank({ query: question.text, documents: docs, topK });
    if (!reranked || reranked.length === 0) {
      return merged;
    }

    const ordered = reranked
      .map(r => ({ item: merged[r.index], score: r.score }))
      .filter(Boolean)
      .map(r => r.item);

    return ordered.length > 0 ? ordered : merged;
  }
}

export default RetrieverService;
