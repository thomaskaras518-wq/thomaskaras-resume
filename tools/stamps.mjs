/**
 * stamps.mjs — hand-carved rubber stamps, drawn rather than generated.
 *
 * Each stamp is 2–4 desaturated spot inks. Every ink layer is printed
 * separately: offset 1–2px so the registration never quite lines up, warped by
 * a turbulence displacement so the edges fracture and the line weights wander,
 * and pitted by a second, finer noise that punches dry-ink gaps for the paper
 * to show through. Nothing here is a photo filter — it is the press failing in
 * the way a real press fails.
 */

export const STAMP_W = 240, STAMP_H = 150;

/* filters: one warp + one pit per ink layer, seeded so no two agree */
function inkFilter(uid, seed) {
  return `
    <filter id="${uid}" x="-15%" y="-15%" width="130%" height="130%"
            color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4"
                    seed="${seed}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.1"
                         xChannelSelector="R" yChannelSelector="G" result="carved"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="3"
                    seed="${seed + 17}" result="grain"/>
      <feColorMatrix in="grain" type="luminanceToAlpha" result="ga"/>
      <feComponentTransfer in="ga" result="pits">
        <feFuncA type="linear" slope="3.1" intercept="-1.72"/>
      </feComponentTransfer>
      <feComposite in="carved" in2="pits" operator="out"/>
    </filter>`;
}

export function stamp(slug, inks) {
  const defs = inks.map((ink, i) => inkFilter(`ink-${slug}-${i}`, ink.seed ?? i * 7 + 3)).join('');
  const layers = inks.map((ink, i) => `
    <g filter="url(#ink-${slug}-${i})" transform="translate(${ink.dx ?? 0} ${ink.dy ?? 0})"
       stroke="var(${ink.c})" fill="none" stroke-linecap="round" stroke-linejoin="round"
       opacity="${ink.o ?? 0.9}">
      ${ink.s.join('\n      ')}
    </g>`).join('');
  return `<svg class="stamp" viewBox="0 0 ${STAMP_W} ${STAMP_H}" role="img"
     aria-label="Carved stamp for this station" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>${layers}
</svg>`;
}

/* ---------- one emblem per station ----------
   Each keeps only what makes the place recognisable: no windows, no crowds,
   no decoration.                                                            */

