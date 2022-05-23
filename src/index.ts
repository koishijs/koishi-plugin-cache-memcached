// import 'source-map-support/register';
import { Context, Cache, Logger, isNullable } from 'koishi';
import { MemcachedCachePluginConfig } from './config';
import { Client } from 'memjs';
import { Moment } from 'moment';
import moment from 'moment';
import * as EncodeBuffer from 'encoded-buffer';
export * from './config';

export default class MemcachedCache extends Cache {
  static schema = MemcachedCachePluginConfig as any;

  protected start(): void | Promise<void> {}
  protected stop(): void | Promise<void> {}
  private logger = new Logger('memcached');
  private mem: Client;
  constructor(ctx: Context, private config: MemcachedCachePluginConfig) {
    super(ctx);
    this.mem = Client.create(config.endpoint, config.memcachedClientOptions);
  }

  private replaceKey(key: string) {
    return key.replace(/\s+/g, '_');
  }

  private momentToBuffer(time: Moment) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(time.unix());
    return buf;
  }

  private bufferToMoment(buf: Buffer) {
    return moment.unix(buf.readUInt32LE(0));
  }

  private getAgeOfTable(table: keyof Cache.Tables) {
    return this.table(table)?.maxAge || 63072000;
  }

  private getVersioningKey(table: keyof Cache.Tables) {
    return this.replaceKey(`${this.config.prefix}${table}:currentVersion`);
  }

  private async resetVersion(table: keyof Cache.Tables) {
    const versioningKey = this.getVersioningKey(table);
    const value = this.momentToBuffer(moment());
    try {
      const result = await this.mem.set(versioningKey, value, {
        expires: this.getAgeOfTable(table),
      });
      if (!result) {
        this.logger.warn(`Set versioning key of table ${table} failed.`);
      }
    } catch (e) {
      this.logger.error(
        `Set versioning key of table ${table} errored: ${e.toString()}`,
      );
    }

    return this.bufferToMoment(value).unix().toString(36);
  }

  private async getVersion(table: keyof Cache.Tables) {
    const versioningKey = this.getVersioningKey(table);
    const { value } = await this.mem.get(versioningKey);
    if (!value) {
      return this.resetVersion(table);
    }
    return this.bufferToMoment(value).unix().toString(36);
  }

  private async getKey(table: keyof Cache.Tables, key: string) {
    const actualKey = this.replaceKey(key);
    return `${this.config.prefix}${table}:${await this.getVersion(
      table,
    )}:${actualKey}`;
  }

  private async encode(data: any): Promise<Buffer> {
    return EncodeBuffer.encodeAsync(data);
  }

  private async decode<T = any>(record: Buffer): Promise<T> {
    const [value] = await EncodeBuffer.decodeAsync(record);
    return value;
  }

  async get(table: keyof Cache.Tables, key: string) {
    const actualKey = await this.getKey(table, key);
    try {
      const { value } = await this.mem.get(actualKey);
      if (value == null) {
        return;
      }
      const decodedValue = await this.decode(value);
      // this.logger.info(`${actualKey} => ${JSON.stringify(decodedValue)}`);
      return decodedValue;
    } catch (e) {
      this.logger.error(`Get key of ${actualKey} errored: ${e.toString()}`);
      return;
    }
  }

  async set(
    table: keyof Cache.Tables,
    key: string,
    value: any,
    maxAge?: number,
  ) {
    if (!this.table(table)) {
      return;
    }
    if (isNullable(value)) {
      return this.del(table, key);
    }
    const actualKey = await this.getKey(table, key);
    const age = maxAge || this.getAgeOfTable(table);
    try {
      const result = await this.mem.set(actualKey, await this.encode(value), {
        expires: age,
      });
      if (!result) {
        this.logger.warn(`Set key of ${actualKey} failed.`);
      }
    } catch (e) {
      this.logger.error(`Set key of ${actualKey} errored: ${e.toString()}`);
    }
  }

  async del(table: keyof Cache.Tables, key: string) {
    const actualKey = await this.getKey(table, key);
    try {
      const result = await this.mem.delete(actualKey);
      if (!result) {
        this.logger.warn(`Delete key ${actualKey} failed.`);
      }
    } catch (e) {
      this.logger.error(`Delete key ${actualKey} errored: ${e.toString()}`);
    }
  }

  async clear(table: keyof Cache.Tables) {
    await this.resetVersion(table);
    return;
  }
}
