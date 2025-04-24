import { Composer } from '../../../domain/composer.aggregate';
import { ComposerOutputMapper } from './composer.output';
import { Name } from '../../../../common/domain/value-objects/name.vo';

describe('ComposerOutputMapper Unit Tests', () => {
  it('should convert a Composer entity to output', () => {
    const entity = Composer.fake()
      .aComposer()
      .withName(new Name('composer-test'))
      .build();
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ComposerOutputMapper.toOutput(entity);

    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toEqual({
      id: entity.composer_id.id,
      name: entity.name.value,
      stacks: entity.stacks.map((stack) => stack.stack_id.id),
      services: entity.services.map((service) => service.service_id.id),
      environment: entity.environment,
      volumes: entity.volumes,
      networks: entity.networks,
      sharedConfigs: entity.sharedConfigs.map(
        (config) => config.shared_config_id.id
      ),
      created_at: entity.created_at,
    });
  });
});
