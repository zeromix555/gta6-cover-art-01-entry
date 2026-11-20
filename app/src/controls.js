// Vice Coast Cover Studio — editor wiring.
// Builds the rail controls from the store catalogues, keeps the preview
// canvas in sync with the state, handles photo uploads, drag-to-pan and
// wheel zoom on the preview, PNG export, and the ?shot= scenes the
// screenshot runner uses. No network: every asset is a file under app/.

import { LAYOUTS, GRADES, SIZES, SAMPLES, SCENES, freshState } from "./store.js";
import { rectsFor, panelAt, clampSlot } from "./panels.js";
import { renderCover, exportPng } from "./painter.js";

const $ = (id) => document.getElementById(id);
const canvas = $("coverCanvas");
const state = freshState();
// Loaded Image objects, parallel to state.slots (null where empty).
let photos = [null, null, null, null];
// True while the page is a bare cover capture (?shot=cover etc).
let coverOnly = false;

function redraw() {
  renderCover(canvas, state, photos);
  syncRail();
}

function syncRail() {
  // Keep every rail button's pressed state in step with the state.
  document.querySelectorAll("#layoutChoices .btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.value === state.layout));
  });
  document.querySelectorAll("#gradeChoices .btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.value === state.grade));
  });
  document.querySelectorAll("#sizeChoices .btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.value === state.size));
  });
  const count = rectsFor(state.layout, 1080, 1080).length;
  $("panelNote").textContent = `Panel ${state.activePanel + 1} of ${count}`;
  const slot = state.slots[state.activePanel];
  $("zoomSlider").value = slot && slot.scale ? Math.round(slot.scale * 100) : 100;
  $("zoomOut").textContent = `${$("zoomSlider").value}%`;
  buildPanelStrip();
}

function buildPanelStrip() {
  const strip = $("panelStrip");
  const rects = rectsFor(state.layout, 1080, 1080);
  strip.innerHTML = "";
  rects.forEach((_, i) => {
    const slot = state.slots[i];
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "panel-chip";
    chip.setAttribute("aria-pressed", String(i === state.activePanel));
    const name = slot ? slot.name : "empty — pick a photo";
    chip.innerHTML = `<b>Panel ${i + 1}</b><span></span>`;
    chip.querySelector("span").textContent = name;
    chip.addEventListener("click", () => {
      state.activePanel = i;
      syncRail();
    });
    strip.appendChild(chip);
  });
}

function buildChoices() {
  const layoutBox = $("layoutChoices");
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.dataset.value = key;
    b.innerHTML = `<span></span><small></small>`;
    b.querySelector("span").textContent = def.label;
    b.querySelector("small").textContent = def.hint;
    b.addEventListener("click", () => {
      state.layout = key;
      if (state.activePanel >= def.panels) state.activePanel = 0;
      redraw();
    });
    layoutBox.appendChild(b);
  }

  const gradeBox = $("gradeChoices");
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.dataset.value = key;
    b.innerHTML = `<i class="swatch-dot"></i><span></span>`;
    b.querySelector(".swatch-dot").style.background = def.swatch;
    b.querySelector("span").textContent = def.label;
    b.addEventListener("click", () => {
      state.grade = key;
      redraw();
    });
    gradeBox.appendChild(b);
  }

  const sizeBox = $("sizeChoices");
  for (const [key, def] of Object.entries(SIZES)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.dataset.value = key;
    b.innerHTML = `<span></span><small></small>`;
    b.querySelector("span").textContent = def.label;
    b.querySelector("small").textContent = def.hint;
    b.addEventListener("click", () => {
      state.size = key;
      redraw();
    });
    sizeBox.appendChild(b);
  }
}

