import { Composer } from '../../../domain/composer.aggregate';

export type ComposerOutput = {
  id: string;
  name: string;
  stacks: string[];
  services: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  sharedConfigs: string[];
  created_at: Date;
};

export class ComposerOutputMapper {
  static toOutput(entity: Composer): ComposerOutput {
    const { composer_id, ...props } = entity.toJSON();
    return {
      id: composer_id,
      ...props,
    };
  }
}
