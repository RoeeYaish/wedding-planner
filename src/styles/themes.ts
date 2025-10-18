export const THEME_CLASSES = ["theme-blush", "theme-navy", "theme-lavender"] as const;
export type ThemeClass = typeof THEME_CLASSES[number];

export function applyTheme(theme: ThemeClass | '') {
  try {
    const html = document.documentElement;
    const body = document.body;
    THEME_CLASSES.forEach((t) => {
      html.classList.remove(t);
      body.classList.remove(t);
    });
    if (theme) {
      html.classList.add(theme);
      body.classList.add(theme);
    }
  } catch {
    // ignore in non-browser
  }
}
