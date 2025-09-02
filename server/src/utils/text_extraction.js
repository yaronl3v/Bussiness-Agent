import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { htmlToText } from 'html-to-text';
import { stripHtml } from 'string-strip-html';

export async function extractTextFromFile(filePath, mime) {
  const ext = path.extname(filePath).toLowerCase();
  if (mime === 'application/pdf' || ext === '.pdf') {
    const data = await fs.readFile(filePath);
    const res = await pdfParse(data);
    return res.text || '';
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    const data = await fs.readFile(filePath);
    const res = await mammoth.extractRawText({ buffer: data });
    return res.value || '';
  }
  if (mime === 'text/html' || ext === '.html' || ext === '.htm') {
    const data = await fs.readFile(filePath, 'utf8');
    const stripped = stripHtml(data).result;
    return htmlToText(stripped, { wordwrap: false });
  }
  // default: plain text
  return await fs.readFile(filePath, 'utf8');
}

export function normalizeText(input) {
  if (!input) return '';
  let text = input.replace(/\u00AD/g, '');
  text = text.replace(/([A-Za-z])-\n([A-Za-z])/g, '$1$2');
  text = text.replace(/\r\n|\r/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[\t\f\v]+/g, ' ');
  text = text.replace(/ {2,}/g, ' ');
  return text.trim();
}
