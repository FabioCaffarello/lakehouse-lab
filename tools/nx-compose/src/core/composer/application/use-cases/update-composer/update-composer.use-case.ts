import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { UpdateComposerInput } from './update-composer.input';
import {
  ComposerOutput,
  ComposerOutputMapper,
} from '../common/composer.output';
import { Composer, ComposerId } from '../../../domain/composer.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { Stack } from '../../../../stack/domain/stack.aggregate';
import { Service } from '../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import { IComposerRepository } from '../../../domain/composer.repository';
import {
  IStackRepository,
  StackSearchParams,
} from '../../../../stack/domain/stack.repository';
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

export class UpdateComposerUseCase
  implements IUseCase<UpdateComposerInput, UpdateComposerOutput>
{
  constructor(
    private readonly repository: IComposerRepository,
    private readonly stackRepository: IStackRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: UpdateComposerInput): Promise<UpdateComposerOutput> {
    const entityId = new ComposerId(input.id);
    const entity = await this.repository.findById(entityId);
    if (!entity) {
      throw new NotFoundError(input.id, Composer);
    }

    if (input.name !== undefined) {
      entity.changeName(new Name(input.name));
    }

    if (input.stacks !== undefined) {
      const stacks: Stack[] = [];
      for (const stackName of input.stacks) {
        const params = new StackSearchParams({
          filter: stackName,
          per_page: 1,
        });
        const result = await this.stackRepository.search(params);
        const found = result.items.find(
          (stack) => stack.name.value === stackName
        );
        if (!found) {
          throw new NotFoundError(stackName, Stack);
        }
        stacks.push(found);
      }
      entity.changeStacks(stacks);
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
    return ComposerOutputMapper.toOutput(entity);
  }
}

export type UpdateComposerOutput = ComposerOutput;
