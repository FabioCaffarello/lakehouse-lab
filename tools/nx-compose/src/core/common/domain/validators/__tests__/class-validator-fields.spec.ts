import { ClassValidatorFields } from '../class-validator-fields';
import { Notification } from '../notification';
import {
  IsNotEmpty,
  MaxLength,
  MinLength,
  validateSync,
} from 'class-validator';

class DummyClassValidatorFields extends ClassValidatorFields {
  @IsNotEmpty({ groups: ['test'] })
  @MaxLength(5, { groups: ['test'] })
  dummyField?: string;
}

describe('ClassValidatorFields', () => {
  let validator: DummyClassValidatorFields;
  let notification: Notification;

  beforeEach(() => {
    validator = new DummyClassValidatorFields();
    notification = new Notification();
  });

  test('should pass validation with correct data', () => {
    validator.dummyField = 'abc';
    const result = validator.validate(notification, validator, ['test']);
    expect(result).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  test('should fail validation with empty field', () => {
    validator.dummyField = '';
    const result = validator.validate(notification, validator, ['test']);
    expect(result).toBe(false);
    expect(notification.hasErrors()).toBe(true);
    expect(notification.errors.get('dummyField')).toEqual([
      'dummyField should not be empty',
    ]);
  });

  test('should fail validation with exceeding max length', () => {
    validator.dummyField = 'exceeds';
    const result = validator.validate(notification, validator, ['test']);
    expect(result).toBe(false);
    expect(notification.hasErrors()).toBe(true);
    expect(notification.errors.get('dummyField')).toEqual([
      'dummyField must be shorter than or equal to 5 characters',
    ]);
  });
  test('should collect multiple errors', () => {
    validator.dummyField = undefined as any;
    const result = validator.validate(notification, validator, ['test']);

    expect(result).toBe(false);
    expect(notification.hasErrors()).toBe(true);
    expect(notification.errors.get('dummyField')).toEqual([
      'dummyField must be shorter than or equal to 5 characters',
      'dummyField should not be empty',
    ]);
  });
});
