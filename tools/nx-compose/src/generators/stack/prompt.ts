import { prompt } from 'enquirer';
import { askAction, pickActions } from '../common/prompt';
import { StackGeneratorSchema } from './schema';

const stackChoices = pickActions(['create', 'update', 'delete', 'get', 'list']);

export async function askStackAction(): Promise<
  ServiceGeneratorSchema['action']
> {
  return askAction('Which stack action do you want to perform?', stackChoices);
}

export async function askCreateOrUpdateProps(
  templatesDir: string,
  existing?: Partial<StackGeneratorSchema>
): Promise<Omit<StackGeneratorSchema, 'action' | 'id'>> {
  const { name } = await prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Stack name:',
      initial: existing?.name,
      validate: (v: string) =>
        v.trim().length >= 2 ? true : 'Minimum of 2 characters',
    },
  ]);

  const { environment, volumes, networks, sharedConfigs, services } =
    await prompt<{
      environment: Record<string, string>;
      volumes: string[];
      networks: string[];
      sharedConfigs: string[];
      services: string[];
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
        message: 'Shared Configs Names (comma separated):',
        initial: existing?.sharedConfigs?.join(',') || '',
      },
      {
        type: 'input',
        name: 'services',
        message: 'Services Names (comma separated):',
        initial: existing?.services?.join(',') || '',
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

  return {
    name,
    environment: envObj,
    volumes: volumesArr,
    networks: networksArr,
    sharedConfigs: sharedConfigsArr,
    services: servicesArr,
  };
}

export async function askForId(): Promise<string> {
  const { id } = await prompt<{ id: string }>({
    type: 'input',
    name: 'id',
    message: 'Stack id:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return id;
}

export async function askForName(): Promise<string> {
  const { name } = await prompt<{ name: string }>({
    type: 'input',
    name: 'name',
    message: 'Stack name:',
    validate: (v) => (!!v ? true : 'Required'),
  });
  return name;
}
