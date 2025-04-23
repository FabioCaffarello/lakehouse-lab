import { readdirSync } from 'fs';

export function listYamlTemplates(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f));
  } catch {
    return [];
  }
}
