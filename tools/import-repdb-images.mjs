import fs from 'node:fs/promises';
import path from 'node:path';

const PTBR_URL = 'https://raw.githubusercontent.com/gugeldev/exercicios-bd-ptbr/main/exercises/exercises-ptbr-full-translation.json';
const REPDB_URL = 'https://exercise-dataset.com/exercises.json';
const IMAGE_BASE = 'https://exercise-dataset.com/';

const ROOT = process.cwd();
const ASSET_ROOT = path.join(ROOT, 'assets', 'exercises');
const MAP_FILE = path.join(ROOT, 'data', 'repdb-image-map.json');
const APP_MEDIA_FILE = path.join(ROOT, 'data', 'app-exercise-media.json');
const APP_LOCAL_MAP_FILE = path.join(ROOT, 'data', 'app-repdb-media.json');

const aliases = {
  'ab-roller': 'ab-wheel-rollout',
  'ab-crunch-machine': 'ab-crunch-machine',
  'barbell-bench-press': 'bench-press',
  'barbell-bench-press-medium-grip': 'bench-press',
  'incline-barbell-bench-press': 'incline-bench-press',
  'dumbbell-bench-press': 'db-bench-press',
  'decline-barbell-bench-press': 'decline-bench-press-barbell',
  'barbell-squat': 'barbell-back-squat',
  'back-extension': 'back-extension',
  'lat-pulldown': 'lat-pulldown',
  'seated-cable-rows': 'seated-cable-row',
  'cable-crossover': 'cable-chest-fly',
  'dumbbell-fly': 'dumbbell-chest-fly',
  'dumbbell-incline-bench-press': 'incline-db-bench-press',
  'military-press': 'overhead-press',
  'standing-military-press': 'overhead-press',
  'front-raise': 'front-dumbbell-raise',
  'lateral-raise': 'dumbbell-lateral-raise',
  'rear-delt-fly': 'reverse-fly',
  'tricep-pushdown': 'cable-triceps-pushdown',
  'barbell-curl': 'barbell-biceps-curl',
  'dumbbell-biceps-curl': 'dumbbell-biceps-curl',
  'hammer-curl': 'hammer-curl',
  'leg-press': 'leg-press',
  'leg-extension': 'leg-extension',
  'leg-curl': 'lying-leg-curl',
  'standing-calf-raise': 'standing-calf-raise',
  'seated-calf-raise': 'seated-calf-raise',
  'romanian-deadlift': 'romanian-deadlift',
  'barbell-deadlift': 'barbell-deadlift',
  'pull-ups': 'pull-up',
  'chin-ups': 'chin-up',
  'push-ups': 'push-up',
  'parallel-bar-dip': 'parallel-bar-dip',
  'bench-dips': 'bench-dip',
  'plank': 'plank',
  'russian-twist': 'russian-twist',
  'hanging-leg-raise': 'hanging-leg-raise',
  'lying-leg-raise': 'lying-leg-raise'
};

const stop = new Set([
  'the', 'with', 'and', 'for', 'of', 'a', 'an',
  'medium', 'wide', 'narrow', 'close', 'grip',
  'body', 'weight', 'weighted', 'version'
]);

const synonyms = new Map([
  ['db', 'dumbbell'],
  ['dumbbells', 'dumbbell'],
  ['bb', 'barbell'],
  ['bar', 'barbell'],
  ['bars', 'barbell'],
  ['ez', 'ezbar'],
  ['ez-bar', 'ezbar'],
  ['pressing', 'press'],
  ['presses', 'press'],
  ['rows', 'row'],
  ['raises', 'raise'],
  ['curls', 'curl'],
  ['extensions', 'extension'],
  ['squats', 'squat'],
  ['lunges', 'lunge']
]);

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(
    norm(value)
      .split(/\s+/)
      .map(token => synonyms.get(token) || token)
      .filter(token => token && !stop.has(token))
  );
}

function score(source, candidate) {
  const a = tokens(source.id);
  const b = new Set([...tokens(candidate.id), ...tokens(candidate.name_en)]);
  if (!a.size || !b.size) return 0;

  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared++;
  }

  const coverage = shared / a.size;
  const precision = shared / b.size;
  const exact = norm(source.id) === norm(candidate.id) ? 1 : 0;
  return exact ? 1 : (coverage * 0.7) + (precision * 0.3);
}

