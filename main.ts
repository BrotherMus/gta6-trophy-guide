// Leonida Platinum Guide – entry program for make.fun's gta6-trophy-guide-01 (Node 22, standard library only).
// The guide is app/: plain static files (ES modules, CSS, data/trophies.json), no build step, nothing loaded over the
// network. This program hands it in: it copies app/ and screenshots/ to /output (or MAKEFUN_OUTPUT_DIR) and writes
// dossier.json with buildDossier from the kit's vendor/makefun-frontend.ts, which stays byte for byte as shipped.
//
// Run the guide locally: node serve.ts  (then open http://localhost:8080)
// Hand it in locally:    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps: at most 4 screenshots of 256 KiB each, app/ within 993 entries and 48 MiB, text cut at 160 KiB.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyGuideInto(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(here, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
}

function writeDossier(outputDir: string): void {
  writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));
}

copyGuideInto(out);
writeDossier(out);
