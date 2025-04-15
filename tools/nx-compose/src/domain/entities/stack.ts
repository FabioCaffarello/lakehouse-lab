import { Service } from './service';
import { SharedConfig } from './shared-config';

export interface StackProps {
  name: string;
  services?: Service[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];

  /**
   * Optional: if you want a stack to also reference shared configs
   * that apply to the stack-level config (or potentially to each service).
   */
  sharedConfigs?: SharedConfig[];
}

export class Stack {
  private props: StackProps;

  constructor(props: StackProps) {
    if (!props.name) {
      throw new Error('Stack name is required');
    }

    this.props = {
      ...props,
      services: props.services || [],
      environment: props.environment || {},
      volumes: props.volumes || [],
      networks: props.networks || [],
      sharedConfigs: props.sharedConfigs || [],
    };

    // Optionally apply merges at the stack level
    this.applyStackSharedConfigs();
  }

  /**
   * Similar to the Service approach, we can merge environment/volumes/networks
   * from shared configs that 'applyTo' this stack's name.
   */
  private applyStackSharedConfigs(): void {
    let mergedEnv = { ...this.props.environment };
    let mergedVols = [...this.props.volumes];
    let mergedNets = [...this.props.networks];

    for (const sc of this.props.sharedConfigs) {
      if (sc.applyTo(this.props.name)) {
        mergedEnv = { ...mergedEnv, ...sc.environment };
        mergedVols = [...mergedVols, ...sc.volumes];
        mergedNets = [...mergedNets, ...sc.networks];
      }
    }

    this.props.environment = mergedEnv;
    this.props.volumes = mergedVols;
    this.props.networks = mergedNets;
  }

  /**
   * If you want to *push down* the stack-level environment/volumes/networks
   * into each Service, consider adding a method that merges them into each Service
   * (depending on your domain rules).
   */
  public applyStackConfigsToServices(): void {
    for (const service of this.props.services) {
      // Merging stack environment into each service:
      const mergedEnv = { ...service.environment, ...this.props.environment };
      const mergedVols = [...service.volumes, ...this.props.volumes];
      const mergedNets = [...service.networks, ...this.props.networks];

      // We can’t directly mutate the private props of `Service`, so we’d either:
      // 1) Provide a method on Service to merge environment/volumes, or
      // 2) Reconstruct a new Service with updated props (less common in a typical domain model).
      // Let's illustrate #1 for clarity:

      service.mergeOverrides(mergedEnv, mergedVols, mergedNets);
    }
  }

  // -------------------------------------------------------------------
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
  // -------------------------------------------------------------------
  get name(): string {
    return this.props.name;
  }

  get services(): Service[] {
    return this.props.services;
  }

  get environment(): Record<string, string> {
    return this.props.environment;
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

  // -------------------------------------------------------------------
  // Potential domain methods
  // -------------------------------------------------------------------
  public addService(service: Service): void {
    // for example, push to the array
    this.props.services.push(service);
  }

  public removeServiceByName(serviceName: string): void {
    this.props.services = this.props.services.filter(
      (s) => s.name !== serviceName
    );
  }
}
