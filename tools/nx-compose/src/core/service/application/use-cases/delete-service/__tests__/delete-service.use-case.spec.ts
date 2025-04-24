import { DeleteServiceUseCase } from '../delete-service.use-case';
import { ServiceId } from '../../../../domain/service.aggregate';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';

describe('DeleteServiceUseCase Unit Tests', () => {
  let repository: { delete: jest.Mock };
  let useCase: DeleteServiceUseCase;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    useCase = new DeleteServiceUseCase(repository as any);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() => useCase.execute({ id: 'invalid-uuid' })).rejects.toThrow(
      InvalidUuidError
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should call repository.delete with correct ServiceId', async () => {
    const id = new ServiceId().id;
    await expect(useCase.execute({ id })).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(new ServiceId(id));
  });

  it('should propagate NotFoundError from repository', async () => {
    const id = new ServiceId().id;
    const entityId = new ServiceId(id);
    const error = new NotFoundError(id, ServiceId as any);
    repository.delete.mockRejectedValue(error);

    await expect(useCase.execute({ id })).rejects.toThrow(NotFoundError);
    expect(repository.delete).toHaveBeenCalledWith(entityId);
  });
});
