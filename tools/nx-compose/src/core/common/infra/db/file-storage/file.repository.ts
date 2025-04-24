import { promises as fs } from 'fs';
import { dirname } from 'path';
import { IRepository } from '../../../domain/repository/repository-interface';
import { Entity } from '../../../domain/entity';
import { ValueObject } from '../../../domain/value-object';
import { NotFoundError } from '../../../domain/errors/not-found.error';

export abstract class FileRepository<
  E extends Entity,
  EntityID extends ValueObject
> implements IRepository<E, EntityID>
{
  constructor(private readonly filePath: string) {}

  private async loadRaw(): Promise<any[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(dirname(this.filePath), { recursive: true });
        await fs.writeFile(this.filePath, '[]', 'utf-8');
        return [];
      }
      throw err;
    }
  }

  private async saveRaw(items: any[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
  }

  protected abstract toEntity(raw: any): E;
  protected abstract getIdKey(): string;
  abstract getEntity(): new (...args: any[]) => E;

  async insert(entity: E): Promise<void> {
    const raws = await this.loadRaw();
    raws.push(entity.toJSON());
    await this.saveRaw(raws);
  }

  async bulkInsert(entities: E[]): Promise<void> {
    const raws = await this.loadRaw();
    for (const e of entities) raws.push(e.toJSON());
    await this.saveRaw(raws);
  }

  async update(entity: E): Promise<void> {
    const raws = await this.loadRaw();
    const key = this.getIdKey();
    const id = entity.entity_id.toString();
    const idx = raws.findIndex((r) => r[key] === id);
    if (idx === -1) {
      throw new NotFoundError(entity.entity_id, this.getEntity());
    }
    raws[idx] = entity.toJSON();
    await this.saveRaw(raws);
  }

  async delete(id: EntityID): Promise<void> {
    const raws = await this.loadRaw();
    const key = this.getIdKey();
    const lookup = id.toString();
    const idx = raws.findIndex((r) => r[key] === lookup);
    if (idx === -1) {
      throw new NotFoundError(id, this.getEntity());
    }
    raws.splice(idx, 1);
    await this.saveRaw(raws);
  }

  async findById(id: EntityID): Promise<E | null> {
    const raws = await this.loadRaw();
    const key = this.getIdKey();
    const lookup = id.toString();
    const raw = raws.find((r) => r[key] === lookup);
    return raw ? this.toEntity(raw) : null;
  }

  async findAll(): Promise<E[]> {
    const raws = await this.loadRaw();
    return raws.map((r) => this.toEntity(r));
  }

  async findByIds(ids: EntityID[]): Promise<E[]> {
    const set = new Set(ids.map((i) => i.toString()));
    return (await this.findAll()).filter((e) =>
      set.has(e.entity_id.toString())
    );
  }

  async existsById(
    ids: EntityID[]
  ): Promise<{ exists: EntityID[]; not_exists: EntityID[] }> {
    if (!ids.length) {
      throw new Error('ids must not be empty');
    }
    const all = await this.findAll();
    const exists: EntityID[] = [];
    const not_exists: EntityID[] = [];
    for (const id of ids) {
      if (all.some((e) => e.entity_id.equals(id))) {
        exists.push(id);
      } else {
        not_exists.push(id);
      }
    }
    return { exists, not_exists };
  }
}
