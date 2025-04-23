import { Service } from '../../../domain/service.aggregate';

export type ServiceOutput = {
  id: string;
  name: string;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
  created_at: Date;
};

export class ServiceOutputMapper {
  static toOutput(entity: Service): ServiceOutput {
    const { service_id, ...props } = entity.toJSON();
    return {
      id: service_id,
      ...props,
    };
  }
}
