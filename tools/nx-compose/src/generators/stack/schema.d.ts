export interface StackGeneratorSchema {
  id?: string;
  action?: 'create' | 'update' | 'delete' | 'get' | 'list';
  name?: string;
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
  services?: string[];
  created_at?: Date;
}
