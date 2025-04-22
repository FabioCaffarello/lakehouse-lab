import { DeleteSharedConfigUseCase } from '../delete-shared-config.use-case';
import { SharedConfigId } from '../../../../domain/shared-config.aggregate';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';

describe('DeleteSharedConfigUseCase Unit Tests', () => {
  let repository: { delete: jest.Mock };
  let useCase: DeleteSharedConfigUseCase;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    useCase = new DeleteSharedConfigUseCase(repository as any);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() => useCase.execute({ id: 'invalid-uuid' })).rejects.toThrow(
      InvalidUuidError
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should call repository.delete with correct SharedConfigId', async () => {
    const id = new SharedConfigId().id;
    await expect(useCase.execute({ id })).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(new SharedConfigId(id));
  });

  it('should propagate NotFoundError from repository', async () => {
    const id = new SharedConfigId().id;
    const entityId = new SharedConfigId(id);
    const error = new NotFoundError(id, SharedConfigId as any);
    repository.delete.mockRejectedValue(error);

    await expect(useCase.execute({ id })).rejects.toThrow(NotFoundError);
    expect(repository.delete).toHaveBeenCalledWith(entityId);
  });
});
