import { Composer } from '../composer.aggregate';
import { SharedConfigFakeBuilder } from '../../../shared-config/domain/shared-config-fake.builder';
import { StackFakeBuilder } from '../../../stack/domain/stack-fake.builder';
import { ServiceFakeBuilder } from '../../../service/domain/service-fake.builder';
import { Name } from '../../../common/domain/value-objects/name.vo';

describe('Composer Aggregate', () => {
  const validProps = {
    name: new Name('my-composer'),
    environment: { NODE_ENV: 'production' },
    volumes: ['data:/data'],
    networks: ['bridge'],
    stacks: [],
    services: [],
    sharedConfigs: [],
  };

  test('should create a valid Composer', () => {
    const composer = Composer.create(validProps);
    expect(composer).toBeInstanceOf(Composer);
    expect(composer.notification.hasErrors()).toBe(false);
    expect(composer.name.value).toBe('my-composer');
  });

  test('should fail with invalid volume format', () => {
    expect(() =>
      Composer.create({ ...validProps, volumes: ['invalid'] })
    ).toThrow('Validation failed');
  });

  test('should apply shared config when appliesTo matches composer name', () => {
    const sharedConfig = SharedConfigFakeBuilder.aSharedConfig()
      .withAppliesTo(['my-composer'])
      .withEnvironment({ SHARED_ENV: 'true' })
      .withVolumes(['shared:/vol'])
      .withNetworks(['shared-net'])
      .build();

    const composer = Composer.create({
      ...validProps,
      sharedConfigs: [sharedConfig],
    });

    expect(composer.environment.SHARED_ENV).toBe('true');
    expect(composer.volumes).toContain('shared:/vol');
    expect(composer.networks).toContain('shared-net');
  });

  test('should merge overrides', () => {
    const composer = Composer.create(validProps);
    composer.mergeOverrides({ EXTRA: 'ok' }, ['override:/opt'], ['net-extra']);

    expect(composer.environment.EXTRA).toBe('ok');
    expect(composer.volumes).toContain('override:/opt');
    expect(composer.networks).toContain('net-extra');
  });

  test('should apply composer configs to stacks and services', () => {
    const service = ServiceFakeBuilder.aService()
      .withName(new Name('svc1'))
      .withImage('node')
      .build();

    const stack = StackFakeBuilder.aStack()
      .withName(new Name('stack1'))
      .withServices([service])
      .build();

    const composer = Composer.create({
      ...validProps,
      environment: { FOO: 'BAR' },
      volumes: ['foo:/bar'],
      networks: ['n1'],
      stacks: [stack],
      services: [service],
    });

    composer.applyComposerConfigsToStacksAndServices();

    expect(service.environment.FOO).toBe('BAR');
    expect(service.volumes).toContain('foo:/bar');
    expect(service.networks).toContain('n1');
  });

  test('should add and remove services and stacks', () => {
    const stack = StackFakeBuilder.aStack()
      .withName(new Name('stack1'))
      .build();
    const svc = ServiceFakeBuilder.aService()
      .withName(new Name('svc1'))
      .build();

    const composer = Composer.create(validProps);
    composer.addStack(stack);
    composer.addService(svc);

    expect(composer.stacks.length).toBe(1);
    expect(composer.services.length).toBe(1);

    composer.removeStackByName('stack1');
    composer.removeServiceByName('svc1');

    expect(composer.stacks.length).toBe(0);
    expect(composer.services.length).toBe(0);
  });
});
