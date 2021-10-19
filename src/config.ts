import 'source-map-support/register';
import { DefineSchema } from 'koishi-utils-schemagen';
import { ClientOptions } from 'memjs';

export class MemcachedCachePluginConfig {
  @DefineSchema({ desc: 'Memcached 服务器地址', default: 'localhost:11211' })
  endpoint: string;

  @DefineSchema({
    desc: 'Memcached 服务器选项',
    type: 'object',
    allowUnknown: true,
  })
  memcachedClientOptions: ClientOptions;

  @DefineSchema({ desc: '存储键前缀', default: 'koishi:' })
  prefix: string;
}

export type MemcachedCachePluginConfigLike = Partial<MemcachedCachePluginConfig>;
