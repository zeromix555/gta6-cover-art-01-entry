// Vice Coast Cover Studio — wires the page: layout/grade/size pickers, per-panel photos
// (upload or sample), drag-to-pan crop, zoom, caption editing and PNG export at the
// three post sizes. A `?shot=` query sets up a fixed scene for a screenshot instead.
import { drawCover, layoutRects, panelCount } from './cover.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const panelName = document.getElementById('panelName');

const state = {
  layout: 'hero3',
  grade: 'sunset',
  size: '1080x1080',
  title: titleInput.value,
  subtitle: subtitleInput.value,
  selected: 0,
  panels: [
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
  ],
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state);
}

function syncSize() {
  const [w, h] = state.size.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w} / ${h}`;
}

function selectPanel(i) {
  state.selected = i;
  panelName.textContent = String(i + 1);
  zoomInput.value = state.panels[i].zoom;
  zoomVal.textContent = `${Number(state.panels[i].zoom).toFixed(2)}×`;
  document.querySelectorAll('#panelPick button').forEach((b) => {
    b.classList.toggle('on', Number(b.dataset.panel) === i);
  });
  redraw();
}

async function setPanelPhoto(i, img) {
  state.panels[i].img = img;
  state.panels[i].ox = 0;
  state.panels[i].oy = 0;
  selectPanel(i);
}

// --- controls ---------------------------------------------------------------
document.getElementById('layouts').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (!b) return;
  state.layout = b.dataset.layout;
  document.querySelectorAll('#layouts button').forEach((x) => x.classList.toggle('on', x === b));
  if (state.selected >= panelCount(state.layout)) selectPanel(0);
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-grade]');
  if (!b) return;
  state.grade = b.dataset.grade;
  document.querySelectorAll('#grades button').forEach((x) => x.classList.toggle('on', x === b));
  redraw();
});
document.getElementById('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-size]');
  if (!b) return;
  state.size = b.dataset.size;
  document.querySelectorAll('#sizes button').forEach((x) => x.classList.toggle('on', x === b));
  syncSize();
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.getElementById('panelPick').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-panel]');
  if (b) selectPanel(Number(b.dataset.panel));
});
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setPanelPhoto(state.selected, await loadImage(URL.createObjectURL(file)));
  status.textContent = `Photo loaded into panel ${state.selected + 1}.`;
});
document.querySelector('.samples').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-sample]');
  if (!b) return;
  setPanelPhoto(state.selected, await loadImage(`samples/${b.dataset.sample}.jpg`));
  status.textContent = `Sample "${b.dataset.sample}" loaded into panel ${state.selected + 1}.`;
});
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  zoomVal.textContent = `${Number(zoomInput.value).toFixed(2)}×`;
  redraw();
});

// --- drag to pan the selected panel's photo ---------------------------------
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit >= 0) selectPanel(hit);
  drag = { x: p.x, y: p.y, ox: state.panels[state.selected].ox, oy: state.panels[state.selected].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  const rect = layoutRects(state.layout, canvas.width, canvas.height)[state.selected];
  if (!rect || !panel.img) return;
  const scale = Math.max(rect.w / panel.img.naturalWidth, rect.h / panel.img.naturalHeight) * panel.zoom;
  const overX = Math.max(0, (panel.img.naturalWidth * scale - rect.w) / 2);
  const overY = Math.max(0, (panel.img.naturalHeight * scale - rect.h) / 2);
  panel.ox = Math.max(-1, Math.min(1, drag.ox + (p.x - drag.x) / (overX || 1)));
  panel.oy = Math.max(-1, Math.min(1, drag.oy + (p.y - drag.y) / (overY || 1)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// --- export -----------------------------------------------------------------
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = state.size.split('x').map(Number);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  drawCover(out, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-coast-cover-${w}x${h}.png`;
  }, 'image/png');
});

// --- fixed scenes for screenshots -------------------------------------------
async function runShot(shot, query) {
  const params = new URLSearchParams(query);
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title') !== null) { state.title = params.get('title'); titleInput.value = state.title; }
  if (params.get('subtitle') !== null) { state.subtitle = params.get('subtitle'); subtitleInput.value = state.subtitle; }
  if (params.get('size')) { state.size = params.get('size'); syncSize(); }
  // Keep the picker buttons honest about the scene being shot.
  document.querySelectorAll('#layouts button').forEach((x) => x.classList.toggle('on', x.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((x) => x.classList.toggle('on', x.dataset.grade === state.grade));
  document.querySelectorAll('#sizes button').forEach((x) => x.classList.toggle('on', x.dataset.size === state.size));
  const photos = (params.get('photo') ?? 'pier,boulevard,pier,boulevard').split(',');
  for (let i = 0; i < panelCount(state.layout); i++) {
    state.panels[i].img = await loadImage(`samples/${photos[i % photos.length]}.jpg`);
  }
  if (params.get('zoom')) {
    const z = Number(params.get('zoom'));
    if (z >= 1 && z <= 3) state.panels.forEach((p) => { p.zoom = z; });
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, location.search);
} else {
  // First paint: sample photos in the first two panels so the app never opens empty.
  document.fonts.ready.then(async () => {
    try {
      state.panels[0].img = await loadImage('samples/pier.jpg');
      state.panels[1].img = await loadImage('samples/boulevard.jpg');
    } catch { /* samples are optional at first paint */ }
    redraw();
  });
  redraw();
}
