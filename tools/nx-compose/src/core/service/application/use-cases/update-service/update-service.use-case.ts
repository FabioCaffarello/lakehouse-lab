import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { UpdateServiceInput } from './update-service.input';
import { ServiceOutput, ServiceOutputMapper } from '../common/service.output';
import { Service, ServiceId } from '../../../domain/service.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../../shared-config/domain/shared-config.aggregate';
import { IServiceRepository } from '../../../domain/service.repository';
import { ISharedConfigRepository } from '../../../../shared-config/domain/shared-config.repository';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class UpdateServiceUseCase
  implements IUseCase<UpdateServiceInput, UpdateServiceOutput>
{
  constructor(
    private readonly repository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: UpdateServiceInput): Promise<UpdateServiceOutput> {
    const entityId = new ServiceId(input.id);
    const entity = await this.repository.findById(entityId);

    if (!entity) {
      throw new NotFoundError(input.id, Service);
    }

    if (input.name !== undefined) {
      entity.changeName(new Name(input.name));
    }

    if (input.image !== undefined) {
      entity.changeImage(input.image);
    }

    if (input.environment !== undefined) {
      entity.changeEnvironment(input.environment);
    }

    if (input.volumes !== undefined) {
      entity.changeVolumes(input.volumes);
    }

    if (input.ports !== undefined) {
      entity.changePorts(input.ports);
    }

    if (input.networks !== undefined) {
      entity.changeNetworks(input.networks);
    }

    if (input.templateFile !== undefined) {
      entity.changeTemplateFile(input.templateFile);
    }

    if (input.sharedConfigs !== undefined) {
      const sharedConfigs: SharedConfig[] = [];
      for (const cfgId of input.sharedConfigs) {
        const sharedConfigId = new SharedConfigId(cfgId);
        const sharedConfig = await this.sharedRepository.findById(
          sharedConfigId
        );
        if (!sharedConfig) {
          throw new NotFoundError(cfgId, SharedConfig);
        }
        sharedConfigs.push(sharedConfig);
      }
      entity.changeSharedConfigs(sharedConfigs);
    }

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.update(entity);

    return ServiceOutputMapper.toOutput(entity);
  }
}

export type UpdateServiceOutput = ServiceOutput;
