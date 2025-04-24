import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../../domain/shared-config.aggregate';
import { SharedConfigInMemoryRepository } from '../../../../infra/db/in-memory/shared-config-in-memory.repository';
import { UpdateSharedConfigUseCase } from '../update-shared-config.use-case';
import {
  Name,
  InvalidNameError,
} from '../../../../../common/domain/value-objects/name.vo';

describe('UpdateSharedConfigUseCase Unit Tests', () => {
  let repository: SharedConfigInMemoryRepository;
  let useCase: UpdateSharedConfigUseCase;

  beforeEach(() => {
    repository = new SharedConfigInMemoryRepository();
    useCase = new UpdateSharedConfigUseCase(repository);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() => useCase.execute({ id: 'not-a-uuid' })).rejects.toThrow(
      InvalidUuidError
    );
  });

  it('should throw NotFoundError when entity does not exist', async () => {
    const validId = new SharedConfigId().id;
    await expect(() => useCase.execute({ id: validId })).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw EntityValidationError when update payload is invalid', async () => {
    const entity = SharedConfig.create({
      name: new Name('orig'),
      templates: ['t1.yaml'],
      appliesTo: ['svc1'],
    });
    repository.items = [entity];

    await expect(() =>
      useCase.execute({ id: entity.shared_config_id.id, name: '' })
    ).rejects.toThrow(InvalidNameError);
  });

  it('should update only the provided fields and persist', async () => {
    const entity = SharedConfig.create({
      name: new Name('orig-name'),
      templates: ['t1.yaml'],
      appliesTo: ['svc1'],
    });
    repository.items = [entity];

    const spy = jest.spyOn(repository, 'update');

    const input = {
      id: entity.shared_config_id.id,
      name: 'new-name',
      templates: ['t2.yaml', 't3.yml'],
      appliesTo: ['svc2', 'svc3'],
      volumes: ['data:/data'],
      networks: ['net1'],
      environment: { FOO: 'BAR' },
    };

    const output = await useCase.execute(input);

    expect(entity.name.value).toBe('new-name');
    expect(entity.templates).toEqual(['t2.yaml', 't3.yml']);
    expect(entity.appliesTo).toEqual(['svc2', 'svc3']);
    expect(entity.volumes).toEqual(['data:/data']);
    expect(entity.networks).toEqual(['net1']);
    expect(entity.environment).toEqual({ FOO: 'BAR' });

    expect(spy).toHaveBeenCalledWith(entity);

    expect(output).toMatchObject({
      id: entity.shared_config_id.id,
      name: 'new-name',
      templates: ['t2.yaml', 't3.yml'],
      appliesTo: ['svc2', 'svc3'],
      environment: { FOO: 'BAR' },
      volumes: ['data:/data'],
      networks: ['net1'],
      created_at: entity.created_at,
    });
  });
});
