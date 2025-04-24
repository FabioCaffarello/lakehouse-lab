export interface SharedConfigGeneratorSchema {
  action?: 'create' | 'update' | 'delete' | 'get' | 'list';
  id?: string;
  name?: string;
  templates?: string[];
  appliesTo?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
}
