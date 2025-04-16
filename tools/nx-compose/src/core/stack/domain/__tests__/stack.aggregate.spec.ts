import { Stack } from '../stack.aggregate';
import { SharedConfigFakeBuilder } from '../../../shared-config/domain/shared-config-fake.builder';
import { ServiceFakeBuilder } from '../../../service/domain/service-fake.builder';

describe('Stack Aggregate', () => {
  const validProps = {
    name: 'dev-stack',
    environment: { DEBUG: 'true' },
    volumes: ['data:/data'],
    networks: ['bridge'],
    services: [],
    sharedConfigs: [],
  };

  test('should create a valid Stack', () => {
    const stack = Stack.create(validProps);
    expect(stack).toBeInstanceOf(Stack);
    expect(stack.notification.hasErrors()).toBe(false);
    expect(stack.name).toBe('dev-stack');
  });

  test('should fail with invalid volume format', () => {
    expect(() => Stack.create({ ...validProps, volumes: ['invalid'] })).toThrow(
      'Validation failed'
    );
  });

  test('should fail with empty name', () => {
    expect(() => Stack.create({ ...validProps, name: '' })).toThrow(
      'Validation failed'
    );
  });

  test('should apply shared config when appliesTo matches stack name', () => {
    const sharedConfig = SharedConfigFakeBuilder.aSharedConfig()
      .withAppliesTo(['dev-stack'])
      .withEnvironment({ SHARED_ENV: 'true' })
      .withVolumes(['shared:/shared'])
      .withNetworks(['shared-net'])
      .build();

    const stack = Stack.create({
      ...validProps,
      sharedConfigs: [sharedConfig],
    });

    expect(stack.environment.SHARED_ENV).toBe('true');
    expect(stack.volumes).toContain('shared:/shared');
    expect(stack.networks).toContain('shared-net');
  });

  test('should merge overrides', () => {
    const stack = Stack.create(validProps);
    stack.mergeOverrides(
      { EXTRA_ENV: 'yes' },
      ['override:/data'],
      ['override-net']
    );

    expect(stack.environment.EXTRA_ENV).toBe('yes');
    expect(stack.volumes).toContain('override:/data');
    expect(stack.networks).toContain('override-net');
  });

  test('should apply stack configs to services', () => {
    const service = ServiceFakeBuilder.aService()
      .withName('s1')
      .withImage('nginx')
      .build();

    const stack = Stack.create({
      ...validProps,
      environment: { E1: 'v1' },
      volumes: ['v:/v'],
      networks: ['n1'],
      services: [service],
    });

    stack.applyStackConfigsToServices();

    expect(service.environment.E1).toBe('v1');
    expect(service.volumes).toContain('v:/v');
    expect(service.networks).toContain('n1');
  });

  test('should add and remove services correctly', () => {
    const s1 = ServiceFakeBuilder.aService()
      .withName('s1')
      .withImage('img1')
      .build();
    const s2 = ServiceFakeBuilder.aService()
      .withName('s2')
      .withImage('img2')
      .build();

    const stack = Stack.create({ ...validProps });
    stack.addService(s1);
    stack.addService(s2);

    expect(stack.services.length).toBe(2);

    stack.removeServiceByName('s1');
    expect(stack.services.length).toBe(1);
    expect(stack.services[0].name).toBe('s2');
  });
});
