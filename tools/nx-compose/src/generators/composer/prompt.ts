import { prompt } from 'enquirer';
import { askAction, pickActions } from '../common/prompt';
import { ComposerGeneratorSchema } from './schema';

const composerChoices = pickActions([
  'create',
  'update',
  'delete',
  'get',
  'list',
]);

export async function askComposerAction(): Promise<
  ComposerGeneratorSchema['action']
> {
  return askAction(
    'Which composer action do you want to perform?',
    composerChoices
  );
}

export async function askCreateOrUpdateProps(
  existing?: Partial<ComposerGeneratorSchema>
): Promise<Omit<ComposerGeneratorSchema, 'action' | 'id'>> {
  const { name } = await prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Composer name:',
      initial: existing?.name,
      validate: (v: string) =>
        v.trim().length >= 2 ? true : 'Minimum of 2 characters',
    },
  ]);

  const { environment, volumes, networks, sharedConfigs, services, stacks } =
    await prompt<{
      environment: Record<string, string>;
      volumes: string[];
      networks: string[];
      sharedConfigs: string[];
      services: string[];
      stacks: string[];
    }>([
      {
        type: 'input',
        name: 'environment',
        message: 'Environment variables (key=value, comma separated)',
        initial: existing?.environment
          ? Object.entries(existing.environment)
              .map(([k, v]) => `${k}=${v}`)
              .join(',')
          : '',
      },
      {
        type: 'input',
        name: 'volumes',
        message: 'Volumes (comma separated):',
        initial: existing?.volumes?.join(',') || '',
      },
      {
        type: 'input',
        name: 'networks',
        message: 'Networks (comma separated):',
        initial: existing?.networks?.join(',') || '',
      },
      {
        type: 'input',
        name: 'sharedConfigs',
        message: 'Shared configs (comma separated):',
        initial: existing?.sharedConfigs?.join(',') || '',
      },
      {
        type: 'input',
        name: 'services',
        message: 'Services (comma separated):',
        initial: existing?.services?.join(',') || '',
      },
      {
        type: 'input',
        name: 'stacks',
        message: 'Stacks (comma separated):',
        initial: existing?.stacks?.join(',') || '',
      },
    ]);

  const envObj = environment
    ? Object.fromEntries(
        environment.split(',').map((pair) => {
          const [k, ...rest] = pair.split('=');
          return [k.trim(), rest.join('=').trim()];
        })
      )
    : undefined;
  const volumesArr = volumes
    ? volumes
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined;
  const networksArr = networks
    ? networks
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
    : undefined;
  const sharedConfigsArr = sharedConfigs
    ? sharedConfigs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const servicesArr = services
    ? services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const stacksArr = stacks
    ? stacks
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    name,
    environment: envObj,
    volumes: volumesArr,
    networks: networksArr,
    sharedConfigs: sharedConfigsArr,
    services: servicesArr,
    stacks: stacksArr,
  };
}

export async function askForId(): Promise<string> {
  const { id } = await prompt<{ id: string }>({
    type: 'input',
    name: 'id',
    message: 'Composer id:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return id;
}

export async function askForName(): Promise<string> {
  const { name } = await prompt<{ name: string }>({
    type: 'input',
    name: 'name',
    message: 'Composer name:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return name;
}
