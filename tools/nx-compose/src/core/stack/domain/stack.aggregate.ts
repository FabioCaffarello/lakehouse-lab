import { AggregateRoot } from '../../common/domain/aggregate-root';
import { ValueObject } from '../../common/domain/value-object';
import { Uuid } from '../../common/domain/value-objects/uuid.vo';
import { Name } from '../../common/domain/value-objects/name.vo';
import { Notification } from '../../common/domain/validators/notification';
import { StackValidatorFactory } from './stack.validator';
import { SharedConfig } from '../../shared-config/domain/shared-config.aggregate';
import { Service } from '../../service/domain/service.aggregate';
import { StackFakeBuilder } from './stack-fake.builder';

export class StackId extends Uuid {}

export type StackProps = {
  stack_id?: StackId;
  name: Name;
  services?: Service[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: SharedConfig[];
  created_at?: Date;
};

export class Stack extends AggregateRoot {
  stack_id: StackId;
  name: Name;
  services: Service[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  sharedConfigs: SharedConfig[];
  created_at: Date;

  constructor(props: StackProps) {
    super();
    this.stack_id = props.stack_id ?? new StackId();
    this.name = props.name;
    this.services = props.services ?? [];
    this.environment = props.environment ?? {};
    this.volumes = props.volumes ?? [];
    this.networks = props.networks ?? [];
    this.sharedConfigs = props.sharedConfigs ?? [];
    this.created_at = props.created_at ?? new Date();

    this.applyStackSharedConfigs();
  }

  private applyStackSharedConfigs(): void {
    for (const config of this.sharedConfigs) {
      if (config.appliesTo.includes(this.name.value)) {
        this.environment = { ...this.environment, ...config.environment };
        this.volumes = [...this.volumes, ...config.volumes];
        this.networks = [...this.networks, ...config.networks];
      }
    }
  }

  applyStackConfigsToServices(): void {
    for (const service of this.services) {
      service.mergeOverrides(this.environment, this.volumes, this.networks);
    }
  }

  mergeOverrides(
    env: Record<string, string>,
    vols: string[],
    nets: string[]
  ): void {
    this.environment = { ...this.environment, ...env };
    this.volumes = [...this.volumes, ...vols];
    this.networks = [...this.networks, ...nets];
  }

  validate(fields?: string[]): boolean {
    const validator = StackValidatorFactory.create();
    const isValid = validator.validate(this.notification, this, fields);
    if (!isValid) {
      throw new Error(
        `Validation failed: ${JSON.stringify(this.notification.toJSON())}`
      );
    }
    return true;
  }

  get entity_id(): ValueObject {
    return this.stack_id;
  }

  static fake() {
    return StackFakeBuilder;
  }

  toJSON() {
    return {
      stack_id: this.stack_id.toString(),
      name: this.name.value,
      environment: this.environment,
      volumes: this.volumes,
      networks: this.networks,
      services: this.services.map((s) => s.entity_id.toString()),
      sharedConfigs: this.sharedConfigs.map((sc) => sc.entity_id.toString()),
      created_at: this.created_at,
    };
  }

  static create(props: StackProps): Stack {
    const stack = new Stack(props);
    stack.validate(['name', 'environment', 'volumes', 'networks']);
    return stack;
  }

  changeName(name: Name): void {
    this.name = name;
    this.validate(['name']);
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

  changeSharedConfigs(sharedConfigs: SharedConfig[]): void {
    this.sharedConfigs = sharedConfigs;
  }

  changeServices(services: Service[]): void {
    this.services = services;
  }

  addService(service: Service): void {
    this.services.push(service);
  }

  removeServiceByName(name: string): void {
    this.services = this.services.filter((s) => s.name.value !== name);
  }
}
