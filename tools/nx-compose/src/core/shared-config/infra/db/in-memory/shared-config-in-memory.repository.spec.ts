import { SharedConfig } from '../../../domain/shared-config.aggregate';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { SharedConfigInMemoryRepository } from './shared-config-in-memory.repository';

describe('SharedConfigInMemoryRepository', () => {
  let repository: SharedConfigInMemoryRepository;

  beforeEach(() => (repository = new SharedConfigInMemoryRepository()));
  it('should no filter items when filter object is null', async () => {
    const items = [SharedConfig.fake().aSharedConfig().build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(filterSpy).not.toHaveBeenCalled();
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items using filter parameter', async () => {
    const items = [
      SharedConfig.fake().aSharedConfig().withName(new Name('test')).build(),
      SharedConfig.fake().aSharedConfig().withName(new Name('TEST')).build(),
      SharedConfig.fake().aSharedConfig().withName(new Name('fake')).build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, 'TEST');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();

    const items = [
      SharedConfig.fake()
        .aSharedConfig()
        .withName(new Name('test'))
        .withCreatedAt(created_at)
        .build(),
      SharedConfig.fake()
        .aSharedConfig()
        .withName(new Name('TEST'))
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      SharedConfig.fake()
        .aSharedConfig()
        .withName(new Name('fake'))
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];

    const itemsSorted = await repository['applySort'](items, null, null);
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('should sort by name', async () => {
    const items = [
      SharedConfig.fake().aSharedConfig().withName(new Name('c1')).build(),
      SharedConfig.fake().aSharedConfig().withName(new Name('b1')).build(),
      SharedConfig.fake().aSharedConfig().withName(new Name('a1')).build(),
    ];

    let itemsSorted = await repository['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repository['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
