#!/usr/bin/env node
/**
 * build-pages.mjs — emits the field-note pages from the content spec below.
 *
 * Run after editing content, or after dropping photographs into assets/img/:
 *     node tools/build-pages.mjs
 *
 * Photographs are picked up automatically. For any station the generator looks
 * for, in order:
 *     assets/img/poster-<slug>.jpg   a finished 4:3 stamp poster  → used whole
 *     assets/img/plate-<slug>.jpg    a plain photograph           → left panel
 * and falls back to a drawn "plate pending" frame when neither exists.
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { stamp, EMBLEMS } from './stamps.mjs';

/* ---------- content ---------- */

const CHRONOLOGY = [
  ['Manager, Data Platform &amp; Operations', 'UPSTACK',   'Jun 2025 – Present', 'roles/upstack-data-platform.html'],
  ['M&amp;A Integration Analyst',             'UPSTACK',   'Apr 2024 – May 2025', 'roles/upstack-ma-integration.html'],
  ['Sr. Project Manager',                     'Lightpath', 'Jun 2023 – 2024',     'roles/lightpath.html'],
  ['Technical Product Manager / Scrum PO',    'Zayo Group','Oct 2021 – Jun 2023', 'roles/zayo-product.html'],
  ['Business Analyst',                        'Zayo Group','Sep 2020 – Sep 2021', 'roles/zayo-analyst.html'],
  ['Data Analyst Intern',                     'Zayo Group','Jun 2020 – Aug 2020', 'origins.html'],
  ['Policy Intern, Designing for Defense',    'U.S. DoD',  'Dec 2018 – Jun 2019', 'origins.html'],
];

