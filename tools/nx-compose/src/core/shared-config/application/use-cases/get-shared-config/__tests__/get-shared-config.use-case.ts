import { GetSharedConfigUseCase } from '../get-shared-config.use-case';
import { SharedConfigSearchParams } from '../../../domain/shared-config.repository';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { SharedConfig } from '../../../domain/shared-config.aggregate';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { SharedConfigOutputMapper } from '../../common/shared-config.output';

describe('GetSharedConfigUseCase Unit Tests', () => {
  let repository: { search: jest.Mock };
  let useCase: GetSharedConfigUseCase;

  beforeEach(() => {
    repository = { search: jest.fn() };
    useCase = new GetSharedConfigUseCase(repository as any);
  });

  it('should throw NotFoundError if no shared config matches the filter', async () => {
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
      new SharedConfigSearchParams({ filter: 'nonexistent', per_page: 1 })
    );
  });

  it('should return SharedConfigOutput when a matching config is found', async () => {
    const entity = SharedConfig.create({
      name: new Name('my-cfg'),
      templates: ['template.yaml'],
      appliesTo: ['service1'],
    });
    const mockResult = {
      items: [entity],
      total: 1,
      current_page: 1,
      per_page: 1,
    };
    repository.search.mockResolvedValue(mockResult);

    const input = { name: 'my-cfg' };
    const output = await useCase.execute(input);

    expect(output).toStrictEqual(SharedConfigOutputMapper.toOutput(entity));
    expect(repository.search).toHaveBeenCalledWith(
      new SharedConfigSearchParams({ filter: 'my-cfg', per_page: 1 })
    );
  });
});
