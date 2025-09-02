import { parsePhoneNumberFromString } from 'libphonenumber-js';

function normalizePhone(phone) {
  if (!phone) return null;
  try {
    const p = parsePhoneNumberFromString(phone);
    return p && p.isValid() ? p.number : null;
  } catch { return null; }
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export class IntakeService {
  static merge(schema, proposedUpdates) {
    const updated = JSON.parse(JSON.stringify(schema || { sections: [] }));
    const updatesById = new Map((proposedUpdates || []).map(u => [u.questionId, u.value]));

    for (const section of updated.sections) {
      for (const q of section.questions) {
        if (!updatesById.has(q.id)) continue;
        let value = updatesById.get(q.id);
        if (q.type === 'tel') value = normalizePhone(value) || value;
        if (q.type === 'date') value = normalizeDate(value) || value;
        q.answer = value;
        if (q.required) q.isDone = Boolean(value);
      }
    }

    return updated;
  }
}

export default IntakeService;
