export function setDocumentDirection(lang?: 'he' | 'en') {
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}