const PAGES = [
  {
    slug: 'origins', out: 'origins.html', depth: '',
    no: '01–03', district: 'Source',
    title: 'Origins', org: 'University of Colorado · Dept. of Defense · Zayo Group',
    dates: '2018 – 2020',
    loc: 'UNIVERSITY OF COLORADO', keys: 'POLICY · ANALYTICS · INTAKE', yr: '2018—2020',
    lede: 'Three intakes feed the pipeline: a degree that paired analytics with finance, a policy internship that taught interviewing under pressure, and the summer at Zayo where cleaning records stopped being a chore and started being the job.',
    sections: [
      { h: 'University of Colorado', p: '<p>B.S. Business Administration — Information Analytics and Finance, with a minor in Political Science. The analytics half taught me to model a business; the political science half taught me to interview one.</p>' },
      { h: 'Designing for Defense — U.S. Department of Defense', sub: 'Policy Intern · Dec 2018 – Jun 2019', obs: [
        'Applied Lean Startup methodology to a problem sponsored by U.S. Army Special Operations Command: the talent management of high-quality mid-career Special Forces officers.',
        'Conducted interviews and briefings with senior Army officers, including generals — the first time I had to make a case to people who would not be reading the appendix.',
        'Developed a policy proposal covering new programs, changed institutional protocols, and the cultural gaps between what an institution says it rewards and what it actually rewards.',
      ]},
      { h: 'Zayo Group — Data Analyst Intern', sub: 'Jun 2020 – Aug 2020', obs: [
        'Performed customer intelligence gathering for the top revenue-generating accounts.',
        'Created and implemented tools to assist with data cleanup across account, contact, building and location records — the first time I built something to stop a problem rather than re-type through it.',
        'Validated and loaded customer intelligence data into Salesforce and other databases.',
        'Built the inter-departmental relationships that get customer and sales issues resolved before they escalate.',
      ]},
    ],
    results: [['3', 'intake sources'], ['2020', 'first tooling built']],
    chips: ['Salesforce', 'Data cleanup', 'Lean startup', 'Customer intelligence', 'Analytics', 'Finance'],
    prev: null, next: ['roles/zayo-analyst.html', 'Business Analyst'],
  },
  {
    slug: 'zayo-analyst', out: 'roles/zayo-analyst.html', depth: '../',
    no: '04', district: 'Staging',
    title: 'Business Analyst', org: 'Zayo Group', dates: 'Sep 2020 – Sep 2021',
    loc: 'ZAYO GROUP — WAREHOUSE', keys: 'SQL · GIS · VALIDATION', yr: '2020—2021',
    lede: 'The staging layer of the career: making raw operational records trustworthy enough that anyone downstream could build on them without checking first.',
    sections: [
      { h: 'Observations', obs: [
        'Became the subject matter expert for complex data cleanup exercises — the person called when nobody could agree on what the records actually said.',
        'Managed SQL tables in the data warehouse that fed metric objects in Salesforce and the analytics dashboards, so the numbers executives read traced back to something maintained on purpose.',
        'Performed GIS analysis to drive mass building-infrastructure changes off fiber builds, turning field reality into record reality at scale.',
        'Analysed the drivers behind business results and summarised them into presentations for the people who had to act on them.',
        'Led a team of college software engineering students through a spatial network development project — first time managing people rather than tables.',
      ]},
    ],
    results: [['SME', 'complex data cleanup'], ['GIS', 'mass infrastructure updates']],
    chips: ['SQL', 'Salesforce', 'GIS', 'Warehouse tables', 'Dashboards', 'Team lead'],
    prev: ['../origins.html', 'Origins'], next: ['zayo-product.html', 'Technical PM / Scrum PO'],
  },
  {
    slug: 'zayo-product', out: 'roles/zayo-product.html', depth: '../',
    no: '05', district: 'Transform',
    title: 'Technical Product Manager / Scrum Product Owner', org: 'Zayo Group', dates: 'Oct 2021 – Jun 2023',
    loc: 'ZAYO GROUP — INVENTORY', keys: 'AUTOMATION · ARCHITECTURE · POLICY', yr: '2021—2023',
    lede: 'Where the work turned from fixing records to designing the system that stops them breaking. Eleven stacked slabs on the survey map are eleven markets.',
    sections: [
      { h: 'Observations', obs: [
        'Led Mid-Market Enterprise Building Automation, including the network architecture spanning inventory systems and the customer portal — enabling quote-to-cash across 11 markets and over 500,000 buildings.',
        'Led Building Management application strategy, front end and back end, for data automation and governance. The result was a single interface for all record creation, replacing four separate entry points into the inventory system and enforcing data policy at the point of entry rather than after the fact.',
        'Drove the software product lifecycle for product inventory development: requirements gathering, data analysis, collaboration with the scrum team, and rollout strategy.',
        'Designed and specified Salesforce object automation for fiber inventory — buildings, locations, services, fiber spans.',
        'Led the system redesign and requirements for the Salesforce One overhaul, aligning it to a new access strategy for buildings and locations.',
        'Team lead for the Data Validation team, responsible for cleanup and mass updates.',
      ]},
    ],
    results: [['500k+', 'buildings enabled'], ['11', 'markets to quote-to-cash'], ['4 → 1', 'record entry points']],
    chips: ['Salesforce', 'Scrum', 'Requirements', 'Data governance', 'Network architecture', 'SOQL'],
    prev: ['zayo-analyst.html', 'Business Analyst'], next: ['upstack-ma-integration.html', 'M&amp;A Integration Analyst'],
  },
  {
    slug: 'upstack-ma-integration', out: 'roles/upstack-ma-integration.html', depth: '../',
    no: '06', district: 'Transform',
    title: 'M&amp;A Integration Analyst', org: 'UPSTACK', dates: 'Apr 2024 – May 2025',
    loc: 'UPSTACK — INTEGRATION', keys: 'MIGRATION · MAPPING · MERGE', yr: '2024—2025',
    lede: 'Three acquisitions, three sets of assumptions about what a customer record means, one core system they all had to land in without losing the history that made each one worth buying.',
    sections: [
      { h: 'Observations', obs: [
        'Directed the migration and transformation of data from three M&amp;A acquisitions, integrating disparate source data into the core systems.',
        'Reconciled competing definitions across acquired systems — the unglamorous work that decides whether a merger produces one company or three companies sharing a logo.',
        'Built the mapping and transformation logic that later made the warehouse rebuild possible, because by then the source data meant one thing instead of three.',
      ]},
    ],
    results: [['3', 'acquisitions integrated'], ['1', 'core source of record']],
    chips: ['Data migration', 'Transformation', 'Source integration', 'SQL', 'Salesforce'],
    prev: ['zayo-product.html', 'Technical PM / Scrum PO'], next: ['lightpath.html', 'Sr. Project Manager'],
  },
  {
    slug: 'lightpath', out: 'roles/lightpath.html', depth: '../',
    no: '07', district: 'Mart',
    title: 'Sr. Project Manager', org: 'Lightpath', dates: 'Jun 2023 – 2024',
    loc: 'LIGHTPATH — REPORTING', keys: 'ROADMAP · DASHBOARDS · BACKLOG', yr: '2023—2024',
    lede: 'The mart layer: turning a warehouse into something a board can read, and a roadmap the business had actually agreed to.',
    sections: [
      { h: 'Observations', obs: [
        'Acted as Product Owner for the Data Warehouse and Reporting team, managing the backlog and roadmap while improving stakeholder communication and issue prioritisation.',
        'Coordinated multi-team hackathons across Finance, Sales and Service Delivery to overhaul their board-facing Tableau metric dashboards along with their day-to-day reporting.',
        'Strategised the 2024 IT Project Roadmap, mapping resource allocation in collaboration with business unit leaders and technical leads.',
      ]},
    ],
    results: [['3', 'business units overhauled'], ['2024', 'IT roadmap owned']],
    chips: ['Tableau', 'Roadmap', 'Backlog', 'Product ownership', 'Stakeholders'],
    prev: ['upstack-ma-integration.html', 'M&amp;A Integration Analyst'], next: ['upstack-data-platform.html', 'Manager, Data Platform &amp; Operations'],
  },
  {
    slug: 'upstack-data-platform', out: 'roles/upstack-data-platform.html', depth: '../',
    no: '08', district: 'Semantic layer', current: true,
    title: 'Manager, Data Platform &amp; Operations', org: 'UPSTACK', dates: 'Jun 2025 – Present',
    loc: 'UPSTACK — DATA PLATFORM', keys: 'GOVERNANCE · SEMANTIC · AUTONOMY', yr: '2025—',
    lede: 'The current station, and the tallest block on the map. Everything earlier was practice for this: one definition of every number, and a platform where asking a question no longer requires an analyst.',
    sections: [
      { h: 'Observations', obs: [
        'Co-led the end-to-end redesign and reconstruction of the enterprise data warehouse layers in dbt — designing staging, base and data mart models from the ground up to eliminate data gaps and cut reporting cost.',
        'Migrated all analytical workflows and AI data consumption from a Postgres OLTP system to Snowflake\'s OLAP platform, improving access performance and scalability.',
        'Established a semantic layer so a number means the same thing to a dashboard, an analyst and an agent — the precondition for trusting any of the three.',
        'Implemented a comprehensive data catalog across the new layers to centralise metadata, improve discoverability, and hold governance across the organisation.',
        'Deployed Hex as a self-serve platform for AI-powered report generation and conversational analytics, so business users explore data without queuing behind an analyst.',
        'Integrated autonomous AI agents to execute complex analytical tasks, reducing turnaround from weeks to under an hour.',
        'Directed the centralised reporting analyst team, standardising workflows and governance practice to maintain a single source of truth across enterprise analytics.',
      ]},
    ],
    results: [['weeks → &lt;1 hr', 'analysis turnaround'], ['OLTP → OLAP', 'Postgres to Snowflake'], ['4', 'modelled layers rebuilt']],
    chips: ['Snowflake', 'dbt', 'Hex', 'Semantic layer', 'Data catalog', 'AI agents', 'Python', 'SQL'],
    prev: ['lightpath.html', 'Sr. Project Manager'], next: ['../stack.html', 'The instrument bus'],
  },
];

