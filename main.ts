// Vice Coast Cover Studio — entrypoint (Node 22, standard library only).
// Hands in the app this session built: copies app/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json with the vendored make.fun
// library. Before writing anything it validates the entry the way the scorer's
// gate will: app/index.html present, 3 or 4 screenshots each at most 256 KiB,
// app/ at most 993 files and 48 MiB. A failed check prints the fix and exits 1,
// so a broken entry never reaches the dossier.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 50331648;

function fail(message) {
  console.error(`entry check failed: ${message}`);
  process.exit(1);
}

function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countTree(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

// Gate 1: the app must exist and open on its index, within its 1 MiB cap.
const indexPath = join(here, 'app', 'index.html');
if (!existsSync(indexPath)) fail('app/index.html is missing');
if (statSync(indexPath).size > 1048576) fail('app/index.html is over the 1 MiB cap');
// Gate 2: 3 or 4 screenshots, each at most 256 KiB.
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
if (shots.length < 3 || shots.length > 4) fail(`expected 3-4 screenshots, found ${shots.length}`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > SCREENSHOT_MAX_BYTES) fail(`${shot} is ${size} bytes, over the 256 KiB cap`);
}
// Gate 3: app/ within the hosting caps.
const appTree = countTree(join(here, 'app'));
if (appTree.files > APP_MAX_FILES) fail(`app/ has ${appTree.files} files, over the 993 cap`);
if (appTree.bytes > APP_MAX_BYTES) fail(`app/ is ${appTree.bytes} bytes, over the 48 MiB cap`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`handed in ${shots.length} screenshots, app/ ${appTree.files} files / ${appTree.bytes} bytes, dossier ${statSync(join(out, 'dossier.json')).size} bytes`);
