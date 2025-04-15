export interface SharedConfigProps {
  name: string;
  templates: string[]; // Must have at least one
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];

  /**
   * The array of service names (or tags) this config applies to.
   */
  appliesTo: string[];
}

export class SharedConfig {
  private props: SharedConfigProps;

  constructor(props: SharedConfigProps) {
    if (!props.name) {
      throw new Error('SharedConfig name is required');
    }
    if (!props.templates || props.templates.length === 0) {
      throw new Error(
        'At least one YAML template must be provided in SharedConfig'
      );
    }

    this.props = {
      ...props,
      environment: props.environment || {},
      volumes: props.volumes || [],
      networks: props.networks || [],
    };
  }

  get name(): string {
    return this.props.name;
  }

  get templates(): string[] {
    return this.props.templates;
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

  get appliesTo(): string[] {
    return this.props.appliesTo;
  }

  /**
   * Check if this SharedConfig applies to the given service name.
   */
  public applyTo(serviceName: string): boolean {
    return this.props.appliesTo.includes(serviceName);
  }
}
