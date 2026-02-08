import { CustomDatabase } from './database';

const core = CustomDatabase.getInstance();

export const liveQuery = <T>(queryFn: () => Promise<T>) => {
  const lq = core.liveQuery(queryFn as any);
  return {
    subscribe(cb: (res: T) => void) {
      const unsub = lq.subscribe(cb as any) as any;
      return { unsubscribe: () => { if (typeof unsub === 'function') unsub(); else if (unsub && unsub.unsubscribe) unsub.unsubscribe(); } };
    }
  };
};