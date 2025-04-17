// tools/nx-compose/src/generators/shared-config/prompt.ts
import { prompt } from 'enquirer';
import { readdirSync } from 'fs';

/**
 * Shape final que alimenta o DTO
 */
export interface SharedConfigCreateProps {
  name: string;
  templates: string[];
  appliesTo: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
}

/** Lista só .yaml/.yml */
function listYamlTemplates(templatesDir: string): string[] {
  try {
    return readdirSync(templatesDir).filter((f) => /\.ya?ml$/i.test(f));
  } catch {
    return [];
  }
}

/** Pergunta todos os campos de “create” */
export async function askCreateProps(
  templatesDir: string
): Promise<SharedConfigCreateProps> {
  const templateChoices = listYamlTemplates(templatesDir);

  const ans = await prompt<Partial<SharedConfigCreateProps>>([
    {
      type: 'input',
      name: 'name',
      message: 'Nome da SharedConfig:',
      validate: (v: string) =>
        v.trim().length >= 2 ? true : 'mínimo 2 caracteres',
    },
    {
      type: 'multiselect',
      name: 'templates',
      message: 'Selecione os templates YAML:',
      choices: templateChoices,
      validate: (sel: string[]) =>
        sel.length > 0 ? true : 'Selecione pelo menos um template',
    },
    {
      type: 'input',
      name: 'appliesTo',
      message: 'AppliesTo (service names, separados por vírgula):',
      validate: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean).length > 0
          ? true
          : 'Informe ao menos um serviço',
      // transforma "svc1, svc2" em ['svc1','svc2']
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'environment',
      message: 'Env vars (key=valor, vírgula):',
      initial: '',
      result: (v: string) =>
        v
          .split(',')
          .filter(Boolean)
          .reduce<Record<string, string>>((o, cur) => {
            const [k, val] = cur.split('=').map((s) => s.trim());
            if (k && val != null) o[k] = val;
            return o;
          }, {}),
    },
    {
      type: 'input',
      name: 'volumes',
      message: 'Volumes (name:mountpoint, vírgula):',
      initial: '',
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'networks',
      message: 'Networks (nome, vírgula):',
      initial: '',
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
  ]);

  // agora sim ans.appliesTo, ans.environment, ans.volumes e ans.networks
  // já virão com o tipo correto
  return {
    name: ans.name!,
    templates: ans.templates!,
    appliesTo: ans.appliesTo as string[],
    environment: ans.environment as Record<string, string>,
    volumes: ans.volumes as string[],
    networks: ans.networks as string[],
  };
}
