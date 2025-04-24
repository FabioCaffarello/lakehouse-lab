import { Tree, formatFiles } from '@nx/devkit';
import { join } from 'path';
import {
  askAction,
  askForId,
  askForName,
  askCreateOrUpdateProps,
  askForPage,
  askForPerPage,
  askForSort,
  askForSortDir,
  askForFilter,
} from './prompt';
import { SharedConfigGeneratorSchema } from './schema';
import { CreateSharedConfigUseCase } from '../../core/shared-config/application/use-cases/create-shared-config/create-shared-config.use-case';
import { CreateSharedConfigInput } from '../../core/shared-config/application/use-cases/create-shared-config/create-shared-config.input';
import { UpdateSharedConfigUseCase } from '../../core/shared-config/application/use-cases/update-shared-config/update-shared-config.use-case';
import { UpdateSharedConfigInput } from '../../core/shared-config/application/use-cases/update-shared-config/update-shared-config.input';
import {
  GetSharedConfigUseCase,
  GetSharedConfigInput,
} from '../../core/shared-config/application/use-cases/get-shared-config/get-shared-config.use-case';
import {
  DeleteSharedConfigUseCase,
  DeleteSharedConfigInput,
} from '../../core/shared-config/application/use-cases/delete-shared-config/delete-shared-config.use-case';
import { ListSharedConfigUseCase } from '../../core/shared-config/application/use-cases/list-shared-config/list-shared-config.use-case';
import { SharedConfigId } from '../../core/shared-config/domain/shared-config.aggregate';
import { SharedConfigFileRepository } from '../../core/shared-config/infra/db/file-storage/shared-config-file.repository';

export default async function sharedConfigGenerator(
  tree: Tree,
  schema: SharedConfigGeneratorSchema
) {
  const repo = new SharedConfigFileRepository('./.local');
  const action = schema.action ?? (await askAction());

  switch (action) {
    case 'create':
      await handleCreate(schema, repo);
      break;
    case 'update':
      await handleUpdate(schema, repo);
      break;
    case 'get':
      await handleGet(schema, repo);
      break;
    case 'delete':
      await handleDelete(schema, repo);
      break;
    case 'list':
      await handleList(schema, repo);
      break;
    default:
      console.warn(`❌ Unknown action: ${action}`);
  }

  await formatFiles(tree);
}

async function handleCreate(
  schema: SharedConfigGeneratorSchema,
  repo: SharedConfigFileRepository
) {
  const templatesDir = join(__dirname, 'files', 'templates');
  const props = await askCreateOrUpdateProps(templatesDir, undefined);
  const input = new CreateSharedConfigInput(props);
  const uc = new CreateSharedConfigUseCase(repo);

  try {
    const result = await uc.execute(input);
    console.log('✅ create SharedConfig:', result);
  } catch (err: any) {
    console.error('❌ Error on create SharedConfig:', err.message);
  }
}

async function handleUpdate(
  schema: SharedConfigGeneratorSchema,
  repo: SharedConfigFileRepository
) {
  const id = schema.id ?? (await askForId());

  const entityId = new SharedConfigId(id);
  const existing = await repo.findById(entityId);
  if (!existing) {
    console.error(`❌ SharedConfig not found: id=${id}`);
    return;
  }

  const templatesDir = join(__dirname, 'files', 'templates');
  const raw = existing.toJSON();
  const props = await askCreateOrUpdateProps(templatesDir, {
    name: raw.name,
    templates: raw.templates,
    appliesTo: raw.appliesTo,
    environment: raw.environment,
    volumes: raw.volumes,
    networks: raw.networks,
  });

  const input = new UpdateSharedConfigInput({ id, ...props });
  const uc = new UpdateSharedConfigUseCase(repo);

  try {
    const result = await uc.execute(input);
    console.log('✅ update SharedConfig:', result);
  } catch (err: any) {
    console.error('❌ Error on update SharedConfig:', err.message);
  }
}

async function handleGet(
  schema: SharedConfigGeneratorSchema,
  repo: SharedConfigFileRepository
) {
  const name = schema.name ?? (await askForName());
  const input = {
    name: name,
  } as GetSharedConfigInput;

  const uc = new GetSharedConfigUseCase(repo);
  try {
    const result = await uc.execute(input);
    console.log('✅ get SharedConfig:', result);
  } catch (err: any) {
    console.error('❌ Error on get SharedConfig:', err.message);
  }
}

async function handleList(
  schema: SharedConfigGeneratorSchema,
  repo: SharedConfigFileRepository
) {
  const uc = new ListSharedConfigUseCase(repo);
  const page = await askForPage();
  const per_page = await askForPerPage();
  const sort = await askForSort();
  const sort_dir = sort ? await askForSortDir() : undefined;
  const filter = await askForFilter();
  const input = {
    page: page,
    per_page: per_page,
    sort: sort,
    sort_dir: sort_dir,
    filter: filter,
  };
  try {
    const result = await uc.execute(input);
    console.log('✅ list SharedConfig:', result);
  } catch (err: any) {
    console.error('❌ Error on list SharedConfig:', err.message);
  }
}

async function handleDelete(
  schema: SharedConfigGeneratorSchema,
  repo: SharedConfigFileRepository
) {
  const id = schema.id ?? (await askForId());
  const input = { id: id } as DeleteSharedConfigInput;

  const uc = new DeleteSharedConfigUseCase(repo);
  try {
    await uc.execute(input);
    console.log('✅ delete SharedConfig:', id);
  } catch (err: any) {
    console.error('❌ Error on delete SharedConfig:', err.message);
  }
}
