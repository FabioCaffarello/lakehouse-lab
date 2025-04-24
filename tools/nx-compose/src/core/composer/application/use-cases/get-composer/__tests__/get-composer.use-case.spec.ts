import { GetComposerUseCase } from '../get-composer.use-case';
import { ComposerSearchParams } from '../../../../domain/composer.repository';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Composer } from '../../../../domain/composer.aggregate';
import { ComposerOutputMapper } from '../../common/composer.output';

describe('GetComposerUseCase Unit Tests', () => {
  let repository: { search: jest.Mock };
  let usecase: GetComposerUseCase;

  beforeEach(() => {
    repository = { search: jest.fn() };
    usecase = new GetComposerUseCase(repository as any);
  });

  it('should throw NotFoundError if no composer matches the filter', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 1,
    });

    await expect(() =>
      usecase.execute({ name: 'nonexistent' })
    ).rejects.toThrow(NotFoundError);

    expect(repository.search).toHaveBeenCalledWith(
      new ComposerSearchParams({ filter: 'nonexistent', per_page: 1 })
    );
  });

  it('should return ComposerOutput when a matching composer is found', async () => {
    const entity = Composer.fake()
      .aComposer()
      .withName(new Name('my-composer'))
      .build();
    const mockResult = {
      items: [entity],
      total: 1,
      current_page: 1,
      per_page: 1,
    };
    repository.search.mockResolvedValue(mockResult);

    const input = { name: 'my-composer' };
    const output = await usecase.execute(input);

    expect(output).toStrictEqual(ComposerOutputMapper.toOutput(entity));
    expect(repository.search).toHaveBeenCalledWith(
      new ComposerSearchParams({ filter: 'my-composer', per_page: 1 })
    );
  });
});
