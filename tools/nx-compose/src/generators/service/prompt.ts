import { prompt } from 'enquirer';
import { askAction, pickActions } from '../common/prompt';
import { ServiceGeneratorSchema } from './schema';
import { listYamlTemplates } from '../common/templates';

const serviceChoices = pickActions(['create']);

export async function askServiceAction(): Promise<
  ServiceGeneratorSchema['action']
> {
  return askAction(
    'Which service action do you want to perform?',
    serviceChoices
  );
}

export async function askCreateOrUpdateProps(
  templatesDir: string,
  existing?: Partial<ServiceGeneratorSchema>
): Promise<Omit<ServiceGeneratorSchema, 'action' | 'id'>> {
  const { name } = await prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Service name:',
      initial: existing?.name,
      validate: (v: string) =>
        v.trim().length >= 2 ? true : 'Minimum of 2 characters',
    },
  ]);

  const templates = listYamlTemplates(templatesDir);
  const { useTemplates } = await prompt<{ useTemplates: boolean }>([
    {
      type: 'confirm',
      name: 'useTemplates',
      message: 'Do you want to select YAML templates? (no → provide image)',
      initial: !!existing?.templates?.length,
    },
  ]);

  let image: string | undefined;
  let selectedTemplate: string | undefined;
  if (useTemplates) {
    const { templateFile } = await prompt<{ templateFile: string }>([
      {
        type: 'select',
        name: 'templateFile',
        message: 'Select YAML template:',
        choices: templates,
        initial: existing?.templateFile,
      },
    ]);
    selectedTemplate = templateFile;
  } else {
    const { image: img } = await prompt<{ image: string }>([
      {
        type: 'input',
        name: 'image',
        message: 'Docker image:',
        initial: existing?.image,
        validate: (v: string) =>
          v.trim().length > 0 ? true : 'Image cannot be empty',
      },
    ]);
    image = img;
  }

  const { environment, ports, volumes, networks, sharedConfigs } =
    await prompt<{
      environment: string;
      ports: string;
      volumes: string;
      networks: string;
      sharedConfigs: string;
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
        name: 'ports',
        message: 'Ports (comma separated)',
        initial: existing?.ports?.join(',') || '',
      },
      {
        type: 'input',
        name: 'volumes',
        message: 'Volumes (comma separated)',
        initial: existing?.volumes?.join(',') || '',
      },
      {
        type: 'input',
        name: 'networks',
        message: 'Networks (comma separated)',
        initial: existing?.networks?.join(',') || '',
      },
      {
        type: 'input',
        name: 'sharedConfigs',
        message: 'Shared config names to apply (comma separated)',
        initial: existing?.sharedConfigs?.join(',') || '',
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
  const portsArr = ports
    ? ports
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
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

  return {
    name,
    image,
    templateFile: selectedTemplate,
    environment: envObj,
    ports: portsArr,
    volumes: volumesArr,
    networks: networksArr,
    sharedConfigs: sharedConfigsArr,
  };
}
