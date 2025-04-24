import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { CreateComposerInput } from './create-composer.input';
import {
  ComposerOutput,
  ComposerOutputMapper,
} from '../common/composer.output';
import { Composer } from '../../../domain/composer.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { Stack } from '../../../../stack/domain/stack.aggregate';
import { Service } from '../../../../service/domain/service.aggregate';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import {
  IComposerRepository,
  ComposerSearchParams,
} from '../../../domain/composer.repository';
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

export class CreateComposerUseCase
  implements IUseCase<CreateComposerInput, CreateComposerOutput>
{
  constructor(
    private readonly repository: IComposerRepository,
    private readonly stackRepository: IStackRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: CreateComposerInput): Promise<CreateComposerOutput> {
    const composerParams = new ComposerSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const composerResult = await this.repository.search(composerParams);
    if (
      composerResult.items.some(
        (composer) => composer.name.value === input.name
      )
    ) {
      throw new EntityValidationError([{ name: ['Name must be unique'] }]);
    }

    const stacks: Stack[] = [];
    if (input.stacks?.length > 0) {
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

    const entity = Composer.create({
      name: new Name(input.name),
      stacks: stacks,
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

    return ComposerOutputMapper.toOutput(entity);
  }
}

export type CreateComposerOutput = ComposerOutput;
