import { readFileSync } from 'fs';
import { join } from 'path';

const loadPackageJson = (dir = process.cwd()): any => {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
  } catch { return null; }
};

export const hasScript = (name: string, root?: string): boolean => 
  loadPackageJson(root)?.scripts?.[name] !== undefined;
