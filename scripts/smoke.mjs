import { existsSync, readdirSync } from 'node:fs';

// Crawls every internal link reachable from "/" (breadth-first) on a running server
// and fails if any page does not return 200. Usage: node scripts/smoke.mjs [baseUrl]
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const seen = new Set(['/']);
const queue = ['/'];
const failures = [];
let pages = 0;

while (queue.length) {
  const path = queue.shift();
  const res = await fetch(base + path);
  pages += 1;
  if (res.status !== 200) {
    failures.push(`${res.status} ${path}`);
    continue;
  }
  const html = await res.text();
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const link = m[1].replace(/\/$/, '') || '/';
    if (link.startsWith('/_next') || link.endsWith('.ico') || link.endsWith('.svg')) continue;
    if (!seen.has(link)) {
      seen.add(link);
      queue.push(link);
    }
  }
}

// Pages only reachable through client-side state (search results, dynamic links) — check explicitly.
for (const extra of ['/search?q=permutation', '/review', '/patterns/decoder', '/mock/behavioral', '/sources']) {
  const res = await fetch(base + extra);
  pages += 1;
  if (res.status !== 200) failures.push(`${res.status} ${extra}`);
}
// Bootcamp activity pages are client-rendered from the home page, so check every prerendered one directly.
const studyDir = '.next/server/app/study';
const studyIds = existsSync(studyDir) ? readdirSync(studyDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : [];
if (!studyIds.length) failures.push('no prerendered /study pages found (run `npm run build` first)');
for (const id of studyIds) {
  const res = await fetch(`${base}/study/${id}`);
  pages += 1;
  if (res.status !== 200) failures.push(`${res.status} /study/${id}`);
}
const unknownActivity = await fetch(base + '/study/not-an-activity');
if (unknownActivity.status !== 404) failures.push(`expected 404 for unknown activity, got ${unknownActivity.status}`);
console.log(`Checked ${studyIds.length} bootcamp activity pages.`);
const missing = await fetch(base + '/learn/not-a-module');
if (missing.status !== 404) failures.push(`expected 404 for unknown module, got ${missing.status}`);

console.log(`Crawled ${pages} pages, ${seen.size} unique internal links.`);
if (failures.length) {
  console.error('Failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('All routes OK.');
