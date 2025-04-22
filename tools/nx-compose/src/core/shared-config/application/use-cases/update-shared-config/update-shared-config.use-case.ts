import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../domain/shared-config.aggregate';
import { ISharedConfigRepository } from '../../../domain/shared-config.repository';
import {
  SharedConfigOutput,
  SharedConfigOutputMapper,
} from '../common/shared-config.output';
import { UpdateSharedConfigInput } from './update-shared-config.input';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class UpdateSharedConfigUseCase
  implements IUseCase<UpdateSharedConfigInput, UpdateSharedConfigOutput>
{
  constructor(private repository: ISharedConfigRepository) {}

  async execute(
    input: UpdateSharedConfigInput
  ): Promise<UpdateSharedConfigOutput> {
    const entityId = new SharedConfigId(input.id);
    const entity = await this.repository.findById(entityId);

    if (!entity) {
      throw new NotFoundError(input.id, SharedConfig);
    }

    if (input.name !== undefined) {
      entity.changeName(new Name(input.name));
    }
    if (input.templates !== undefined) {
      entity.changeTemplates(input.templates);
    }
    if (input.environment !== undefined) {
      entity.changeEnvironment(input.environment);
    }
    if (input.volumes !== undefined) {
      entity.changeVolumes(input.volumes);
    }
    if (input.networks !== undefined) {
      entity.changeNetworks(input.networks);
    }
    if (input.appliesTo !== undefined) {
      entity.changeAppliesTo(input.appliesTo);
    }

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.update(entity);

    return SharedConfigOutputMapper.toOutput(entity);
  }
}

export type UpdateSharedConfigOutput = SharedConfigOutput;
