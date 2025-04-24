import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { UpdateStackInput } from './update-stack.input';
import { StackOutput, StackOutputMapper } from '../common/stack.output';
import { Stack, StackId } from '../../../domain/stack.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { Service } from '../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import { IStackRepository } from '../../../domain/stack.repository';
import {
  IServiceRepository,
  ServiceSearchParams,
} from '../../../../service/domain/service.repository';
import {
  ISharedConfigRepository,
  SharedConfigSearchParams,
} from '../../../../shared-config/domain/shared-config.repository';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class UpdateStackUseCase
  implements IUseCase<UpdateStackInput, UpdateStackOutput>
{
  constructor(
    private readonly repository: IStackRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: UpdateStackInput): Promise<UpdateStackOutput> {
    const entityId = new StackId(input.id);
    const entity = await this.repository.findById(entityId);
    if (!entity) {
      throw new NotFoundError(input.id, Stack);
    }

    if (input.name !== undefined) {
      entity.changeName(new Name(input.name));
    }

    if (input.services !== undefined) {
      const services: Service[] = [];
      for (const svcName of input.services) {
        const params = new ServiceSearchParams({
          filter: svcName,
          per_page: 1,
        });
        const result = await this.serviceRepository.search(params);
        const found = result.items.find((svc) => svc.name.value === svcName);
        if (!found) {
          throw new NotFoundError(svcName, Service);
        }
        services.push(found);
      }
      entity.changeServices(services);
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

    if (input.environment !== undefined) {
      entity.changeEnvironment(input.environment);
    }

    if (input.volumes !== undefined) {
      entity.changeVolumes(input.volumes);
    }

    if (input.networks !== undefined) {
      entity.changeNetworks(input.networks);
    }

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.update(entity);

    const output = StackOutputMapper.toOutput(entity);
    return output;
  }
}

export type UpdateStackOutput = StackOutput;
