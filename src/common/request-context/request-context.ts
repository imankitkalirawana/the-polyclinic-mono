import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  userId: string | null;
  actorType: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  source: string | null;
}

export class RequestContext {
  private static storage = new AsyncLocalStorage<RequestContextData>();

  static run<T>(data: RequestContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  static get(): RequestContextData | undefined {
    return this.storage.getStore();
  }
}
