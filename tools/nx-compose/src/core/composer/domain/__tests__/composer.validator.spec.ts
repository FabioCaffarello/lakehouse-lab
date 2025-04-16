import { ComposerValidator } from '../composer.validator';
import { Name } from '../../../common/domain/value-objects/name.vo';
import { Notification } from '../../../common/domain/validators/notification';

const makeValidProps = () => ({
  name: new Name('prod-composer'),
  environment: { NODE_ENV: 'production' },
  volumes: ['data:/data'],
  networks: ['bridge'],
});

describe('ComposerValidator', () => {
  let validator: ComposerValidator;
  let notification: Notification;

  beforeEach(() => {
    validator = new ComposerValidator();
    notification = new Notification();
  });

  test('should pass with valid data', () => {
    const isValid = validator.validate(notification, makeValidProps());
    expect(isValid).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  test('should fail with invalid volume format', () => {
    const props = { ...makeValidProps(), volumes: ['invalid-volume'] };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(false);
    expect(notification.errors.get('volumes')).toContain(
      'Volume must be in format name:mountpoint'
    );
  });

  test('should fail if environment is not object', () => {
    const props = { ...makeValidProps(), environment: 'not-object' as any };
    const isValid = validator.validate(notification, props);
    expect(isValid).toBe(false);
    expect(notification.errors.get('environment')[0].toLowerCase()).toContain(
      'environment must be an object'
    );
  });
});
