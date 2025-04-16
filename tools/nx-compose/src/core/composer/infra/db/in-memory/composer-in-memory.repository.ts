import { SortDirection } from '../../../../common/domain/repository/search-params';
import { InMemorySearchableRepository } from '../../../../common/infra/db/in-memory/in-memory.repository';
import { Composer, ComposerId } from '../../../domain/composer.aggregate';
import {
  ComposerFilter,
  IComposerRepository,
} from '../../../domain/composer.repository';

export class ComposerInMemoryRepository
  extends InMemorySearchableRepository<Composer, ComposerId>
  implements IComposerRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  protected async applyFilter(
    items: Composer[],
    filter: ComposerFilter | null
  ): Promise<Composer[]> {
    if (!filter) {
      return items;
    }

    return items.filter((i) => {
      return i.name.toLowerCase().includes(filter.toLowerCase());
    });
  }
  getEntity(): new (...args: any[]) => Composer {
    return Composer;
  }

  protected applySort(
    items: Composer[],
    sort: string | null,
    sort_dir: SortDirection | null
  ) {
    return sort
      ? super.applySort(items, sort, sort_dir, (sort, item) => {
          if (sort === 'name') return item.name.value;
          return item[sort as keyof Composer];
        })
      : super.applySort(items, 'created_at', 'desc');
  }
}
