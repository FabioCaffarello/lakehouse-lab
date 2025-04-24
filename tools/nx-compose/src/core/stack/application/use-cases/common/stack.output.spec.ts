import { Stack } from '../../../domain/stack.aggregate';
import { StackOutputMapper } from './stack.output';
import { Name } from '../../../../common/domain/value-objects/name.vo';

describe('StackOutputMapper Unit Tests', () => {
  it('should convert a Stack entity to output', () => {
    const entity = Stack.fake()
      .aStack()
      .withName(new Name('stack-test'))
      .build();
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = StackOutputMapper.toOutput(entity);

    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toEqual({
      id: entity.stack_id.id,
      name: entity.name.value,
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
