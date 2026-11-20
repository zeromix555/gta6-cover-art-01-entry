// Vice Coast Cover Studio — state, catalogues, and shot scenes.
// Everything the UI and the painter agree on lives here, so a new layout
// or grade is one entry in one table, not a change in five places.

// Four poster arrangements. `panels` is how many photo slots the
// arrangement shows; the painter asks panels.js where each slot sits.
export const LAYOUTS = {
  "hero-trio": {
    label: "Hero Trio",
    hint: "One big moment, three small ones",
    panels: 4,
  },
  "four-square": {
    label: "Four Square",
    hint: "Four equal frames",
    panels: 4,
  },
  "full-frame": {
    label: "Full Frame",
    hint: "One photo, edge to edge",
    panels: 1,
  },
  "snapshot-strip": {
    label: "Snapshot Strip",
    hint: "Three tilted snapshots",
    panels: 3,
  },
};

// Five Vice City grades. `sky` is the poster gradient behind the panels,
// `wash` is the colour the photos are tinted with, `glow` colours the
// tagline, and `swatch` paints the matching button in the rail.
export const GRADES = {
  "sunset-drive": {
    label: "Sunset Drive",
    sky: ["#ff9a3d", "#ff2e88", "#5b1a6e"],
    wash: "rgba(255, 110, 60, 0.16)",
    glow: "#ffd166",
    swatch: "linear-gradient(135deg,#ff9a3d,#ff2e88)",
  },
  "neon-nights": {
    label: "Neon Nights",
    sky: ["#1b0f3b", "#ff2e88", "#19c2b8"],
    wash: "rgba(255, 46, 136, 0.20)",
    glow: "#39f5e6",
    swatch: "linear-gradient(135deg,#1b0f3b,#ff2e88 55%,#19c2b8)",
  },
  "vice-teal": {
    label: "Vice Teal",
    sky: ["#0b3d4a", "#19c2b8", "#ffd166"],
    wash: "rgba(25, 194, 184, 0.18)",
    glow: "#ffd166",
    swatch: "linear-gradient(135deg,#0b3d4a,#19c2b8)",
  },
  "golden-hour": {
    label: "Golden Hour",
    sky: ["#ffb347", "#ff7a3d", "#7a2e5d"],
    wash: "rgba(255, 180, 70, 0.20)",
    glow: "#fff3c4",
    swatch: "linear-gradient(135deg,#ffb347,#ff7a3d)",
  },
  "noir-mono": {
    label: "Noir Mono",
    sky: ["#2b2b33", "#0e0e12", "#4a4a55"],
    wash: "rgba(0, 0, 0, 0.10)",
    glow: "#f4ede3",
    swatch: "linear-gradient(135deg,#4a4a55,#0e0e12)",
  },
};

// The three post sizes the bounty asks for.
export const SIZES = {
  square: { label: "Square", hint: "1080 × 1080", w: 1080, h: 1080 },
  portrait: { label: "Portrait", hint: "1080 × 1350", w: 1080, h: 1350 },
  wide: { label: "Wide", hint: "1920 × 1080", w: 1920, h: 1080 },
};

// Sample photos shipped with the app (model-made, free to use).
export const SAMPLES = {
  boulevard: "samples/boulevard.jpg",
  pier: "samples/pier.jpg",
};

// A fresh studio: which layout, grade, size, caption, and one photo slot
// per panel. A slot holds { img, name, scale, ox, oy } once a photo loads.
export function freshState() {
  return {
    layout: "hero-trio",
    grade: "sunset-drive",
    size: "square",
    title: "VICE COAST",
    subtitle: "chasing the last light",
    activePanel: 0,
    slots: [null, null, null, null],
  };
}

// Preset scenes for ?shot= captures. The screenshot runner opens the app
// with one of these names and the page configures itself from the scene.
export const SCENES = {
  cover: {
    layout: "hero-trio",
    grade: "sunset-drive",
    size: "square",
    title: "VICE COAST",
    subtitle: "chasing the last light",
    photos: ["boulevard", "pier", "boulevard", "pier"],
    coverOnly: true,
  },
  editor: {
    layout: "four-square",
    grade: "neon-nights",
    size: "wide",
    title: "NEON MILE",
    subtitle: "midnight on the strip",
    photos: ["pier", "boulevard", "pier", "boulevard"],
    coverOnly: false,
  },
  portrait: {
    layout: "full-frame",
    grade: "vice-teal",
    size: "portrait",
    title: "PALM ROYALE",
    subtitle: "teal water, gold light",
    photos: ["pier"],
    coverOnly: true,
  },
  strip: {
    layout: "snapshot-strip",
    grade: "golden-hour",
    size: "wide",
    title: "GOLDEN GETAWAY",
    subtitle: "one last summer",
    photos: ["boulevard", "pier", "boulevard"],
    coverOnly: true,
  },
};
