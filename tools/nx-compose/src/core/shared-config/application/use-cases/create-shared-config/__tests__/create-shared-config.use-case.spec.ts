import { SharedConfigInMemoryRepository } from '../../../../infra/db/in-memory/shared-config-in-memory.repository';
import { CreateSharedConfigUseCase } from '../create-shared-config.use-case';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { SharedConfig } from '../../../../domain/shared-config.aggregate';
import { CreateSharedConfigInput } from '../create-shared-config.input';

describe('CreateSharedConfigUseCase Unit Tests', () => {
  let useCase: CreateSharedConfigUseCase;
  let repository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new SharedConfigInMemoryRepository();
    useCase = new CreateSharedConfigUseCase(repository);
  });

  it('should throw an error when aggregate is not valid', async () => {
    const input = {
      name: 't'.repeat(256),
      templates: ['template.yaml'],
      appliesTo: ['some-service'],
    } as CreateSharedConfigInput;

    await expect(() => useCase.execute(input)).rejects.toThrowError(
      'Name must be less than 256 characters'
    );
  });

  it('should create a valid shared config', async () => {
    const input = {
      name: 'my-config',
      templates: ['template.yaml'],
      appliesTo: ['my-service'],
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['bridge'],
    } as CreateSharedConfigInput;

    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      name: 'my-config',
      templates: ['template.yaml'],
      appliesTo: ['my-service'],
      environment: { NODE_ENV: 'production' },
      volumes: ['vol:/data'],
      networks: ['bridge'],
      created_at: expect.any(Date),
    });
  });

  it('should throw an error when name already exists', async () => {
    const input = {
      name: 'duplicate-name',
      templates: ['a.yaml'],
      appliesTo: ['svc1'],
      environment: {},
      volumes: [],
      networks: [],
      created_at: expect.any(Date),
    } as CreateSharedConfigInput;

    const existing = SharedConfig.create({
      name: new Name(input.name),
      templates: input.templates,
      appliesTo: input.appliesTo,
      environment: input.environment,
      volumes: input.volumes,
      networks: input.networks,
    });
    await repository.insert(existing);

    await expect(() => useCase.execute(input)).rejects.toThrowError(
      EntityValidationError
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      error: [{ name: ['Name must be unique'] }],
    });
  });
});
