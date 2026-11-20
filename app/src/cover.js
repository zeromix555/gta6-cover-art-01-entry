// Vice Coast Cover Studio — the cover engine: four multi-panel layouts, five Vice City
// grades, Anton title lettering with a Pacifico neon subtitle. All original art and
// lettering; no Rockstar logo, artwork or fonts anywhere in this file.

export const LAYOUTS = ['hero3', 'grid', 'bleed', 'strip'];

export const GRADES = {
  sunset: { wash: 'rgba(255, 94, 60, 0.16)', top: 'rgba(255, 120, 80, 0.00)', bottom: 'rgba(200, 40, 120, 0.55)', accent: '#ffb347', filter: null },
  neon: { wash: 'rgba(255, 45, 149, 0.14)', top: 'rgba(45, 226, 255, 0.10)', bottom: 'rgba(255, 45, 149, 0.50)', accent: '#2de2ff', filter: null },
  teal: { wash: 'rgba(45, 226, 255, 0.14)', top: 'rgba(45, 226, 255, 0.12)', bottom: 'rgba(10, 90, 120, 0.55)', accent: '#7df9ff', filter: null },
  gold: { wash: 'rgba(255, 179, 71, 0.18)', top: 'rgba(255, 200, 100, 0.10)', bottom: 'rgba(180, 90, 20, 0.50)', accent: '#ffd166', filter: null },
  noir: { wash: 'rgba(0, 0, 0, 0.10)', top: 'rgba(255, 255, 255, 0.05)', bottom: 'rgba(0, 0, 0, 0.55)', accent: '#ffffff', filter: 'grayscale(1) contrast(1.18) brightness(1.05)' },
};

/** Panel rectangles (and tilt, for the strip) for a layout at W x H. Index = panel number. */
export function layoutRects(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.005)); // gutter
  if (layout === 'grid') {
    const cw = (w - g) / 2, ch = (h - g) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch, rot: 0 },
      { x: cw + g, y: 0, w: cw, h: ch, rot: 0 },
      { x: 0, y: ch + g, w: cw, h: ch, rot: 0 },
      { x: cw + g, y: ch + g, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w, h, rot: 0 }];
  }
  if (layout === 'strip') {
    const pw = w * 0.30, ph = h * 0.52, y = h * 0.06;
    return [
      { x: w * 0.04, y, w: pw, h: ph, rot: -0.07 },
      { x: w * 0.35, y: y + h * 0.02, w: pw, h: ph, rot: 0.03 },
      { x: w * 0.66, y, w: pw, h: ph, rot: -0.02 },
    ];
  }
  // hero3 (default): one hero panel over three small ones.
  const heroH = h * 0.60, cw = (w - g * 2) / 3;
  return [
    { x: 0, y: 0, w, h: heroH, rot: 0 },
    { x: 0, y: heroH + g, w: cw, h: h - heroH - g, rot: 0 },
    { x: cw + g, y: heroH + g, w: cw, h: h - heroH - g, rot: 0 },
    { x: (cw + g) * 2, y: heroH + g, w: cw, h: h - heroH - g, rot: 0 },
  ];
}

/** How many panels a layout shows. */
export function panelCount(layout) {
  return layout === 'bleed' ? 1 : layout === 'strip' ? 3 : 4;
}

function drawPhoto(ctx, img, rect, zoom, ox, oy, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, '#4b2364');
    grad.addColorStop(1, '#1c0b2e');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return;
  }
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * Math.max(0, (dw - rect.w) / 2);
  const dy = rect.y + (rect.h - dh) / 2 + oy * Math.max(0, (dh - rect.h) / 2);
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

function drawPanel(ctx, img, rect, panel, filter) {
  if (rect.rot) {
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rect.rot);
    // Polaroid-style white border around the tilted snapshot.
    ctx.fillStyle = '#fdf7f0';
    ctx.fillRect(-rect.w / 2 - 10, -rect.h / 2 - 10, rect.w + 20, rect.h + 20);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(-rect.w / 2 - 10, -rect.h / 2 - 10, rect.w + 20, rect.h + 20);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawPhoto(ctx, img, { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }, panel.zoom, panel.ox, panel.oy, filter);
    ctx.restore();
    return;
  }
  drawPhoto(ctx, img, rect, panel.zoom, panel.ox, panel.oy, filter);
}

function fitFont(ctx, text, fontFamily, maxWidth, startSize, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }
  return size;
}

/**
 * Draws the whole cover onto `canvas` (at its own pixel size).
 * state: { layout, grade, panels: [{ img, zoom, ox, oy }], title, subtitle }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;

  // Backdrop: deep Vice City dusk.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2b1038');
  bg.addColorStop(0.55, '#57204e');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { img: null, zoom: 1.4, ox: 0, oy: 0 };
    drawPanel(ctx, panel.img, rect, panel, grade.filter);
  });

  // Grade wash + vertical tint, strongest at the foot where the title sits.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const tint = ctx.createLinearGradient(0, h * 0.3, 0, h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  // Poster frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeRect(w * 0.014, h * 0.014, w * 0.972, h * 0.972);

  // Title block: dark band, Anton title, Pacifico neon subtitle.
  const bandH = h * 0.20;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 22, 0)');
  band.addColorStop(1, 'rgba(12, 4, 22, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const size = fitFont(ctx, title, 'Anton, sans-serif', w * 0.9, h * 0.105);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = size * 0.09;
    ctx.strokeText(title, w / 2, h - h * 0.085);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(title, w / 2, h - h * 0.085);
    ctx.shadowBlur = 0;
  }
  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const size = fitFont(ctx, subtitle, 'Pacifico, cursive', w * 0.8, h * 0.038);
    ctx.textAlign = 'center';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(subtitle, w / 2, h - h * 0.028);
    ctx.shadowBlur = 0;
  }

  // Corner tag: invented studio mark, top-left.
  const tag = 'VICE COAST';
  const tagSize = fitFont(ctx, tag, 'Anton, sans-serif', w * 0.2, h * 0.022);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText(tag, w * 0.035, h * 0.045);
}
