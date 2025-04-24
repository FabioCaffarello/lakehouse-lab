import { SharedConfigFakeBuilder } from '../shared-config-fake.builder';
import { SharedConfig } from '../shared-config.aggregate';
import { Name } from '../../../common/domain/value-objects/name.vo';

describe('SharedConfigFakeBuilder', () => {
  test('should build a valid SharedConfig instance', () => {
    const config = SharedConfigFakeBuilder.aSharedConfig().build();
    expect(config).toBeInstanceOf(SharedConfig);
    expect(config.notification.hasErrors()).toBe(false);
  });

  test('should build multiple SharedConfig instances', () => {
    const configs = SharedConfigFakeBuilder.theSharedConfigs(3).build();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs).toHaveLength(3);
    configs.forEach((c) => expect(c).toBeInstanceOf(SharedConfig));
  });

  test('should override name with specific value', () => {
    const config = SharedConfigFakeBuilder.aSharedConfig()
      .withName(new Name('MyConfig'))
      .build();
    expect(config.name.value).toBe('MyConfig');
  });

  test('should override templates with specific values', () => {
    const config = SharedConfigFakeBuilder.aSharedConfig()
      .withTemplates(['a.yaml', 'b.yml'])
      .build();
    expect(config.templates).toEqual(['a.yaml', 'b.yml']);
  });

  test('should fail validation with invalid name (too long)', () => {
    expect(() =>
      SharedConfigFakeBuilder.aSharedConfig().withInvalidNameTooLong().build()
    ).toThrow();
  });

  test('should provide access to individual field values via getters', () => {
    const builder = SharedConfigFakeBuilder.aSharedConfig().withName(
      new Name('GetterTest')
    );
    expect(builder.name.value).toBe('GetterTest');
  });

  test('should throw error when accessing unset optional field via getter', () => {
    const builder = SharedConfigFakeBuilder.aSharedConfig();
    expect(() => builder.shared_config_id).toThrow(
      "Property shared_config_id not have a factory, use 'with' methods"
    );
  });
});
