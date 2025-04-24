import { ListServiceUseCase } from '../list-service.use-case';
import {
  ServiceSearchParams,
  ServiceSearchResult,
  IServiceRepository,
} from '../../../../domain/service.repository';
import { Service } from '../../../../domain/service.aggregate';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { ServiceOutputMapper } from '../../common/service.output';

describe('ListServiceUseCase Unit Tests', () => {
  let repository: jest.Mocked<IServiceRepository>;
  let useCase: ListServiceUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as any;
    useCase = new ListServiceUseCase(repository);
  });

  it('should return empty pagination when repository has no items', async () => {
    const emptyResult = new ServiceSearchResult({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(emptyResult);

    const output = await useCase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new ServiceSearchParams({
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

  it('should map repository items into ServiceOutput and pagination', async () => {
    const service1 = Service.fake()
      .aService()
      .withName(new Name('service1'))
      .build();
    const service2 = Service.fake()
      .aService()
      .withName(new Name('service2'))
      .build();
    const mockResult = new ServiceSearchResult({
      items: [service1, service2],
      total: 2,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(mockResult);

    const output = await useCase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new ServiceSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    );
    expect(output).toEqual({
      items: [
        ServiceOutputMapper.toOutput(service1),
        ServiceOutputMapper.toOutput(service2),
      ],
      total: 2,
      current_page: 1,
      last_page: 1,
      per_page: 10,
    });
  });
});
