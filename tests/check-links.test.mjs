import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'check-links.mjs');

function site(files) {
  const dir = mkdtempSync(join(tmpdir(), 'links-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

function run(dir) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [script, dir], { encoding: 'utf8' }) };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
}

const validSite = {
  'index.html': `<html><head><link rel="canonical" href="https://gleamit.app/"><link rel="stylesheet" href="/_astro/a.css"></head>
    <body><h1 id="top">Hi</h1><img src="/icon.svg"><a href="/support/">Support</a><a href="#top">Top</a>
    <a href="/support/#delete">Delete</a><a href="https://example.com/x">Out</a><a href="mailto:a@b.c">Mail</a>
    <a href="support/">Relative</a><a href="/about">Flat page</a></body></html>`,
  'about.html': '<html><body><h1>About</h1></body></html>',
  'support/index.html': `<html><body><h1>Support</h1><h2 id="delete">Delete</h2><a href="../">Home</a><a href="/?ref=footer#top">Home</a></body></html>`,
  '_astro/a.css': 'body{}',
  'icon.svg': '<svg/>',
};

test('a site whose internal links all resolve passes', () => {
  const result = run(site(validSite));
  assert.equal(result.code, 0, result.out);
});

test('a link to a missing page fails', () => {
  const result = run(site({ ...validSite, 'index.html': validSite['index.html'] + '<a href="/privacy/">Privacy</a>' }));
  assert.equal(result.code, 1);
  assert.match(result.out, /\/privacy\//);
});

test('a link to a missing anchor fails', () => {
  const result = run(site({ ...validSite, 'index.html': validSite['index.html'] + '<a href="/support/#nope">Nope</a>' }));
  assert.equal(result.code, 1);
  assert.match(result.out, /#nope/);
});

test('a missing asset fails', () => {
  const result = run(site({ ...validSite, 'index.html': validSite['index.html'] + '<img src="/missing.png">' }));
  assert.equal(result.code, 1);
  assert.match(result.out, /missing\.png/);
});

test('a link escaping the site root fails', () => {
  const result = run(site({ ...validSite, 'index.html': validSite['index.html'] + '<a href="../../outside.html">Out</a>' }));
  assert.equal(result.code, 1);
  assert.match(result.out, /outside\.html/);
});

test('a canonical URL on the site origin that has no page fails', () => {
  const result = run(site({ ...validSite, 'support/index.html': '<link rel="canonical" href="https://gleamit.app/help/">' }));
  assert.equal(result.code, 1);
  assert.match(result.out, /\/help\//);
});
