import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const webDir = path.join(root, 'www');

const excluded = new Set([
  '.git',
  '.github',
  'node_modules',
  'www',
  'android',
  'ios',
  'package.json',
  'package-lock.json',
  'capacitor.config.json'
]);

async function copyEntry(name) {
  if (excluded.has(name)) return;

  const source = path.join(root, name);
  const destination = path.join(webDir, name);

  await cp(source, destination, {
    recursive: true,
    force: true
  });
}

if (existsSync(webDir)) {
  await rm(webDir, { recursive: true, force: true });
}

await mkdir(webDir, { recursive: true });

const entries = [
  ...await (await import('node:fs/promises')).readdir(root)
];

for (const name of entries) {
  await copyEntry(name);
}

console.log('Web assets preparados em ./www');
