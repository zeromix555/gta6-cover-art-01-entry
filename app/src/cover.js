// Vice Coast Cover Studio — cover renderer.
// Four poster layouts, five Vice City colour grades, Anton title lettering with a
// Pacifico neon subtitle. Every letterform and frame here is original work; there
// is no Rockstar logo, artwork, or font anywhere in this file.

export const LAYOUTS = ['hero3', 'grid', 'bleed', 'strip'];

export const GRADES = {
  sunset: { wash: 'rgba(255, 94, 60, 0.16)', top: 'rgba(255, 120, 80, 0)', bottom: 'rgba(200, 40, 120, 0.55)', accent: '#ffb347', filter: null },
  neon: { wash: 'rgba(255, 45, 149, 0.14)', top: 'rgba(45, 226, 255, 0.10)', bottom: 'rgba(255, 45, 149, 0.50)', accent: '#2de2ff', filter: null },
  teal: { wash: 'rgba(45, 226, 255, 0.14)', top: 'rgba(45, 226, 255, 0.12)', bottom: 'rgba(10, 90, 120, 0.55)', accent: '#7df9ff', filter: null },
  gold: { wash: 'rgba(255, 179, 71, 0.18)', top: 'rgba(255, 200, 100, 0.10)', bottom: 'rgba(180, 90, 20, 0.50)', accent: '#ffd166', filter: null },
  noir: { wash: 'rgba(0, 0, 0, 0.10)', top: 'rgba(255, 255, 255, 0.05)', bottom: 'rgba(0, 0, 0, 0.55)', accent: '#ffffff', filter: 'grayscale(1) contrast(1.18) brightness(1.05)' },
};

// Panel boxes for one layout at a W x H canvas. Index matches the panel number.
export function layoutRects(layout, w, h) {
  const gap = Math.max(4, Math.round(w * 0.005));
  if (layout === 'grid') {
    const cw = (w - gap) / 2;
    const ch = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch, rot: 0 },
      { x: cw + gap, y: 0, w: cw, h: ch, rot: 0 },
      { x: 0, y: ch + gap, w: cw, h: ch, rot: 0 },
      { x: cw + gap, y: ch + gap, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'bleed') return [{ x: 0, y: 0, w, h, rot: 0 }];
  if (layout === 'strip') {
    const pw = w * 0.30;
    const ph = h * 0.52;
    const y0 = h * 0.06;
    return [
      { x: w * 0.04, y: y0, w: pw, h: ph, rot: -0.07 },
      { x: w * 0.35, y: y0 + h * 0.02, w: pw, h: ph, rot: 0.03 },
      { x: w * 0.66, y: y0, w: pw, h: ph, rot: -0.02 },
    ];
  }
  // hero3: one wide hero panel, three small ones underneath.
  const heroH = h * 0.60;
  const cw = (w - gap * 2) / 3;
  const smallH = h - heroH - gap;
  return [
    { x: 0, y: 0, w, h: heroH, rot: 0 },
    { x: 0, y: heroH + gap, w: cw, h: smallH, rot: 0 },
    { x: cw + gap, y: heroH + gap, w: cw, h: smallH, rot: 0 },
    { x: (cw + gap) * 2, y: heroH + gap, w: cw, h: smallH, rot: 0 },
  ];
}

export function panelCount(layout) {
  if (layout === 'bleed') return 1;
  if (layout === 'strip') return 3;
  return 4;
}

// Paint one photo (or a purple placeholder when the panel is empty) clipped to rect.
function paintPhoto(ctx, img, rect, zoom, ox, oy, filter) {
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
  const slackX = Math.max(0, (dw - rect.w) / 2);
  const slackY = Math.max(0, (dh - rect.h) / 2);
  const dx = rect.x + (rect.w - dw) / 2 + ox * slackX;
  const dy = rect.y + (rect.h - dh) / 2 + oy * slackY;
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

// One panel; tilted strip panels get a polaroid-style white border and shadow.
function paintPanel(ctx, img, rect, panel, filter) {
  if (!rect.rot) {
    paintPhoto(ctx, img, rect, panel.zoom, panel.ox, panel.oy, filter);
    return;
  }
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.rot);
  const pad = 10;
  ctx.fillStyle = '#fdf7f0';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillRect(-rect.w / 2 - pad, -rect.h / 2 - pad, rect.w + pad * 2, rect.h + pad * 2);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  paintPhoto(ctx, img, { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }, panel.zoom, panel.ox, panel.oy, filter);
  ctx.restore();
}

// Shrink a font until the text fits maxWidth. Returns the size actually used.
function fitFont(ctx, text, family, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

// Draw the full cover onto `canvas` at its own pixel size.
// state: { layout, grade, panels: [{ img, zoom, ox, oy }], title, subtitle }
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;

  // Dusk backdrop behind the panels.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2b1038');
  bg.addColorStop(0.55, '#57204e');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { img: null, zoom: 1.4, ox: 0, oy: 0 };
    paintPanel(ctx, panel.img, rect, panel, grade.filter);
  });

  // Grade wash, then a vertical tint that deepens toward the title band.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const tint = ctx.createLinearGradient(0, h * 0.3, 0, h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  // Thin white poster frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeRect(w * 0.014, h * 0.014, w * 0.972, h * 0.972);

  // Title band fading up from the bottom edge.
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

  // Invented studio mark, top-left corner.
  const tag = 'VICE COAST';
  fitFont(ctx, tag, 'Anton, sans-serif', w * 0.2, h * 0.022);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText(tag, w * 0.035, h * 0.045);
}
