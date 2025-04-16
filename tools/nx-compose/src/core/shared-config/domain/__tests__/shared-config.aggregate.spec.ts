import { SharedConfig } from '../shared-config.aggregate';
import { Notification } from '../../../common/domain/validators/notification';

describe('SharedConfig', () => {
  const validProps = {
    name: 'My Config',
    templates: ['template.yaml'],
    appliesTo: ['service1'],
    environment: { NODE_ENV: 'production' },
    volumes: ['volume1:/data'],
    networks: ['network1'],
  };

  test('should create a valid SharedConfig', () => {
    const sharedConfig = SharedConfig.create(validProps);
    expect(sharedConfig).toBeInstanceOf(SharedConfig);
    expect(sharedConfig.notification.hasErrors()).toBe(false);
  });

  test('should fail when creating with invalid name', () => {
    expect(() => SharedConfig.create({ ...validProps, name: '' })).toThrow();
  });

  test('should fail when templates are empty', () => {
    expect(() =>
      SharedConfig.create({ ...validProps, templates: [] })
    ).toThrow();
  });

  test('should fail when template has invalid extension', () => {
    expect(() =>
      SharedConfig.create({ ...validProps, templates: ['template.txt'] })
    ).toThrow();
  });

  test('should change name correctly', () => {
    const sharedConfig = SharedConfig.create(validProps);
    sharedConfig.changeName('New Name');
    expect(sharedConfig.name).toBe('New Name');
    expect(sharedConfig.notification.hasErrors()).toBe(false);
  });

  test('should validate volumes correctly', () => {
    const sharedConfig = SharedConfig.create(validProps);
    expect(() => sharedConfig.changeVolumes(['invalidVolume'])).toThrow();
  });

  test('should change appliesTo correctly', () => {
    const sharedConfig = SharedConfig.create(validProps);
    sharedConfig.changeAppliesTo(['service2', 'service3']);
    expect(sharedConfig.appliesTo).toEqual(['service2', 'service3']);
    expect(sharedConfig.notification.hasErrors()).toBe(false);
  });

  test('should convert entity to JSON correctly', () => {
    const sharedConfig = SharedConfig.create(validProps);
    const json = sharedConfig.toJSON();
    expect(json).toMatchObject({
      name: validProps.name,
      templates: validProps.templates,
      appliesTo: validProps.appliesTo,
      environment: validProps.environment,
      volumes: validProps.volumes,
      networks: validProps.networks,
    });
  });
});
