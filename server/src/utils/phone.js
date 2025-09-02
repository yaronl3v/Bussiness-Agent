import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function toE164(phone) {
  if (!phone) return null;
  try {
    const p = parsePhoneNumberFromString(phone);
    return p && p.isValid() ? p.number : null;
  } catch { return null; }
}

export default toE164;


