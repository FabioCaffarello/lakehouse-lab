import { StackValidator } from '../stack.validator';
import { Notification } from '../../../common/domain/validators/notification';

const makeValidProps = () => ({
  name: 'stack-dev',
  environment: { NODE_ENV: 'production' },
  volumes: ['data:/data'],
  networks: ['bridge'],
});

describe('StackValidator', () => {
  let validator: StackValidator;
  let notification: Notification;

  beforeEach(() => {
    validator = new StackValidator();
    notification = new Notification();
  });

  test('should pass with valid data', () => {
    const isValid = validator.validate(notification, makeValidProps());
    expect(isValid).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  test('should fail if name is empty', () => {
    const props = { ...makeValidProps(), name: '' };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(false);
    expect(notification.errors.get('name')).toContain(
      'name should not be empty'
    );
  });

  test('should fail if volume format is invalid', () => {
    const props = { ...makeValidProps(), volumes: ['invalid-format'] };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(false);
    expect(notification.errors.get('volumes')).toContain(
      'Volume must be in format name:mountpoint'
    );
  });

  test('should pass if environment is empty object', () => {
    const props = { ...makeValidProps(), environment: {} };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(true);
  });

  test('should fail if environment is not object', () => {
    const props = { ...makeValidProps(), environment: 'invalid' as any };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(false);
    expect(notification.errors.get('environment')).toContain(
      'environment must be an object'
    );
  });
});
