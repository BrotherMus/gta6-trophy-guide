// Leonida Platinum Guide – entry program for make.fun's gta6-trophy-guide-01 (Node 22, standard library only).
// The guide is app/: plain static files (ES modules, CSS, data/trophies.json), no build step, nothing loaded over the
// network. This program hands it in: it copies app/ and screenshots/ to /output (or MAKEFUN_OUTPUT_DIR) and writes
// dossier.json with buildDossier from the kit's vendor/makefun-frontend.ts, which stays byte for byte as shipped.
//
// Run the guide locally: node serve.ts  (then open http://localhost:8080)
// Hand it in locally:    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const OFFICIAL_TROPHY_COUNT = 55;

// Pre-flight: the gate needs every official trophy named in app/data/trophies.json with a non-blank guide.
// Problems are reported on stderr only, so the files written stay byte for byte the same on every run.
function reportTrophyFileProblems(): void {
  const problems: string[] = [];
  try {
    const parsed = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
    const trophies: Array<{ name?: unknown; guide?: unknown }> = Array.isArray(parsed) ? parsed : parsed.trophies;
    if (trophies.length !== OFFICIAL_TROPHY_COUNT) problems.push(`${trophies.length} trophies, expected ${OFFICIAL_TROPHY_COUNT}`);
    for (const trophy of trophies) {
      if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') problems.push(`no guide for ${String(trophy.name)}`);
    }
  } catch (error) {
    problems.push(`app/data/trophies.json is unreadable: ${(error as Error).message}`);
  }
  for (const problem of problems) console.error(`trophies.json: ${problem}`);
}

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

reportTrophyFileProblems();
copyGuideInto(out);
writeDossier(out);
