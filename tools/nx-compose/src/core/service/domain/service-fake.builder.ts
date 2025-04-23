import { Chance } from 'chance';
import { Service, ServiceId } from './service.aggregate';
import { Name } from '../../common/domain/value-objects/name.vo';
import { SharedConfigFakeBuilder } from '../../shared-config/domain/shared-config-fake.builder';
import { SharedConfig } from '../../shared-config/domain/shared-config.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class ServiceFakeBuilder<TBuild = any> {
  private _service_id: PropOrFactory<ServiceId> | undefined = undefined;
  private _name: PropOrFactory<Name> = (_index) => new Name(this.chance.word());
  private _image: PropOrFactory<string> = (i) => `nginx:latest`;
  private _templateFile: PropOrFactory<string> | undefined = undefined;
  private _environment: PropOrFactory<Record<string, string>> = (i) => ({
    NODE_ENV: 'test',
  });
  private _ports: PropOrFactory<string[]> = (i) => ['3000:3000'];
  private _volumes: PropOrFactory<string[]> = (i) => ['data:/data'];
  private _networks: PropOrFactory<string[]> = (i) => ['bridge'];
  private _sharedConfigs: PropOrFactory<SharedConfig[]> = (i) => {
    const nameVO = this.callFactory(this._name, i) as Name;
    return [
      SharedConfigFakeBuilder.aSharedConfig()
        .withAppliesTo([nameVO.value])
        .build(),
    ];
  };
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private chance = Chance();
  private countObjs;

  static aService() {
    return new ServiceFakeBuilder<Service>();
  }

  static theServices(count: number) {
    return new ServiceFakeBuilder<Service[]>(count);
  }

  private constructor(countObjs = 1) {
    this.countObjs = countObjs;
  }

  withServiceId(value: PropOrFactory<ServiceId>) {
    this._service_id = value;
    return this;
  }

  withName(value: PropOrFactory<Name>) {
    this._name = value;
    return this;
  }

  withImage(value: PropOrFactory<string>) {
    this._image = value;
    this._templateFile = undefined;
    return this;
  }

  withTemplateFile(value: PropOrFactory<string>) {
    this._templateFile = value;
    this._image = undefined;
    return this;
  }

  withEnvironment(value: PropOrFactory<Record<string, string>>) {
    this._environment = value;
    return this;
  }

  withPorts(value: PropOrFactory<string[]>) {
    this._ports = value;
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

  withSharedConfigs(value: PropOrFactory<SharedConfig[]>) {
    this._sharedConfigs = value;
    return this;
  }

  withCreatedAt(value: PropOrFactory<Date>) {
    this._created_at = value;
    return this;
  }

  build(): TBuild {
    const services = new Array(this.countObjs).fill(undefined).map((_, i) => {
      const service = Service.create({
        service_id: this.callFactory(this._service_id, i),
        name: this.callFactory(this._name, i),
        image: this.callFactory(this._image, i),
        templateFile: this.callFactory(this._templateFile, i),
        environment: this.callFactory(this._environment, i),
        ports: this.callFactory(this._ports, i),
        volumes: this.callFactory(this._volumes, i),
        networks: this.callFactory(this._networks, i),
        sharedConfigs: this.callFactory(this._sharedConfigs, i),
        created_at: this.callFactory(this._created_at, i),
      });
      return service;
    });
    return this.countObjs === 1 ? (services[0] as any) : services;
  }

  private getValue(
    prop:
      | 'name'
      | 'image'
      | 'templateFile'
      | 'environment'
      | 'ports'
      | 'volumes'
      | 'networks'
      | 'sharedConfigs'
      | 'created_at'
  ): any {
    const map = {
      name: this._name,
      image: this._image,
      templateFile: this._templateFile,
      environment: this._environment,
      ports: this._ports,
      volumes: this._volumes,
      networks: this._networks,
      sharedConfigs: this._sharedConfigs,
      created_at: this._created_at,
    } as const;

    return this.callFactory(map[prop], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }
}
