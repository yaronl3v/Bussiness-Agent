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

    // Ensure sections is always an array
    if (!updated.sections || !Array.isArray(updated.sections)) {
      updated.sections = [];
    }

    for (const section of updated.sections) {
      // Ensure section.questions is always an array
      if (!section.questions || !Array.isArray(section.questions)) {
        section.questions = [];
      }
      
      for (const q of section.questions) {
        // Apply updates when present
        if (updatesById.has(q.id)) {
          let value = updatesById.get(q.id);
          if (q.type === 'tel') value = normalizePhone(value) || value;
          if (q.type === 'date') value = normalizeDate(value) || value;
          q.answer = value;
        }
        // Normalize flags based on current answer
        const hasAnswer = q.answer !== undefined && q.answer !== null && String(q.answer).trim() !== '';
        q.collected = Boolean(hasAnswer);
        if (q.required) {
          q.isDone = Boolean(hasAnswer);
        }
      }
    }

    return updated;
  }
}

export default IntakeService;
