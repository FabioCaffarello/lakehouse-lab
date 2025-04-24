import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../common/application/pagination/pagination-output';
import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { SortDirection } from '../../../../common/domain/repository/search-params';
import {
  StackFilter,
  StackSearchParams,
  StackSearchResult,
  IStackRepository,
} from '../../../domain/stack.repository';
import { StackOutput, StackOutputMapper } from '../common/stack.output';

export class ListStackUseCase
  implements IUseCase<ListStackInput, ListStackOutput>
{
  constructor(private repository: IStackRepository) {}

  async execute(input: ListStackInput): Promise<ListStackOutput> {
    const searchParams = new StackSearchParams(input);
    const result = await this.repository.search(searchParams);

    return this.toOutput(result);
  }

  private toOutput(searchResult: StackSearchResult): ListStackOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return StackOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListStackInput = {
  page?: number;
  per_page?: number;
  sort?: string | null;
  sort_dir?: SortDirection | null;
  filter?: StackFilter | null;
};

export type ListStackOutput = PaginationOutput<StackOutput>;
