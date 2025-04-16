import { ISearchableRepository } from '../../common/domain/repository/repository-interface';
import { SearchParams } from '../../common/domain/repository/search-params';
import { SearchResult } from '../../common/domain/repository/search-result';
import { SharedConfig, SharedConfigId } from './shared-config.aggregate';

export type SharedConfigFilter = string;

export class SharedConfigSearchParams extends SearchParams<SharedConfigFilter> {}

export class SharedConfigSearchResult extends SearchResult<SharedConfig> {}

export interface ISharedConfigRepository
  extends ISearchableRepository<
    SharedConfig,
    SharedConfigId,
    SharedConfigFilter,
    SharedConfigSearchParams,
    SharedConfigSearchResult
  > {}
