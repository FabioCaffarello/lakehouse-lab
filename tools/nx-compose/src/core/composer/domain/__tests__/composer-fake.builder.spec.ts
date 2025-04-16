import { ComposerFakeBuilder } from '../composer-fake.builder';
import { Composer } from '../composer.aggregate';
import { SharedConfigFakeBuilder } from '../../../shared-config/domain/shared-config-fake.builder';

describe('ComposerFakeBuilder', () => {
  test('should build a valid Composer instance', () => {
    const composer = ComposerFakeBuilder.aComposer().build();
    expect(composer).toBeInstanceOf(Composer);
    expect(composer.notification.hasErrors()).toBe(false);
  });

  test('should build multiple composers', () => {
    const composers = ComposerFakeBuilder.theComposers(3).build();
    expect(composers.length).toBe(3);
    composers.forEach((c) => {
      expect(c).toBeInstanceOf(Composer);
      expect(c.notification.hasErrors()).toBe(false);
    });
  });

  test('should override name and environment', () => {
    const composer = ComposerFakeBuilder.aComposer()
      .withName('custom-composer')
      .withEnvironment({ CUSTOM: 'true' })
      .build();

    expect(composer.name).toBe('custom-composer');
    expect(composer.environment.CUSTOM).toBe('true');
  });

  test('should override volumes and networks', () => {
    const composer = ComposerFakeBuilder.aComposer()
      .withVolumes(['foo:/bar'])
      .withNetworks(['custom-net'])
      .build();

    expect(composer.volumes).toContain('foo:/bar');
    expect(composer.networks).toContain('custom-net');
  });

  test('should include services and stacks', () => {
    const composer = ComposerFakeBuilder.aComposer().build();
    expect(Array.isArray(composer.services)).toBe(true);
    expect(Array.isArray(composer.stacks)).toBe(true);
  });

  test('should include shared configs that apply to composer name', () => {
    const composer = ComposerFakeBuilder.aComposer()
      .withName('special-composer')
      .withSharedConfigs([
        SharedConfigFakeBuilder.aSharedConfig()
          .withAppliesTo(['special-composer'])
          .build(),
      ])
      .build();

    expect(
      composer.sharedConfigs.some((sc) =>
        sc.appliesTo.includes('special-composer')
      )
    ).toBe(true);
  });
});
