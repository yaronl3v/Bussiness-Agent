export function detectLanguageFromText(text) {
  if (!text) return { locale: 'en', languageName: 'English', textDirection: 'LTR' };
  // Basic heuristics for RTL languages
  const hasHebrew = /[\u0590-\u05FF]/.test(text);
  if (hasHebrew) return { locale: 'he', languageName: 'Hebrew', textDirection: 'RTL' };
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasArabic) return { locale: 'ar', languageName: 'Arabic', textDirection: 'RTL' };
  // Add more scripts as needed
  return { locale: 'en', languageName: 'English', textDirection: 'LTR' };
}

export default detectLanguageFromText;


