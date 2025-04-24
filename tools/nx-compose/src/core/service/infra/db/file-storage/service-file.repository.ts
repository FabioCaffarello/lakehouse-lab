import { promises as fs } from 'fs';
import { join } from 'path';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { Service, ServiceId } from '../../../domain/service.aggregate';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../../shared-config/domain/shared-config.aggregate';
import {
  ServiceFilter,
  IServiceRepository,
  ServiceSearchParams,
  ServiceSearchResult,
} from '../../../domain/service.repository';
import { ISharedConfigRepository } from '../../../../shared-config/domain/shared-config.repository';
import { FileSearchableRepository } from '../../../../common/infra/db/file-storage/file-searchable.repository';

export class ServiceFileRepository
  extends FileSearchableRepository<Service, ServiceId, string>
  implements IServiceRepository
{
  sortableFields = ['name', 'created_at'];
  private filePath: string;

  constructor(
    private baseDir: string,
    private sharedConfigRepo: ISharedConfigRepository
  ) {
    super(join(baseDir, 'service.json'));
    this.filePath = join(baseDir, 'service.json');
  }

  protected async toEntity(raw: any): Promise<Service> {
    const sharedConfigs: SharedConfig[] = [];
    for (const cfgId of raw.sharedConfigs) {
      const sharedConfigId = new SharedConfigId(cfgId);
      const cfg = await this.sharedConfigRepo.findById(sharedConfigId);
      if (!cfg) {
        throw new Error(`Shared config not found: ${cfgId}`);
      }
      sharedConfigs.push(cfg);
    }
    const serviceId = new ServiceId(raw.service_id);
    return Service.create({
      service_id: serviceId,
      name: new Name(raw.name),
      image: raw.image,
      environment: raw.environment,
      volumes: raw.volumes,
      ports: raw.ports,
      networks: raw.networks,
      templateFile: raw.templateFile,
      sharedConfigs: sharedConfigs,
      created_at: new Date(raw.created_at),
    });
  }

  protected getIdKey(): string {
    return 'service_id';
  }

  protected async applyFilter(
    items: Service[],
    filter: ServiceFilter | null
  ): Promise<Service[]> {
    if (!filter) return items;
    const term = filter.toLowerCase();
    return items.filter((i) => i.name.value.toLowerCase().includes(term));
  }

  getEntity(): new (...args: any[]) => Service {
    return Service;
  }

  async findById(id: ServiceId): Promise<Service | null> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];
    const raw = raws.find((r) => r.service_id === id.toString());
    if (!raw) return null;
    return this.toEntity(raw);
  }

  async search(params: ServiceSearchParams): Promise<ServiceSearchResult> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];

    const filtered = params.filter
      ? raws.filter((r) =>
          r.name.toLowerCase().includes(params.filter!.toLowerCase())
        )
      : raws;

    const sorted = this.applySort(filtered, params.sort, params.sort_dir);
    const page = this.applyPaginate(sorted, params.page, params.per_page);

    const items = await Promise.all(page.map((raw) => this.toEntity(raw)));

    return new ServiceSearchResult({
      items,
      total: filtered.length,
      current_page: params.page,
      per_page: params.per_page,
    });
  }
}
