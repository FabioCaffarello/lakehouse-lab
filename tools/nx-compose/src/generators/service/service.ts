import { Tree, formatFiles } from '@nx/devkit';
import { join } from 'path';
import { askServiceAction, askCreateOrUpdateProps } from './prompt';
import { ServiceGeneratorSchema } from './schema';
import { ServiceInMemoryRepository } from '../../core/service/infra/db/in-memory/service-in-memory.repository';
import { CreateServiceUseCase } from '../../core/service/application/use-cases/create-service/create-service.use-case';
import { CreateServiceInput } from '../../core/service/application/use-cases/create-service/create-service.input';
import { SharedConfigFileRepository } from '../../core/shared-config/infra/db/file-storage/shared-config-file.repository';

export async function serviceGenerator(
  tree: Tree,
  options: ServiceGeneratorSchema
) {
  const repo = new ServiceInMemoryRepository();
  const sharedConfigRepo = new SharedConfigFileRepository('./.local');
  const action = options.action ?? (await askServiceAction());

  switch (action) {
    case 'create':
      await handleCreate(options, repo, sharedConfigRepo);
      break;
    // case 'update':
    //   await handleUpdate(options, repo);
    //   break;
    // case 'get':
    //   await handleGet(options, repo);
    //   break;
    // case 'delete':
    //   await handleDelete(options, repo);
    //   break;
    // case 'list':
    //   await handleList(options, repo);
    //   break;
    default:
      console.warn(`❌ Unknown action: ${action}`);
  }

  await formatFiles(tree);
}

async function handleCreate(
  options: ServiceGeneratorSchema,
  repo: ServiceInMemoryRepository,
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

export default serviceGenerator;
