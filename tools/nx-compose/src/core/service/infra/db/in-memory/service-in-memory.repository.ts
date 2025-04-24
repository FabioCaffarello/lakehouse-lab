import { SortDirection } from '../../../../common/domain/repository/search-params';
import { InMemorySearchableRepository } from '../../../../common/infra/db/in-memory/in-memory.repository';
import { Service, ServiceId } from '../../../domain/service.aggregate';
import {
  ServiceFilter,
  IServiceRepository,
} from '../../../domain/service.repository';

export class ServiceInMemoryRepository
  extends InMemorySearchableRepository<Service, ServiceId>
  implements IServiceRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  protected async applyFilter(
    items: Service[],
    filter: ServiceFilter | null
  ): Promise<Service[]> {
    if (!filter) {
      return items;
    }

    return items.filter((i) => {
      return i.name.toLowerCase().includes(filter.toLowerCase());
    });
  }
  getEntity(): new (...args: any[]) => Service {
    return Service;
  }

  protected applySort(
    items: Service[],
    sort: string | null,
    sort_dir: SortDirection | null
  ) {
    return sort
      ? super.applySort(items, sort, sort_dir, (sort, item) => {
          if (sort === 'name') return item.name.value;
          return item[sort as keyof Service];
        })
      : super.applySort(items, 'created_at', 'desc');
  }
}
