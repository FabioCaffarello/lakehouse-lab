import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  Matches,
} from 'class-validator';
import { Notification } from '../../common/domain/validators/notification';
import { ClassValidatorFields } from '../../common/domain/validators/class-validator-fields';
import { Composer } from './composer.aggregate';

class ComposerRules {
  @IsString({ groups: ['name'] })
  @IsNotEmpty({ groups: ['name'], message: 'name should not be empty' })
  @MinLength(2, { groups: ['name'], message: 'Name is too short.' })
  @MaxLength(255, { groups: ['name'], message: 'Name is too long.' })
  name: string;

  @IsOptional({ groups: ['environment'] })
  @IsObject({
    groups: ['environment'],
    message: 'Environment must be an object',
  })
  environment?: Record<string, string>;

  @IsOptional({ groups: ['volumes'] })
  @IsArray({ groups: ['volumes'] })
  @Matches(/^.+:[^:]+$/, {
    each: true,
    groups: ['volumes'],
    message: 'Volume must be in format name:mountpoint',
  })
  volumes?: string[];

  @IsOptional({ groups: ['networks'] })
  @IsArray({ groups: ['networks'] })
  networks?: string[];

  constructor(composer: Composer) {
    Object.assign(this, composer);
  }
}

export class ComposerValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const groups = fields?.length
      ? fields
      : ['name', 'environment', 'volumes', 'networks'];
    return super.validate(notification, new ComposerRules(data), groups);
  }
}

export class ComposerValidatorFactory {
  static create(): ComposerValidator {
    return new ComposerValidator();
  }
}
