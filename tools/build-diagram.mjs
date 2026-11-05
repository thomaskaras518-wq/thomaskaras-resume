#!/usr/bin/env node
/**
 * build-diagram.mjs — one-off generator for the isometric career diagram.
 *
 * Emits the SVG (and a narrow-screen vertical fallback) and splices both into
 * index.html between marker comments. The OUTPUT is committed; this script is
 * never needed to serve the site. Re-run it only when the station data below
 * changes:   node tools/build-diagram.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

/* ---------- isometric projection ---------- */

const TW = 118;            // tile width
const TH = 66;             // tile height  (~2:1 isometric)
/* Stages advance along (+S,-S), which in isometric moves purely RIGHT on screen.
 * Nodes within a stage advance along (+N,+N), which moves purely DOWN. The plane
 * stays isometric, but the pipeline reads as clean columns instead of drifting
 * diagonally off the canvas. */
const STAGE_STEP = 1.72;
const NODE_STEP  = 2.50;

const proj = (gx, gy) => ({ x: (gx - gy) * TW / 2, y: (gx + gy) * TH / 2 });
const r2 = n => Math.round(n * 10) / 10;

/* ---------- station data ---------- */
/* h        : extrusion height — encodes scope
 * plates   : {n, t, gap} — a stack of n slabs, encoding a real count
 * size     : footprint multiplier                                    */

const STAGES = [
  {
    id: 'source', label: 'Source',
    note: 'raw intake',
    nodes: [
      { id:'cu',   label:'CU BOULDER',    sub:'B.S. BUS. ADMIN · 2020', href:'origins.html', h:26 },
      { id:'d4d',  label:'DESIGNING/DEF', sub:'DoD POLICY · 2018–19',   href:'origins.html', h:20 },
      { id:'intern', label:'ZAYO INTERN', sub:'DATA ANALYST · 2020',    href:'origins.html', h:23 },
    ],
  },
  {
    id: 'staging', label: 'Staging',
    note: 'clean · validate · conform',
    nodes: [
      { id:'ba', label:'BUSINESS ANALYST', sub:'ZAYO · 2020–21',
        href:'roles/zayo-analyst.html', h:48, size:1.05 },
    ],
  },
  {
    id: 'transform', label: 'Transform',
    note: 'model · automate · integrate',
    nodes: [
      { id:'tpm', label:'TECHNICAL PM / PO', sub:'ZAYO · 2021–23',
        href:'roles/zayo-product.html', size:1.15,
        plates:{ n:11, t:5, gap:3.5 }, plateNote:'11 MARKETS' },
      { id:'ma',  label:'M&A INTEGRATION', sub:'UPSTACK · 2024–25',
        href:'roles/upstack-ma-integration.html', size:1.05,
        plates:{ n:3, t:13, gap:5 }, plateNote:'3 ACQUISITIONS' },
    ],
  },
  {
    id: 'mart', label: 'Mart',
    note: 'governed delivery',
    nodes: [
      { id:'lp', label:'SR. PROJECT MGR', sub:'LIGHTPATH · 2023–24',
        href:'roles/lightpath.html', size:1.05,
        plates:{ n:3, t:14, gap:5 }, plateNote:'3 BUSINESS UNITS' },
    ],
  },
  {
    id: 'semantic', label: 'Semantic Layer',
    note: 'one definition of every number',
    nodes: [
      { id:'dp', label:'MGR, DATA PLATFORM', sub:'UPSTACK · 2025–PRESENT',
        href:'roles/upstack-data-platform.html', size:1.3, current:true,
        plates:{ n:4, t:15, gap:5 }, plateNote:'4 DBT LAYERS' },
    ],
  },
  {
    id: 'consumers', label: 'Consumers',
    note: 'what comes out',
    nodes: [
      { id:'agents', label:'AI AGENTS',      sub:'WEEKS → <1 HR', href:'stack.html', h:36 },
      { id:'hex',    label:'HEX SELF-SERVE', sub:'CONVERSATIONAL', href:'stack.html', h:31 },
      { id:'tab',    label:'TABLEAU / BOARD',sub:'EXEC REPORTING', href:'stack.html', h:31 },
      { id:'team',   label:'ANALYST TEAM',   sub:'CENTRALISED',    href:'roles/upstack-data-platform.html', h:26 },
      { id:'stake',  label:'STAKEHOLDERS',   sub:'SINGLE SOURCE',  href:'roles/upstack-data-platform.html', h:22 },
    ],
  },
];

const EDGES = [
  ['cu','ba','flow'], ['d4d','ba','flow'], ['intern','ba','flow'],
  ['ba','tpm','flow'], ['ba','ma','flow'],
  ['tpm','lp','flow'],
  ['ma','dp','flow'], ['lp','dp','flow'],
  ['dp','agents','flow'], ['dp','hex','flow'], ['dp','tab','flow'],
  ['dp','team','gov'],   ['dp','stake','gov'],
];

