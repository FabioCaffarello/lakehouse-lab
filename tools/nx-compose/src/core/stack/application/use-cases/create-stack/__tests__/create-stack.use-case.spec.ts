import { StackInMemoryRepository } from '../../../../infra/db/in-memory/stack-in-memory.repository';
import { ServiceInMemoryRepository } from '../../../../../service/infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import { CreateStackUseCase } from '../create-stack.use-case';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Stack } from '../../../../domain/stack.aggregate';
import { Service } from '../../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../../shared-config/domain/shared-config.aggregate';
import { CreateStackInput } from '../create-stack.input';

describe('CreateStackUseCase Unit Tests', () => {
  let usecase: CreateStackUseCase;
  let repository: StackInMemoryRepository;
  let serviceRepository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new StackInMemoryRepository();
    serviceRepository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new CreateStackUseCase(
      repository,
      serviceRepository,
      sharedConfigRepository
    );
  });

  it('should create a valid stack', async () => {
    const input = {
      name: 'my-stack',
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
    } as CreateStackInput;

    const output = await usecase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      name: 'my-stack',
      services: [],
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
      sharedConfigs: [],
      created_at: expect.any(Date),
    });
  });
});
