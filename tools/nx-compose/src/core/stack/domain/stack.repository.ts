import { ISearchableRepository } from '../../common/domain/repository/repository-interface';
import { SearchParams } from '../../common/domain/repository/search-params';
import { SearchResult } from '../../common/domain/repository/search-result';
import { Stack, StackId } from './stack.aggregate';

export type StackFilter = string;

export class StackSearchParams extends SearchParams<StackFilter> {}

export class StackSearchResult extends SearchResult<Stack> {}

export interface IStackRepository
  extends ISearchableRepository<
    Stack,
    StackId,
    StackFilter,
    StackSearchParams,
    StackSearchResult
  > {}