/* the instruments page is built from its own shape */
const STACK_GROUPS = [
  ['warehouse', 'Warehouse', ['Snowflake', 'Postgres'],
   'Moved the analytical estate off an OLTP Postgres system onto Snowflake, because a database optimised for writing transactions is the wrong place to ask questions.'],
  ['modeling', 'Modeling', ['dbt', 'SQL / SOQL'],
   'dbt for staging, base, mart and semantic layers. SQL since the warehouse tables at Zayo; SOQL because inventory lived in Salesforce.'],
  ['sources', 'Source systems', ['Salesforce'],
   'Six years of it — object automation for fiber inventory, the Salesforce One overhaul, metric objects fed from warehouse tables, and three acquisitions merged into it.'],
  ['analysis', 'Analysis', ['Hex', 'Tableau'],
   'Hex as the self-serve and conversational surface. Tableau for the board-facing dashboards that get read in the room where decisions happen.'],
  ['languages', 'Languages', ['Python'],
   'For the transformation and validation work that does not belong in SQL.'],
  ['delivery', 'Delivery', ['Jira', 'Confluence', 'GitLab'],
   'Scrum product ownership: backlog, roadmap, requirements, and the written record that makes a decision survive the person who made it.'],
  ['ai', 'AI harness', ['Claude Code', 'Cortex Code', 'Codex'],
   'Autonomous agents executing analytical tasks end to end. They work because the layers underneath are governed — an agent asking for revenue gets the number a human would.'],
];

