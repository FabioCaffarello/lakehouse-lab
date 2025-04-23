import { Service } from '../../../domain/service.aggregate';
import { ServiceOutputMapper } from './service.output';
import { Name } from '../../../../common/domain/value-objects/name.vo';

describe('ServiceOutputMapper Unit Tests', () => {
  it('should convert a Service entity to output', () => {
    const entity = Service.fake()
      .aService()
      .withName(new Name('service-test'))
      .withTemplateFile('template.yaml')
      .build();
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ServiceOutputMapper.toOutput(entity);

    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toEqual({
      id: entity.service_id.id,
      name: entity.name.value,
      image: entity.image,
      templateFile: entity.templateFile,
      environment: entity.environment,
      ports: entity.ports,
      volumes: entity.volumes,
      networks: entity.networks,
      sharedConfigs: entity.sharedConfigs.map(
        (config) => config.shared_config_id.id
      ),
      created_at: entity.created_at,
    });
  });
});
