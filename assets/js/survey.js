/* ============================================================
   survey.js — progressive enhancement for the field survey.
   The page is fully navigable without it: every station is a
   real <a>, and the panel already carries the overview.
   ============================================================ */

(() => {
  'use strict';

  const svg    = document.querySelector('svg.survey');
  const canvas = document.getElementById('canvas');
  const dataEl = document.getElementById('station-data');
  if (!svg || !canvas || !dataEl) return;

  let STATIONS;
  try { STATIONS = JSON.parse(dataEl.textContent); }
  catch { return; }                       // bad JSON: leave the static page alone

  const nodes = [...svg.querySelectorAll('.node')];
  const links = [...svg.querySelectorAll('.link')];

  /* ---------- panel ---------- */

  const panel = {
    kicker: document.getElementById('panel-kicker'),
    title:  document.getElementById('panel-title'),
    meta:   document.getElementById('panel-meta'),
    prose:  document.getElementById('panel-prose'),
    view:   document.getElementById('selected-view'),
  };
  const chipList = document.querySelector('.panel-section .chips');
  const overview = {
    kicker: panel.kicker.textContent,
    title:  panel.title.textContent,
    meta:   panel.meta.textContent,
    prose:  panel.prose.innerHTML,
    chips:  chipList ? chipList.innerHTML : '',
  };

  let tab = 'what';          // which panel tab is active
  let selected = null;       // station pinned by click or keyboard
  let hovered  = null;       // station under the pointer, previewed only

  // A button that appears in the panel once a station is selected.
  const openBtn = document.createElement('a');
  openBtn.className = 'panel-cta panel-open';
  openBtn.textContent = 'Open field note →';
  panel.prose.after(openBtn);

  function renderPanel() {
    const shown = selected || hovered;
    if (!shown) {
      panel.kicker.textContent = overview.kicker;
      panel.title.textContent  = overview.title;
      panel.meta.textContent   = overview.meta;
      panel.prose.innerHTML    = overview.prose;
      if (chipList) chipList.innerHTML = overview.chips;
      panel.view.textContent   = '—';
      openBtn.classList.remove('on');
      return;
    }
    const s = STATIONS[shown];
    if (!s) return;
    panel.kicker.textContent = s.kicker;
    panel.title.textContent  = s.title;
    panel.meta.textContent   = s.meta;
    panel.prose.innerHTML    = tab === 'built' ? s.built : s.what;
    panel.view.textContent   = s.title;
    if (chipList) chipList.innerHTML = s.chips.map(c => `<li class="chip">${c}</li>`).join('');
    openBtn.href = s.href;
    openBtn.classList.toggle('on', Boolean(selected));
  }

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(b =>
        b.setAttribute('aria-selected', String(b === btn)));
      renderPanel();
    });
  });

  /* ---------- selection + connected-path highlight ---------- */

  function select(id) {
    selected = id;
    svg.classList.toggle('is-focused', Boolean(id));
    nodes.forEach(n => n.classList.remove('is-selected', 'on'));
    links.forEach(l => l.classList.remove('on'));

    if (id) {
      const neighbours = new Set([id]);
      links.forEach(l => {
        const { from, to } = l.dataset;
        if (from === id || to === id) {
          l.classList.add('on');
          neighbours.add(from); neighbours.add(to);
        }
      });
      nodes.forEach(n => {
        if (neighbours.has(n.dataset.node)) n.classList.add('on');
        if (n.dataset.node === id) n.classList.add('is-selected');
      });
    }
    document.querySelectorAll('.index-item[data-target]').forEach(a =>
      a.setAttribute('aria-current', String(a.dataset.target === id)));
    renderPanel();
  }

  // First activation selects; a second on the same station goes inside.
  nodes.forEach(node => {
    const id = node.dataset.node;
    node.addEventListener('click', e => {
      if (selected !== id) { e.preventDefault(); select(id); node.focus(); }
    });
    node.addEventListener('focus', () => {
      if (node.matches(':focus-visible') && selected !== id) select(id);
    });
    // Chrome does not fire an SVG anchor's default action on Enter, so do it here.
    node.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (selected === id) window.location.href = node.getAttribute('href');
      else select(id);
    });
    node.addEventListener('mouseenter', () => { hovered = id; if (!selected) renderPanel(); });
    node.addEventListener('mouseleave', () => { hovered = null; if (!selected) renderPanel(); });
  });

  document.querySelectorAll('.index-item[data-target]').forEach(a => {
    a.addEventListener('mouseenter', () => { hovered = a.dataset.target; if (!selected) renderPanel(); });
    a.addEventListener('mouseleave', () => { hovered = null; if (!selected) renderPanel(); });
  });

  /* ---------- keyboard ---------- */

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hovered = null; select(null); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '')) return;
    e.preventDefault();
    const i = nodes.findIndex(n => n.dataset.node === selected);
    const next = e.key === 'ArrowRight'
      ? nodes[(i + 1 + nodes.length) % nodes.length]
      : nodes[(i - 1 + nodes.length) % nodes.length];
    next.focus();
    select(next.dataset.node);
  });

  /* ---------- pan + zoom (viewBox driven) ---------- */

  const base = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  let view = base.slice();

  const applyView = () => svg.setAttribute('viewBox', view.map(n => Math.round(n * 10) / 10).join(' '));

  function zoomAt(factor, clientX, clientY) {
    const r = svg.getBoundingClientRect();
    const px = (clientX - r.left) / r.width;
    const py = (clientY - r.top)  / r.height;
    const nw = Math.min(base[2] * 3, Math.max(base[2] * 0.32, view[2] * factor));
    const nh = nw * (base[3] / base[2]);
    view[0] += (view[2] - nw) * px;
    view[1] += (view[3] - nh) * py;
    view[2] = nw; view[3] = nh;
    applyView();
  }

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(e.deltaY > 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  }, { passive: false });

  let drag = null;
  svg.addEventListener('pointerdown', e => {
    if (e.target.closest('a')) return;           // let links behave like links
    drag = { x: e.clientX, y: e.clientY };
    svg.setPointerCapture(e.pointerId);
    canvas.classList.add('is-grabbing');
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const r = svg.getBoundingClientRect();
    view[0] -= (e.clientX - drag.x) * (view[2] / r.width);
    view[1] -= (e.clientY - drag.y) * (view[3] / r.height);
    drag = { x: e.clientX, y: e.clientY };
    applyView();
  });
  const endDrag = () => { drag = null; canvas.classList.remove('is-grabbing'); };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  document.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = svg.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (btn.dataset.zoom === 'in')  zoomAt(0.8, cx, cy);
      if (btn.dataset.zoom === 'out') zoomAt(1.25, cx, cy);
      if (btn.dataset.zoom === 'reset') { view = base.slice(); applyView(); select(null); }
    });
  });
})();
