import { HarEntry } from 'har-format';

export interface BatchableGroup {
  type: 'CONCURRENT' | 'SEQUENTIAL';
  requests: HarEntry[];
}

export interface CachingStrategy {
  cacheableRequests: HarEntry[];
  ttlSeconds: number;
}

export interface OptimizedRequestFlow {
  optimizedRequests: HarEntry[];
  batchableGroups: BatchableGroup[];
  cachingStrategy: CachingStrategy;
  removedRequestCount: number;
}
