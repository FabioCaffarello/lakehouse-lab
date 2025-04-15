import { SharedConfig } from '../shared-config';

describe('SharedConfig Entity', () => {
  it('should create a valid SharedConfig with at least one template and an appliesTo array', () => {
    const shared = new SharedConfig({
      name: 'monitoring-shared',
      templates: ['templates/monitoring.yml'],
      appliesTo: ['kafka-broker', 'spark-master'],
    });

    expect(shared.name).toBe('monitoring-shared');
    expect(shared.templates).toEqual(['templates/monitoring.yml']);
    expect(shared.appliesTo).toEqual(['kafka-broker', 'spark-master']);
  });

  it('should throw an error if no templates are provided', () => {
    expect(() => {
      new SharedConfig({
        name: 'invalid-shared',
        templates: [],
        appliesTo: ['any-service'],
      });
    }).toThrowError(
      'At least one YAML template must be provided in SharedConfig'
    );
  });

  it('should allow optional environment, volumes, networks alongside templates', () => {
    const shared = new SharedConfig({
      name: 'common-logging',
      templates: ['templates/logging.yml', 'templates/logrotate.yml'],
      appliesTo: ['some-service'],
      environment: { LOG_LEVEL: 'DEBUG' },
      volumes: ['logging-data:/var/log'],
      networks: ['logging-net'],
    });

    expect(shared.environment).toEqual({ LOG_LEVEL: 'DEBUG' });
    expect(shared.volumes).toEqual(['logging-data:/var/log']);
    expect(shared.networks).toEqual(['logging-net']);
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      new SharedConfig({
        name: '',
        templates: ['templates/anything.yml'],
        appliesTo: ['anything'],
      });
    }).toThrowError('SharedConfig name is required');
  });

  it('should check applyTo() returns true if service name is in appliesTo array', () => {
    const shared = new SharedConfig({
      name: 'monitoring-shared',
      templates: ['templates/monitoring.yml'],
      appliesTo: ['kafka-broker', 'spark-master'],
    });

    expect(shared.applyTo('kafka-broker')).toBe(true);
    expect(shared.applyTo('spark-master')).toBe(true);
    expect(shared.applyTo('unknown-service')).toBe(false);
  });

  it('should handle environment, volumes, networks defaults if not provided', () => {
    const shared = new SharedConfig({
      name: 'test-shared',
      templates: ['templates/test.yml'],
      appliesTo: ['service1'],
    });

    expect(shared.environment).toEqual({});
    expect(shared.volumes).toEqual([]);
    expect(shared.networks).toEqual([]);
  });
});
