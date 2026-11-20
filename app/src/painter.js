// Vice Coast Cover Studio — canvas painter.
// renderCover draws the whole poster onto a canvas at export resolution:
// sky gradient, photos in their panels, grade wash, caption band,
// headline + tagline lettering, corner bug, and the poster frame.
// The editor's preview and the PNG export both call this one function,
// so what you see is exactly what you download.

import { GRADES, SIZES } from "./store.js";
import { rectsFor, captionBand, cropFor } from "./panels.js";

// Fit text to a width by shrinking the font until it fits.
function fitFont(ctx, text, px, family, maxWidth, weight = "") {
  let size = px;
  while (size > 24) {
    ctx.font = `${weight} ${size}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

// Draw one photo into one panel, with its grade wash on top.
function paintPanel(ctx, img, slot, rect, wash) {
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
  } else {
    ctx.translate(rect.x, rect.y);
  }
  if (img) {
    const crop = cropFor(img, rect, slot);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, rect.w, rect.h);
  } else {
    // Empty slot: a dark placeholder with a dashed frame and a plus.
    ctx.fillStyle = "rgba(10, 8, 14, 0.72)";
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.strokeStyle = "rgba(244, 237, 227, 0.5)";
    ctx.lineWidth = Math.max(2, rect.w * 0.004);
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(6, 6, rect.w - 12, rect.h - 12);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(244, 237, 227, 0.75)";
    ctx.font = `${Math.round(rect.w * 0.16)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", rect.w / 2, rect.h / 2);
  }
  // Grade wash: the same tint over every photo, so the panels feel shot
  // in the same light.
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, rect.w, rect.h);
  // White frame line around the panel.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = Math.max(3, rect.w * 0.006);
  ctx.strokeRect(0, 0, rect.w, rect.h);
  ctx.restore();
}

// The caption band: headline in Anton, tagline in Pacifico with a glow.
function paintCaption(ctx, state, grade, W, H) {
  const band = captionBand(H);
  const bandY = H - band;
  // A soft dark veil so white lettering reads over any photo.
  const veil = ctx.createLinearGradient(0, bandY - band * 0.5, 0, H);
  veil.addColorStop(0, "rgba(10, 6, 14, 0)");
  veil.addColorStop(1, "rgba(10, 6, 14, 0.78)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, bandY - band * 0.5, W, band * 1.5);

  const pad = Math.round(W * 0.045);
  const maxW = W - pad * 2;
  const title = (state.title || "VICE COAST").toUpperCase();
  const sub = state.subtitle || "";

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const titlePx = fitFont(ctx, title, Math.round(H * 0.085), "Anton, sans-serif", maxW);
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = Math.round(H * 0.012);
  ctx.fillText(title, pad, H - Math.round(band * 0.42));
  ctx.shadowBlur = 0;

  if (sub) {
    const subPx = fitFont(ctx, sub, Math.round(H * 0.038), "Pacifico, cursive", maxW);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = grade.glow;
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = Math.round(H * 0.006);
    ctx.fillText(sub, pad + 4, H - Math.round(band * 0.10));
    ctx.shadowBlur = 0;
  }
}

// Small corner bug, top-left, like a magazine masthead stamp.
function paintBug(ctx, W, H) {
  const size = Math.round(W * 0.052);
  const x = Math.round(W * 0.045);
  const y = Math.round(H * 0.035);
  ctx.save();
  ctx.fillStyle = "rgba(10, 6, 14, 0.66)";
  ctx.fillRect(x - 10, y - size * 0.72, size * 4.1, size * 1.05);
  ctx.fillStyle = "#ffd166";
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("VC", x, y);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(size * 0.40)}px Anton, sans-serif`;
  ctx.fillText("VICE COAST", x + size * 1.05, y + 1);
  ctx.restore();
}

// Main entry: paint the poster for `state` onto `canvas` at the size
// named by state.size. `photos` is the array of loaded Image objects
// (or nulls) parallel to state.slots.
export function renderCover(canvas, state, photos) {
  const size = SIZES[state.size] || SIZES.square;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const grade = GRADES[state.grade] || GRADES["sunset-drive"];

  // Sky: diagonal Vice City gradient behind everything.
  const sky = ctx.createLinearGradient(0, 0, W, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Panels.
  const rects = rectsFor(state.layout, W, H);
  const count = rects.length;
  for (let i = 0; i < count; i++) {
    const slot = state.slots[i] || null;
    const img = photos && photos[i] ? photos[i] : null;
    paintPanel(ctx, img, slot, rects[i], grade.wash);
  }

  // Mono grade: desaturate the whole poster for the noir look.
  if (state.grade === "noir-mono") {
    ctx.save();
    ctx.globalCompositeOperation = "saturation";
    ctx.fillStyle = "rgba(128, 128, 128, 1)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  paintCaption(ctx, state, grade, W, H);
  paintBug(ctx, W, H);

  // Poster frame: a thin inner border holding the whole cover together.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = Math.max(4, W * 0.004);
  ctx.strokeRect(10, 10, W - 20, H - 20);
  return { w: W, h: H };
}

// Render the same poster to a throwaway canvas and hand back a PNG blob.
export function exportPng(state, photos) {
  const canvas = document.createElement("canvas");
  renderCover(canvas, state, photos);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