const TOOLS = [
  'SNOWFLAKE','DBT','SQL / SOQL','SALESFORCE','PYTHON',
  'TABLEAU','HEX','JIRA · CONFLUENCE · GITLAB','CLAUDE CODE · CORTEX · CODEX',
];

/* ---------- place nodes on the grid ---------- */

const NODES = new Map();
STAGES.forEach((stage, si) => {
  const n = stage.nodes.length;
  stage.nodes.forEach((node, ni) => {
    const c  = (ni - (n - 1) / 2) * NODE_STEP;
    const gx =  si * STAGE_STEP + c;
    const gy = -si * STAGE_STEP + c;
    const height = node.plates
      ? node.plates.n * node.plates.t + (node.plates.n - 1) * node.plates.gap
      : node.h;
    NODES.set(node.id, { ...node, gx, gy, height, stage: stage.id, ...proj(gx, gy) });
  });
  stage.colX = si * STAGE_STEP * TW;   // screen x of this stage's column
});

/* ---------- geometry helpers ---------- */

// One extruded box: left face, right face, top face (painter order).
function box(cx, cy, size, base, h) {
  const hw = (TW / 2) * size, hh = (TH / 2) * size;
  const yb = cy - base, yt = cy - base - h;          // ground / raised centre lines
  const p = (x, y) => `${r2(x)},${r2(y)}`;
  const left  = `${p(cx-hw, yt)} ${p(cx, yt+hh)} ${p(cx, yb+hh)} ${p(cx-hw, yb)}`;
  const right = `${p(cx, yt+hh)} ${p(cx+hw, yt)} ${p(cx+hw, yb)} ${p(cx, yb+hh)}`;
  const top   = `${p(cx, yt-hh)} ${p(cx+hw, yt)} ${p(cx, yt+hh)} ${p(cx-hw, yt)}`;
  return `<polygon class="box-face box-left" points="${left}"/>`
       + `<polygon class="box-face box-right" points="${right}"/>`
       + `<polygon class="box-face box-top" points="${top}"/>`;
}

function nodeShape(nd) {
  const size = nd.size || 1;
  if (!nd.plates) return box(nd.x, nd.y, size, 0, nd.height);
  const { n, t, gap } = nd.plates;
  let out = '';
  for (let i = 0; i < n; i++) out += box(nd.x, nd.y, size, i * (t + gap), t);
  return out;
}

// Elbow route in GRID space (along gx, then gy) — reads as a schematic trace.
function edgePath(a, b) {
  const pts = [proj(a.gx, a.gy), proj(b.gx, a.gy), proj(b.gx, b.gy)]
    .map(q => `${r2(q.x)},${r2(q.y)}`);
  return pts.join(' ');
}

/* ---------- assemble the SVG ---------- */

const all = [...NODES.values()];

/* Bounds are measured from what is actually drawn — box, floating tag and any
   plate note — so the canvas carries no dead margin to letterbox away. */
const TAG_H = 46, PLATE_H = 46;
for (const nd of all) {
  const size = nd.size || 1;
  nd.halfW = (TW / 2) * size;
  nd.halfH = (TH / 2) * size;
  nd.tagW  = Math.max(nd.label.length, nd.sub.length) * 5.7 + 16;
  nd.left   = nd.x - Math.max(nd.halfW, nd.tagW / 2);
  nd.right  = nd.x + Math.max(nd.halfW, nd.tagW / 2);
  nd.top    = nd.y - nd.height - nd.halfH - TAG_H;
  nd.bottom = nd.y + nd.halfH + (nd.plateNote ? PLATE_H : 10);
}

const DISTRICT_BAND = 52;
const contentTop = Math.min(...all.map(n => n.top)) - DISTRICT_BAND;
const minX = Math.min(...all.map(n => n.left))  - 40;
const maxX = Math.max(...all.map(n => n.right)) + 40;
const minY = contentTop - 16;
const maxY = Math.max(...all.map(n => n.bottom)) + 24;
const W = maxX - minX, H = maxY - minY;

/* faint isometric ground grid, sized to the node field */
let grid = '';
const pad = 1.7;
const GX0 = Math.min(...all.map(n => n.gx)) - pad, GX1 = Math.max(...all.map(n => n.gx)) + pad;
const GY0 = Math.min(...all.map(n => n.gy)) - pad, GY1 = Math.max(...all.map(n => n.gy)) + pad;
for (let gx = GX0; gx <= GX1 + .01; gx += 1) {
  const a = proj(gx, GY0), b = proj(gx, GY1);
  grid += `<line class="grid-line" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"/>`;
}
for (let gy = GY0; gy <= GY1 + .01; gy += 1) {
  const a = proj(GX0, gy), b = proj(GX1, gy);
  grid += `<line class="grid-line" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"/>`;
}

/* edges on the ground plane, under every box */
const edges = EDGES.map(([from, to, kind]) => {
  const a = NODES.get(from), b = NODES.get(to);
  return `<polyline class="link ${kind}" data-from="${from}" data-to="${to}" `
       + `points="${edgePath(a, b)}" marker-end="url(#arrow-${kind})"/>`;
}).join('');

