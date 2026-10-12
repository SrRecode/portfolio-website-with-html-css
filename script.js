import { THEME_KEY, activeSection, nextTheme, resolveTheme } from './theme.js';

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

function readStored() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function store(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore private-mode failures */
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function initTheme() {
  const theme = resolveTheme(readStored(), prefersDark);
  applyTheme(theme);

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const updated = nextTheme(document.documentElement.dataset.theme);
    applyTheme(updated);
    store(updated);
  });
}

function initNav() {
  const nav = document.querySelector('[data-nav]');
  document.querySelector('[data-nav-toggle]')?.addEventListener('click', () => {
    const open = nav?.toggleAttribute('data-open') ?? false;
    document.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', String(open));
  });

  const links = [...document.querySelectorAll('[data-nav] a[href^="#"]')];
  links.forEach((link) =>
    link.addEventListener('click', () => {
      nav?.removeAttribute('data-open');
      document.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', 'false');
    }),
  );

  const sections = links
    .map((link) => {
      const id = link.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      return el ? { id, el } : null;
    })
    .filter(Boolean);

  if (sections.length === 0 || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) =>
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`),
        );
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach(({ el }) => observer.observe(el));
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

function initScrollProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

export function init() {
  initTheme();
  initNav();
  initYear();
  initScrollProgress();
}

// Only auto-run in a real browser (this file is a module the tests don't import).
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export { activeSection };
