import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';
import { UpdateStackUseCase } from '../update-stack.use-case';
import { UpdateStackInput } from '../update-stack.input';
import { Stack, StackId } from '../../../../domain/stack.aggregate';
import { StackInMemoryRepository } from '../../../../infra/db/in-memory/stack-in-memory.repository';
import { ServiceInMemoryRepository } from '../../../../../service/infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import {
  Name,
  InvalidNameError,
} from '../../../../../common/domain/value-objects/name.vo';

describe('UpdateStackUseCase Unit Tests', () => {
  let usecase: UpdateStackUseCase;
  let repository: StackInMemoryRepository;
  let serviceRepository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new StackInMemoryRepository();
    serviceRepository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new UpdateStackUseCase(
      repository,
      serviceRepository,
      sharedConfigRepository
    );
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() =>
      usecase.execute({ id: 'not-a-uuid' } as UpdateStackInput)
    ).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when entity does not exist', async () => {
    const validId = new StackId().id;
    await expect(() =>
      usecase.execute({ id: validId } as UpdateStackInput)
    ).rejects.toThrow(NotFoundError);
  });

  it('should update only the provided fields and persist', async () => {
    const entity = Stack.create({
      name: new Name('orig'),
      environment: {},
      volumes: [],
      networks: [],
    });
    repository.items = [entity];

    const spy = jest.spyOn(repository, 'update');

    const input = {
      id: entity.stack_id.id,
      name: 'new-name',
    } as UpdateStackInput;

    const output = await usecase.execute(input);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        stack_id: entity.stack_id,
        name: new Name('new-name'),
      })
    );
    expect(output).toMatchObject({
      id: entity.stack_id.id,
      name: 'new-name',
    });
  });
});
