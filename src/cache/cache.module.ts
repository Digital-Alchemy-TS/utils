import { CreateLibrary, StringConfig } from "@digital-alchemy/core";

import { Cache, CacheDel, CacheKeys } from "./extension";
import { CacheGet } from "./extension/get.extension";
import { CacheSet } from "./extension/set.extension";
import { CacheProviders } from "./helpers";

export const LIB_CACHE = CreateLibrary({
  configuration: {
    CACHE_PREFIX: {
      default: "",
      description: [
        "Use a prefix with all cache keys",
        "If blank, then application name is used",
      ].join(`. `),
      type: "string",
    },
    CACHE_PROVIDER: {
      default: "memory",
      description: "Redis is preferred if available",
      enum: ["redis", "memory"],
      type: "string",
    } satisfies StringConfig<`${CacheProviders}`>,
    CACHE_TTL: {
      default: 86_400,
      description: "Configuration property for cache provider, in seconds",
      type: "number",
    },
    REDIS_URL: {
      default: "redis://localhost:6379",
      description: "Configuration property for cache provider, does not apply to memory caching",
      type: "string",
    },
  },
  name: "cache",
  priorityInit: [],
  services: {
    del: CacheDel,
    get: CacheGet,
    internals: Cache,
    keys: CacheKeys,
    set: CacheSet,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    cache: typeof LIB_CACHE;
  }
}
