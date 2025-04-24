import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { SharedConfig } from '../../../domain/shared-config.aggregate';
import { ISharedConfigRepository } from '../../../domain/shared-config.repository';
import {
  SharedConfigOutput,
  SharedConfigOutputMapper,
} from '../common/shared-config.output';
import { SharedConfigSearchParams } from '../../../domain/shared-config.repository';
import { CreateSharedConfigInput } from './create-shared-config.input';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class CreateSharedConfigUseCase
  implements IUseCase<CreateSharedConfigInput, CreateSharedConfigOutput>
{
  constructor(private readonly repository: ISharedConfigRepository) {}

  async execute(
    input: CreateSharedConfigInput
  ): Promise<CreateSharedConfigOutput> {
    const params = new SharedConfigSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const result = await this.repository.search(params);
    if (result.items.some((cfg) => cfg.name.value === input.name)) {
      throw new EntityValidationError([{ name: ['Name must be unique'] }]);
    }
    const entity = SharedConfig.create({
      name: new Name(input.name),
      templates: input.templates,
      environment: input.environment,
      volumes: input.volumes,
      networks: input.networks,
      appliesTo: input.appliesTo,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.insert(entity);

    return SharedConfigOutputMapper.toOutput(entity);
  }
}

export type CreateSharedConfigOutput = SharedConfigOutput;
