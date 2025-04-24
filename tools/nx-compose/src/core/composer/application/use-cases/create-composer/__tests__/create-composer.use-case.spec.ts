import { ComposerInMemoryRepository } from '../../../../infra/db/in-memory/composer-in-memory.repository';
import { StackInMemoryRepository } from '../../../../../stack/infra/db/in-memory/stack-in-memory.repository';
import { ServiceInMemoryRepository } from '../../../../../service/infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import { CreateComposerUseCase } from '../create-composer.use-case';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Composer } from '../../../../domain/composer.aggregate';
import { Stack } from '../../../../../stack/domain/stack.aggregate';
import { Service } from '../../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../../shared-config/domain/shared-config.aggregate';
import { CreateComposerInput } from '../create-composer.input';

describe('CreateComposerUseCase Unit Tests', () => {
  let usecase: CreateComposerUseCase;
  let repository: ComposerInMemoryRepository;
  let stackRepository: StackInMemoryRepository;
  let serviceRepository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new ComposerInMemoryRepository();
    stackRepository = new StackInMemoryRepository();
    serviceRepository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new CreateComposerUseCase(
      repository,
      stackRepository,
      serviceRepository,
      sharedConfigRepository
    );
  });

  it('should create a valid composer', async () => {
    const input = {
      name: 'my-composer',
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
    } as CreateComposerInput;

    const output = await usecase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      name: 'my-composer',
      stacks: [],
      services: [],
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
      sharedConfigs: [],
      created_at: expect.any(Date),
    });
  });
});
