import { SortDirection } from '../../../../common/domain/repository/search-params';
import { InMemorySearchableRepository } from '../../../../common/infra/db/in-memory/in-memory.repository';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../domain/shared-config.aggregate';
import {
  SharedConfigFilter,
  ISharedConfigRepository,
} from '../../../domain/shared-config.repository';

export class SharedConfigInMemoryRepository
  extends InMemorySearchableRepository<SharedConfig, SharedConfigId>
  implements ISharedConfigRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  protected async applyFilter(
    items: SharedConfig[],
    filter: SharedConfigFilter | null
  ): Promise<SharedConfig[]> {
    if (!filter) {
      return items;
    }

    return items.filter((i) => {
      return i.name.toLowerCase().includes(filter.toLowerCase());
    });
  }
  getEntity(): new (...args: any[]) => SharedConfig {
    return SharedConfig;
  }

  protected applySort(
    items: SharedConfig[],
    sort: string | null,
    sort_dir: SortDirection | null
  ) {
    return sort
      ? super.applySort(items, sort, sort_dir, (sort, item) => {
          if (sort === 'name') return item.name.value;
          return item[sort as keyof SharedConfig];
        })
      : super.applySort(items, 'created_at', 'desc');
  }
}
