import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../common/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';
import { UpdateServiceUseCase } from '../update-service.use-case';
import { UpdateServiceInput } from '../update-service.input';
import { Service, ServiceId } from '../../../../domain/service.aggregate';
import { ServiceInMemoryRepository } from '../../../../infra/db/in-memory/service-in-memory.repository';
import { SharedConfigInMemoryRepository } from '../../../../../shared-config/infra/db/in-memory/shared-config-in-memory.repository';
import {
  Name,
  InvalidNameError,
} from '../../../../../common/domain/value-objects/name.vo';

describe('UpdateServiceUseCase Unit Tests', () => {
  let usecase: UpdateServiceUseCase;
  let repository: ServiceInMemoryRepository;
  let sharedConfigRepository: SharedConfigInMemoryRepository;

  beforeEach(() => {
    repository = new ServiceInMemoryRepository();
    sharedConfigRepository = new SharedConfigInMemoryRepository();
    usecase = new UpdateServiceUseCase(repository, sharedConfigRepository);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() =>
      usecase.execute({ id: 'not-a-uuid' } as UpdateServiceInput)
    ).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when entity does not exist', async () => {
    const validId = new ServiceId().id;
    await expect(() =>
      usecase.execute({ id: validId } as UpdateServiceInput)
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw EntityValidationError when update payload is invalid', async () => {
    const entity = Service.create({
      name: new Name('orig'),
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
    });
    repository.items = [entity];

    await expect(() =>
      usecase.execute({
        id: entity.service_id.id,
        name: '',
      } as UpdateServiceInput)
    ).rejects.toThrow(InvalidNameError);
  });

  it('should update only the provided fields and persist', async () => {
    const entity = Service.create({
      name: new Name('orig-name'),
      templateFile: 'template.yaml',
      environment: {},
      volumes: [],
      networks: [],
    });
    repository.items = [entity];

    const spy = jest.spyOn(repository, 'update');

    const input = {
      id: entity.service_id.id,
      name: 'new-name',
      templateFile: 'new-template.yaml',
    } as UpdateServiceInput;

    const output = await usecase.execute(input);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        service_id: entity.service_id,
        name: new Name('new-name'),
        templateFile: 'new-template.yaml',
      })
    );
    expect(output).toMatchObject({
      id: entity.service_id.id,
      name: 'new-name',
      templateFile: 'new-template.yaml',
    });
  });
});
