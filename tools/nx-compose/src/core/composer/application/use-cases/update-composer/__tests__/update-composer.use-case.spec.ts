import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';
import { UpdateComposerUseCase } from '../update-composer.use-case';
import { UpdateComposerInput } from '../update-composer.input';
import { Composer, ComposerId } from '../../../../domain/composer.aggregate';
import { ComposerInMemoryRepository } from '../../../../infra/db/in-memory/composer-in-memory.repository';
import { StackInMemoryRepository } from '../../../../../stack/infra/db/in-memory/stack-in-memory.repository';
import { ServiceInMemoryRepository } from '../../../../../service/infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import {
  Name,
  InvalidNameError,
} from '../../../../../common/domain/value-objects/name.vo';

describe('UpdateComposerUseCase Unit Tests', () => {
  let usecase: UpdateComposerUseCase;
  let repository: ComposerInMemoryRepository;
  let stackRepository: StackInMemoryRepository;
  let serviceRepository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new ComposerInMemoryRepository();
    stackRepository = new StackInMemoryRepository();
    serviceRepository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new UpdateComposerUseCase(
      repository,
      stackRepository,
      serviceRepository,
      sharedConfigRepository
    );
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() =>
      usecase.execute({ id: 'not-a-uuid' } as UpdateComposerInput)
    ).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when entity does not exist', async () => {
    const validId = new ComposerId().id;
    await expect(() =>
      usecase.execute({ id: validId } as UpdateComposerInput)
    ).rejects.toThrow(NotFoundError);
  });

  it('should update only the provided fields and persist', async () => {
    const entity = Composer.create({
      name: new Name('orig'),
      environment: {},
      volumes: [],
      networks: [],
    });
    repository.items = [entity];

    const spy = jest.spyOn(repository, 'update');

    const input = {
      id: entity.composer_id.id,
      name: 'new-name',
    } as UpdateComposerInput;

    const output = await usecase.execute(input);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        composer_id: entity.composer_id,
        name: new Name('new-name'),
      })
    );
    expect(output).toMatchObject({
      id: entity.composer_id.id,
      name: 'new-name',
    });
  });
});
