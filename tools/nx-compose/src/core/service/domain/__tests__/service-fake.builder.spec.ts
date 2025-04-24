import { ServiceFakeBuilder } from '../service-fake.builder';
import { Service } from '../service.aggregate';
import { Name } from '../../../common/domain/value-objects/name.vo';

describe('ServiceFakeBuilder', () => {
  test('should build a valid Service instance with image', () => {
    const service = ServiceFakeBuilder.aService().withImage('node:18').build();
    expect(service).toBeInstanceOf(Service);
    expect(service.image).toBe('node:18');
    expect(service.templateFile).toBeUndefined();
    expect(service.notification.hasErrors()).toBe(false);
  });

  test('should build a valid Service instance with templateFile', () => {
    const service = ServiceFakeBuilder.aService()
      .withTemplateFile('service.yaml')
      .build();
    expect(service.templateFile).toBe('service.yaml');
    expect(service.image).toBeUndefined();
    expect(service.notification.hasErrors()).toBe(false);
  });

  test('should throw error when neither image nor templateFile is provided', () => {
    const builder = ServiceFakeBuilder.aService().withImage(undefined);
    expect(() => builder.build()).toThrow(
      'Either image or templateFile must be provided'
    );
  });

  test('should build multiple services', () => {
    const services = ServiceFakeBuilder.theServices(3).build();
    expect(services.length).toBe(3);
    services.forEach((s) => expect(s).toBeInstanceOf(Service));
  });

  test('should apply shared configs based on appliesTo', () => {
    const service = ServiceFakeBuilder.aService()
      .withName(new Name('my-service'))
      .withSharedConfigs([
        ServiceFakeBuilder.aService()
          .withName(new Name('my-service'))
          .withTemplateFile('shared.yaml')
          .build().sharedConfigs[0],
      ])
      .build();

    expect(service.environment).toBeDefined();
    expect(service.volumes.length).toBeGreaterThan(0);
    expect(service.networks.length).toBeGreaterThan(0);
  });
});
