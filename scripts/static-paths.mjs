import { existsSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export function resolveStaticFile(root, urlPath) {
  const candidate = resolve(root, `.${urlPath}`);
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, 'index.html');
    return existsSync(index) ? index : null;
  }
  if (existsSync(candidate)) return candidate;
  if (existsSync(`${candidate}.html`)) return `${candidate}.html`;
  return null;
}
