import { Stack, StackProps } from './stack.aggregate';
import { StackId } from './stack.aggregate';
import { Name } from '../../common/domain/value-objects/name.vo';
import { ServiceFakeBuilder } from '../../service/domain/service-fake.builder';
import { SharedConfigFakeBuilder } from '../../shared-config/domain/shared-config-fake.builder';
import { Chance } from 'chance';

type PropOrFactory<T> = T | ((index: number) => T);

export class StackFakeBuilder<TBuild = any> {
  private _stack_id: PropOrFactory<StackId> | undefined = undefined;
  private _name: PropOrFactory<Name> = (_index) =>
    new Name(`stack-${_index}-${this.chance.word()}`);
  private _services: PropOrFactory<any[]> = (i) => [
    ServiceFakeBuilder.aService().build(),
  ];
  private _environment: PropOrFactory<Record<string, string>> = (i) => ({
    ENV: 'test',
  });
  private _volumes: PropOrFactory<string[]> = (i) => ['vol:/mnt'];
  private _networks: PropOrFactory<string[]> = (i) => ['bridge'];
  private _sharedConfigs: PropOrFactory<any[]> = (i) => [
    SharedConfigFakeBuilder.aSharedConfig().build(),
  ];
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private chance = Chance();
  private countObjs: number;

  static aStack() {
    return new StackFakeBuilder<Stack>();
  }

  static theStacks(count: number) {
    return new StackFakeBuilder<Stack[]>(count);
  }

  private constructor(countObjs = 1) {
    this.countObjs = countObjs;
  }

  withStackId(value: PropOrFactory<StackId>) {
    this._stack_id = value;
    return this;
  }

  withName(value: PropOrFactory<Name>) {
    this._name = value;
    return this;
  }

  withServices(value: PropOrFactory<any[]>) {
    this._services = value;
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

  withSharedConfigs(value: PropOrFactory<any[]>) {
    this._sharedConfigs = value;
    return this;
  }

  withCreatedAt(value: PropOrFactory<Date>) {
    this._created_at = value;
    return this;
  }

  build(): TBuild {
    const stacks = new Array(this.countObjs).fill(undefined).map((_, i) => {
      const props: StackProps = {
        stack_id: this.callFactory(this._stack_id, i),
        name: this.callFactory(this._name, i),
        services: this.callFactory(this._services, i),
        environment: this.callFactory(this._environment, i),
        volumes: this.callFactory(this._volumes, i),
        networks: this.callFactory(this._networks, i),
        sharedConfigs: this.callFactory(this._sharedConfigs, i),
        created_at: this.callFactory(this._created_at, i),
      };

      return Stack.create(props);
    });

    return this.countObjs === 1 ? (stacks[0] as any) : stacks;
  }

  private callFactory<T>(
    factoryOrValue: PropOrFactory<T> | undefined,
    index: number
  ): T | undefined {
    if (factoryOrValue === undefined) return undefined;
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as any)(index)
      : factoryOrValue;
  }
}
