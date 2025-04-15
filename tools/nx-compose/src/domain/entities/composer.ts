import { Stack } from './stack';
import { Service } from './service';
import { SharedConfig } from './shared-config';

export interface ComposerProps {
  name: string;
  /** A composer can have multiple stacks */
  stacks?: Stack[];
  /** A composer can also have direct services */
  services?: Service[];

  /** Environment/volumes/networks at the composer level */
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];

  /** Optional shared configs that might apply to this composer’s name */
  sharedConfigs?: SharedConfig[];
}

export class Composer {
  private props: ComposerProps;

  constructor(props: ComposerProps) {
    if (!props.name) {
      throw new Error('Composer name is required');
    }

    this.props = {
      ...props,
      stacks: props.stacks || [],
      services: props.services || [],
      environment: props.environment || {},
      volumes: props.volumes || [],
      networks: props.networks || [],
      sharedConfigs: props.sharedConfigs || [],
    };

    // Optionally merge the composer-level shared configs
    this.applyComposerSharedConfigs();
  }

  /**
   * If the composer has any SharedConfigs whose appliesTo includes
   * this composer's name, we merge them into the composer's environment,
   * volumes, networks.
   */
  private applyComposerSharedConfigs(): void {
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
   * This method optionally pushes the composer's environment, volumes,
   * and networks down to each stack and each service. It's your domain call
   * whether you want a 2-step approach (like "composer -> stack -> service")
   * or if you want the composer to also directly affect its services.
   */
  public applyComposerConfigsToStacksAndServices(): void {
    // 1) Push to each stack
    for (const stack of this.props.stacks) {
      // We'll assume Stack has a domain method "mergeOverrides"
      // or we do something inline:
      stack.mergeOverrides(
        this.props.environment,
        this.props.volumes,
        this.props.networks
      );

      // Then let each stack push environment down to its services
      stack.applyStackConfigsToServices();
    }

    // 2) Also push environment/volumes/networks to direct services
    for (const service of this.props.services) {
      service.mergeOverrides(
        this.props.environment,
        this.props.volumes,
        this.props.networks
      );
    }
  }

  // -------------------------------------------------------------------
  // GETTERS
  // -------------------------------------------------------------------
  get name(): string {
    return this.props.name;
  }

  get stacks(): Stack[] {
    return this.props.stacks;
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
  public addStack(stack: Stack): void {
    this.props.stacks.push(stack);
  }

  public removeStackByName(stackName: string): void {
    this.props.stacks = this.props.stacks.filter((s) => s.name !== stackName);
  }

  public addService(service: Service): void {
    this.props.services.push(service);
  }

  public removeServiceByName(serviceName: string): void {
    this.props.services = this.props.services.filter(
      (s) => s.name !== serviceName
    );
  }
}
