import { ListStackUseCase } from '../list-stack.use-case';
import {
  StackSearchParams,
  StackSearchResult,
  IStackRepository,
} from '../../../../domain/stack.repository';
import { Stack } from '../../../../domain/stack.aggregate';
import { Name } from '../../../../../common/domain/value-objects/name.vo';
import { StackOutputMapper } from '../../common/stack.output';

describe('ListStackUseCase Unit Tests', () => {
  let repository: jest.Mocked<IStackRepository>;
  let useCase: ListStackUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as any;
    useCase = new ListStackUseCase(repository);
  });

  it('should return empty pagination when repository has no items', async () => {
    const emptyResult = new StackSearchResult({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(emptyResult);

    const output = await useCase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new StackSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    );
    expect(output).toEqual({
      items: [],
      total: 0,
      current_page: 1,
      last_page: 0,
      per_page: 10,
    });
  });

  it('should map repository items into StackOutput and pagination', async () => {
    const stack1 = Stack.fake().aStack().withName(new Name('stack1')).build();
    const stack2 = Stack.fake().aStack().withName(new Name('stack2')).build();
    const mockResult = new StackSearchResult({
      items: [stack1, stack2],
      total: 2,
      current_page: 1,
      per_page: 10,
    });
    repository.search.mockResolvedValue(mockResult);

    const output = await useCase.execute({
      page: 1,
      per_page: 10,
      sort: null,
      sort_dir: null,
      filter: null,
    });

    expect(repository.search).toHaveBeenCalledWith(
      new StackSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    );
    expect(output).toEqual({
      items: [
        StackOutputMapper.toOutput(stack1),
        StackOutputMapper.toOutput(stack2),
      ],
      total: 2,
      current_page: 1,
      last_page: 1,
      per_page: 10,
    });
  });
});
