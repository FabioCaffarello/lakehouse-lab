import {
  MaxLength,
  MinLength,
  ArrayNotEmpty,
  IsArray,
  IsString,
  IsNotEmpty,
  IsObject,
  Matches,
} from 'class-validator';
import { SharedConfig } from './shared-config.aggregate';
import { ClassValidatorFields } from '../../common/domain/validators/class-validator-fields';
import { Notification } from '../../common/domain/validators/notification';

export class SharedConfigRules {
  @IsString({ groups: ['name'] })
  @IsNotEmpty({ groups: ['name'], message: 'Name cannot be empty.' })
  @MaxLength(255, { groups: ['name'], message: 'Name is too long.' })
  @MinLength(2, { groups: ['name'], message: 'Name is too short.' })
  name: string;

  @IsArray({ groups: ['templates'] })
  @ArrayNotEmpty({
    groups: ['templates'],
    message: 'At least one template is required.',
  })
  @Matches(/.*\.(yaml|yml)$/, {
    groups: ['templates'],
    message: 'Each template must have a YAML extension (.yaml or .yml).',
    each: true,
  })
  templates: string[];

  @IsArray({ groups: ['appliesTo'] })
  @ArrayNotEmpty({
    groups: ['appliesTo'],
    message: 'At least one appliesTo is required.',
  })
  appliesTo: string[];

  @IsArray({ groups: ['volumes'] })
  @Matches(/^.+:[^:]+$/, {
    groups: ['volumes'],
    message:
      'Each volume must be in the format "name:mountpoint", where both parts are non-empty.',
    each: true,
  })
  volumes?: string[];

  @IsArray({ groups: ['networks'] })
  @IsString({
    each: true,
    groups: ['networks'],
    message: 'Each network must be a non-empty string.',
  })
  networks?: string[];

  @IsObject({ groups: ['environment'] })
  environment?: Record<string, string>;

  constructor(entity: SharedConfig) {
    this.name = entity.name.value;
    this.templates = entity.templates;
    this.appliesTo = entity.appliesTo;
    this.volumes = entity.volumes;
    this.networks = entity.networks;
    this.environment = entity.environment;
  }
}

export class SharedConfigValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields =
      fields && fields.length
        ? fields
        : [
            'name',
            'templates',
            'appliesTo',
            'volumes',
            'networks',
            'environment',
          ];
    return super.validate(notification, new SharedConfigRules(data), newFields);
  }
}

export class SharedConfigValidatorFactory {
  static create(): SharedConfigValidator {
    return new SharedConfigValidator();
  }
}
