import { DeleteStackUseCase } from '../delete-stack.use-case';
import { StackId } from '../../../../domain/stack.aggregate';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';

describe('DeleteStackUseCase Unit Tests', () => {
  let repository: { delete: jest.Mock };
  let useCase: DeleteStackUseCase;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    useCase = new DeleteStackUseCase(repository as any);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() => useCase.execute({ id: 'invalid-uuid' })).rejects.toThrow(
      InvalidUuidError
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should call repository.delete with correct StackId', async () => {
    const id = new StackId().id;
    await expect(useCase.execute({ id })).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(new StackId(id));
  });

  it('should propagate NotFoundError from repository', async () => {
    const id = new StackId().id;
    const entityId = new StackId(id);
    const error = new NotFoundError(id, StackId as any);
    repository.delete.mockRejectedValue(error);

    await expect(useCase.execute({ id })).rejects.toThrow(NotFoundError);
    expect(repository.delete).toHaveBeenCalledWith(entityId);
  });
});
