import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parse } from 'node-html-parser';
import { resolveStaticFile } from './static-paths.mjs';

const SITE_ORIGIN = 'https://gleamit.app';
const root = resolve(process.argv[2] ?? 'dist');

if (!existsSync(root)) {
  console.error(`check-links: directory not found: ${root}`);
  process.exit(2);
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const idsByFile = new Map();
function idsOf(file) {
  if (!idsByFile.has(file)) {
    const doc = parse(readFileSync(file, 'utf8'));
    idsByFile.set(file, new Set(doc.querySelectorAll('[id]').map((el) => el.getAttribute('id'))));
  }
  return idsByFile.get(file);
}

function references(doc) {
  const refs = [];
  const attrs = [['a', 'href'], ['link', 'href'], ['img', 'src'], ['script', 'src'], ['source', 'src'], ['video', 'src'], ['audio', 'src'], ['iframe', 'src']];
  for (const [tag, attr] of attrs) {
    for (const el of doc.querySelectorAll(`${tag}[${attr}]`)) refs.push(el.getAttribute(attr));
  }
  for (const el of doc.querySelectorAll('[srcset]')) {
    for (const part of el.getAttribute('srcset').split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  return refs.filter(Boolean);
}

function normalise(ref, pageDirUrl) {
  if (ref.startsWith(SITE_ORIGIN)) ref = ref.slice(SITE_ORIGIN.length) || '/';
  if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(ref)) return null;
  const [pathAndQuery, fragment = null] = ref.split('#', 2);
  const path = pathAndQuery.split('?')[0];
  if (path === '') return { path: null, fragment };
  return { path: new URL(path, `http://x${pageDirUrl}`).pathname, fragment };
}

const failures = [];
for (const file of htmlFiles(root)) {
  const pageUrl = '/' + relative(root, file).split(sep).join('/');
  const pageDirUrl = pageUrl.slice(0, pageUrl.lastIndexOf('/') + 1);
  const doc = parse(readFileSync(file, 'utf8'));
  for (const ref of references(doc)) {
    const target = normalise(ref, pageDirUrl);
    if (!target) continue;
    const targetPath = target.path === null ? file : resolveStaticFile(root, decodeURIComponent(target.path));
    if (!targetPath) {
      failures.push(`${pageUrl}: ${ref} -> missing`);
      continue;
    }
    if (target.fragment && targetPath.endsWith('.html') && !idsOf(targetPath).has(target.fragment)) {
      failures.push(`${pageUrl}: ${ref} -> no element with id "${target.fragment}"`);
    }
  }
}

if (failures.length > 0) {
  console.error(`check-links: ${failures.length} broken internal link(s)\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`check-links: ok (${relative(process.cwd(), root) || '.'})`);
