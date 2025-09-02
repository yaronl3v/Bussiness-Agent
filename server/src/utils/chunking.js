import { encoding_for_model } from '@dqbd/tiktoken';

const DEFAULT_MODEL = 'gpt-3.5-turbo';

export function tokenizeAndChunk(text, targetTokens = 500, overlapTokens = 50, model = DEFAULT_MODEL) {
  const enc = encoding_for_model(model);
  const tokens = enc.encode(text);
  const chunks = [];
  let start = 0;
  while (start < tokens.length) {
    const end = Math.min(tokens.length, start + targetTokens);
    const slice = tokens.slice(start, end);
    chunks.push(enc.decode(slice));
    if (end === tokens.length) break;
    start = end - overlapTokens;
    if (start < 0) start = 0;
  }
  enc.free();
  return chunks;
}
