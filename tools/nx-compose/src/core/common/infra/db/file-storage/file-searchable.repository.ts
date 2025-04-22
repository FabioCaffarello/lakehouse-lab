import { FileRepository } from './file.repository';
import { ISearchableRepository } from '../../../domain/repository/repository-interface';
import { SearchParams } from '../../../domain/repository/search-params';
import { SearchResult } from '../../../domain/repository/search-result';
import { SortDirection } from '../../../domain/repository/search-params';
import { Entity } from '../../../domain/entity';
import { ValueObject } from '../../../domain/value-object';

export abstract class FileSearchableRepository<
    E extends Entity,
    EntityID extends ValueObject,
    Filter = string
  >
  extends FileRepository<E, EntityID>
  implements ISearchableRepository<E, EntityID, Filter>
{
  abstract sortableFields: string[];

  protected abstract applyFilter(
    items: E[],
    filter: Filter | null
  ): Promise<E[]>;

  protected applySort(
    items: E[],
    sort: string | null,
    sort_dir: SortDirection | null,
    customGetter?: (field: string, item: E) => any
  ): E[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }
    return [...items].sort((a, b) => {
      const aVal = customGetter ? customGetter(sort, a) : (a as any)[sort];
      const bVal = customGetter ? customGetter(sort, b) : (b as any)[sort];
      if (aVal < bVal) return sort_dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort_dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  protected applyPaginate(items: E[], page: number, per_page: number): E[] {
    const start = (page - 1) * per_page;
    return items.slice(start, start + per_page);
  }

  async search(props: SearchParams<Filter>): Promise<SearchResult<E>> {
    const all = await this.findAll();
    const filtered = await this.applyFilter(all, props.filter);
    const sorted = this.applySort(filtered, props.sort, props.sort_dir);
    const paginated = this.applyPaginate(sorted, props.page, props.per_page);
    return new SearchResult<E>({
      items: paginated,
      total: filtered.length,
      current_page: props.page,
      per_page: props.per_page,
    });
  }
}
