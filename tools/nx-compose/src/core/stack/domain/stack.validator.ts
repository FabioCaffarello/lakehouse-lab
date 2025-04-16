import {
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';
import { Notification } from '../../common/domain/validators/notification';
import { ClassValidatorFields } from '../../common/domain/validators/class-validator-fields';
import { Stack } from './stack.aggregate';

class StackRules {
  @IsString({ groups: ['name'] })
  @IsNotEmpty({ groups: ['name'], message: 'name should not be empty' })
  @MinLength(2, { groups: ['name'], message: 'Name is too short.' })
  @MaxLength(255, { groups: ['name'], message: 'Name is too long.' })
  name: string;

  @IsObject({ groups: ['environment'] })
  @IsOptional({ groups: ['environment'] })
  environment?: Record<string, string>;

  @IsArray({ groups: ['volumes'] })
  @IsOptional({ groups: ['volumes'] })
  @Matches(/^.+:[^:]+$/, {
    each: true,
    groups: ['volumes'],
    message: 'Volume must be in format name:mountpoint',
  })
  volumes?: string[];

  @IsArray({ groups: ['networks'] })
  @IsOptional({ groups: ['networks'] })
  networks?: string[];

  constructor(stack: Stack) {
    Object.assign(this, stack);
  }
}

export class StackValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const groups = fields?.length
      ? fields
      : ['name', 'environment', 'volumes', 'networks'];
    return super.validate(notification, new StackRules(data), groups);
  }
}

export class StackValidatorFactory {
  static create(): StackValidator {
    return new StackValidator();
  }
}
