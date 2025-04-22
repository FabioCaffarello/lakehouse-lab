import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { SharedConfigId } from '../../../domain/shared-config.aggregate';
import { ISharedConfigRepository } from '../../../domain/shared-config.repository';

export class DeleteSharedConfigUseCase
  implements IUseCase<DeleteSharedConfigInput, DeleteSharedConfigOutput>
{
  constructor(private repository: ISharedConfigRepository) {}

  async execute(
    input: DeleteSharedConfigInput
  ): Promise<DeleteSharedConfigOutput> {
    const entityId = new SharedConfigId(input.id);
    await this.repository.delete(entityId);
  }
}

export type DeleteSharedConfigInput = {
  id: string;
};

export type DeleteSharedConfigOutput = void;
