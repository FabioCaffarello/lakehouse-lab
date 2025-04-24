import { promises as fs } from 'fs';
import { join } from 'path';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import { Composer, ComposerId } from '../../../domain/composer.aggregate';
import { Stack, StackId } from '../../../../stack/domain/stack.aggregate';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../../shared-config/domain/shared-config.aggregate';
import {
  Service,
  ServiceId,
} from '../../../../service/domain/service.aggregate';
import {
  ComposerFilter,
  IComposerRepository,
  ComposerSearchParams,
  ComposerSearchResult,
} from '../../../domain/composer.repository';
import { IStackRepository } from '../../../domain/stack.repository';
import { IServiceRepository } from '../../../../service/domain/service.repository';
import { ISharedConfigRepository } from '../../../../shared-config/domain/shared-config.repository';
import { FileSearchableRepository } from '../../../../common/infra/db/file-storage/file-searchable.repository';

export class ComposerFileRepository
  extends FileSearchableRepository<Composer, ComposerId, string>
  implements IComposerRepository
{
  sortableFields = ['name', 'created_at'];
  private filePath: string;

  constructor(
    private baseDir: string,
    private stackRepo: IStackRepository,
    private serviceRepo: IServiceRepository,
    private sharedConfigRepo: ISharedConfigRepository
  ) {
    super(join(baseDir, 'composer.json'));
    this.filePath = join(baseDir, 'composer.json');
  }

  protected async toEntity(raw: any): Promise<Composer> {
    const stacks: Stack[] = [];
    for (const stackId of raw.stacks) {
      const stack = await this.stackRepo.findById(new StackId(stackId));
      if (!stack) {
        throw new Error(`Stack not found: ${stackId}`);
      }
      stacks.push(stack);
    }

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

    const composerId = new ComposerId(raw.composer_id);
    return Composer.create({
      composer_id: composerId,
      name: new Name(raw.name),
      stacks: stacks,
      services: services,
      environment: raw.environment,
      volumes: raw.volumes,
      networks: raw.networks,
      sharedConfigs: sharedConfigs,
      created_at: new Date(raw.created_at),
    });
  }

  protected getIdKey(): string {
    return 'composer_id';
  }

  protected async applyFilter(
    items: Composer[],
    filter: ComposerFilter | null
  ): Promise<Composer[]> {
    if (!filter) return items;
    const term = filter.toLowerCase();
    return items.filter((i) => i.name.value.toLowerCase().includes(term));
  }

  getEntity(): new (...args: any[]) => Composer {
    return Composer;
  }

  async findById(id: ComposerId): Promise<Composer | null> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];
    const raw = raws.find((r) => r.composer_id === id.toString());
    if (!raw) return null;
    return this.toEntity(raw);
  }

  async search(params: ComposerSearchParams): Promise<ComposerSearchResult> {
    const raws = JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as any[];

    const filtered = params.filter
      ? raws.filter((r) =>
          r.name.toLowerCase().includes(params.filter!.toLowerCase())
        )
      : raws;

    const sorted = this.applySort(filtered, params.sortBy, params.sortDir);
    const paginated = this.applyPaginate(sorted, params.page, params.pageSize);

    const items = await Promise.all(paginated.map((raw) => this.toEntity(raw)));

    return new ComposerSearchResult({
      items,
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}
