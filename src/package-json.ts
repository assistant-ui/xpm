import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const loadPackageJson = (dir = process.cwd()): any => {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
  } catch { return null; }
};

const loadDenoJson = (dir = process.cwd()): any => {
  try {
    const denoJsonPath = join(dir, 'deno.json');
    const denoJsoncPath = join(dir, 'deno.jsonc');

    let content: string;
    if (existsSync(denoJsonPath)) {
      content = readFileSync(denoJsonPath, 'utf-8');
    } else if (existsSync(denoJsoncPath)) {
      content = readFileSync(denoJsoncPath, 'utf-8');
    } else {
      return null;
    }

    // Remove comments for parsing
    const jsonWithoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
    return JSON.parse(jsonWithoutComments);
  } catch { return null; }
};

export const hasScript = (name: string, root?: string): boolean => {
  // Check for package.json scripts
  const packageJson = loadPackageJson(root);
  if (packageJson?.scripts?.[name] !== undefined) {
    return true;
  }

  // Check for deno.json tasks
  const denoJson = loadDenoJson(root);
  if (denoJson?.tasks?.[name] !== undefined) {
    return true;
  }

  return false;
};
