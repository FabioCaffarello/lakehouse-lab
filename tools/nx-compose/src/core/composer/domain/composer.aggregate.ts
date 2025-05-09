import { AggregateRoot } from '../../common/domain/aggregate-root';
import { ValueObject } from '../../common/domain/value-object';
import { Uuid } from '../../common/domain/value-objects/uuid.vo';
import { Name } from '../../common/domain/value-objects/name.vo';
import { ComposerValidatorFactory } from './composer.validator';
import { SharedConfig } from '../../shared-config/domain/shared-config.aggregate';
import { Stack } from '../../stack/domain/stack.aggregate';
import { Service } from '../../service/domain/service.aggregate';
import { ComposerFakeBuilder } from './composer-fake.builder';

export class ComposerId extends Uuid {}

export type ComposerProps = {
  composer_id?: ComposerId;
  name: Name;
  stacks?: Stack[];
  services?: Service[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: SharedConfig[];
  created_at?: Date;
};

export class Composer extends AggregateRoot {
  composer_id: ComposerId;
  name: Name;
  stacks: Stack[];
  services: Service[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  sharedConfigs: SharedConfig[];
  created_at: Date;

  constructor(props: ComposerProps) {
    super();
    this.composer_id = props.composer_id ?? new ComposerId();
    this.name = props.name;
    this.stacks = props.stacks ?? [];
    this.services = props.services ?? [];
    this.environment = props.environment ?? {};
    this.volumes = props.volumes ?? [];
    this.networks = props.networks ?? [];
    this.sharedConfigs = props.sharedConfigs ?? [];
    this.created_at = props.created_at ?? new Date();

    this.applyComposerSharedConfigs();
  }

  private applyComposerSharedConfigs(): void {
    for (const config of this.sharedConfigs) {
      if (config.appliesTo.includes(this.name.value)) {
        this.environment = { ...this.environment, ...config.environment };
        this.volumes = [...this.volumes, ...config.volumes];
        this.networks = [...this.networks, ...config.networks];
      }
    }
  }

  applyComposerConfigsToStacksAndServices(): void {
    for (const stack of this.stacks) {
      stack.mergeOverrides(this.environment, this.volumes, this.networks);
      stack.applyStackConfigsToServices();
    }
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
    const validator = ComposerValidatorFactory.create();
    const isValid = validator.validate(this.notification, this, fields);
    if (!isValid) {
      throw new Error(
        `Validation failed: ${JSON.stringify(this.notification.toJSON())}`
      );
    }
    return true;
  }

  get entity_id(): ValueObject {
    return this.composer_id;
  }

  static fake() {
    return ComposerFakeBuilder;
  }

  toJSON() {
    return {
      composer_id: this.composer_id.id,
      name: this.name.value,
      environment: this.environment,
      volumes: this.volumes,
      networks: this.networks,
      stacks: this.stacks.map((s) => s.entity_id.toString()),
      services: this.services.map((s) => s.entity_id.toString()),
      sharedConfigs: this.sharedConfigs.map((sc) => sc.entity_id.toString()),
      created_at: this.created_at,
    };
  }

  static create(props: ComposerProps): Composer {
    const composer = new Composer(props);
    composer.validate(['name', 'environment', 'volumes', 'networks']);
    return composer;
  }

  addStack(stack: Stack): void {
    this.stacks.push(stack);
  }

  changeName(name: Name): void {
    this.name = name;
    this.validate(['name']);
  }

  changeEnvironment(env: Record<string, string>): void {
    this.environment = env;
    this.validate(['environment']);
  }

  changeVolumes(vols: string[]): void {
    this.volumes = vols;
    this.validate(['volumes']);
  }

  changeNetworks(nets: string[]): void {
    this.networks = nets;
    this.validate(['networks']);
  }

  changeStacks(stacks: Stack[]): void {
    this.stacks = stacks;
  }

  changeServices(services: Service[]): void {
    this.services = services;
  }

  changeSharedConfigs(sharedConfigs: SharedConfig[]): void {
    this.sharedConfigs = sharedConfigs;
  }

  removeStackByName(name: string): void {
    this.stacks = this.stacks.filter((s) => s.name.value !== name);
  }

  addService(service: Service): void {
    this.services.push(service);
  }

  removeServiceByName(name: string): void {
    this.services = this.services.filter((s) => s.name.value !== name);
  }
}
