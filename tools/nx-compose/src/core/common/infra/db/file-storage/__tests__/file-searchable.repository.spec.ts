import { join } from 'path';
import { promises as fs } from 'fs';
import { FileSearchableRepository } from '../file-searchable.repository';
import { Entity } from '../../../../domain/entity';
import { ValueObject } from '../../../../domain/value-object';
import { Uuid } from '../../../../domain/value-objects/uuid.vo';
import { SearchParams } from '../../../../domain/repository/search-params';

class ItemId extends Uuid {}
class Item extends Entity {
  constructor(public id: ItemId, public name: string, public rank: number) {
    super();
  }
  get entity_id(): ValueObject {
    return this.id;
  }
  toJSON() {
    return { id: this.id.toString(), name: this.name, rank: this.rank };
  }
}

class ItemFileRepo extends FileSearchableRepository<Item, ItemId, string> {
  sortableFields = ['name', 'rank'];
  constructor(path: string) {
    super(path);
  }
  protected toEntity(raw: any): Item {
    return new Item(new ItemId(raw.id), raw.name, raw.rank);
  }
  protected getIdKey(): string {
    return 'id';
  }
  protected async applyFilter(
    items: Item[],
    filter: string | null
  ): Promise<Item[]> {
    if (!filter) return items;
    return items.filter((i) => i.name.includes(filter));
  }
  getEntity(): new (...args: any[]) => Item {
    return Item;
  }
}

describe('FileSearchableRepository (search)', () => {
  const TMP = join(process.cwd(), '.tmp', 'items.json');
  let repo: ItemFileRepo;

  beforeEach(async () => {
    await fs.rm(TMP, { force: true, recursive: true });
    repo = new ItemFileRepo(TMP);
  });

  it('should insert and paginate', async () => {
    for (let i = 1; i <= 30; i++) {
      await repo.insert(new Item(new ItemId(), `it${i}`, i));
    }
    const sp1 = new SearchParams<string>({ page: 1, per_page: 10 });
    const r1 = await repo.search(sp1);
    expect(r1.items).toHaveLength(10);
    expect(r1.total).toBe(30);
    expect(r1.current_page).toBe(1);
    expect(r1.last_page).toBe(3);
  });

  it('should filter by name substring', async () => {
    await repo.bulkInsert([
      new Item(new ItemId(), 'apple', 1),
      new Item(new ItemId(), 'banana', 2),
      new Item(new ItemId(), 'apricot', 3),
    ]);
    const sp = new SearchParams<string>({ filter: 'ap', page: 1 });
    const r = await repo.search(sp);
    const names = r.items.map((i) => i.name);
    expect(names.sort()).toEqual(['apple', 'apricot'].sort());
  });

  it('should sort by rank desc when no sort provided', async () => {
    await repo.bulkInsert([
      new Item(new ItemId(), 'a', 10),
      new Item(new ItemId(), 'b', 20),
      new Item(new ItemId(), 'c', 5),
    ]);
    const spAsc = new SearchParams<string>({
      sort: 'rank',
      sort_dir: 'asc',
      page: 1,
    });
    const asc = await repo.search(spAsc);
    expect(asc.items.map((i) => i.rank)).toEqual([5, 10, 20]);
    const spDesc = new SearchParams<string>({
      sort: 'rank',
      sort_dir: 'desc',
      page: 1,
    });
    const desc = await repo.search(spDesc);
    expect(desc.items.map((i) => i.rank)).toEqual([20, 10, 5]);
  });
});
