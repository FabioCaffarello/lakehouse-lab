import { Stack } from '../stack';
import { Service } from '../service';
import { SharedConfig } from '../shared-config';

describe('Stack Entity (Extended Tests)', () => {
  // -------------------------------------------------------------------
  // Basic Validations
  // -------------------------------------------------------------------
  it('should create a valid Stack with a name', () => {
    const stack = new Stack({ name: 'kafka-stack' });
    expect(stack.name).toBe('kafka-stack');
    expect(stack.services).toHaveLength(0);
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      new Stack({ name: '' });
    }).toThrowError('Stack name is required');
  });

  it('should allow adding services in the constructor', () => {
    const service1 = new Service({
      name: 'kafka-broker',
      image: 'apache/kafka',
    });
    const service2 = new Service({
      name: 'kafka-controller',
      image: 'apache/kafka',
    });
    const stack = new Stack({
      name: 'kafka-stack',
      services: [service1, service2],
    });
    expect(stack.services).toHaveLength(2);
    expect(stack.services[0].name).toBe('kafka-broker');
    expect(stack.services[1].name).toBe('kafka-controller');
  });

  it('should allow optional fields like environment, volumes, or networks', () => {
    const stack = new Stack({
      name: 'spark-stack',
      environment: { SPARK_MODE: 'cluster' },
      volumes: ['spark-data:/var/lib/spark'],
      networks: ['lab-network'],
    });
    expect(stack.environment).toEqual({ SPARK_MODE: 'cluster' });
    expect(stack.volumes).toEqual(['spark-data:/var/lib/spark']);
    expect(stack.networks).toEqual(['lab-network']);
  });

  // -------------------------------------------------------------------
  // Shared Config merges at the Stack level
  // -------------------------------------------------------------------
  it('should merge environment, volumes, and networks from relevant SharedConfigs at stack level', () => {
    const sc1 = new SharedConfig({
      name: 'spark-shared',
      templates: ['templates/spark.yml'],
      appliesTo: ['spark-stack'], // applies to this stack
      environment: { SPARK_SHARED: 'enabled' },
      volumes: ['spark-shared:/data'],
      networks: ['spark-net'],
    });
    const sc2 = new SharedConfig({
      name: 'irrelevant-sc',
      templates: ['templates/other.yml'],
      appliesTo: ['other-stack'],
      environment: { IRRELEVANT: 'yes' },
      volumes: ['irrelevant:/vol'],
      networks: ['irrelevant-net'],
    });

    const stack = new Stack({
      name: 'spark-stack',
      environment: { EXISTING: 'value' },
      volumes: ['existing-vol:/vol'],
      networks: ['existing-net'],
      sharedConfigs: [sc1, sc2],
    });

    // Only sc1 should be merged because it applies to 'spark-stack'
    expect(stack.environment).toEqual({
      EXISTING: 'value',
      SPARK_SHARED: 'enabled',
    });
    expect(stack.volumes).toEqual(['existing-vol:/vol', 'spark-shared:/data']);
    expect(stack.networks).toEqual(['existing-net', 'spark-net']);
  });

  // -------------------------------------------------------------------
  // Testing mergeOverrides on Stack
  // -------------------------------------------------------------------
  it('should merge overrides via mergeOverrides method', () => {
    const stack = new Stack({
      name: 'custom-stack',
      environment: { BASE: '1' },
      volumes: ['base-vol:/data'],
      networks: ['base-net'],
    });

    stack.mergeOverrides(
      { OVERRIDE: 'yes', BASE: '2' }, // service-provided overrides
      ['extra-vol:/extra'],
      ['extra-net']
    );

    // Here we assume that overrides simply append/overwrite the existing keys;
    // since our implementation does:
    //   environment: { ...existing, ...overrides }
    // the override should win for duplicated keys.
    expect(stack.environment).toEqual({
      BASE: '2',
      OVERRIDE: 'yes',
    });
    expect(stack.volumes).toEqual(['base-vol:/data', 'extra-vol:/extra']);
    expect(stack.networks).toEqual(['base-net', 'extra-net']);
  });

  // -------------------------------------------------------------------
  // Pushing Stack Configurations to Services
  // -------------------------------------------------------------------
  it('should push stack configurations down to each service using applyStackConfigsToServices', () => {
    // Create two services with their own initial configurations.
    const service1 = new Service({
      name: 'service-1',
      image: 'img-1',
      environment: { SVC1_ENV: 'initial' },
      volumes: ['svc1-vol:/srv'],
      networks: ['svc1-net'],
    });
    const service2 = new Service({
      name: 'service-2',
      templateFile: 'templates/svc.yml',
      environment: { SVC2_ENV: 'initial' },
      volumes: ['svc2-vol:/srv'],
      networks: ['svc2-net'],
    });

    // Create a stack with its own environment that should be pushed to its services.
    const stack = new Stack({
      name: 'push-stack',
      environment: { STACK_ENV: 'override' },
      volumes: ['stack-vol:/stack'],
      networks: ['stack-net'],
      services: [service1, service2],
    });

    // Call the method that pushes the stack configuration down to each service.
    stack.applyStackConfigsToServices();

    // Verify that each service now has the stack's environment merged in.
    // Given our merge order in service.mergeOverrides, the service's existing props
    // are merged with the stack's overrides.

    // For service1, its final environment should include both SVC1_ENV and STACK_ENV,
    // similarly for volumes and networks.
    expect(service1.environment).toMatchObject({
      SVC1_ENV: 'initial',
      STACK_ENV: 'override',
    });
    expect(service1.volumes).toEqual(
      expect.arrayContaining(['svc1-vol:/srv', 'stack-vol:/stack'])
    );
    expect(service1.networks).toEqual(
      expect.arrayContaining(['svc1-net', 'stack-net'])
    );

    // The same test for service2.
    expect(service2.environment).toMatchObject({
      SVC2_ENV: 'initial',
      STACK_ENV: 'override',
    });
    expect(service2.volumes).toEqual(
      expect.arrayContaining(['svc2-vol:/srv', 'stack-vol:/stack'])
    );
    expect(service2.networks).toEqual(
      expect.arrayContaining(['svc2-net', 'stack-net'])
    );
  });
});
