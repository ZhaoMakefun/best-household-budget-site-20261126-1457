// HomeLedger — the entry program (Node 22, standard library only).
// It hands the site in: copies app/ and screenshots/ from this repository
// into /output (or $MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the kit's buildDossier library, unchanged.
//
// The output is deterministic: copying files and deriving the dossier from
// them always produces the same bytes, so two runs are byte-identical.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader collects the output as another user, so every file it collects
// must be world-readable: files 0644, directories 0755.
function openUp(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      chmodSync(path, 0o755);
      openUp(path);
    } else {
      chmodSync(path, 0o644);
    }
  }
}

mkdirSync(out, { recursive: true });
mkdirSync(join(out, 'app'), { recursive: true });
const appDir = join(root, 'app');
if (!existsSync(appDir)) {
  throw new Error(`missing app directory: ${appDir}`);
}
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

openUp(out);
