import { Chance } from 'chance';
import { SharedConfig, SharedConfigId } from './shared-config.aggregate';
import { Name } from '../../common/domain/value-objects/name.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export class SharedConfigFakeBuilder<TBuild = any> {
  private _shared_config_id: PropOrFactory<SharedConfigId> | undefined =
    undefined;
  private _name: PropOrFactory<Name> = (_index) => new Name(this.chance.word());
  private _templates: PropOrFactory<string[]> = (_index) => ['default.yaml'];
  private _environment: PropOrFactory<Record<string, string>> = (_index) => ({
    NODE_ENV: 'production',
  });
  private _volumes: PropOrFactory<string[]> = (_index) => ['data:/data'];
  private _networks: PropOrFactory<string[]> = (_index) => ['default-network'];
  private _appliesTo: PropOrFactory<string[]> = (_index) => ['default-service'];
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;

  static aSharedConfig() {
    return new SharedConfigFakeBuilder<SharedConfig>();
  }

  static theSharedConfigs(countObjs: number) {
    return new SharedConfigFakeBuilder<SharedConfig[]>(countObjs);
  }

  private chance: Chance.Chance;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withSharedConfigId(valueOrFactory: PropOrFactory<SharedConfigId>) {
    this._shared_config_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<Name>) {
    this._name = valueOrFactory;
    return this;
  }

  withTemplates(valueOrFactory: PropOrFactory<string[]>) {
    this._templates = valueOrFactory;
    return this;
  }

  withEnvironment(valueOrFactory: PropOrFactory<Record<string, string>>) {
    this._environment = valueOrFactory;
    return this;
  }

  withVolumes(valueOrFactory: PropOrFactory<string[]>) {
    this._volumes = valueOrFactory;
    return this;
  }

  withNetworks(valueOrFactory: PropOrFactory<string[]>) {
    this._networks = valueOrFactory;
    return this;
  }

  withAppliesTo(valueOrFactory: PropOrFactory<string[]>) {
    this._appliesTo = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  withInvalidNameTooLong(value?: string) {
    this._name = new Name(value ?? this.chance.string({ length: 256 }));
    return this;
  }

  build(): TBuild {
    const sharedConfigs = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const sharedConfig = new SharedConfig({
          shared_config_id: !this._shared_config_id
            ? undefined
            : this.callFactory(this._shared_config_id, index),
          name: this.callFactory(this._name, index),
          templates: this.callFactory(this._templates, index),
          environment: this.callFactory(this._environment, index),
          volumes: this.callFactory(this._volumes, index),
          networks: this.callFactory(this._networks, index),
          appliesTo: this.callFactory(this._appliesTo, index),
          ...(this._created_at && {
            created_at: this.callFactory(this._created_at, index),
          }),
        });
        sharedConfig.validate();
        return sharedConfig;
      });

    return this.countObjs === 1 ? (sharedConfigs[0] as any) : sharedConfigs;
  }

  get shared_config_id() {
    return this.getValue('shared_config_id');
  }

  get name() {
    return this.getValue('name');
  }

  get templates() {
    return this.getValue('templates');
  }

  get environment() {
    return this.getValue('environment');
  }

  get volumes() {
    return this.getValue('volumes');
  }

  get networks() {
    return this.getValue('networks');
  }

  get appliesTo() {
    return this.getValue('appliesTo');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  private getValue(prop: any) {
    const optional = ['shared_config_id', 'created_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!this[privateProp] && optional.includes(prop)) {
      throw new Error(
        `Property ${prop} not have a factory, use 'with' methods`
      );
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }
}
