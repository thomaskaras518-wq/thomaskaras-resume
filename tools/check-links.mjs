#!/usr/bin/env node
/* Asserts every internal href/src resolves to a real file. Catches the classic
   broken relative path that only shows up once GitHub Pages serves the site
   from a /repo-name/ subpath. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.git') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.html')) pages.push(p);
  }
})('.');

let bad = 0, checked = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(raw)) continue;
    const target = normalize(join(dirname(page), raw.split('#')[0]));
    checked++;
    if (!existsSync(target)) { console.error(`BROKEN  ${page}  ->  ${raw}`); bad++; }
  }
}
console.log(`${checked} internal links checked across ${pages.length} pages, ${bad} broken`);
process.exit(bad ? 1 : 0);
