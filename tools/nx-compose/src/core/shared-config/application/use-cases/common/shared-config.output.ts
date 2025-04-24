import { SharedConfig } from '../../../domain/shared-config.aggregate';

export type SharedConfigOutput = {
  id: string;
  name: string;
  templates: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  appliesTo: string[];
  created_at: Date;
};

export class SharedConfigOutputMapper {
  static toOutput(entity: SharedConfig): SharedConfigOutput {
    const { shared_config_id, ...props } = entity.toJSON();
    return {
      id: shared_config_id,
      ...props,
    };
  }
}
