import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { ComposerId } from '../../../domain/composer.aggregate';
import { IComposerRepository } from '../../../domain/composer.repository';

export class DeleteComposerUseCase
  implements IUseCase<DeleteComposerInput, DeleteComposerOutput>
{
  constructor(private repository: IComposerRepository) {}

  async execute(input: DeleteComposerInput): Promise<DeleteComposerOutput> {
    const entityId = new ComposerId(input.id);
    await this.repository.delete(entityId);
  }
}

export type DeleteComposerInput = {
  id: string;
};

export type DeleteComposerOutput = void;
