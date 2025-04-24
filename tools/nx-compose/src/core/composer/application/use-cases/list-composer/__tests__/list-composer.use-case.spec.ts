import { ListComposerUseCase } from '../list-composer.use-case';
import {
  ComposerSearchParams,
  ComposerSearchResult,
  IComposerRepository,
} from '../../../../domain/composer.repository';
import { Composer } from '../../../../domain/composer.aggregate';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { ComposerOutputMapper } from '../../common/composer.output';

describe('ListComposerUseCase Unit Tests', () => {
  let repository: jest.Mocked<IComposerRepository>;
  let usecase: ListComposerUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as any;
    usecase = new ListComposerUseCase(repository);
  });

  it('should return empty pagination when repository has no items', async () => {
    const emptyResult = new ComposerSearchResult({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(emptyResult);

    const output = await usecase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new ComposerSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    );
    expect(output).toEqual({
      items: [],
      total: 0,
      current_page: 1,
      last_page: 0,
      per_page: 10,
    });
  });

  it('should map repository items into ComposerOutput and pagination', async () => {
    const composer1 = Composer.fake()
      .aComposer()
      .withName(new Name('composer1'))
      .build();
    const composer2 = Composer.fake()
      .aComposer()
      .withName(new Name('composer2'))
      .build();
    const mockResult = new ComposerSearchResult({
      items: [composer1, composer2],
      total: 2,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(mockResult);

    const output = await usecase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new ComposerSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    );
    expect(output).toEqual({
      items: [
        ComposerOutputMapper.toOutput(composer1),
        ComposerOutputMapper.toOutput(composer2),
      ],
      total: 2,
      current_page: 1,
      last_page: 1,
      per_page: 10,
    });
  });
});