/* ---------- template ---------- */

const head = (d, title, desc) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Thomas Karas</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title} — Thomas Karas">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${d}assets/img/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23efe7d6'/%3E%3Cpath d='M16 7 27 13 16 19 5 13z' fill='none' stroke='%231c1814' stroke-width='1.6'/%3E%3Cpath d='M5 13v6l11 6 11-6v-6' fill='none' stroke='%231c1814' stroke-width='1.6'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Courier+Prime:wght@400;700&family=Spectral:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${d}assets/css/journal.css">
</head>
<body>
<a class="skip" href="#note">Skip to the field note</a>
<div class="note-page">`;

const colophon = d => `
  <footer class="colophon">
    <div class="col">
      <span class="label">Chronology</span>
      <ul class="source-list">
${CHRONOLOGY.map(([r, o, dt, href]) =>
  `        <li><a href="${d}${href}">${r}</a> — ${o}, ${dt}</li>`).join('\n')}
      </ul>
    </div>
    <div class="col">
      <span class="label">Contact</span>
      <ul class="source-list">
        <li><a href="mailto:thomaskaras518@gmail.com">thomaskaras518@gmail.com</a></li>
        <li><a href="https://www.linkedin.com/in/thomas-karas-b17445179/" rel="me noopener">linkedin.com/in/thomas-karas</a></li>
        <li><a href="${d}assets/ThomasKaras-Resume-2026.pdf">Resume (PDF) ↓</a></li>
      </ul>
    </div>
    <div class="col">
      <span class="label">The survey</span>
      <ul class="source-list">
        <li><a href="${d}index.html">← Return to the survey map</a></li>
        <li><a href="${d}stack.html">The instrument bus</a></li>
      </ul>
    </div>
  </footer>
</div>
</body>
</html>`;

/* photograph slot: a finished poster, a plain plate, or a drawn placeholder */
function plate(slug, alt) {
  if (existsSync(`assets/img/poster-${slug}.jpg`)) return { poster: `poster-${slug}.jpg` };
  if (existsSync(`assets/img/plate-${slug}.jpg`))  return { plate: `plate-${slug}.jpg`, alt };
  return {};
}

function posterBlock(p, d) {
  const found = plate(p.slug, p.title.replace(/&amp;/g, '&'));
  if (found.poster) {
    return `  <figure class="poster poster-whole">
    <img src="${d}assets/img/${found.poster}" alt="Field-note poster for ${p.title}">
  </figure>`;
  }
  const left = found.plate
    ? `<img src="${d}assets/img/${found.plate}" alt="${found.alt}">`
    : `<div class="plate-pending">
        <span class="box" aria-hidden="true"></span>
        <span class="label">Plate pending</span>
        <span class="label">assets/img/plate-${p.slug}.jpg</span>
      </div>`;
  return `  <div class="poster">
    <div class="poster-plate">${left}</div>
    <div class="poster-paper">
      <div class="poster-stamp">${stamp(p.slug, EMBLEMS[p.slug])}</div>
      <div class="poster-meta">
        <p class="loc">${p.loc}</p>
        <p class="no">No. ${p.no}</p>
        <p class="keys">${p.keys}</p>
        <p class="yr">${p.yr}</p>
      </div>
    </div>
  </div>`;
}

function notePage(p) {
  const d = p.depth;
  const body = p.sections.map(s => `
  <section class="note-section">
    <h3>${s.h}</h3>
    ${s.sub ? `<p class="org">${s.sub}</p>` : ''}
    ${s.p ?? ''}
    ${s.obs ? `<ol class="obs">\n${s.obs.map(o => `      <li>${o}</li>`).join('\n')}\n    </ol>` : ''}
  </section>`).join('');

  const nav = `
  <nav class="station-nav" aria-label="Stations">
    ${p.prev ? `<a href="${p.prev[0]}"><span class="dir label">← Previous station</span><span class="ttl">${p.prev[1]}</span></a>` : ''}
    ${p.next ? `<a class="next" href="${p.next[0]}"><span class="dir label">Next station →</span><span class="ttl">${p.next[1]}</span></a>` : ''}
  </nav>`;

  return head(d, p.title.replace(/&amp;/g, '&'), p.lede.replace(/"/g, '&quot;').slice(0, 180)) + `
  <div class="topbar">
    <a class="back" href="${d}index.html">← Survey map</a>
    <span class="label station-no">Station No. ${p.no} · ${p.district}${p.current ? ' · current' : ''}</span>
  </div>

  <header class="note-head" id="note">
    <h1>${p.title}</h1>
    <p class="org">${p.org} · ${p.dates}</p>
  </header>