export const EMBLEMS = {
  origins: [
    { c:'--ink-slate', dx:1.4, dy:-0.9, seed:5, s:[
      '<path d="M12,124 L60,40 L104,124" stroke-width="3.6"/>',
      '<path d="M82,124 L124,60 L162,124" stroke-width="2.7"/>',
      '<path d="M142,124 L174,82 L204,124" stroke-width="2.1"/>',
    ]},
    { c:'--ink-taupe', dx:-1.1, dy:0.8, seed:23, s:[
      '<line x1="8" y1="125" x2="230" y2="125" stroke-width="3.2"/>',
      '<rect x="24" y="104" width="17" height="21" stroke-width="1.9"/>',
      '<rect x="196" y="98" width="24" height="27" stroke-width="2.1"/>',
    ]},
    { c:'--ink-brick', dx:0.6, dy:1.3, seed:41, s:[
      '<circle cx="60" cy="40" r="7.5" stroke-width="2.6"/>',
      '<line x1="60" y1="16" x2="60" y2="30" stroke-width="2.2"/>',
    ]},
  ],

  'zayo-analyst': [            /* a fiber span: what the records described */
    { c:'--ink-green', dx:1.2, dy:-1.1, seed:9, s:[
      '<path d="M42,44 L42,122 M42,44 L20,122 M42,44 L64,122" stroke-width="2.6"/>',
      '<path d="M186,52 L186,122 M186,52 L166,122 M186,52 L206,122" stroke-width="2.6"/>',
      '<line x1="26" y1="86" x2="58" y2="86" stroke-width="2"/>',
      '<line x1="171" y1="90" x2="201" y2="90" stroke-width="2"/>',
    ]},
    { c:'--ink-ochre', dx:-1.5, dy:0.6, seed:31, s:[
      '<path d="M42,52 Q114,104 186,60" stroke-width="3"/>',
      '<path d="M42,64 Q114,116 186,72" stroke-width="2.2"/>',
    ]},
    { c:'--ink-brick', dx:0.9, dy:1.2, seed:53, s:[
      '<line x1="8" y1="126" x2="230" y2="126" stroke-width="2.8"/>',
      '<circle cx="114" cy="98" r="5" stroke-width="2.4"/>',
    ]},
  ],

  'zayo-product': [            /* building footprints — 500k of them, reduced to nine */
    { c:'--ink-brick', dx:1.5, dy:-0.8, seed:13, s:[
      '<rect x="24" y="34" width="34" height="28" stroke-width="2.4"/>',
      '<rect x="72" y="34" width="46" height="28" stroke-width="2.4"/>',
      '<rect x="132" y="34" width="30" height="28" stroke-width="2.4"/>',
      '<rect x="24" y="76" width="46" height="34" stroke-width="2.4"/>',
      '<rect x="84" y="76" width="30" height="34" stroke-width="2.4"/>',
      '<rect x="128" y="76" width="42" height="34" stroke-width="2.4"/>',
    ]},
    { c:'--ink-ochre', dx:-1.2, dy:1.1, seed:37, o:0.75, s:[
      '<rect x="84" y="76" width="30" height="34" fill="var(--ink-ochre)" stroke="none"/>',
    ]},
    { c:'--ink-slate', dx:0.7, dy:1.4, seed:61, s:[
      '<path d="M12,20 L196,20 L208,124 L12,124 Z" stroke-width="2.2"/>',
      '<line x1="12" y1="68" x2="202" y2="68" stroke-width="1.6" stroke-dasharray="7 6"/>',
    ]},
  ],

  'upstack-ma-integration': [  /* three record sets folding into one */
    { c:'--ink-ochre', dx:1.6, dy:-1.2, seed:19, s:[
      '<rect x="14" y="26" width="66" height="40" stroke-width="2.6"/>',
    ]},
    { c:'--ink-green', dx:-1.4, dy:0.7, seed:43, s:[
      '<rect x="14" y="58" width="66" height="40" stroke-width="2.6"/>',
    ]},
    { c:'--ink-taupe', dx:1.0, dy:1.5, seed:67, s:[
      '<rect x="14" y="90" width="66" height="40" stroke-width="2.6"/>',
    ]},
    { c:'--ink-brick', dx:-0.8, dy:1.1, seed:83, s:[
      '<path d="M84,46 L128,46 L146,78 L128,110 L84,110" stroke-width="2"/>',
      '<rect x="150" y="52" width="72" height="52" stroke-width="3.4"/>',
      '<line x1="164" y1="72" x2="208" y2="72" stroke-width="2"/>',
      '<line x1="164" y1="86" x2="196" y2="86" stroke-width="2"/>',
    ]},
  ],

  lightpath: [                 /* a board-facing dashboard, reduced to its bars */
    { c:'--ink-slate', dx:1.3, dy:-1.0, seed:11, s:[
      '<rect x="30" y="86" width="22" height="36" stroke-width="2.5"/>',
      '<rect x="62" y="62" width="22" height="60" stroke-width="2.5"/>',
      '<rect x="94" y="72" width="22" height="50" stroke-width="2.5"/>',
      '<rect x="126" y="40" width="22" height="82" stroke-width="2.5"/>',
      '<rect x="158" y="56" width="22" height="66" stroke-width="2.5"/>',
    ]},
    { c:'--ink-brick', dx:-1.5, dy:1.0, seed:29, s:[
      '<path d="M34,96 L72,74 L104,82 L136,48 L168,62" stroke-width="3"/>',
      '<circle cx="136" cy="48" r="5.5" stroke-width="2.4"/>',
    ]},
    { c:'--ink-taupe', dx:0.8, dy:1.4, seed:59, s:[
      '<line x1="18" y1="124" x2="222" y2="124" stroke-width="3"/>',
      '<line x1="18" y1="26" x2="18" y2="124" stroke-width="2.4"/>',
      '<line x1="18" y1="34" x2="222" y2="34" stroke-width="1.4" stroke-dasharray="6 7"/>',
    ]},
  ],

  'upstack-data-platform': [   /* four modelled layers under one seal */
    { c:'--ink-green', dx:1.5, dy:-1.1, seed:7, s:[
      '<rect x="22" y="36" width="120" height="18" stroke-width="2.6"/>',
      '<rect x="22" y="60" width="120" height="18" stroke-width="2.6"/>',
      '<rect x="22" y="84" width="120" height="18" stroke-width="2.6"/>',
      '<rect x="22" y="108" width="120" height="18" stroke-width="2.6"/>',
    ]},
    { c:'--ink-ochre', dx:-1.3, dy:0.9, seed:47, s:[
      '<path d="M186,30 L214,46 L214,78 L186,94 L158,78 L158,46 Z" stroke-width="3"/>',
      '<line x1="186" y1="94" x2="186" y2="124" stroke-width="2.2"/>',
      '<line x1="150" y1="124" x2="222" y2="124" stroke-width="2.6"/>',
    ]},
    { c:'--ink-brick', dx:0.9, dy:1.3, seed:71, s:[
      '<path d="M148,62 L156,62" stroke-width="2"/>',
      '<circle cx="186" cy="62" r="7" stroke-width="2.4"/>',
    ]},
  ],

  stack: [                     /* the instruments themselves */
    { c:'--ink', dx:1.4, dy:-0.9, seed:3, s:[
      '<path d="M52,34 L78,49 L78,79 L52,94 L26,79 L26,49 Z" stroke-width="3"/>',
      '<path d="M120,34 L146,94 L94,94 Z" stroke-width="3"/>',
      '<circle cx="188" cy="64" r="30" stroke-width="3"/>',
    ]},
    { c:'--ink-slate', dx:-1.2, dy:1.1, seed:27, s:[
      '<line x1="16" y1="118" x2="224" y2="118" stroke-width="2.6"/>',
      '<line x1="52" y1="112" x2="52" y2="124" stroke-width="2"/>',
      '<line x1="120" y1="112" x2="120" y2="124" stroke-width="2"/>',
      '<line x1="188" y1="112" x2="188" y2="124" stroke-width="2"/>',
    ]},
    { c:'--ink-ochre', dx:0.7, dy:1.4, seed:55, s:[
      '<line x1="176" y1="64" x2="200" y2="64" stroke-width="2.4"/>',
      '<line x1="188" y1="52" x2="188" y2="76" stroke-width="2.4"/>',
    ]},
  ],
};
