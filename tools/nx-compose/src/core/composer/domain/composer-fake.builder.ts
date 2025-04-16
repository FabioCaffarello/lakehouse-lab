import { Chance } from 'chance';
import { Composer } from './composer.aggregate';
import { StackFakeBuilder } from '../../stack/domain/stack-fake.builder';
import { ServiceFakeBuilder } from '../../service/domain/service-fake.builder';
import { SharedConfigFakeBuilder } from '../../shared-config/domain/shared-config-fake.builder';
import { Stack } from '../../stack/domain/stack.aggregate';
import { Service } from '../../service/domain/service.aggregate';
import { Name } from '../../common/domain/value-objects/name.vo';
import { SharedConfig } from '../../shared-config/domain/shared-config.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class ComposerFakeBuilder<TBuild = any> {
  private _name: PropOrFactory<Name> = () => new Name(this.chance.name());
  private _environment: PropOrFactory<Record<string, string>> = () => ({
    NODE_ENV: 'test',
  });
  private _volumes: PropOrFactory<string[]> = () => ['data:/data'];
  private _networks: PropOrFactory<string[]> = () => ['bridge'];
  private _stacks: PropOrFactory<Stack[]> = () => [
    StackFakeBuilder.aStack().build(),
  ];
  private _services: PropOrFactory<Service[]> = () => [
    ServiceFakeBuilder.aService().build(),
  ];
  private _sharedConfigs: PropOrFactory<SharedConfig[]> = () => [
    SharedConfigFakeBuilder.aSharedConfig().build(),
  ];

  private chance = Chance();
  private countObjs;

  static aComposer() {
    return new ComposerFakeBuilder<Composer>();
  }

  static theComposers(count: number) {
    return new ComposerFakeBuilder<Composer[]>(count);
  }

  private constructor(countObjs = 1) {
    this.countObjs = countObjs;
  }

  withName(value: PropOrFactory<Name>) {
    this._name = value;
    return this;
  }

  withEnvironment(value: PropOrFactory<Record<string, string>>) {
    this._environment = value;
    return this;
  }

  withVolumes(value: PropOrFactory<string[]>) {
    this._volumes = value;
    return this;
  }

  withNetworks(value: PropOrFactory<string[]>) {
    this._networks = value;
    return this;
  }

  withStacks(value: PropOrFactory<Stack[]>) {
    this._stacks = value;
    return this;
  }

  withServices(value: PropOrFactory<Service[]>) {
    this._services = value;
    return this;
  }

  withSharedConfigs(value: PropOrFactory<SharedConfig[]>) {
    this._sharedConfigs = value;
    return this;
  }

  build(): TBuild {
    const composers = new Array(this.countObjs).fill(null).map((_, i) => {
      return Composer.create({
        name: this.callFactory(this._name, i),
        environment: this.callFactory(this._environment, i),
        volumes: this.callFactory(this._volumes, i),
        networks: this.callFactory(this._networks, i),
        stacks: this.callFactory(this._stacks, i),
        services: this.callFactory(this._services, i),
        sharedConfigs: this.callFactory(this._sharedConfigs, i),
      });
    });

    return this.countObjs === 1 ? (composers[0] as any) : composers;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return typeof valueOrFactory === 'function'
      ? (valueOrFactory as Function)(index)
      : valueOrFactory;
  }
}
