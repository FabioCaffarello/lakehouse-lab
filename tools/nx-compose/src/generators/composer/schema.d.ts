export interface ComposerGeneratorSchema {
  id?: string;
  action?: 'create' | 'update' | 'delete' | 'get' | 'list';
  name?: string;
  stacks?: string[];
  services?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: string[];
  created_at?: Date;
}
