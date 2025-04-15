import { Composer } from '../composer';
import { Stack } from '../stack';
import { Service } from '../service';
import { SharedConfig } from '../shared-config';

describe('Composer Entity (Extended Tests)', () => {
  // -------------------------------------------------
  // Basic Validations
  // -------------------------------------------------
  it('should create a valid Composer with a name', () => {
    const composer = new Composer({ name: 'local-lab' });
    expect(composer.name).toBe('local-lab');
    expect(composer.stacks).toHaveLength(0);
    expect(composer.services).toHaveLength(0);
  });

  it('should throw an error if name is empty', () => {
    expect(() => {
      new Composer({ name: '' });
    }).toThrowError('Composer name is required');
  });

  // -------------------------------------------------
  // Optional Fields
  // -------------------------------------------------
  it('should allow optional fields like environment, volumes, or networks', () => {
    const composer = new Composer({
      name: 'local-lab',
      environment: { GLOBAL_ENV: 'true' },
      volumes: ['composer-volume:/data'],
      networks: ['composer-network'],
    });

    expect(composer.environment).toEqual({ GLOBAL_ENV: 'true' });
    expect(composer.volumes).toEqual(['composer-volume:/data']);
    expect(composer.networks).toEqual(['composer-network']);
  });

  // -------------------------------------------------
  // Adding Stacks/Services in the Constructor
  // -------------------------------------------------
  it('should allow adding stacks in the constructor', () => {
    const service1 = new Service({ name: 'kafka-broker', image: 'kafka' });
    const service2 = new Service({ name: 'spark-master', image: 'spark' });
    const stack1 = new Stack({ name: 'kafka-stack', services: [service1] });
    const stack2 = new Stack({ name: 'spark-stack', services: [service2] });

    const composer = new Composer({
      name: 'local-lab',
      stacks: [stack1, stack2],
    });

    expect(composer.stacks).toHaveLength(2);
    expect(composer.stacks[0].name).toBe('kafka-stack');
    expect(composer.stacks[1].name).toBe('spark-stack');
  });

  it('should allow adding services in the constructor', () => {
    const service1 = new Service({ name: 'standalone-1', image: 'image-1' });
    const service2 = new Service({ name: 'standalone-2', image: 'image-2' });

    const composer = new Composer({
      name: 'local-lab',
      services: [service1, service2],
    });

    expect(composer.services).toHaveLength(2);
    expect(composer.services[0].name).toBe('standalone-1');
    expect(composer.services[1].name).toBe('standalone-2');
  });

  // -------------------------------------------------
  // Shared Config merges at Composer level
  // -------------------------------------------------
  it('should merge environment from relevant SharedConfigs at composer level', () => {
    const sc1 = new SharedConfig({
      name: 'global-monitoring',
      templates: ['templates/monitoring.yml'],
      appliesTo: ['local-lab'],
      environment: { MONITOR: 'true' },
      volumes: ['monitor-volume:/monitor'],
    });
    const sc2 = new SharedConfig({
      name: 'irrelevant-sc',
      templates: ['templates/irrelevant.yml'],
      appliesTo: ['some-other-lab'],
      environment: { IRRELEVANT: '1' },
    });

    const composer = new Composer({
      name: 'local-lab',
      sharedConfigs: [sc1, sc2],
      environment: { COMPOSER_VAR: 'abc' },
      volumes: ['composer-volume:/data'],
    });

    // sc1 merges, sc2 does not
    expect(composer.environment).toEqual({
      COMPOSER_VAR: 'abc',
      MONITOR: 'true',
    });
    // sc1 volumes also merges
    expect(composer.volumes).toEqual([
      'composer-volume:/data',
      'monitor-volume:/monitor',
    ]);
  });

  // -------------------------------------------------
  // Domain methods: add/remove stacks & services
  // -------------------------------------------------
  it('should add and remove stacks via domain methods', () => {
    const composer = new Composer({ name: 'local-lab' });
    const stackA = new Stack({ name: 'stackA' });
    const stackB = new Stack({ name: 'stackB' });

    composer.addStack(stackA);
    composer.addStack(stackB);

    expect(composer.stacks).toHaveLength(2);
    expect(composer.stacks[0].name).toBe('stackA');
    expect(composer.stacks[1].name).toBe('stackB');

    composer.removeStackByName('stackA');
    expect(composer.stacks).toHaveLength(1);
    expect(composer.stacks[0].name).toBe('stackB');
  });

  it('should add and remove services via domain methods', () => {
    const composer = new Composer({ name: 'local-lab' });
    const svcA = new Service({ name: 'svcA', image: 'imgA' });
    const svcB = new Service({ name: 'svcB', image: 'imgB' });

    composer.addService(svcA);
    composer.addService(svcB);

    expect(composer.services).toHaveLength(2);
    expect(composer.services[0].name).toBe('svcA');
    expect(composer.services[1].name).toBe('svcB');

    composer.removeServiceByName('svcA');
    expect(composer.services).toHaveLength(1);
    expect(composer.services[0].name).toBe('svcB');
  });

  // -------------------------------------------------
  // applyComposerConfigsToStacksAndServices
  // -------------------------------------------------
  it('should push composer environment to each stack and direct service', () => {
    // Suppose each Stack has a "mergeOverrides" method
    // and each service has "mergeOverrides" too.
    const serviceKafka = new Service({ name: 'kafka-broker', image: 'kafka' });
    const stack = new Stack({ name: 'kafka-stack', services: [serviceKafka] });

    const serviceStandalone = new Service({
      name: 'standalone-svc',
      image: 'standalone',
    });

    const composer = new Composer({
      name: 'local-lab',
      stacks: [stack],
      services: [serviceStandalone],
      environment: { COMPOSER_ENV: 'abc' },
      volumes: ['composer-vol:/composer'],
    });

    // We call the method that merges composer env into stacks & services
    composer.applyComposerConfigsToStacksAndServices();

    // Now we expect each stack to have composer environment
    expect(stack.environment).toEqual({ COMPOSER_ENV: 'abc' });
    expect(stack.volumes).toEqual(['composer-vol:/composer']);

    // And the stack applies environment to the service
    // if "stack.applyStackConfigsToServices()" was called internally.
    // Our example does that in "applyComposerConfigsToStacksAndServices()"
    // => stack.mergeOverrides(...) => stack.applyStackConfigsToServices().
    // So let's check the service environment:
    expect(serviceKafka.environment).toHaveProperty('COMPOSER_ENV', 'abc');
    expect(serviceKafka.volumes).toContain('composer-vol:/composer');

    // Check the direct service as well
    expect(serviceStandalone.environment).toHaveProperty('COMPOSER_ENV', 'abc');
    expect(serviceStandalone.volumes).toContain('composer-vol:/composer');
  });
});