/* district labels: a header band across the top, one per stage column */
const districts = STAGES.map(s => `
  <text class="district-label" x="${r2(s.colX)}" y="${r2(contentTop + 14)}" text-anchor="middle">${s.label.toUpperCase()}</text>
  <text class="callout" x="${r2(s.colX)}" y="${r2(contentTop + 29)}" text-anchor="middle" opacity=".7">${s.note}</text>
  <line class="grid-line" x1="${r2(s.colX)}" y1="${r2(contentTop + 38)}" x2="${r2(s.colX)}" y2="${r2(contentTop + 50)}"/>`
).join('');

/* boxes, back to front (painter's algorithm on gx+gy) */
const drawOrder = all.slice().sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

const nodesSvg = drawOrder.map(nd => {
  const apexY  = nd.y - nd.height - nd.halfH;      // top vertex of the box
  const labelY = apexY - 26;
  const plate = nd.plateNote
    ? `<text class="callout plate-note" x="${r2(nd.x)}" y="${r2(nd.y + nd.halfH + 24)}" `
      + `text-anchor="middle">${nd.plateNote}</text>` : '';
  return `<a class="node${nd.current ? ' current' : ''}" id="n-${nd.id}" href="${nd.href}" `
       + `tabindex="0" role="link" data-node="${nd.id}" data-stage="${nd.stage}" `
       + `aria-label="${nd.label} — ${nd.sub}">`
       + `<g class="shape" filter="url(#carve)">${nodeShape(nd)}</g>`
       + `<g class="tag">`
       +   `<line class="callout-leader" x1="${r2(nd.x)}" y1="${r2(labelY + 6)}" `
       +     `x2="${r2(nd.x)}" y2="${r2(apexY - 3)}"/>`
       +   `<rect x="${r2(nd.x - nd.tagW/2)}" y="${r2(labelY - 20)}" width="${r2(nd.tagW)}" height="26" `
       +     `fill="var(--paper)" stroke="var(--rule)" stroke-width="1"/>`
       +   `<text class="node-label" x="${r2(nd.x)}" y="${r2(labelY - 9)}" text-anchor="middle">${nd.label}</text>`
       +   `<text class="node-sub"   x="${r2(nd.x)}" y="${r2(labelY + 1)}" text-anchor="middle">${nd.sub}</text>`
       + `</g>${plate}</a>`;
}).join('');

const defs = `
  <defs>
    <filter id="carve" x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    ${['flow','support','gov'].map(k => `
    <marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,1 L9,5 L0,9 z" fill="var(--ink-${k === 'flow' ? 'slate' : k === 'gov' ? 'green' : 'taupe'})"/>
    </marker>`).join('')}
  </defs>`;

const svg = `<svg class="survey" viewBox="${r2(minX)} ${r2(minY)} ${r2(W)} ${r2(H)}"
     role="img" aria-labelledby="survey-title survey-desc"
     xmlns="http://www.w3.org/2000/svg">
  <title id="survey-title">Career survey: an isometric data pipeline</title>
  <desc id="survey-desc">Six stages — source, staging, transform, mart, semantic layer and
  consumers — drawn as extruded blocks on an isometric grid. Each block links to a field note
  about that station.</desc>${defs}
  <g class="plane">${grid}</g>
  <g class="districts">${districts}</g>
  <g class="edges">${edges}</g>
  <g class="nodes">${nodesSvg}</g>
</svg>`;

/* ---------- instrument bus, as an HTML strip under the canvas ---------- */

const busHtml = `<div class="bus" aria-label="Instrument bus">
  <span class="label">Instrument bus</span>
  <ul class="bus-rail">
${TOOLS.map(t => `    <li><a href="stack.html">${t}</a></li>`).join('\n')}
  </ul>
</div>`;

/* ---------- narrow-screen fallback: a vertical pipeline index ---------- */

const mobile = `<nav class="pipe" aria-label="Career pipeline">
${STAGES.map(s => `  <section class="pipe-stage">
    <p class="label">${s.label.toUpperCase()} — ${s.note}</p>
${s.nodes.map(n => `    <a class="pipe-node" href="${n.href}">
      <span class="pipe-label">${n.label}</span>
      <span class="pipe-sub">${n.sub}</span>
    </a>`).join('\n')}
  </section>`).join('\n')}
</nav>`;

/* ---------- splice into index.html ---------- */

const between = (src, tag, body) => {
  const a = `<!-- ${tag}:BEGIN -->`, b = `<!-- ${tag}:END -->`;
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`markers for ${tag} not found in index.html`);
  return src.slice(0, i + a.length) + '\n' + body + '\n' + src.slice(j);
};

let html = readFileSync('index.html', 'utf8');
html = between(html, 'DIAGRAM', svg);
html = between(html, 'BUS', busHtml);
html = between(html, 'MOBILE', mobile);
writeFileSync('index.html', html);

console.log(`diagram: ${NODES.size} nodes, ${EDGES.length} edges, viewBox ${r2(W)}x${r2(H)}`);
