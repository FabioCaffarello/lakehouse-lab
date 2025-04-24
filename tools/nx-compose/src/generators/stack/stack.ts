import { formatFiles, Tree } from '@nx/devkit';
import { join } from 'path';
import {
  askStackAction,
  askCreateOrUpdateProps,
  askForId,
  askForName,
} from './prompt';
import { StackGeneratorSchema } from './schema';
import { CreateStackUseCase } from '../../core/stack/application/use-cases/create-stack/create-stack.use-case';
import { CreateStackInput } from '../../core/stack/application/use-cases/create-stack/create-stack.input';
import { UpdateStackUseCase } from '../../core/stack/application/use-cases/update-stack/update-stack.use-case';
import { UpdateStackInput } from '../../core/stack/application/use-cases/update-stack/update-stack.input';
import {
  GetStackUseCase,
  GetStackInput,
} from '../../core/stack/application/use-cases/get-stack/get-stack.use-case';
import {
  ListStackUseCase,
  ListStackInput,
} from '../../core/stack/application/use-cases/list-stack/list-stack.use-case';
import {
  DeleteStackUseCase,
  DeleteStackInput,
} from '../../core/stack/application/use-cases/delete-stack/delete-stack.use-case';
import { StackFileRepository } from '../../core/stack/infra/db/file-storage/stack-file.repository';
import { SharedConfigFileRepository } from '../../core/shared-config/infra/db/file-storage/shared-config-file.repository';
import { ServiceFileRepository } from '../../core/service/infra/db/file-storage/service-file.repository';
import { Stack, StackId } from '../../core/stack/domain/stack.aggregate';

export async function stackGenerator(
  tree: Tree,
  options: StackGeneratorSchema
) {
  const localPath = './.local';
  const sharedConfigRepo = new SharedConfigFileRepository(localPath);
  const serviceRepo = new ServiceFileRepository(localPath, sharedConfigRepo);
  const repo = new StackFileRepository(
    localPath,
    serviceRepo,
    sharedConfigRepo
  );

  const action = options.action ?? (await askStackAction());
  switch (action) {
    case 'create':
      await handleCreate(options, repo, serviceRepo, sharedConfigRepo);
      break;
    case 'update':
      await handleUpdate(options, repo, serviceRepo, sharedConfigRepo);
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
  options: StackGeneratorSchema,
  repo: StackFileRepository,
  serviceRepo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const templatesDir = join(__dirname, 'files', 'templates');
  const props = await askCreateOrUpdateProps(templatesDir, undefined);
  const input = new CreateStackInput(props);
  const uc = new CreateStackUseCase(repo, serviceRepo, sharedConfigRepo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Stack created:', output);
  } catch (error) {
    console.error('❌ Error on create Stack:', error.message);
  }
}

async function handleUpdate(
  options: StackGeneratorSchema,
  repo: StackFileRepository,
  serviceRepo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const id = options.id ?? (await askForId());
  const templatesDir = join(__dirname, 'files', 'templates');
  let props = await askCreateOrUpdateProps(templatesDir, undefined);
  props = {
    ...props,
    id,
  };
  const input = new UpdateStackInput(props);
  const uc = new UpdateStackUseCase(repo, serviceRepo, sharedConfigRepo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Stack updated:', output);
  } catch (error) {
    console.error('❌ Error on update Stack:', error.message);
  }
}

async function handleGet(
  options: StackGeneratorSchema,
  repo: StackFileRepository
) {
  const name = options.name ?? (await askForName());
  const input = {
    name: name,
  } as GetStackInput;
  const uc = new GetStackUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Stack retrieved successfully:', output);
  } catch (error: any) {
    console.error('❌ Error retrieving stack:', error.message);
  }
}

async function handleDelete(
  options: StackGeneratorSchema,
  repo: StackFileRepository
) {
  const id = options.id ?? (await askForId());
  const input = {
    id: id,
  } as DeleteStackInput;

  const uc = new DeleteStackUseCase(repo);
  try {
    await uc.execute(input);
    console.log('✅ Stack deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting stack:', error.message);
  }
}

async function handleList(
  options: StackGeneratorSchema,
  repo: StackFileRepository
) {
  const input = {} as ListStackInput;
  const uc = new ListStackUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Stacks:', output);
  } catch (error: any) {
    console.error('❌ Error listing stacks:', error.message);
  }
}

export default stackGenerator;
