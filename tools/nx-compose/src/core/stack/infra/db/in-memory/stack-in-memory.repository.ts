import { SortDirection } from '../../../../common/domain/repository/search-params';
import { InMemorySearchableRepository } from '../../../../common/infra/db/in-memory/in-memory.repository';
import { StackId, Stack } from '../../../domain/stack.aggregate';
import {
  StackFilter,
  IStackRepository,
} from '../../../domain/stack.repository';

export class StackInMemoryRepository
  extends InMemorySearchableRepository<Stack, StackId>
  implements IStackRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  protected async applyFilter(
    items: Stack[],
    filter: StackFilter | null
  ): Promise<Stack[]> {
    if (!filter) {
      return items;
    }

    return items.filter((i) => {
      return i.name.toLowerCase().includes(filter.toLowerCase());
    });
  }
  getEntity(): new (...args: any[]) => Stack {
    return Stack;
  }

  protected applySort(
    items: Stack[],
    sort: string | null,
    sort_dir: SortDirection | null
  ) {
    return sort
      ? super.applySort(items, sort, sort_dir, (sort, item) => {
          if (sort === 'name') return item.name.value;
          return item[sort as keyof Stack];
        })
      : super.applySort(items, 'created_at', 'desc');
  }
}