// Load an image from a URL (sample) or an object URL (upload) into a slot.
function loadIntoSlot(index, src, name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      photos[index] = img;
      state.slots[index] = clampSlot({
        img: null,
        name,
        scale: 1,
        ox: 0,
        oy: 0,
      });
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function loadSamples(names) {
  for (let i = 0; i < names.length; i++) {
    const key = names[i];
    if (SAMPLES[key]) await loadIntoSlot(i, SAMPLES[key], `${key}.jpg`);
  }
  redraw();
}

// --- photo editing on the preview canvas ---

// Convert a pointer event to cover coordinates (the canvas draws at
// export resolution, the element on screen is smaller).
function toCoverCoords(e) {
  const box = canvas.getBoundingClientRect();
  const size = SIZES[state.size] || SIZES.square;
  return {
    x: ((e.clientX - box.left) / box.width) * size.w,
    y: ((e.clientY - box.top) / box.height) * size.h,
    size,
  };
}

let drag = null;

canvas.addEventListener("pointerdown", (e) => {
  if (coverOnly) return;
  const p = toCoverCoords(e);
  const rects = rectsFor(state.layout, p.size.w, p.size.h);
  const hit = panelAt(rects, p.x, p.y);
  if (hit < 0) return;
  state.activePanel = hit;
  drag = { panel: hit, lastX: e.clientX, lastY: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  syncRail();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const box = canvas.getBoundingClientRect();
  const size = SIZES[state.size] || SIZES.square;
  const rects = rectsFor(state.layout, size.w, size.h);
  const rect = rects[drag.panel];
  const slot = state.slots[drag.panel];
  if (!slot || !rect) return;
  // Dragging moves the photo inside its panel: pointer travel in cover
  // pixels, divided by the panel size, is the pan fraction.
  slot.ox = (slot.ox || 0) - ((e.clientX - drag.lastX) / box.width) * (size.w / rect.w);
  slot.oy = (slot.oy || 0) - ((e.clientY - drag.lastY) / box.height) * (size.h / rect.h);
  state.slots[drag.panel] = clampSlot(slot);
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  redraw();
});

canvas.addEventListener("pointerup", () => {
  drag = null;
});

canvas.addEventListener("wheel", (e) => {
  if (coverOnly) return;
  e.preventDefault();
  const p = toCoverCoords(e);
  const rects = rectsFor(state.layout, p.size.w, p.size.h);
  const hit = panelAt(rects, p.x, p.y);
  const index = hit >= 0 ? hit : state.activePanel;
  const slot = state.slots[index];
  if (!slot) return;
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  slot.scale = (slot.scale || 1) * factor;
  state.slots[index] = clampSlot(slot);
  state.activePanel = index;
  redraw();
}, { passive: false });

// --- rail events ---

function wireRail() {
  $("titleInput").addEventListener("input", (e) => {
    state.title = e.target.value;
    redraw();
  });
  $("subtitleInput").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  $("zoomSlider").addEventListener("input", (e) => {
    const slot = state.slots[state.activePanel];
    if (!slot) return;
    slot.scale = Number(e.target.value) / 100;
    state.slots[state.activePanel] = clampSlot(slot);
    redraw();
  });
  $("uploadBtn").addEventListener("click", () => $("fileInput").click());
  $("fileInput").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    await loadIntoSlot(state.activePanel, url, file.name);
    redraw();
  });
  $("fillBtn").addEventListener("click", () => {
    const slot = state.slots[state.activePanel];
    if (!slot) return;
    slot.scale = 1;
    slot.ox = 0;
    slot.oy = 0;
    state.slots[state.activePanel] = clampSlot(slot);
    redraw();
  });
  $("centerBtn").addEventListener("click", () => {
    const slot = state.slots[state.activePanel];
    if (!slot) return;
    slot.ox = 0;
    slot.oy = 0;
    state.slots[state.activePanel] = clampSlot(slot);
    redraw();
  });
  document.querySelectorAll("[data-sample]").forEach((b) => {
    b.addEventListener("click", async () => {
      await loadIntoSlot(state.activePanel, SAMPLES[b.dataset.sample], `${b.dataset.sample}.jpg`);
      redraw();
    });
  });
  const doExport = async () => {
    const blob = await exportPng(state, photos);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const size = SIZES[state.size] || SIZES.square;
    a.href = url;
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  $("exportBtn").addEventListener("click", doExport);
  $("topExport").addEventListener("click", doExport);
}

// --- ?shot= scenes for screenshots ---

function applyQuery() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  const scene = shot && SCENES[shot] ? SCENES[shot] : null;
  if (scene) {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.size = scene.size;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    coverOnly = !!scene.coverOnly;
    if (coverOnly) document.body.classList.add("cover-only");
  }
  // Individual overrides, so a scene can be tweaked from the URL.
  if (q.get("layout") && LAYOUTS[q.get("layout")]) state.layout = q.get("layout");
  if (q.get("grade") && GRADES[q.get("grade")]) state.grade = q.get("grade");
  if (q.get("size") && SIZES[q.get("size")]) state.size = q.get("size");
  if (q.get("title")) state.title = q.get("title");
  if (q.get("subtitle")) state.subtitle = q.get("subtitle");
  // The rail's text fields hold the page's defaults; a scene replaces
  // them, so mirror the state into the fields once at boot.
  $("titleInput").value = state.title;
  $("subtitleInput").value = state.subtitle;
  if (q.get("photo") && SAMPLES[q.get("photo")]) {
    const names = rectsFor(state.layout, 1080, 1080).map(() => q.get("photo"));
    return loadSamples(names);
  }
  if (scene) return loadSamples(scene.photos);
  return Promise.resolve();
}

// Boot: build the rail, apply the scene (if any), load the default photos,
// then draw once the vendored fonts are ready so the lettering is real.
buildChoices();
wireRail();
applyQuery().then(async () => {
  if (!photos.some(Boolean)) await loadSamples(["boulevard", "pier", "boulevard", "pier"]);
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch (_) {
    // Fonts are local files; if loading fails the canvas still draws
    // with the fallback stack.
  }
  redraw();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => redraw());
  }
});
