import { Tree, formatFiles } from '@nx/devkit';
import { join } from 'path';
import {
  askServiceAction,
  askCreateOrUpdateProps,
  askForId,
  askForName,
} from './prompt';
import { ServiceGeneratorSchema } from './schema';
import { CreateServiceUseCase } from '../../core/service/application/use-cases/create-service/create-service.use-case';
import { CreateServiceInput } from '../../core/service/application/use-cases/create-service/create-service.input';
import { UpdateServiceUseCase } from '../../core/service/application/use-cases/update-service/update-service.use-case';
import { UpdateServiceInput } from '../../core/service/application/use-cases/update-service/update-service.input';
import { SharedConfigFileRepository } from '../../core/shared-config/infra/db/file-storage/shared-config-file.repository';
import { ServiceFileRepository } from '../../core/service/infra/db/file-storage/service-file.repository';
import {
  Service,
  ServiceId,
} from '../../core/service/domain/service.aggregate';
import {
  GetServiceUseCase,
  GetServiceInput,
} from '../../core/service/application/use-cases/get-service/get-service.use-case';
import {
  ListServiceUseCase,
  ListServiceInput,
} from '../../core/service/application/use-cases/list-service/list-service.use-case';

export async function serviceGenerator(
  tree: Tree,
  options: ServiceGeneratorSchema
) {
  const sharedConfigRepo = new SharedConfigFileRepository('./.local');
  const repo = new ServiceFileRepository('./.local', sharedConfigRepo);
  const action = options.action ?? (await askServiceAction());

  switch (action) {
    case 'create':
      await handleCreate(options, repo, sharedConfigRepo);
      break;
    case 'update':
      await handleUpdate(options, repo, sharedConfigRepo);
      break;
    case 'get':
      await handleGet(options, repo);
      break;
    case 'delete':
      await handleDelete(options, repo);
      break;
    case 'list':
      await handleList(options, repo);
      break;
    default:
      console.warn(`❌ Unknown action: ${action}`);
  }

  await formatFiles(tree);
}

async function handleCreate(
  options: ServiceGeneratorSchema,
  repo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const templatesDir = join(__dirname, 'files', 'templates');
  const props = await askCreateOrUpdateProps(templatesDir, undefined);
  const input = new CreateServiceInput(props);
  const uc = new CreateServiceUseCase(repo, sharedConfigRepo);

  try {
    const output = await uc.execute(input);
    console.log('✅ Service created successfully:', output);
  } catch (error: any) {
    console.error('❌ Error creating service:', error.message);
  }
}

async function handleUpdate(
  options: ServiceGeneratorSchema,
  repo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const id = options.id ?? (await askForId());
  const templatesDir = join(__dirname, 'files', 'templates');
  let props = await askCreateOrUpdateProps(templatesDir, undefined);
  props = {
    ...props,
    id,
  };
  const input = new UpdateServiceInput(props);
  const uc = new UpdateServiceUseCase(repo, sharedConfigRepo);

  try {
    const output = await uc.execute(input);
    console.log('✅ Service updated successfully:', output);
  } catch (error: any) {
    console.error('❌ Error updating service:', error.message);
  }
}

async function handleGet(
  options: ServiceGeneratorSchema,
  repo: ServiceFileRepository
) {
  const name = options.name ?? (await askForName());
  const input = {
    name: name,
  } as GetServiceInput;

  const uc = new GetServiceUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Service retrieved successfully:', output);
  } catch (error: any) {
    console.error('❌ Error retrieving service:', error.message);
  }
}

async function handleList(
  options: ServiceGeneratorSchema,
  repo: ServiceFileRepository
) {
  const input = {} as ListServiceInput;

  const uc = new ListServiceUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Services listed successfully:', output);
  } catch (error: any) {
    console.error('❌ Error listing services:', error.message);
  }
}

async function handleDelete(
  options: ServiceGeneratorSchema,
  repo: ServiceFileRepository
) {
  const id = options.id ?? (await askForId());
  const input = {
    id: id,
  } as DeleteServiceInput;

  const uc = new DeleteServiceUseCase(repo);

  try {
    await uc.execute(input);
    console.log('✅ Service deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting service:', error.message);
  }
}

export default serviceGenerator;
