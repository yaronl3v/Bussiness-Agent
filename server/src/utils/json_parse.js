export function extractFirstJson(text = '') {
  if (!text || typeof text !== 'string') return null;
  // Fast path: try direct parse
  try {
    const obj = JSON.parse(text);
    return obj;
  } catch {}

  // Try to find a JSON object in the text (first top-level {...})
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // Try fenced code blocks ```json ... ```
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {}
  }
  return null;
}

export default extractFirstJson;

