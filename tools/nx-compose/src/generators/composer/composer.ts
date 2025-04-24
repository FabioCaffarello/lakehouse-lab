import { formatFiles, Tree } from '@nx/devkit';
import { join } from 'path';
import {
  askComposerAction,
  askCreateOrUpdateProps,
  askForId,
  askForName,
} from './prompt';
import { ComposerGeneratorSchema } from './schema';
import { CreateComposerUseCase } from '../../core/composer/application/use-cases/create-composer/create-composer.use-case';
import { CreateComposerInput } from '../../core/composer/application/use-cases/create-composer/create-composer.input';
import { UpdateComposerUseCase } from '../../core/composer/application/use-cases/update-composer/update-composer.use-case';
import { UpdateComposerInput } from '../../core/composer/application/use-cases/update-composer/update-composer.input';
import {
  GetComposerUseCase,
  GetComposerInput,
} from '../../core/composer/application/use-cases/get-composer/get-composer.use-case';
import {
  ListComposerUseCase,
  ListComposerInput,
} from '../../core/composer/application/use-cases/list-composer/list-composer.use-case';
import {
  DeleteComposerUseCase,
  DeleteComposerInput,
} from '../../core/composer/application/use-cases/delete-composer/delete-composer.use-case';
import { ComposerFileRepository } from '../../core/composer/infra/db/file-storage/composer-file.repository';
import { StackFileRepository } from '../../core/stack/infra/db/file-storage/stack-file.repository';
import { ServiceFileRepository } from '../../core/service/infra/db/file-storage/service-file.repository';
import { SharedConfigFileRepository } from '../../core/shared-config/infra/db/file-storage/shared-config-file.repository';
import {
  Composer,
  ComposerId,
} from '../../core/composer/domain/composer.aggregate';

export async function composerGenerator(
  tree: Tree,
  options: ComposerGeneratorSchema
) {
  const localPath = './.local';
  const sharedConfigRepo = new SharedConfigFileRepository(localPath);
  const serviceRepo = new ServiceFileRepository(localPath, sharedConfigRepo);
  const stackRepo = new StackFileRepository(
    localPath,
    serviceRepo,
    sharedConfigRepo
  );
  const repo = new ComposerFileRepository(
    localPath,
    stackRepo,
    serviceRepo,
    sharedConfigRepo
  );

  const action = options.action ?? (await askComposerAction());
  switch (action) {
    case 'create':
      await handleCreate(
        options,
        repo,
        stackRepo,
        serviceRepo,
        sharedConfigRepo
      );
      break;
    case 'update':
      await handleUpdate(
        options,
        repo,
        stackRepo,
        serviceRepo,
        sharedConfigRepo
      );
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
  options: ComposerGeneratorSchema,
  repo: ComposerFileRepository,
  stackRepo: StackFileRepository,
  serviceRepo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const props = await askCreateOrUpdateProps(options);
  const input = new CreateComposerInput(props);
  const uc = new CreateComposerUseCase(
    repo,
    stackRepo,
    serviceRepo,
    sharedConfigRepo
  );
  try {
    const output = await uc.execute(input);
    console.log('✅ Composer created:', output);
  } catch (error) {
    console.error('❌ Error on create Composer:', error.message);
  }
}

async function handleUpdate(
  options: ComposerGeneratorSchema,
  repo: ComposerFileRepository,
  stackRepo: StackFileRepository,
  serviceRepo: ServiceFileRepository,
  sharedConfigRepo: SharedConfigFileRepository
) {
  const id = options.id ?? (await askForId());
  let props = await askCreateOrUpdateProps(options);
  props = {
    ...props,
    id,
  };
  const input = new UpdateComposerInput(props);
  const uc = new UpdateComposerUseCase(
    repo,
    stackRepo,
    serviceRepo,
    sharedConfigRepo
  );
  try {
    const output = await uc.execute(input);
    console.log('✅ Composer updated:', output);
  } catch (error) {
    console.error('❌ Error on update Composer:', error.message);
  }
}

async function handleGet(
  options: ComposerGeneratorSchema,
  repo: ComposerFileRepository
) {
  const name = options.name ?? (await askForName());
  const input = new GetComposerInput({ name });
  const uc = new GetComposerUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Composer found:', output);
  } catch (error) {
    console.error('❌ Error on get Composer:', error.message);
  }
}

async function handleDelete(
  options: ComposerGeneratorSchema,
  repo: ComposerFileRepository
) {
  const id = options.id ?? (await askForId());
  const input = new DeleteComposerInput({ id });
  const uc = new DeleteComposerUseCase(repo);
  try {
    await uc.execute(input);
    console.log('✅ Composer deleted');
  } catch (error) {
    console.error('❌ Error on delete Composer:', error.message);
  }
}

async function handleList(
  options: ComposerGeneratorSchema,
  repo: ComposerFileRepository
) {
  const input = new ListComposerInput({});
  const uc = new ListComposerUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ Composers found:', output);
  } catch (error) {
    console.error('❌ Error on list Composers:', error.message);
  }
}

export default composerGenerator;
