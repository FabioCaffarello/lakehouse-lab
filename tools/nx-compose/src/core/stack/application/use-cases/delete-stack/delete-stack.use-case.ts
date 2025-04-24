import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { StackId } from '../../../domain/stack.aggregate';
import { IStackRepository } from '../../../domain/stack.repository';

export class DeleteStackUseCase
  implements IUseCase<DeleteStackInput, DeleteStackOutput>
{
  constructor(private repository: IStackRepository) {}

  async execute(input: DeleteStackInput): Promise<DeleteStackOutput> {
    const entityId = new StackId(input.id);
    await this.repository.delete(entityId);
  }
}

export type DeleteStackInput = {
  id: string;
};

export type DeleteStackOutput = void;
