/**
 * Pure theme helpers — no DOM access, so they are easy to unit test and can be
 * reused by the browser script.
 */

export const THEME_KEY = 'portfolio-theme';

/** Decide which theme to use from a stored preference and the OS setting. */
export function resolveTheme(stored, prefersDark) {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

/** The theme to switch to when the toggle is activated. */
export function nextTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}

/** Which nav link is "active" for a scroll position, given section offsets. */
export function activeSection(scrollY, sections) {
  let current = sections[0]?.id ?? null;
  for (const section of sections) {
    if (scrollY >= section.top - 96) current = section.id;
  }
  return current;
}
