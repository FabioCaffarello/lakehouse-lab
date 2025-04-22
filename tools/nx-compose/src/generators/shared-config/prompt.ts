import { prompt } from 'enquirer';
import { readdirSync } from 'fs';

export interface SharedConfigGeneratorSchema {
  action?: 'create' | 'update' | 'delete' | 'get' | 'list';
  id?: string;
  name?: string;
  templates?: string[];
  appliesTo?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
}

export async function askAction(): Promise<
  SharedConfigGeneratorSchema['action']
> {
  const { action } = await prompt<{ action: string }>({
    type: 'select',
    name: 'action',
    message: 'Which action do you want to perform?',
    choices: [
      { name: 'create', message: 'Create' },
      { name: 'update', message: 'Update' },
      { name: 'delete', message: 'Remove' },
      { name: 'get', message: 'Search by name' },
      { name: 'list', message: 'List all' },
    ],
  });
  return action as any;
}

export async function askForId(): Promise<string> {
  const { id } = await prompt<{ id: string }>({
    type: 'input',
    name: 'id',
    message: 'SharedConfig id:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return id;
}

export async function askForName(): Promise<string> {
  const { name } = await prompt<{ name: string }>({
    type: 'input',
    name: 'name',
    message: 'SharedConfig name:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return name;
}

export async function askForPage(): Promise<number> {
  const { page } = await prompt<{ page: number }>({
    type: 'input',
    name: 'page',
    message: 'Page:',
    initial: 1,
    validate: (v) => (!isNaN(v) && v > 0 ? true : 'Must be a positive number'),
  });
  return page;
}

export async function askForPerPage(): Promise<number> {
  const { per_page } = await prompt<{ per_page: number }>({
    type: 'input',
    name: 'per_page',
    message: 'Items per page:',
    initial: 10,
    validate: (v) => (!isNaN(v) && v > 0 ? true : 'Must be a positive number'),
  });
  return per_page;
}

export async function askForSort(): Promise<string | null> {
  const { sort } = await prompt<{ sort: string | null }>({
    type: 'input',
    name: 'sort',
    message: 'Sort by (field name):',
    initial: null,
  });
  return sort;
}

export async function askForSortDir(): Promise<string | null> {
  const { sort_dir } = await prompt<{ sort_dir: string | null }>({
    type: 'select',
    name: 'sort_dir',
    message: 'Sort direction:',
    choices: [
      { name: 'asc', message: 'Ascending' },
      { name: 'desc', message: 'Descending' },
    ],
  });
  return sort_dir;
}

export async function askForFilter(): Promise<string | null> {
  const { filter } = await prompt<{ filter: string | null }>({
    type: 'input',
    name: 'filter',
    message: 'Filter by (field name):',
    initial: null,
  });
  return filter;
}

function listYamlTemplates(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f));
  } catch {
    return [];
  }
}

export async function askCreateOrUpdateProps(
  templatesDir: string,
  existing?: Partial<SharedConfigGeneratorSchema>
): Promise<Omit<SharedConfigGeneratorSchema, 'action' | 'id'>> {
  const templates = listYamlTemplates(templatesDir);
  const answers = await prompt<Partial<SharedConfigGeneratorSchema>>([
    {
      type: 'input',
      name: 'name',
      message: 'SharedConfig name:',
      initial: existing?.name,
      validate: (v: string) =>
        v.trim().length >= 2 ? true : 'Minimum of 2 characters',
    },
    {
      type: 'multiselect',
      name: 'templates',
      message: 'Select YAML templates:',
      choices: templates,
      initial: existing?.templates,
      validate: (sel: string[]) =>
        sel.length > 0 ? true : 'Select at least one template',
    },
    {
      type: 'input',
      name: 'appliesTo',
      message: 'Services that uses this config (comma separated):',
      initial: existing?.appliesTo?.join(','),
      validate: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean).length > 0
          ? true
          : 'Inform at least one service',
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'environment',
      message: 'Environment variables (key=value, comma):',
      initial: existing
        ? Object.entries(existing.environment || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(',')
        : '',
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
      message: 'Volumes (name:mountpoint, comma):',
      initial: existing?.volumes?.join(','),
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'networks',
      message: 'Networks (comma separated):',
      initial: existing?.networks?.join(','),
      result: (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
  ]);

  return {
    name: answers.name!,
    templates: answers.templates!,
    appliesTo: answers.appliesTo as string[],
    environment: answers.environment as Record<string, string>,
    volumes: answers.volumes as string[],
    networks: answers.networks as string[],
  };
}
