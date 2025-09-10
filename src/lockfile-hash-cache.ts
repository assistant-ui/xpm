import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export type CacheData = { lockfileHash?: string; lastSync?: string };

const getCachePath = (root: string) => join(root, 'node_modules', '.cache', 'xpm', 'cache.json');

export const readCache = (root: string): CacheData => {
  try { return JSON.parse(readFileSync(getCachePath(root), 'utf8')); } 
  catch { return {}; }
};

export const writeCache = (root: string, data: CacheData): void => {
  try {
    const path = getCachePath(root);
    mkdirSync(join(root, 'node_modules', '.cache', 'xpm'), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2));
  } catch {}
};

export const hashFile = (file: string): string | null =>
  existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null;