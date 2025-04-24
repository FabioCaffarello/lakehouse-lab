import { ServiceInMemoryRepository } from '../../../../infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import { CreateServiceUseCase } from '../create-service.use-case';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Service } from '../../../../domain/service.aggregate';
import { CreateServiceInput } from '../create-service.input';
import { SharedConfig } from '../../../../../shared-config/domain/shared-config.aggregate';

describe('CreateServiceUseCase Unit Tests', () => {
  let usecase: CreateServiceUseCase;
  let repository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new CreateServiceUseCase(repository, sharedConfigRepository);
  });

  it('should create a valid service', async () => {
    const input = {
      name: 'my-service',
      templateFile: 'template.yaml',
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
    } as CreateServiceInput;

    const output = await usecase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      name: 'my-service',
      templateFile: 'template.yaml',
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['template-network'],
      sharedConfigs: [],
      created_at: expect.any(Date),
    });
  });

  it('should throw an error when name already exists', async () => {
    const input = {
      name: 'duplicate-name',
      templateFile: 'a.yaml',
      environment: {},
      volumes: [],
      networks: [],
    } as CreateServiceInput;

    await usecase.execute(input);

    await expect(() => usecase.execute(input)).rejects.toThrowError(
      new EntityValidationError([{ name: ['Name must be unique'] }])
    );
  });

  it('should throw an error when name is invalid', async () => {
    const input = {
      name: 't'.repeat(256),
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
    } as CreateServiceInput;

    await expect(() => usecase.execute(input)).rejects.toThrowError(
      'Name must be less than 256 characters'
    );
  });

  it('should throw an error when shared config is not found', async () => {
    const input = {
      name: 'my-service',
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
      sharedConfigs: ['non-existing-config'],
    } as CreateServiceInput;

    await expect(() => usecase.execute(input)).rejects.toThrowError(
      'SharedConfig Not Found using ID non-existing-config'
    );
  });

  it('should create a service with shared configs', async () => {
    const sharedConfig = SharedConfig.fake()
      .aSharedConfig()
      .withName(new Name('my-shared-config'))
      .withTemplates(['template.yaml'])
      .build();
    await sharedConfigRepository.insert(sharedConfig);

    const input = {
      name: 'my-service',
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
      sharedConfigs: [sharedConfig.name.value],
    } as CreateServiceInput;

    const output = await usecase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      name: 'my-service',
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
      sharedConfigs: [sharedConfig.shared_config_id.id],
      created_at: expect.any(Date),
    });
  });
});
