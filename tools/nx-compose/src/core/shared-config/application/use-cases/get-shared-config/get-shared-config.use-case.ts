import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import {
  SharedConfigOutput,
  SharedConfigOutputMapper,
} from '../common/shared-config.output';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../domain/shared-config.aggregate';
import { ISharedConfigRepository } from '../../../domain/shared-config.repository';
import { SharedConfigSearchParams } from '../../../domain/shared-config.repository';

export class GetSharedConfigUseCase
  implements IUseCase<GetSharedConfidInput, GetSharedConfigOutput>
{
  constructor(private repository: ISharedConfigRepository) {}

  async execute(input: GetSharedConfidInput): Promise<GetSharedConfigOutput> {
    const params = new SharedConfigSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const entity = await this.repository.search(params);

    if (!entity) {
      throw new NotFoundError(input.name, SharedConfig);
    }

    return SharedConfigOutputMapper.toOutput(entity);
  }
}

export type GetSharedConfidInput = {
  name: string;
};

export type GetSharedConfigOutput = SharedConfigOutput;
