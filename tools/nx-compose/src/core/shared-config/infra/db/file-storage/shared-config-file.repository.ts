import { join } from 'path';
import { Name } from '../../../../common/domain/value-objects/name.vo';
import {
  SharedConfig,
  SharedConfigId,
} from '../../../domain/shared-config.aggregate';
import {
  SharedConfigFilter,
  ISharedConfigRepository,
} from '../../../domain/shared-config.repository';
import { FileSearchableRepository } from '../../../../common/infra/db/file-storage/file-searchable.repository';

export class SharedConfigFileRepository
  extends FileSearchableRepository<SharedConfig, SharedConfigId, string>
  implements ISharedConfigRepository
{
  sortableFields = ['name', 'created_at'];

  constructor(private baseDir: string) {
    super(join(baseDir, 'shared.json'));
  }

  protected toEntity(raw: any): SharedConfig {
    return SharedConfig.create({
      name: new Name(raw.name),
      templates: raw.templates,
      appliesTo: raw.appliesTo,
      environment: raw.environment,
      volumes: raw.volumes,
      networks: raw.networks,
      shared_config_id: new SharedConfigId(raw.shared_config_id),
      created_at: new Date(raw.created_at),
    });
  }

  protected getIdKey(): string {
    return 'shared_config_id';
  }

  protected async applyFilter(
    items: SharedConfig[],
    filter: SharedConfigFilter | null
  ): Promise<SharedConfig[]> {
    if (!filter) return items;
    const term = filter.toLowerCase();
    return items.filter((i) => i.name.value.toLowerCase().includes(term));
  }

  getEntity(): new (...args: any[]) => SharedConfig {
    return SharedConfig;
  }
}
