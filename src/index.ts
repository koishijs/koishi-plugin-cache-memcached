import 'source-map-support/register';
import { Context } from 'koishi';
import MemcachedCache from './plugin';
import { MemcachedCachePluginConfig } from './config';
export * from './config';
export * from './plugin';

export const name = 'memcached';
export const schema = MemcachedCache.schema;
export function apply(ctx: Context, config: MemcachedCachePluginConfig) {
  ctx.plugin(MemcachedCache, config);
}
