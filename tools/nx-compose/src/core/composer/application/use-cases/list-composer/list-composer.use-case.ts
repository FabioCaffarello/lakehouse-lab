import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../common/application/pagination/pagination-output';
import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { SortDirection } from '../../../../common/domain/repository/search-params';
import {
  ComposerFilter,
  ComposerSearchParams,
  ComposerSearchResult,
  IComposerRepository,
} from '../../../domain/composer.repository';
import {
  ComposerOutput,
  ComposerOutputMapper,
} from '../common/composer.output';

export class ListComposerUseCase
  implements IUseCase<ListComposerInput, ListComposerOutput>
{
  constructor(private repository: IComposerRepository) {}

  async execute(input: ListComposerInput): Promise<ListComposerOutput> {
    const searchParams = new ComposerSearchParams(input);
    const result = await this.repository.search(searchParams);

    return this.toOutput(result);
  }

  private toOutput(searchResult: ComposerSearchResult): ListComposerOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return ComposerOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListComposerInput = {
  page?: number;
  per_page?: number;
  sort?: string | null;
  sort_dir?: SortDirection | null;
  filter?: ComposerFilter | null;
};

export type ListComposerOutput = PaginationOutput<ComposerOutput>;
