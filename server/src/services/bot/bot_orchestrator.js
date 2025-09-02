import EmbeddingService from '../embedding_service.js';
import RetrieverService from '../retriever_service.js';
import IntakeService from '../intake_service.js';

export class BotOrchestrator {
  constructor({ userId, agentId }) {
    this.userId = userId;
    this.agentId = agentId;
  }

  async chat({ messageText, channel, context }) {
    const embedder = new EmbeddingService();
    const [queryEmbedding] = await embedder.embedTexts([messageText]);
    const passages = await RetrieverService.searchHybrid({ agentId: this.agentId, question: { text: messageText, embedding: queryEmbedding }, topN: 200, topK: 10, useFTS: true, useTrigram: true, useRerank: true });
    const citeTitles = passages.slice(0, 3).map((p, i) => `[#${i+1}]`);
    return { uiText: `Thanks for your message. I found ${passages.length} relevant passages ${citeTitles.join(' ')}.`, proposedUpdates: [], nextAction: 'answer' };
  }
}

export default BotOrchestrator;
