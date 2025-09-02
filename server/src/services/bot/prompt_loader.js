import fs from 'fs/promises';
import path from 'path';

export async function loadPrompt(fileName, variables = {}, locale = 'en') {
  const baseDir = path.dirname(new URL(import.meta.url).pathname);
  const localePath = path.join(baseDir, 'prompts', locale, fileName);
  const defaultPath = path.join(baseDir, 'prompts', fileName);
  let raw = '';
  try {
    raw = await fs.readFile(localePath, 'utf8');
  } catch {
    raw = await fs.readFile(defaultPath, 'utf8');
  }
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    raw = raw.replace(pattern, String(value ?? ''));
  }
  return raw;
}

export default loadPrompt;


