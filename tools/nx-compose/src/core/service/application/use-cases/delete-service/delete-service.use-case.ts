import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { ServiceId } from '../../../domain/service.aggregate';
import { IServiceRepository } from '../../../domain/service.repository';

export class DeleteServiceUseCase
  implements IUseCase<DeleteServiceInput, DeleteServiceOutput>
{
  constructor(private repository: IServiceRepository) {}

  async execute(input: DeleteServiceInput): Promise<DeleteServiceOutput> {
    const entityId = new ServiceId(input.id);
    await this.repository.delete(entityId);
  }
}

export type DeleteServiceInput = {
  id: string;
};

export type DeleteServiceOutput = void;
