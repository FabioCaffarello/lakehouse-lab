import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsObject,
  IsArray,
  Matches,
} from 'class-validator';
import { Notification } from '../../common/domain/validators/notification';
import { ClassValidatorFields } from '../../common/domain/validators/class-validator-fields';
import { Service } from './service.aggregate';

class ServiceRules {
  @IsString({ groups: ['name'] })
  @MinLength(2, { groups: ['name'], message: 'Name is too short.' })
  @MaxLength(255, { groups: ['name'], message: 'Name is too long.' })
  name: string;

  @IsString({ groups: ['image'] })
  @IsOptional({ groups: ['image'] })
  image?: string;

  @IsString({ groups: ['templateFile'] })
  @IsOptional({ groups: ['templateFile'] })
  templateFile?: string;

  @IsObject({ groups: ['environment'] })
  environment: Record<string, string>;

  @IsArray({ groups: ['ports'] })
  ports: string[];

  @IsArray({ groups: ['volumes'] })
  @Matches(/^.+:[^:]+$/, {
    each: true,
    groups: ['volumes'],
    message: 'Volume must be in format name:mountpoint',
  })
  volumes: string[];

  @IsArray({ groups: ['networks'] })
  networks: string[];

  constructor(service: Service) {
    this.name = service.name;
    this.image = service.image;
    this.templateFile = service.templateFile;
    this.environment = service.environment;
    this.ports = service.ports;
    this.volumes = service.volumes;
    this.networks = service.networks;
  }
}

export class ServiceValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const groups = fields?.length
      ? fields
      : ['name', 'image', 'templateFile', 'environment', 'volumes', 'networks'];
    return super.validate(notification, new ServiceRules(data), groups);
  }
}

export class ServiceValidatorFactory {
  static create(): ServiceValidator {
    return new ServiceValidator();
  }
}
