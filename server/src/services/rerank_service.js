const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

export class RerankService {
  static async rerank({ query, documents, topK = 10, model = 'rerank-2' }) {
    if (!VOYAGE_API_KEY) {
      return documents.slice(0, topK).map((doc, index) => ({ index, score: 0 }));
    }

    const response = await fetch('https://api.voyageai.com/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`
      },
      body: JSON.stringify({ model, query, documents, top_k: topK })
    });

    if (!response.ok) {
      return documents.slice(0, topK).map((doc, index) => ({ index, score: 0 }));
    }

    const json = await response.json();
    // Expect json.data = [{ index, score }]
    return Array.isArray(json.data) ? json.data : [];
  }
}

export default RerankService;
