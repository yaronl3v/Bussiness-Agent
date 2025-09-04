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
  static merge(schema, proposedUpdates, options = {}) {
    const updated = JSON.parse(JSON.stringify(schema || { sections: [] }));
    const updatesById = new Map((proposedUpdates || []).map(u => [u.questionId, u.value]));

    // Ensure sections is always an array
    if (!updated.sections || !Array.isArray(updated.sections)) {
      updated.sections = [];
    }

    // Build quick index of existing questions by id
    const existingIds = new Set();
    for (const section of updated.sections) {
      // Ensure section.questions is always an array
      if (!section.questions || !Array.isArray(section.questions)) {
        section.questions = [];
      }
      for (const q of section.questions) {
        if (q && q.id) existingIds.add(q.id);
      }
    }

    // Optionally create missing questions for unknown updates (used for dynamic schema)
    if (options.createMissing === true) {
      const missing = [];
      for (const [qid, value] of updatesById.entries()) {
        if (!existingIds.has(qid)) missing.push({ id: qid, value });
      }
      if (missing.length > 0) {
        // Find or create an 'extras' section
        let extras = (updated.sections || []).find(s => s && (s.id === 'extras' || s.title === 'Additional Details'));
        if (!extras) {
          extras = { id: 'extras', title: 'Additional Details', questions: [] };
          updated.sections = Array.isArray(updated.sections) ? updated.sections : [];
          updated.sections.push(extras);
        }
        for (const m of missing) {
          const label = toTitleCase(m.id.replace(/_/g, ' '));
          extras.questions.push({ id: m.id, label, type: 'text', required: false, answer: m.value });
          existingIds.add(m.id);
        }
      }
    }

    for (const section of updated.sections) {
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

function toTitleCase(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/(^|\s|[-_/])([a-z])/g, (_, __, c) => c.toUpperCase())
    .replace(/[-_/]/g, ' ')
    .trim();
}

export default IntakeService;
