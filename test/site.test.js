import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveTheme, nextTheme, activeSection, THEME_KEY } from '../theme.js';
import { contentType, safeJoin, createStaticServer } from '../scripts/serve.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (name) => readFile(join(root, name), 'utf8');

describe('theme helpers', () => {
  test('resolveTheme honors an explicit stored preference', () => {
    assert.equal(resolveTheme('dark', false), 'dark');
    assert.equal(resolveTheme('light', true), 'light');
  });

  test('resolveTheme falls back to the OS preference', () => {
    assert.equal(resolveTheme(null, true), 'dark');
    assert.equal(resolveTheme(null, false), 'light');
    assert.equal(resolveTheme('nonsense', true), 'dark');
  });

  test('nextTheme flips between the two themes', () => {
    assert.equal(nextTheme('light'), 'dark');
    assert.equal(nextTheme('dark'), 'light');
  });

  test('activeSection tracks the last section scrolled past', () => {
    const sections = [
      { id: 'about', top: 100 },
      { id: 'projects', top: 500 },
      { id: 'contact', top: 900 },
    ];
    assert.equal(activeSection(0, sections), 'about');
    assert.equal(activeSection(520, sections), 'projects');
    assert.equal(activeSection(5000, sections), 'contact');
  });

  test('exposes a stable storage key', () => {
    assert.equal(THEME_KEY, 'portfolio-theme');
  });
});

describe('static server helpers', () => {
  test('contentType maps common extensions', () => {
    assert.match(contentType('index.html'), /text\/html/);
    assert.match(contentType('styles.css'), /text\/css/);
    assert.match(contentType('script.js'), /javascript/);
    assert.equal(contentType('archive.bin'), 'application/octet-stream');
  });

  test('safeJoin resolves within root and serves index for the bare path', () => {
    const base = join(root, 'public');
    assert.equal(safeJoin(base, '/styles.css'), join(base, 'styles.css'));
    assert.equal(safeJoin(base, '/'), join(base, 'index.html'));
  });

  test('safeJoin blocks path traversal', () => {
    const base = join(root, 'public');
    assert.equal(safeJoin(base, '/../../secret.env'), null);
    assert.equal(safeJoin(base, '/..%2f..%2fsecret'), null);
  });

  test('createStaticServer serves a file and 404s a missing one', async () => {
    const server = createStaticServer(root);
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}`;

    const ok = await fetch(`${base}/styles.css`);
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get('content-type'), /text\/css/);

    const missing = await fetch(`${base}/nope.css`);
    assert.equal(missing.status, 404);

    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);

    await new Promise((r) => server.close(r));
  });
});

describe('portfolio markup & assets', () => {
  test('index.html has required landmarks and wiring', async () => {
    const html = await read('index.html');
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<html lang="en"/i);
    assert.match(html, /name="viewport"/i);
    assert.match(html, /<main id="main">/);
    assert.match(html, /href="styles.css"/);
    assert.match(html, /type="module" src="script\.js"/);
    for (const id of ['hero', 'about', 'projects', 'contact']) {
      assert.match(html, new RegExp(`id="${id}"`), `has #${id} section`);
    }
    assert.match(html, /data-theme-toggle/);
    assert.match(html, /data-nav/);
  });

  test('every local asset referenced by the page exists', async () => {
    const html = await read('index.html');
    const refs = [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)]
      .map((m) => m[1])
      .filter((url) => !url.startsWith('mailto:') && !url.startsWith('data:'));
    assert.ok(refs.length >= 2);
    for (const ref of refs) {
      await assert.doesNotReject(read(ref), `${ref} should exist`);
    }
  });

  test('css defines light/dark tokens and reduced-motion support', async () => {
    const css = await read('styles.css');
    assert.match(css, /:root\s*\{/);
    assert.match(css, /\[data-theme='dark'\]/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /focus-visible/);
  });
});
