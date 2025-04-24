import { SharedConfigValidatorFactory } from '../shared-config.validator';
import { Notification } from '../../../common/domain/validators/notification';
import { SharedConfig } from '../shared-config.aggregate';
import { Name } from '../../../common/domain/value-objects/name.vo';

describe('SharedConfigValidator', () => {
  let notification: Notification;
  let validator: ReturnType<typeof SharedConfigValidatorFactory.create>;

  beforeEach(() => {
    notification = new Notification();
    validator = SharedConfigValidatorFactory.create();
  });

  const validSharedConfig = new SharedConfig({
    name: new Name('Valid Config'),
    templates: ['config.yaml'],
    appliesTo: ['service1'],
    environment: { NODE_ENV: 'production' },
    volumes: ['volume1:/data'],
    networks: ['network1'],
  });

  test('should validate successfully with valid data', () => {
    const result = validator.validate(notification, validSharedConfig);
    expect(result).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  test('should fail validation when templates are empty', () => {
    validSharedConfig.templates = [];
    const result = validator.validate(notification, validSharedConfig);
    expect(result).toBe(false);
    expect(notification.errors.get('templates')).toContain(
      'At least one template is required.'
    );
  });

  test('should fail validation for invalid template extension', () => {
    validSharedConfig.templates = ['config.txt'];
    const result = validator.validate(notification, validSharedConfig);
    expect(result).toBe(false);
    expect(notification.errors.get('templates')).toContain(
      'Each template must have a YAML extension (.yaml or .yml).'
    );
  });

  test('should fail validation when volumes have incorrect format', () => {
    validSharedConfig.volumes = ['invalidVolume'];
    const result = validator.validate(notification, validSharedConfig);
    expect(result).toBe(false);
    expect(notification.errors.get('volumes')).toContain(
      'Each volume must be in the format "name:mountpoint", where both parts are non-empty.'
    );
  });

  test('should fail validation when appliesTo is empty', () => {
    validSharedConfig.appliesTo = [];
    const result = validator.validate(notification, validSharedConfig);
    expect(result).toBe(false);
    expect(notification.errors.get('appliesTo')).toContain(
      'At least one appliesTo is required.'
    );
  });
});
