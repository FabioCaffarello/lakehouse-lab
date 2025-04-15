import { Service } from '../service';
import { SharedConfig } from '../shared-config';

describe('Service Entity (Extended Tests)', () => {
  // ---------------------------
  // Basic validations
  // ---------------------------
  it('should create a valid Service using image-based config', () => {
    const service = new Service({
      name: 'kafka-broker',
      image: 'apache/kafka:3.8.1',
    });

    expect(service.name).toBe('kafka-broker');
    expect(service.image).toBe('apache/kafka:3.8.1');
    expect(service.templateFile).toBeUndefined();
  });

  it('should create a valid Service using a YAML template', () => {
    const service = new Service({
      name: 'my-service-from-template',
      templateFile: 'templates/kafka-broker.yml',
    });

    expect(service.name).toBe('my-service-from-template');
    expect(service.templateFile).toBe('templates/kafka-broker.yml');
    expect(service.image).toBeUndefined();
  });

  it('should throw an error if neither image nor templateFile is provided', () => {
    expect(() => {
      new Service({ name: 'invalid-service' });
    }).toThrowError('Either image or templateFile must be provided');
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      new Service({ name: '', image: 'apache/kafka:3.8.1' });
    }).toThrowError('Service name is required');
  });

  // ---------------------------
  // Optional fields
  // ---------------------------
  it('should allow additional optional fields, like environment, ports, etc.', () => {
    const service = new Service({
      name: 'another-service',
      image: 'some/image',
      environment: { KEY: 'VALUE' },
      ports: ['9092:9092'],
    });

    expect(service.environment).toEqual({ KEY: 'VALUE' });
    expect(service.ports).toEqual(['9092:9092']);
  });

  // ---------------------------
  // Potential domain rule: disallow both image & template
  // (Only if your domain says it's invalid to have both.)
  // ---------------------------
  it('should throw error if both image and templateFile are provided (if domain disallows it)', () => {
    // Uncomment if your domain logic forbids both
    expect(() => {
      new Service({
        name: 'conflicting-service',
        image: 'some/image',
        templateFile: 'templates/svc.yml',
      });
    }).toThrowError('You cannot specify both image and templateFile at once');
  });

  // ---------------------------
  // SharedConfig merges
  // ---------------------------
  it('should merge environment from relevant SharedConfigs only', () => {
    const sc1 = new SharedConfig({
      name: 'monitoring-sc',
      templates: ['templates/monitoring.yml'],
      appliesTo: ['kafka-broker'], // relevant
      environment: { PROMETHEUS_ENABLED: 'true' },
    });
    const sc2 = new SharedConfig({
      name: 'unrelated-sc',
      templates: ['templates/unrelated.yml'],
      appliesTo: ['another-service'], // irrelevant
      environment: { SOME_VAR: 'some_value' },
    });

    const service = new Service({
      name: 'kafka-broker',
      image: 'apache/kafka:3.8.1',
      environment: { KAFKA_VAR: '123' },
      sharedConfigs: [sc1, sc2],
    });

    // Only sc1 applies
    expect(service.environment).toEqual({
      KAFKA_VAR: '123',
      PROMETHEUS_ENABLED: 'true',
    });
    // 'SOME_VAR' is not merged
  });

  it('should merge environment from multiple relevant SharedConfigs', () => {
    const sc1 = new SharedConfig({
      name: 'monitoring-sc',
      templates: ['templates/monitoring.yml'],
      appliesTo: ['multi-service'],
      environment: { MONITOR: '1', COMMON: 'sc1' },
    });
    const sc2 = new SharedConfig({
      name: 'extra-env-sc',
      templates: ['templates/extra.yml'],
      appliesTo: ['multi-service'],
      environment: { EXTRA: 'yes', COMMON: 'sc2' },
    });

    const service = new Service({
      name: 'multi-service',
      templateFile: 'templates/multi.yml',
      environment: { BASE_ENV: 'base', COMMON: 'service' },
      sharedConfigs: [sc1, sc2],
    });

    // sc1 & sc2 both apply, sc2 merges after sc1
    // environment order: service props -> sc1 -> sc2
    expect(service.environment).toEqual({
      BASE_ENV: 'base',
      COMMON: 'sc2', // overwritten by sc2
      MONITOR: '1',
      EXTRA: 'yes',
    });
  });

  it('should merge volumes from relevant SharedConfigs and ignore non-applicable configs', () => {
    const sc1 = new SharedConfig({
      name: 'logging-sc',
      templates: ['templates/logging.yml'],
      appliesTo: ['my-service'],
      volumes: ['logs-data:/var/logs'],
    });
    const sc2 = new SharedConfig({
      name: 'other-sc',
      templates: ['templates/other.yml'],
      appliesTo: ['some-other-service'],
      volumes: ['ignored-volume:/data'],
    });

    const service = new Service({
      name: 'my-service',
      templateFile: 'templates/svc.yml',
      volumes: ['service-data:/srv'],
      sharedConfigs: [sc1, sc2],
    });

    // Only sc1 applies
    expect(service.volumes).toEqual([
      'service-data:/srv',
      'logs-data:/var/logs',
    ]);
  });

  it('should also merge networks from relevant SharedConfigs', () => {
    const sc = new SharedConfig({
      name: 'net-sc',
      templates: ['templates/network.yml'],
      appliesTo: ['networked-service'],
      networks: ['special-net'],
    });

    const service = new Service({
      name: 'networked-service',
      image: 'my-img',
      networks: ['default-net'],
      sharedConfigs: [sc],
    });

    expect(service.networks).toEqual(['default-net', 'special-net']);
  });

  it('should do nothing if sharedConfigs is empty or undefined', () => {
    const service = new Service({
      name: 'no-shared-config-service',
      image: 'my-img',
      environment: { INITIAL: '1' },
    });

    // No SharedConfigs to merge
    expect(service.environment).toEqual({ INITIAL: '1' });
    expect(service.volumes).toEqual([]);
    expect(service.networks).toEqual([]);
  });

  // ---------------------------
  // Conflict resolution tests
  // ---------------------------
  it('should allow SharedConfig to override existing environment keys from the service', () => {
    const sc = new SharedConfig({
      name: 'override-sc',
      templates: ['templates/override.yml'],
      appliesTo: ['override-service'],
      environment: { DUPLICATE_KEY: 'shared-val', NEW_KEY: 'sc' },
    });

    const service = new Service({
      name: 'override-service',
      image: 'my-img',
      environment: { DUPLICATE_KEY: 'service-val' },
      sharedConfigs: [sc],
    });

    // By default, we do environment = {...serviceEnv, ...scEnv}
    // so the shared config override wins
    expect(service.environment).toEqual({
      DUPLICATE_KEY: 'shared-val',
      NEW_KEY: 'sc',
    });
  });

  // ---------------------------
  // Potential domain method test (mergeOverrides)
  // ---------------------------
  it('should allow external overrides via mergeOverrides domain method', () => {
    const service = new Service({
      name: 'external-override-service',
      templateFile: 'templates/external.yml',
      environment: { INIT: '1' },
      volumes: ['service-volume:/srv'],
      networks: ['default-net'],
    });

    // Suppose we add domain method mergeOverrides(env, vols, nets)
    service.mergeOverrides(
      { OVERRIDE_ENV: 'yes', INIT: '2' },
      ['extra-volume:/data'],
      ['override-net']
    );

    // Check final merges
    expect(service.environment).toEqual({
      INIT: '2', // overwritten
      OVERRIDE_ENV: 'yes',
    });
    expect(service.volumes).toEqual([
      'service-volume:/srv',
      'extra-volume:/data',
    ]);
    expect(service.networks).toEqual(['default-net', 'override-net']);
  });
});