${posterBlock(p, d)}

  <div class="note-body">
    <div class="note-main">
      <p class="lede">${p.lede}</p>
${body}
    </div>

    <aside class="note-rail">
      <section class="rail-block">
        <h3>Result</h3>
        <div class="results">
${p.results.map(([b, s]) => `          <div class="stamped"><b>${b}</b><span>${s}</span></div>`).join('\n')}
        </div>
      </section>
      <section class="rail-block">
        <h3>Instruments</h3>
        <ul class="chips">
${p.chips.map(c => `          <li class="chip">${c}</li>`).join('\n')}
        </ul>
      </section>
      <section class="rail-block">
        <h3>Station</h3>
        <p class="rail-meta">No. ${p.no}<br>${p.district}<br>${p.dates}</p>
      </section>
    </aside>
  </div>
${nav}` + colophon(d);
}

function stackPage() {
  const p = { slug: 'stack', title: 'The instrument bus', no: '09', loc: 'THE INSTRUMENT BUS',
              keys: 'WAREHOUSE · MODEL · SURFACE', yr: '2018—2026', depth: '' };
  return head('', 'The instrument bus', 'Every system Thomas Karas works in, and what each one is actually for.') + `
  <div class="topbar">
    <a class="back" href="index.html">← Survey map</a>
    <span class="label station-no">Instruments · 9 systems</span>
  </div>

  <header class="note-head" id="note">
    <h1>The instrument bus</h1>
    <p class="org">Every system on the map, and what each one is actually for</p>
  </header>

${posterBlock(p, '')}

  <div class="note-body"><div class="note-main">
  <section class="note-section">
    <p class="lede">A tool list says nothing on its own. What matters is which layer it sits in and
    what breaks without it — so this reads bottom-up, from where the data rests to where somebody
    finally asks it a question.</p>
  </section>
${STACK_GROUPS.map(([id, h, tools, note]) => `
  <section class="note-section" id="${id}">
    <h3>${h}</h3>
    <ul class="chips">
${tools.map(t => `      <li class="chip">${t}</li>`).join('\n')}
    </ul>
    <p class="prose" style="margin-top:12px">${note}</p>
  </section>`).join('')}

  </div><aside class="note-rail">
    <section class="rail-block">
      <h3>Read the map</h3>
      <p class="rail-meta">Every instrument here appears on the survey map as a tick on the
      instrument bus, running beneath the pipeline.</p>
      <a class="panel-cta" href="index.html">Survey map →</a>
    </section>
  </aside></div>

  <nav class="station-nav" aria-label="Stations">
    <a href="roles/upstack-data-platform.html"><span class="dir label">← Previous station</span><span class="ttl">Manager, Data Platform &amp; Operations</span></a>
    <a class="next" href="index.html"><span class="dir label">Back to the map →</span><span class="ttl">The survey</span></a>
  </nav>` + colophon('');
}

/* ---------- emit ---------- */

mkdirSync('roles', { recursive: true });
for (const p of PAGES) { writeFileSync(p.out, notePage(p)); console.log('wrote', p.out); }
writeFileSync('stack.html', stackPage());
console.log('wrote stack.html');
