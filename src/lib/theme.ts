import { applyTheme } from '@/styles/themes'

export type ThemeName = 'theme-blush' | 'theme-navy' | 'theme-lavender' | '';

const THEME_KEY = 'wp_theme';

export function setTheme(theme: ThemeName) {
  try {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function getTheme(): ThemeName {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'theme-blush' || t === 'theme-navy' || t === 'theme-lavender') return t;
    return '';
  } catch {
    return '';
  }
}

export function initTheme() {
  const t = getTheme();
  if (t) setTheme(t);
}
