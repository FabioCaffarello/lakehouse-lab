import { StackFakeBuilder } from '../stack-fake.builder';
import { Stack } from '../stack.aggregate';

describe('StackFakeBuilder', () => {
  test('should build a valid Stack instance with default values', () => {
    const stack = StackFakeBuilder.aStack().build();

    expect(stack).toBeInstanceOf(Stack);
    expect(stack.notification.hasErrors()).toBe(false);
    expect(stack.name).toBeDefined();
    expect(stack.environment).toBeDefined();
    expect(stack.volumes.length).toBeGreaterThan(0);
    expect(stack.networks.length).toBeGreaterThan(0);
  });

  test('should override name', () => {
    const stack = StackFakeBuilder.aStack().withName('custom-stack').build();
    expect(stack.name).toBe('custom-stack');
  });

  test('should override environment', () => {
    const env = { DEBUG: 'true' };
    const stack = StackFakeBuilder.aStack().withEnvironment(env).build();
    expect(stack.environment).toEqual(env);
  });

  test('should override volumes and networks', () => {
    const volumes = ['foo:/bar'];
    const networks = ['custom-net'];
    const stack = StackFakeBuilder.aStack()
      .withVolumes(volumes)
      .withNetworks(networks)
      .build();

    expect(stack.volumes).toEqual(volumes);
    expect(stack.networks).toEqual(networks);
  });

  test('should build multiple stacks', () => {
    const stacks = StackFakeBuilder.theStacks(3).build();
    expect(stacks.length).toBe(3);
    stacks.forEach((stack) => {
      expect(stack).toBeInstanceOf(Stack);
    });
  });

  test('should apply sharedConfigs correctly', () => {
    const stack = StackFakeBuilder.aStack().withName('dev-stack').build();

    expect(stack.sharedConfigs.length).toBeGreaterThan(0);
    expect(Object.keys(stack.environment).length).toBeGreaterThan(0);
  });
});
