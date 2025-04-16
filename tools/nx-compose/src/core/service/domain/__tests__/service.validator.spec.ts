import { ServiceValidator } from '../service.validator';
import { Notification } from '../../../common/domain/validators/notification';
import { Service } from '../service.aggregate';
import { Name } from '../../../common/domain/value-objects/name.vo';

const makeBaseService = (overrides: Partial<Service> = {}): Service => {
  return new Service({
    name: new Name('valid-service'),
    image: 'nginx:latest',
    environment: { NODE_ENV: 'test' },
    ports: ['3000:3000'],
    volumes: ['data:/data'],
    networks: ['bridge'],
    sharedConfigs: [],
    ...overrides,
  });
};

describe('ServiceValidator', () => {
  let validator: ServiceValidator;
  let notification: Notification;

  beforeEach(() => {
    validator = new ServiceValidator();
    notification = new Notification();
  });

  test('should validate a correct service', () => {
    const service = makeBaseService();
    const result = validator.validate(notification, service);
    expect(result).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  test('should invalidate invalid volume format', () => {
    const service = makeBaseService({ volumes: ['invalid-volume'] });
    const result = validator.validate(notification, service, ['volumes']);
    expect(result).toBe(false);
    expect(notification.errors.get('volumes')).toContain(
      'Volume must be in format name:mountpoint'
    );
  });

  test('should invalidate when image is not string', () => {
    const service = makeBaseService({ image: 123 as any });
    const result = validator.validate(notification, service, ['image']);
    expect(result).toBe(false);
    expect(notification.errors.get('image')).toContain(
      'image must be a string'
    );
  });

  test('should validate templateFile when present and string', () => {
    const service = makeBaseService({
      image: undefined,
      templateFile: 'service.yaml',
    });
    const result = validator.validate(notification, service, ['templateFile']);
    expect(result).toBe(true);
  });
});
