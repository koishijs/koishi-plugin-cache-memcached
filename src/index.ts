import 'source-map-support/register';
import { Context } from 'koishi';
import { MemcachedCache, MemcachedCachePlugin } from './plugin';
import { MemcachedCachePluginConfig } from './config';
export * from './config';
export * from './plugin';

export const name = 'memcached';
const plugin = new MemcachedCachePlugin();
export const schema = plugin.schema;
export function apply(ctx: Context, config: MemcachedCachePluginConfig) {
  ctx.plugin(plugin, config);
}
