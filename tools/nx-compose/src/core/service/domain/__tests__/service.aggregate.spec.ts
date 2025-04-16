import { Service } from '../service.aggregate';
import { Name } from '../../../common/domain/value-objects/name.vo';

describe('Service Aggregate', () => {
  const validProps = {
    name: new Name('my-service'),
    image: 'nginx:latest',
    templateFile: undefined,
    environment: { NODE_ENV: 'production' },
    ports: ['3000:3000'],
    volumes: ['data:/data'],
    networks: ['bridge'],
    sharedConfigs: [],
  };

  test('should create service with valid image', () => {
    const service = Service.create(validProps);
    expect(service).toBeInstanceOf(Service);
    expect(service.notification.hasErrors()).toBe(false);
    expect(service.image).toBe('nginx:latest');
    expect(service.templateFile).toBeUndefined();
  });

  test('should create service with valid templateFile', () => {
    const service = Service.create({
      ...validProps,
      image: undefined,
      templateFile: 'service.yaml',
    });
    expect(service).toBeInstanceOf(Service);
    expect(service.templateFile).toBe('service.yaml');
    expect(service.image).toBeUndefined();
    expect(service.notification.hasErrors()).toBe(false);
  });

  test('should fail when both image and templateFile are set', () => {
    expect(() =>
      Service.create({
        ...validProps,
        templateFile: 'conf.yaml',
      })
    ).toThrow('You cannot specify both image and templateFile at once');
  });

  test('should fail when neither image nor templateFile is set', () => {
    expect(() =>
      Service.create({
        ...validProps,
        image: undefined,
        templateFile: undefined,
      })
    ).toThrow('Either image or templateFile must be provided');
  });

  test('should merge overrides', () => {
    const service = Service.create(validProps);

    service.mergeOverrides(
      { DEBUG: 'true' },
      ['override:/opt'],
      ['override-net']
    );

    expect(service.environment.DEBUG).toBe('true');
    expect(service.volumes).toContain('override:/opt');
    expect(service.networks).toContain('override-net');
  });

  test('should convert entity to JSON correctly', () => {
    const service = Service.create(validProps);
    const json = service.toJSON();
    expect(json).toMatchObject({
      name: validProps.name.value,
      image: validProps.image,
      environment: validProps.environment,
      ports: validProps.ports,
      volumes: validProps.volumes,
      networks: validProps.networks,
      templateFile: undefined,
      sharedConfigs: [],
    });
  });
});
