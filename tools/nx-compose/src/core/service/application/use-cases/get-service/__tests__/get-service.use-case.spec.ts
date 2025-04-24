import { GetServiceUseCase } from '../get-service.use-case';
import { ServiceSearchParams } from '../../../../domain/service.repository';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Service } from '../../../../domain/service.aggregate';
import { ServiceOutputMapper } from '../../common/service.output';

describe('GetServiceUseCase Unit Tests', () => {
  let repository: { search: jest.Mock };
  let useCase: GetServiceUseCase;

  beforeEach(() => {
    repository = { search: jest.fn() };
    useCase = new GetServiceUseCase(repository as any);
  });

  it('should throw NotFoundError if no service matches the filter', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 1,
    });

    await expect(() =>
      useCase.execute({ name: 'nonexistent' })
    ).rejects.toThrow(NotFoundError);

    expect(repository.search).toHaveBeenCalledWith(
      new ServiceSearchParams({ filter: 'nonexistent', per_page: 1 })
    );
  });

  it('should return ServiceOutput when a matching service is found', async () => {
    const entity = Service.fake()
      .aService()
      .withName(new Name('my-service'))
      .build();
    const mockResult = {
      items: [entity],
      total: 1,
      current_page: 1,
      per_page: 1,
    };
    repository.search.mockResolvedValue(mockResult);

    const input = { name: 'my-service' };
    const output = await useCase.execute(input);

    expect(output).toStrictEqual(ServiceOutputMapper.toOutput(entity));
    expect(repository.search).toHaveBeenCalledWith(
      new ServiceSearchParams({ filter: 'my-service', per_page: 1 })
    );
  });
});
