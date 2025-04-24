import { Service } from '../../../domain/service.aggregate';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { ServiceInMemoryRepository } from './service-in-memory.repository';

describe('ServiceInMemoryRepository', () => {
  let repository: ServiceInMemoryRepository;

  beforeEach(() => (repository = new ServiceInMemoryRepository()));
  it('should no filter items when filter object is null', async () => {
    const items = [Service.fake().aService().build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(filterSpy).not.toHaveBeenCalled();
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items using filter parameter', async () => {
    const items = [
      Service.fake().aService().withName(new Name('test')).build(),
      Service.fake().aService().withName(new Name('TEST')).build(),
      Service.fake().aService().withName(new Name('fake')).build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, 'TEST');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();

    const items = [
      Service.fake()
        .aService()
        .withName(new Name('test'))
        .withCreatedAt(created_at)
        .build(),
      Service.fake()
        .aService()
        .withName(new Name('TEST'))
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      Service.fake()
        .aService()
        .withName(new Name('fake'))
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];

    const itemsSorted = await repository['applySort'](items, null, null);
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('should sort by name', async () => {
    const items = [
      Service.fake().aService().withName(new Name('c1')).build(),
      Service.fake().aService().withName(new Name('b1')).build(),
      Service.fake().aService().withName(new Name('a1')).build(),
    ];

    let itemsSorted = await repository['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repository['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
