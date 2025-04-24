import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import {
  ComposerOutput,
  ComposerOutputMapper,
} from '../common/composer.output';
import { Composer, ComposerId } from '../../../domain/composer.aggregate';
import {
  IComposerRepository,
  ComposerSearchParams,
} from '../../../domain/composer.repository';

export class GetComposerUseCase
  implements IUseCase<GetComposerInput, GetComposerOutput>
{
  constructor(private repository: IComposerRepository) {}

  async execute(input: GetComposerInput): Promise<GetComposerOutput> {
    const params = new ComposerSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const result = await this.repository.search(params);

    if (result.items.length === 0) {
      throw new NotFoundError(input.name, Composer);
    }

    const found = result.items[0];
    return ComposerOutputMapper.toOutput(found);
  }
}

export type GetComposerInput = {
  name: string;
};

export type GetComposerOutput = ComposerOutput;
