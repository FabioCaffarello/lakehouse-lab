import { IUseCase } from '../../../../common/application/use-cases/use-case.interface';
import { CreateServiceInput } from './create-service.input';
import { ServiceOutput, ServiceOutputMapper } from '../common/service.output';
import { Service } from '../../../domain/service.aggregate';
import { NotFoundError } from '../../../../common/domain/errors/not-found.error';
import { SharedConfig } from '../../../../shared-config/domain/shared-config.aggregate';
import { IServiceRepository } from '../../../domain/service.repository';
import {
  ISharedConfigRepository,
  SharedConfigSearchParams,
} from '../../../../shared-config/domain/shared-config.repository';
import { ServiceSearchParams } from '../../../domain/service.repository';
import { EntityValidationError } from '../../../../common/domain/validators/validation.error';
import { Name } from '../../../../common/domain/value-objects/name.vo';

export class CreateServiceUseCase
  implements IUseCase<CreateServiceInput, CreateServiceOutput>
{
  constructor(
    private readonly repository: IServiceRepository,
    private readonly sharedRepository: ISharedConfigRepository
  ) {}

  async execute(input: CreateServiceInput): Promise<CreateServiceOutput> {
    const serviceParams = new ServiceSearchParams({
      filter: input.name,
      per_page: 1,
    });
    const serviceResult = await this.repository.search(serviceParams);
    if (serviceResult.items.some((svc) => svc.name.value === input.name)) {
      throw new EntityValidationError([{ name: ['Name must be unique'] }]);
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
    const entity = Service.create({
      name: new Name(input.name),
      image: input.image,
      environment: input.environment,
      volumes: input.volumes,
      ports: input.ports,
      networks: input.networks,
      templateFile: input.templateFile,
      sharedConfigs: sharedConfigs,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.repository.insert(entity);

    return ServiceOutputMapper.toOutput(entity);
  }
}

export type CreateServiceOutput = ServiceOutput;
