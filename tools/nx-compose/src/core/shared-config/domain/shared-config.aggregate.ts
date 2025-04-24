import { AggregateRoot } from '../../common/domain/aggregate-root';
import { ValueObject } from '../../common/domain/value-object';
import { Uuid } from '../../common/domain/value-objects/uuid.vo';
import { Name } from '../../common/domain/value-objects/name.vo';
import { Notification } from '../../common/domain/validators/notification';
import { SharedConfigValidatorFactory } from './shared-config.validator';
import { SharedConfigFakeBuilder } from './shared-config-fake.builder';

export class SharedConfigId extends Uuid {}

export type SharedConfigProps = {
  shared_config_id?: SharedConfigId;
  name: Name;
  templates: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  appliesTo: string[];
  created_at?: Date;
};

export class SharedConfig extends AggregateRoot {
  shared_config_id: SharedConfigId;
  name: Name;
  templates: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  appliesTo: string[];
  created_at: Date;

  constructor(props: SharedConfigProps) {
    super();
    this.shared_config_id = props.shared_config_id ?? new SharedConfigId();
    this.name = props.name;
    this.templates = props.templates;
    this.environment = props.environment || {};
    this.volumes = props.volumes || [];
    this.networks = props.networks || [];
    this.appliesTo = props.appliesTo;
    this.created_at = props.created_at || new Date();
  }

  get entity_id(): ValueObject {
    return this.shared_config_id;
  }

  static create(props: SharedConfigProps): SharedConfig {
    const sharedConfig = new SharedConfig(props);
    sharedConfig.validate([
      'name',
      'templates',
      'environment',
      'volumes',
      'networks',
      'appliesTo',
    ]);
    return sharedConfig;
  }

  changeName(name: Name): void {
    this.name = name;
    this.validate(['name']);
  }

  changeTemplates(templates: string[]): void {
    this.templates = templates;
    this.validate(['templates']);
  }

  changeEnvironment(env: Record<string, string>): void {
    this.environment = env;
    this.validate(['environment']);
  }

  changeVolumes(volumes: string[]): void {
    this.volumes = volumes;
    this.validate(['volumes']);
  }

  changeNetworks(networks: string[]): void {
    this.networks = networks;
    this.validate(['networks']);
  }

  changeAppliesTo(appliesTo: string[]): void {
    this.appliesTo = appliesTo;
    this.validate(['appliesTo']);
  }

  validate(fields?: string[]): boolean {
    const validator = SharedConfigValidatorFactory.create();
    const isValid = validator.validate(this.notification, this, fields);
    if (!isValid) {
      throw new Error(
        `Validation failed: ${JSON.stringify(this.notification.toJSON())}`
      );
    }
    return true;
  }

  static fake() {
    return SharedConfigFakeBuilder;
  }

  toJSON() {
    return {
      shared_config_id: this.shared_config_id.id,
      name: this.name.value,
      templates: this.templates,
      environment: this.environment,
      volumes: this.volumes,
      networks: this.networks,
      appliesTo: this.appliesTo,
      created_at: this.created_at,
    };
  }
}
