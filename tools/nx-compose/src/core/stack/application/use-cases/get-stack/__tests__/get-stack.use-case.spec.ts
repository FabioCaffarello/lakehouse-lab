import { GetStackUseCase } from '../get-stack.use-case';
import { StackSearchParams } from '../../../../domain/stack.repository';
import { NotFoundError } from '../../../../../common/domain/errors/not-found.error';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { Stack } from '../../../../domain/stack.aggregate';
import { StackOutputMapper } from '../../common/stack.output';

describe('GetStackUseCase Unit Tests', () => {
  let repository: { search: jest.Mock };
  let useCase: GetStackUseCase;

  beforeEach(() => {
    repository = { search: jest.fn() };
    useCase = new GetStackUseCase(repository as any);
  });

  it('should throw NotFoundError if no stack matches the filter', async () => {
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
      new StackSearchParams({ filter: 'nonexistent', per_page: 1 })
    );
  });

  it('should return StackOutput when a matching stack is found', async () => {
    const entity = Stack.fake().aStack().withName(new Name('my-stack')).build();
    const mockResult = {
      items: [entity],
      total: 1,
      current_page: 1,
      per_page: 1,
    };
    repository.search.mockResolvedValue(mockResult);

    const input = { name: 'my-stack' };
    const output = await useCase.execute(input);

    expect(output).toStrictEqual(StackOutputMapper.toOutput(entity));
    expect(repository.search).toHaveBeenCalledWith(
      new StackSearchParams({ filter: 'my-stack', per_page: 1 })
    );
  });
});
