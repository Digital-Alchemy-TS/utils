import { is, NONE, TServiceParams } from "@digital-alchemy/core";

import { createMemoryDriver, createRedisDriver, ICacheDriver, TCache } from "../helpers";

export function Cache({ logger, lifecycle, config, internal }: TServiceParams): TCache {
  let client: ICacheDriver;

  function fullKeyName(key: string): string {
    return `${config.cache.CACHE_PREFIX}${key}`;
  }

  // #MARK: onPostConfig
  lifecycle.onPostConfig(async () => {
    if (is.empty(config.cache.CACHE_PREFIX)) {
      internal.boilerplate.configuration.set(
        "cache",
        "CACHE_PREFIX",
        internal.boot.application.name,
      );
    }
    if (client) {
      return;
    }
    logger.trace({ name: "onPostConfig", provider: config.cache.CACHE_PROVIDER }, `init cache`);
    if (config.cache.CACHE_PROVIDER === "redis") {
      client = await createRedisDriver({ config, lifecycle, logger });
      return;
    }
    client = await createMemoryDriver({ config, lifecycle, logger });
  });

  // #MARK: Return object
  return {
    [Symbol.for("cache_logger")]: logger,
    del: async (key: string): Promise<void> => {
      try {
        const fullKey = fullKeyName(key);
        await client.del(fullKey);
      } catch (error) {
        logger.error({ error, name: "del" }, `cache error`);
      }
    },
    get: async <T>(key: string, defaultValue?: T): Promise<T> => {
      try {
        const fullKey = fullKeyName(key);
        const result = await client.get(fullKey);
        return is.undefined(result) ? defaultValue : (result as T);
      } catch (error) {
        logger.warn({ defaultValue, error, key, name: "get" }, `cache error`);
        return defaultValue;
      }
    },
    keys: async (pattern = ""): Promise<string[]> => {
      try {
        const fullPattern = fullKeyName(pattern);
        const keys = await client.keys(fullPattern);
        return keys.map(key => key.slice(Math.max(NONE, config.cache.CACHE_PREFIX.length)));
      } catch (error) {
        logger.warn({ error, name: "keys" }, `cache error`);
        return [];
      }
    },
    set: async <T>(key: string, value: T, ttl = config.cache.CACHE_TTL): Promise<void> => {
      try {
        const fullKey = fullKeyName(key);
        await client.set(fullKey, value, ttl);
      } catch (error) {
        logger.error({ error, name: "set" }, `cache error`);
      }
    },
    setClient: newClient => {
      logger.debug({ name: "setClient" }, `using new cache driver`);
      client = newClient;
    },
  } as TCache;
}
