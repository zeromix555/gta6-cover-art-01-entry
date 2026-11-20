// Vice Coast Cover Studio — entrypoint (Node 22, standard library only).
//
// What this program does: it hands the app in. It checks the entry
// against the competition's own size caps first (a bad entry fails here,
// loudly, instead of failing in the grader), then copies app/ and
// screenshots/ beside this file into the output directory and writes
// /output/dossier.json with the vendored make.fun library.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs twice and both runs must write the same bytes: every
// step below is deterministic (plain file copies, no timestamps in the
// dossier), so a second run reproduces the first byte for byte.

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// --- the competition's caps, in one place ---
const CAPS = {
  indexMaxBytes: 1_048_576, // app/index.html at most 1 MiB
  shotsMax: 4, // screenshots/ holds 3 or 4 images
  shotMaxBytes: 262_144, // each screenshot at most 256 KiB
  appMaxFiles: 993, // app/ at most 993 files and directories
  appMaxBytes: 50_331_648, // app/ at most 48 MiB in all
  appPathMaxBytes: 1000, // every path under app/ at most 1000 bytes
  dossierMaxBytes: 1_572_864, // dossier.json at most 1.5 MiB
  textMaxBytes: 163_840, // dossier text cap the library applies
};

const root = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail fast with a plain message; a non-zero exit is the signal.
function refuse(message) {
  throw new Error(`gta6-cover-art-01 entry refused: ${message}`);
}

function bytesOf(path) {
  return statSync(path).size;
}

// Walk a directory tree, counting entries and bytes, and refusing any
// path that is too long. Returns { files, bytes }.
function measureTree(dir) {
  let files = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      // app/ is plain files and directories only: refuse symlinks here
      // instead of letting the grader trip over them.
      if (lstatSync(path).isSymbolicLink()) {
        refuse(`symlink under app/: ${path}`);
      }
      const stat = statSync(path);
      files += 1;
      if (Buffer.byteLength(path, "utf8") > CAPS.appPathMaxBytes) {
        refuse(`path too long under app/: ${path}`);
      }
      if (stat.isDirectory()) stack.push(path);
      else bytes += stat.size;
    }
  }
  return { files, bytes };
}

// Gate 1 — the editor page exists and fits the cap.
function checkIndex() {
  const indexPath = join(root, "app", "index.html");
  if (!existsSync(indexPath)) refuse("app/index.html is missing");
  const size = bytesOf(indexPath);
  if (size > CAPS.indexMaxBytes) {
    refuse(`app/index.html is ${size} bytes, over the ${CAPS.indexMaxBytes} cap`);
  }
}

// Gate 2 — screenshots: 3 or 4 files, each a whole image under the cap.
function checkShots() {
  const shotsDir = join(root, "screenshots");
  if (!existsSync(shotsDir)) refuse("screenshots/ is missing");
  const names = readdirSync(shotsDir).filter((n) => !n.startsWith(".")).sort();
  if (names.length < 3 || names.length > CAPS.shotsMax) {
    refuse(`screenshots/ holds ${names.length} images, need 3 or 4`);
  }
  for (const name of names) {
    if (!/\.(png|jpe?g)$/i.test(name)) {
      refuse(`screenshots/${name} is not a PNG or JPEG image`);
    }
    const size = bytesOf(join(shotsDir, name));
    if (size > CAPS.shotMaxBytes) {
      refuse(`screenshots/${name} is ${size} bytes, over the ${CAPS.shotMaxBytes} cap`);
    }
  }
}

// Gate 3 — app/ fits the file-count and byte caps.
function checkAppTree() {
  const appDir = join(root, "app");
  if (!existsSync(appDir)) refuse("app/ is missing");
  const { files, bytes } = measureTree(appDir);
  if (files > CAPS.appMaxFiles) {
    refuse(`app/ holds ${files} entries, over the ${CAPS.appMaxFiles} cap`);
  }
  if (bytes > CAPS.appMaxBytes) {
    refuse(`app/ is ${bytes} bytes, over the ${CAPS.appMaxBytes} cap`);
  }
}

// Gate 4 — the dossier the library writes must fit its own cap.
function checkDossierSize(dossierText) {
  const size = Buffer.byteLength(dossierText, "utf8");
  if (size > CAPS.dossierMaxBytes) {
    refuse(`dossier.json would be ${size} bytes, over the ${CAPS.dossierMaxBytes} cap`);
  }
  return size;
}

checkIndex();
checkShots();
checkAppTree();

mkdirSync(outDir, { recursive: true });
cpSync(join(root, "app"), join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
if (existsSync(join(root, "screenshots"))) {
  cpSync(join(root, "screenshots"), join(outDir, "screenshots"), { recursive: true });
}

const dossier = buildDossier(resolve(outDir), {
  text_max_bytes: CAPS.textMaxBytes,
  screenshots: { max: CAPS.shotsMax, max_bytes: CAPS.shotMaxBytes },
  app_max_files: CAPS.appMaxFiles,
  app_max_bytes: CAPS.appMaxBytes,
  app_path_max_bytes: CAPS.appPathMaxBytes,
});

const dossierBytes = checkDossierSize(dossier);
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`Vice Coast Cover Studio handed in: dossier ${dossierBytes} bytes (cap ${CAPS.dossierMaxBytes})`);
