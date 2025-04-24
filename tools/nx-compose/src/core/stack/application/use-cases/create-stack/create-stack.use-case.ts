import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { CreateStackInput } from './create-stack.input';
import { StackOutput, StackOutputMapper } from '../common/stack.output';
import { Stack } from '../../../domain/stack.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { Service } from '../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import {
  IServiceRepository,
  ServiceSearchParams,
} from '../../../../service/domain/service.repository';
import {
  ISharedConfigRepository,
  SharedConfigSearchParams,
} from '../../../../shared-config/domain/shared-config.repository';
import {
  IStackRepository,
  StackSearchParams,
} from '../../../domain/stack.repository';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class CreateStackUseCase
  implements IUseCase<CreateStackInput, CreateStackOutput>
{
  constructor(
    private readonly repository: IStackRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: CreateStackInput): Promise<CreateStackOutput> {
    const stackParams = new StackSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const stackResult = await this.repository.search(stackParams);
    if (stackResult.items.some((stack) => stack.name.value === input.name)) {
      throw new EntityValidationError([{ name: ['Name must be unique'] }]);
    }

    const services: Service[] = [];
    if (input.services?.length > 0) {
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
    }

    const sharedConfigs: SharedConfig[] = [];
    if (input.sharedConfigs?.length > 0) {
      for (const cfgName of input.sharedConfigs) {
        const params = new SharedConfigSearchParams({
          filter: cfgName,
          per_page: 1,
        });
        const result = await this.sharedRepository.search(params);
        const found = result.items.find((cfg) => cfg.name.value === cfgName);
        if (!found) {
          throw new NotFoundError(cfgName, SharedConfig);
        }
        sharedConfigs.push(found);
      }
    }

    const entity = Stack.create({
      name: new Name(input.name),
      services: services,
      environment: input.environment,
      volumes: input.volumes,
      networks: input.networks,
      sharedConfigs: sharedConfigs,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.insert(entity);

    return StackOutputMapper.toOutput(entity);
  }
}

export type CreateStackOutput = StackOutput;
