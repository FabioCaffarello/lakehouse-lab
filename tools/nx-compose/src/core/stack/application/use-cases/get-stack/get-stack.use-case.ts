import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { StackOutput, StackOutputMapper } from '../common/stack.output';
import { Stack, StackId } from '../../../domain/stack.aggregate';
import {
  IStackRepository,
  StackSearchParams,
} from '../../../domain/stack.repository';

export class GetStackUseCase
  implements IUseCase<GetStackInput, GetStackOutput>
{
  constructor(private repository: IStackRepository) {}

  async execute(input: GetStackInput): Promise<GetStackOutput> {
    const params = new StackSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const result = await this.repository.search(params);

    if (result.items.length === 0) {
      throw new NotFoundError(input.name, Stack);
    }

    const found = result.items[0];
    return StackOutputMapper.toOutput(found);
  }
}

export type GetStackInput = {
  name: string;
};

export type GetStackOutput = StackOutput;
