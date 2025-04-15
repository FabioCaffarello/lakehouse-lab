import { SharedConfig } from './shared-config';

export interface ServiceProps {
  name: string;
  image?: string;
  templateFile?: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  sharedConfigs?: SharedConfig[];
}

export class Service {
  private props: ServiceProps;

  constructor(props: ServiceProps) {
    if (!props.name) {
      throw new Error('Service name is required');
    }

    const hasImage = !!props.image;
    const hasTemplate = !!props.templateFile;

    if (hasImage && hasTemplate) {
      throw new Error('You cannot specify both image and templateFile at once');
    }

    if (!hasImage && !hasTemplate) {
      throw new Error('Either image or templateFile must be provided');
    }

    this.props = {
      ...props,
      environment: props.environment || {},
      volumes: props.volumes || [],
      networks: props.networks || [],
      ports: props.ports || [],
      sharedConfigs: props.sharedConfigs || [],
    };

    // automatically apply relevant shared configs
    this.applySharedConfigs();
  }

  private applySharedConfigs(): void {
    let mergedEnv = { ...this.props.environment };
    let mergedVols = [...this.props.volumes];
    let mergedNetworks = [...this.props.networks];

    for (const sc of this.props.sharedConfigs) {
      if (sc.applyTo(this.props.name)) {
        mergedEnv = { ...mergedEnv, ...sc.environment };
        mergedVols = [...mergedVols, ...sc.volumes];
        mergedNetworks = [...mergedNetworks, ...sc.networks];
      }
    }

    this.props.environment = mergedEnv;
    this.props.volumes = mergedVols;
    this.props.networks = mergedNetworks;
  }

  /**
   * This allows external entities (like Stack) to override environment,
   * volumes, or networks after the Service is created.
   */
  public mergeOverrides(
    env: Record<string, string>,
    vols: string[],
    nets: string[]
  ): void {
    // Merge environment
    this.props.environment = {
      ...this.props.environment,
      ...env,
    };

    // Merge volumes
    this.props.volumes = [...this.props.volumes, ...vols];

    // Merge networks
    this.props.networks = [...this.props.networks, ...nets];
  }

  // GETTERS
  get name(): string {
    return this.props.name;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get templateFile(): string | undefined {
    return this.props.templateFile;
  }

  get environment(): Record<string, string> {
    return this.props.environment;
  }

  get ports(): string[] {
    return this.props.ports;
  }

  get volumes(): string[] {
    return this.props.volumes;
  }

  get networks(): string[] {
    return this.props.networks;
  }

  get sharedConfigs(): SharedConfig[] {
    return this.props.sharedConfigs;
  }

  // Additional domain logic...
}
