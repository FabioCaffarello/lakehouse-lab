import { ListSharedConfigUseCase } from '../list-shared-config.use-case';
import {
  SharedConfigSearchParams,
  SharedConfigSearchResult,
  ISharedConfigRepository,
} from '../../../../domain/shared-config.repository';
import { SharedConfig } from '../../../../domain/shared-config.aggregate';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { SharedConfigOutputMapper } from '../../common/shared-config.output';

describe('ListSharedConfigUseCase Unit Tests', () => {
  let useCase: ListSharedConfigUseCase;
  let repo: jest.Mocked<ISharedConfigRepository>;

  beforeEach(() => {
    repo = {
      search: jest.fn(),
    } as any;
    useCase = new ListSharedConfigUseCase(repo);
  });

  it('should return empty pagination when repository has no items', async () => {
    const emptyResult = new SharedConfigSearchResult({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 10,
    });
    repo.search.mockResolvedValue(emptyResult);

    const output = await useCase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repo.search).toHaveBeenCalledWith(
      new SharedConfigSearchParams({
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

  it('should map repository items into SharedConfigOutput and pagination', async () => {
    const cfg1 = SharedConfig.create({
      name: new Name('cfg1'),
      templates: ['t1.yaml'],
      appliesTo: ['svc1'],
    });
    const cfg2 = SharedConfig.create({
      name: new Name('cfg2'),
      templates: ['t2.yaml'],
      appliesTo: ['svc2'],
    });
    const total = 5,
      page = 2,
      per_page = 2;
    const result = new SharedConfigSearchResult({
      items: [cfg1, cfg2],
      total,
      current_page: page,
      per_page,
    });
    repo.search.mockResolvedValue(result);

    const output = await useCase.execute({
      page,
      per_page,
      sort: 'name',
      sort_dir: 'asc',
      filter: 'cfg',
    });

    expect(repo.search).toHaveBeenCalledWith(
      new SharedConfigSearchParams({
        page,
        per_page,
        sort: 'name',
        sort_dir: 'asc',
        filter: 'cfg',
      })
    );

    const expectedItems = [cfg1, cfg2].map((i) =>
      SharedConfigOutputMapper.toOutput(i)
    );
    expect(output).toEqual({
      items: expectedItems,
      total,
      current_page: page,
      last_page: Math.ceil(total / per_page),
      per_page,
    });
  });
});
