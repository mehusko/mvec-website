// One optional uploaded file (CV or photo), sent by assets/site.js as { name, type, data: base64 }.
import { clip } from './telegram.js';

export const MAX_FILE_BYTES = 3 * 1024 * 1024; // Vercel request bodies are capped at 4.5 MB
const ALLOWED = { 'application/pdf': 'pdf', 'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg', 'image/png': 'png' };

// Returns { file } (file may be null), or { error } with a message for the visitor.
export function readUpload(raw, fallbackName = 'cv') {
  if (!raw || !raw.data) return { file: null };
  const mime = clip(raw.type, 120);
  if (!ALLOWED[mime]) return { error: 'The file must be a PDF, Word document or photo.' };
  const buffer = Buffer.from(String(raw.data), 'base64');
  if (buffer.length > MAX_FILE_BYTES) return { error: 'The file is too large (max 3 MB).' };
  const name = clip(raw.name, 100).replace(/[^\w.\- ]+/g, '_') || `${fallbackName}.${ALLOWED[mime]}`;
  return { file: { buffer, mime, name } };
}
