# koishi-plugin-cache-memcached

Koishi.js 的 Memcached 缓存支持。

## 安装

### npm

```bash
npm install koishi-plugin-cache-memcached
```

### 直接安装

在 https://cdn02.moecube.com:444/nanahira/koishi-plugin/cache-memcached/index.js 下载即可。

## 配置

* `endpoint` Memcached 地址。格式为 `[user:pass@]server1[:11211],[user:pass@]server2[:11211],...` ，参照 [MemJS 文档](https://memjs.netlify.app/)。

* `memcachedClientOptions` MemJS 的额外可选配置。

* `prefix` 存储键前缀。默认 `koishi:` 。
