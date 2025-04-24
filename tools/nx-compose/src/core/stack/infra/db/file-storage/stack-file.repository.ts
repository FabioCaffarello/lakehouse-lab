import { promises as fs } from 'fs';
import { join } from 'path';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { Stack, StackId } from '../../../domain/stack.aggregate';
import {
  Service,
  ServiceId,
} from '../../../../service/domain/service.aggregate';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../../shared-config/domain/shared-config.aggregate';
import {
  StackFilter,
  IStackRepository,
  StackSearchParams,
  StackSearchResult,
} from '../../../domain/stack.repository';
import { IServiceRepository } from '../../../../service/domain/service.repository';
import { ISharedConfigRepository } from '../../../../shared-config/domain/shared-config.repository';
import { FileSearchableRepository } from '../../../../common/infra/db/file-storage/file-searchable.repository';

export class StackFileRepository
  extends FileSearchableRepository<Stack, StackId, string>
  implements IStackRepository
{
  sortableFields = ['name', 'created_at'];
  private filePath: string;

  constructor(
    private baseDir: string,
    private serviceRepo: IServiceRepository,
    private sharedConfigRepo: ISharedConfigRepository
  ) {
    super(join(baseDir, 'stack.json'));
    this.filePath = join(baseDir, 'stack.json');
  }

  protected async toEntity(raw: any): Promise<Stack> {
    const services: Service[] = [];
    for (const svcId of raw.services) {
      const serviceId = new ServiceId(svcId);
      const svc = await this.serviceRepo.findById(serviceId);
      if (!svc) {
        throw new Error(`Service not found: ${svcId}`);
      }
      services.push(svc);
    }

    const sharedConfigs: SharedConfig[] = [];
    for (const cfgId of raw.sharedConfigs) {
      const sharedConfigId = new SharedConfigId(cfgId);
      const cfg = await this.sharedConfigRepo.findById(sharedConfigId);
      if (!cfg) {
        throw new Error(`Shared config not found: ${cfgId}`);
      }
      sharedConfigs.push(cfg);
    }

    const stackId = new StackId(raw.stack_id);
    return Stack.create({
      stack_id: stackId,
      name: new Name(raw.name),
      services: services,
      environment: raw.environment,
      volumes: raw.volumes,
      sharedConfigs: sharedConfigs,
      created_at: new Date(raw.created_at),
    });
  }

  protected getIdKey(): string {
    return 'stack_id';
  }

  protected async applyFilter(
    items: Stack[],
    filter: StackFilter | null
  ): Promise<Stack[]> {
    if (!filter) return items;
    const term = filter.toLowerCase();
    return items.filter((i) => i.name.value.toLowerCase().includes(term));
  }

  getEntity(): new (...args: any[]) => Stack {
    return Stack;
  }

  async findById(id: StackId): Promise<Stack | null> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];
    const raw = raws.find((r) => r.stack_id === id.toString());
    if (!raw) return null;
    return this.toEntity(raw);
  }

  async search(params: StackSearchParams): Promise<StackSearchResult> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];

    const filtered = params.filter
      ? raws.filter((r) =>
          r.name.toLowerCase().includes(params.filter!.toLowerCase())
        )
      : raws;

    const sorted = this.applySort(filtered, params.sort, params.sort_dir);
    const paginated = this.applyPaginate(sorted, params.page, params.per_page);

    const items = await Promise.all(paginated.map((raw) => this.toEntity(raw)));

    return new StackSearchResult({
      items,
      total: filtered.length,
      page: params.page,
      per_page: params.per_page,
    });
  }
}
