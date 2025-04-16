import { AggregateRoot } from '../../common/domain/aggregate-root';
import { ValueObject } from '../../common/domain/value-object';
import { Uuid } from '../../common/domain/value-objects/uuid.vo';
import { Name } from '../../common/domain/value-objects/name.vo';
import { SharedConfig } from '../../shared-config/domain/shared-config.aggregate';
import { ServiceValidatorFactory } from './service.validator';
import { ServiceFakeBuilder } from './service-fake.builder';

export class ServiceId extends Uuid {}

export type ServiceProps = {
  service_id?: ServiceId;
  name: Name;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: SharedConfig[];
  created_at?: Date;
};

export class Service extends AggregateRoot {
  service_id: ServiceId;
  name: Name;
  image?: string;
  templateFile?: string;
  environment: Record<string, string>;
  ports: string[];
  volumes: string[];
  networks: string[];
  sharedConfigs: SharedConfig[];
  created_at: Date;

  constructor(props: ServiceProps) {
    super();

    const hasImage = !!props.image;
    const hasTemplate = !!props.templateFile;

    if (hasImage && hasTemplate) {
      throw new Error('You cannot specify both image and templateFile at once');
    }

    if (!hasImage && !hasTemplate) {
      throw new Error('Either image or templateFile must be provided');
    }

    this.service_id = props.service_id ?? new ServiceId();
    this.name = props.name;
    this.image = props.image;
    this.templateFile = props.templateFile;
    this.environment = props.environment ?? {};
    this.ports = props.ports ?? [];
    this.volumes = props.volumes ?? [];
    this.networks = props.networks ?? [];
    this.sharedConfigs = props.sharedConfigs ?? [];
    this.created_at = props.created_at ?? new Date();

    this.applySharedConfigs();
  }

  private applySharedConfigs(): void {
    for (const config of this.sharedConfigs) {
      if (config.appliesTo.includes(this.name.value)) {
        this.environment = { ...this.environment, ...config.environment };
        this.volumes = [...this.volumes, ...config.volumes];
        this.networks = [...this.networks, ...config.networks];
      }
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
    return ServiceValidatorFactory.create().validate(
      this.notification,
      this,
      fields
    );
  }

  get entity_id(): ValueObject {
    return this.service_id;
  }

  toJSON() {
    return {
      service_id: this.service_id.id,
      name: this.name.value,
      image: this.image,
      templateFile: this.templateFile,
      environment: this.environment,
      ports: this.ports,
      volumes: this.volumes,
      networks: this.networks,
      sharedConfigs: this.sharedConfigs.map((sc) => sc.shared_config_id.id),
      created_at: this.created_at,
    };
  }

  static fake() {
    return ServiceFakeBuilder;
  }

  static create(props: ServiceProps): Service {
    const service = new Service(props);
    const isValid = service.validate([
      'name',
      'image',
      'templateFile',
      'ports',
      'environment',
      'volumes',
      'networks',
    ]);

    if (!isValid) {
      throw new Error(
        `Validation failed: ${JSON.stringify(service.notification.toJSON())}`
      );
    }

    return service;
  }
}
