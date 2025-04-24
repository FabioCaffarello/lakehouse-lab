import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import {
  UpdateServiceInput,
  ValidateUpdateServiceInput,
} from './update-service.input';
import { ServiceOutput, ServiceOutputMapper } from '../common/service.output';
import { Service, ServiceId } from '../../../domain/service.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import { IServiceRepository } from '../../../domain/service.repository';
import {
  ISharedConfigRepository,
  SharedConfigSearchParams,
} from '../../../../shared-config/domain/shared-config.repository';
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
    if (input.templateFile !== undefined) {
      entity.changeTemplateFile(input.templateFile);
    }
    if (input.environment !== undefined) {
      entity.changeEnvironment(input.environment);
    }
    if (input.ports !== undefined) {
      entity.changePorts(input.ports);
    }
    if (input.volumes !== undefined) {
      entity.changeVolumes(input.volumes);
    }
    if (input.networks !== undefined) {
      entity.changeNetworks(input.networks);
    }

    if (input.sharedConfigs !== undefined) {
      const sharedConfigs: SharedConfig[] = [];
      for (const cfgName of input.sharedConfigs) {
        const params = new SharedConfigSearchParams({
          filter: cfgName,
          per_page: 1,
        });
        const result = await this.sharedRepository.search(params);
        const found = result.items.find((c) => c.name.value === cfgName);
        if (!found) {
          throw new NotFoundError(cfgName, SharedConfig);
        }
        sharedConfigs.push(found);
      }
      entity.changeSharedConfigs(sharedConfigs);
    }

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.update(entity);

    const output = ServiceOutputMapper.toOutput(entity);
    return output;
  }
}

export type UpdateServiceOutput = ServiceOutput;
