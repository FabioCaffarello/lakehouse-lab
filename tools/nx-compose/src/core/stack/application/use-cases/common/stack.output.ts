import { Stack } from '../../../domain/stack.aggregate';

export type StackOutput = {
  id: string;
  name: string;
  services: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  sharedConfigs: string[];
  created_at: Date;
};

export class StackOutputMapper {
  static toOutput(entity: Stack): StackOutput {
    const { stack_id, ...props } = entity.toJSON();
    return {
      id: stack_id,
      ...props,
    };
  }
}
