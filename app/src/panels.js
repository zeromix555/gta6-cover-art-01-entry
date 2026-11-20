// Vice Coast Cover Studio — panel geometry and photo cropping.
// The painter asks this module two questions: where does each panel sit
// on a cover of size W x H, and which part of a photo fills that panel
// once the user has panned and zoomed it. Nothing here touches the DOM.

// Where each panel of a layout sits. Rects are in cover pixels; `rot` is
// a tilt in radians (only the snapshot strip tilts its frames). `gap` is
// the breathing room between panels and the poster's edge.
export function rectsFor(layout, W, H, gap = 28) {
  const inset = gap;
  const innerW = W - inset * 2;
  const innerH = H - inset * 2;
  switch (layout) {
    case "hero-trio": {
      // One tall hero on the left, three stacked frames on the right.
      const heroW = Math.round(innerW * 0.62);
      const sideW = innerW - heroW - gap;
      const sideH = Math.round((innerH - gap * 2) / 3);
      const rects = [{ x: inset, y: inset, w: heroW, h: innerH, rot: 0 }];
      for (let i = 0; i < 3; i++) {
        rects.push({
          x: inset + heroW + gap,
          y: inset + i * (sideH + gap),
          w: sideW,
          h: sideH,
          rot: 0,
        });
      }
      return rects;
    }
    case "four-square": {
      const cellW = Math.round((innerW - gap) / 2);
      const cellH = Math.round((innerH - gap) / 2);
      return [
        { x: inset, y: inset, w: cellW, h: cellH, rot: 0 },
        { x: inset + cellW + gap, y: inset, w: cellW, h: cellH, rot: 0 },
        { x: inset, y: inset + cellH + gap, w: cellW, h: cellH, rot: 0 },
        { x: inset + cellW + gap, y: inset + cellH + gap, w: cellW, h: cellH, rot: 0 },
      ];
    }
    case "full-frame": {
      return [{ x: inset, y: inset, w: innerW, h: innerH, rot: 0 }];
    }
    case "snapshot-strip": {
      // Three overlapping snapshots, fanned out like prints on a table.
      const snapW = Math.round(innerW * 0.42);
      const snapH = Math.round(innerH * 0.62);
      const top = inset + Math.round(innerH * 0.08);
      const step = Math.round((innerW - snapW) / 2);
      return [
        { x: inset, y: top + 26, w: snapW, h: snapH, rot: -0.07 },
        { x: inset + step, y: top - 6, w: snapW, h: snapH, rot: 0.02 },
        { x: inset + step * 2, y: top + 30, w: snapW, h: snapH, rot: 0.07 },
      ];
    }
    default:
      return [{ x: inset, y: inset, w: innerW, h: innerH, rot: 0 }];
  }
}

// The strip under the poster: how tall the caption band is, in cover
// pixels, for a given cover height. The painter reserves this band at the
// bottom so lettering never lands on a face.
export function captionBand(H) {
  return Math.round(H * 0.21);
}

// Which source rectangle of a photo fills a panel, cover-fit style.
// `slot` carries the user's zoom (scale, 1 = just fills) and pan offsets
// (ox, oy in fractions of the panel). Returns { sx, sy, sw, sh }.
export function cropFor(img, rect, slot) {
  const scale = slot && slot.scale ? slot.scale : 1;
  const ox = slot && slot.ox ? slot.ox : 0;
  const oy = slot && slot.oy ? slot.oy : 0;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const rectRatio = rect.w / rect.h;
  let sw;
  let sh;
  if (imgRatio > rectRatio) {
    // Photo is wider than the panel: crop the sides.
    sh = img.naturalHeight;
    sw = sh * rectRatio;
  } else {
    // Photo is taller than the panel: crop top and bottom.
    sw = img.naturalWidth;
    sh = sw / rectRatio;
  }
  // Zoom in by shrinking the sampled window around its centre.
  sw /= scale;
  sh /= scale;
  // Pan by sliding the window; clamp so it never leaves the photo.
  const maxX = img.naturalWidth - sw;
  const maxY = img.naturalHeight - sh;
  const sx = Math.min(Math.max((img.naturalWidth - sw) / 2 + ox * sw, 0), Math.max(maxX, 0));
  const sy = Math.min(Math.max((img.naturalHeight - sh) / 2 + oy * sh, 0), Math.max(maxY, 0));
  return { sx, sy, sw, sh };
}

// Hit-test: which panel index holds a point in cover coordinates, or -1.
// Tilted strip frames are tested against their unrotated bounds, which is
// close enough for a click and keeps dragging predictable.
export function panelAt(rects, px, py) {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

// Clamp a slot's pan so the photo always covers its panel.
export function clampSlot(slot) {
  if (!slot) return slot;
  return {
    ...slot,
    scale: Math.min(Math.max(slot.scale || 1, 0.5), 4),
    ox: Math.min(Math.max(slot.ox || 0, -0.5), 0.5),
    oy: Math.min(Math.max(slot.oy || 0, -0.5), 0.5),
  };
}
