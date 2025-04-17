import { SharedConfigInMemoryRepository } from '../../../../infra/db/in-memory/shared-config-in-memory.repository';
import { CreateSharedConfigUseCase } from '../create-shared-config.use-case';
import { Name } from '../../../../../common/domain/value-objects/name.vo';

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
    };

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
    };

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
});
