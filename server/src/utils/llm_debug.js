import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

function zeroPad(n, len = 2) {
  return String(n).padStart(len, '0');
}

function timestampYYMMDD_hh_mm(date = new Date()) {
  const yy = zeroPad(date.getFullYear() % 100);
  const MM = zeroPad(date.getMonth() + 1);
  const dd = zeroPad(date.getDate());
  const hh = zeroPad(date.getHours());
  const mm = zeroPad(date.getMinutes());
  // requested format: yymmdd_hh:mm (no seconds)
  return `${yy}${MM}${dd}_${hh}:${mm}`;
}

function sanitizeName(name = 'prompt') {
  return (name || 'prompt')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveDebugDir() {
  const envDir = process.env.LLM_DEBUG_DIR;
  if (envDir) return path.resolve(process.cwd(), envDir);

  const cwd = process.cwd();
  const direct = path.resolve(cwd, 'llmdebug');
  const parent = path.resolve(cwd, '..', 'llmdebug');

  // Prefer an existing llmdebug dir if found; fall back to direct
  if (fs.existsSync(direct)) return direct;
  if (fs.existsSync(parent)) return parent;
  return direct;
}

export async function logLlmInteraction({ promptName = 'prompt', promptText = '', rawResponse = null }) {
  const debugDir = resolveDebugDir();
  await fsp.mkdir(debugDir, { recursive: true });

  const safeName = sanitizeName(promptName);
  let stamp = timestampYYMMDD_hh_mm();
  // Windows does not allow ':' in filenames; fallback to '-'
  if (process.platform === 'win32') {
    stamp = stamp.replace(/:/g, '-');
  }
  const fileName = `${safeName}_${stamp}`;
  const filePath = path.join(debugDir, fileName);

  const separator = `${'='.repeat(80)}\n`;
  const headerLine = `${safeName}\n`;
  const promptBlock = `${promptText || ''}\n`;
  let responseBlock = '';
  try {
    responseBlock = rawResponse ? (typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse, null, 2)) : '';
  } catch {
    responseBlock = String(rawResponse ?? '');
  }

  const body = headerLine + promptBlock + separator + responseBlock + (responseBlock.endsWith('\n') ? '' : '\n');
  await fsp.writeFile(filePath, body, 'utf8');
}

export default logLlmInteraction;
