import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../common/application/pagination/pagination-output';
import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { SortDirection } from '../../../../common/domain/repository/search-params';
import {
  SharedConfigFilter,
  SharedConfigSearchParams,
  SharedConfigSearchResult,
  ISharedConfigRepository,
} from '../../../domain/shared-config.repository';
import {
  SharedConfigOutput,
  SharedConfigOutputMapper,
} from '../common/shared-config.output';

export class ListSharedConfigUseCase
  implements IUseCase<ListSharedConfigInput, ListSharedConfigOutput>
{
  constructor(private repository: ISharedConfigRepository) {}

  async execute(input: ListSharedConfigInput): Promise<ListSharedConfigOutput> {
    const searchParams = new SharedConfigSearchParams(input);
    const result = await this.repository.search(searchParams);

    return this.toOutput(result);
  }

  private toOutput(
    searchResult: SharedConfigSearchResult
  ): ListSharedConfigOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return SharedConfigOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListSharedConfigInput = {
  page?: number;
  per_page?: number;
  sort?: string | null;
  sort_dir?: SortDirection | null;
  filter?: SharedConfigFilter | null;
};

export type ListSharedConfigOutput = PaginationOutput<SharedConfigOutput>;
