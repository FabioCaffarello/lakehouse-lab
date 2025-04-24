import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { ServiceOutput, ServiceOutputMapper } from '../common/service.output';
import { Service, ServiceId } from '../../../domain/service.aggregate';
import {
  IServiceRepository,
  ServiceSearchParams,
} from '../../../domain/service.repository';

export class GetServiceUseCase
  implements IUseCase<GetServiceInput, GetServiceOutput>
{
  constructor(private repository: IServiceRepository) {}

  async execute(input: GetServiceInput): Promise<GetServiceOutput> {
    const params = new ServiceSearchParams({
      filter: input.name,
      per_page: 1,
    });
    console.debug('GetServiceUseCase: params', params);
    const result = await this.repository.search(params);
    console.debug('GetServiceUseCase: result', result);

    if (result.items.length === 0) {
      throw new NotFoundError(input.name, Service);
    }

    const found = result.items[0];
    return ServiceOutputMapper.toOutput(found);
  }
}

export type GetServiceInput = {
  name: string;
};

export type GetServiceOutput = ServiceOutput;
