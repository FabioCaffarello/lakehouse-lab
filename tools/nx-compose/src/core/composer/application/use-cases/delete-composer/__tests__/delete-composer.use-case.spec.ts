import { DeleteComposerUseCase } from '../delete-composer.use-case';
import { ComposerId } from '../../../../domain/composer.aggregate';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../common/domain/value-objects/uuid.vo';

describe('DeleteComposerUseCase Unit Tests', () => {
  let repository: { delete: jest.Mock };
  let usecase: DeleteComposerUseCase;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    usecase = new DeleteComposerUseCase(repository as any);
  });

  it('should throw InvalidUuidError when id is not a UUID', async () => {
    await expect(() => usecase.execute({ id: 'invalid-uuid' })).rejects.toThrow(
      InvalidUuidError
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should call repository.delete with correct ComposerId', async () => {
    const id = new ComposerId().id;
    await expect(usecase.execute({ id })).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(new ComposerId(id));
  });

  it('should propagate NotFoundError from repository', async () => {
    const id = new ComposerId().id;
    const entityId = new ComposerId(id);
    const error = new NotFoundError(id, ComposerId as any);
    repository.delete.mockRejectedValue(error);

    await expect(usecase.execute({ id })).rejects.toThrow(NotFoundError);
    expect(repository.delete).toHaveBeenCalledWith(entityId);
  });
});
