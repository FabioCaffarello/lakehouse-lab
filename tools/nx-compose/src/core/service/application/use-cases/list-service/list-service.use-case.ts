import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../common/application/pagination/pagination-output';
import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { SortDirection } from '../../../../common/domain/repository/search-params';
import {
  ServiceFilter,
  ServiceSearchParams,
  ServiceSearchResult,
  IServiceRepository,
} from '../../../domain/service.repository';
import { ServiceOutput, ServiceOutputMapper } from '../common/service.output';

export class ListServiceUseCase
  implements IUseCase<ListServiceInput, ListServiceOutput>
{
  constructor(private repository: IServiceRepository) {}

  async execute(input: ListServiceInput): Promise<ListServiceOutput> {
    const searchParams = new ServiceSearchParams(input);
    const result = await this.repository.search(searchParams);

    return this.toOutput(result);
  }

  private toOutput(searchResult: ServiceSearchResult): ListServiceOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return ServiceOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListServiceInput = {
  page?: number;
  per_page?: number;
  sort?: string | null;
  sort_dir?: SortDirection | null;
  filter?: ServiceFilter | null;
};

export type ListServiceOutput = PaginationOutput<ServiceOutput>;