function choose(source, repdb) {
  const alias = aliases[norm(source.id).replace(/ /g, '-')];
  if (alias) {
    const direct = repdb.find(ex => ex.id === alias);
    if (direct) return { ex: direct, score: 1, method: 'alias' };
  }

  const ranked = repdb
    .map(ex => ({ ex, score: score(source, ex) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const strong = best.score >= 0.72 ||
    (best.score >= 0.58 && (!second || best.score - second.score >= 0.10));

  return strong ? { ...best, method: 'fuzzy' } : null;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + url);
  return response.json();
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer);
}

const ptbr = await getJson(PTBR_URL);
const repdbRoot = await getJson(REPDB_URL);
const repdb = Array.isArray(repdbRoot.exercises) ? repdbRoot.exercises : [];
const appMedia = await fs.readFile(APP_MEDIA_FILE, 'utf8').then(JSON.parse);

await fs.mkdir(ASSET_ROOT, { recursive: true });

const map = {};
let matched = 0;
let unmatched = 0;
let downloaded = 0;

for (const source of ptbr) {
  const match = choose(source, repdb);
  if (!match || !match.ex || !match.ex.images || !match.ex.images.flat) {
    unmatched++;
    continue;
  }

  const flat = match.ex.images.flat;
  const local = {};

  for (const phase of ['start', 'peak', 'main']) {
    const remotePath = flat[phase];
    if (!remotePath) continue;

    const relative = path.join('assets', 'exercises', source.id, phase + '.webp').replaceAll('\\', '/');
    const destination = path.join(ROOT, relative);
    const remoteUrl = IMAGE_BASE + remotePath;

    await download(remoteUrl, destination);
    local[phase] = './' + relative;
    downloaded++;
  }

  map[source.id] = {
    repdbId: match.ex.id,
    method: match.method,
    score: Number(match.score.toFixed(3)),
    images: local
  };
  matched++;
}

await fs.mkdir(path.dirname(MAP_FILE), { recursive: true });
await fs.writeFile(
  MAP_FILE,
  JSON.stringify({
    source: 'RepDB free tier',
    generatedAt: new Date().toISOString(),
    matched,
    unmatched,
    imagesDownloaded: downloaded,
    exercises: map
  }, null, 2) + '\n'
);

const appLocal = {};
let appUnmatched = 0;
let appDownloaded = 0;

for (const [name, ids] of Object.entries(appMedia)) {
  const candidates = Array.isArray(ids) ? ids : [ids];
  const ex = candidates.map(id => repdb.find(item => item.id === id)).find(Boolean);
  if (!ex || !ex.images?.flat) {
    appUnmatched++;
    continue;
  }

  const local = {};
  for (const phase of ['start', 'peak', 'main']) {
    const remotePath = ex.images.flat[phase];
    if (!remotePath) continue;
    const relative = path.join('assets', 'repdb', ex.id, phase + '.webp').replaceAll('\\', '/');
    const destination = path.join(ROOT, relative);
    await download(IMAGE_BASE + remotePath, destination);
    local[phase] = './' + relative;
    appDownloaded++;
  }

  appLocal[name] = {
    repdbId: ex.id,
    images: local
  };
}

await fs.writeFile(
  APP_LOCAL_MAP_FILE,
  JSON.stringify({
    source: 'RepDB free tier',
    generatedAt: new Date().toISOString(),
    matched: Object.keys(appLocal).length,
    unmatched: appUnmatched,
    imagesDownloaded: appDownloaded,
    exercises: appLocal
  }, null, 2) + '\n'
);

console.log('RepDB: ' + repdb.length + ' exercícios disponíveis.');
console.log('PT-BR: ' + ptbr.length + ' exercícios.');
console.log('Correspondências PT-BR: ' + matched + '; sem correspondência segura: ' + unmatched + '; imagens baixadas: ' + downloaded + '.');
console.log('Mídia local do app: ' + Object.keys(appLocal).length + ' exercícios; sem correspondência: ' + appUnmatched + '; imagens baixadas: ' + appDownloaded + '.');
