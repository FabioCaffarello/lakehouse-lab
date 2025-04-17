import { SharedConfig } from '../../../domain/shared-config.aggregate';
import { SharedConfigOutputMapper } from './shared-config.output';
import { Name } from '../../../../common/domain/value-objects/name.vo';

describe('SharedConfigOutputMapper Unit Tests', () => {
  it('should convert a SharedConfig entity to output', () => {
    const entity = SharedConfig.create({
      name: new Name('my-config'),
      templates: ['template.yaml'],
      appliesTo: ['service1'],
      environment: { NODE_ENV: 'production' },
      volumes: ['volume1:/data'],
      networks: ['network1'],
    });

    const spyToJSON = jest.spyOn(entity, 'toJSON');

    const output = SharedConfigOutputMapper.toOutput(entity);

    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.shared_config_id.id,
      name: entity.name.value,
      templates: entity.templates,
      environment: entity.environment,
      volumes: entity.volumes,
      networks: entity.networks,
      appliesTo: entity.appliesTo,
      created_at: entity.created_at,
    });
  });
});
