// import { ActionSchema } from '../common/schema';

export interface ServiceGeneratorSchema {
  id?: string;
  action?: 'create' | 'update' | 'delete' | 'get' | 'list';
  name?: string;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
  created_at?: Date;
}
