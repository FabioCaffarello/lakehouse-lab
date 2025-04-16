import { ISearchableRepository } from '../../common/domain/repository/repository-interface';
import { SearchParams } from '../../common/domain/repository/search-params';
import { SearchResult } from '../../common/domain/repository/search-result';
import { Service, ServiceId } from './service.aggregate';

export type ServiceFilter = string;

export class ServiceSearchParams extends SearchParams<ServiceFilter> {}

export class ServiceSearchResult extends SearchResult<Service> {}

export interface IServiceRepository
  extends ISearchableRepository<
    Service,
    ServiceId,
    ServiceFilter,
    ServiceSearchParams,
    ServiceSearchResult
  > {}
