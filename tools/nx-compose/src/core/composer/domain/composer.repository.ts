import { ISearchableRepository } from '../../common/domain/repository/repository-interface';
import { SearchParams } from '../../common/domain/repository/search-params';
import { SearchResult } from '../../common/domain/repository/search-result';
import { Composer, ComposerId } from './composer.aggregate';

export type ComposerFilter = string;

export class ComposerSearchParams extends SearchParams<ComposerFilter> {}

export class ComposerSearchResult extends SearchResult<Composer> {}

export interface IComposerRepository
  extends ISearchableRepository<
    Composer,
    ComposerId,
    ComposerFilter,
    ComposerSearchParams,
    ComposerSearchResult
  > {}
