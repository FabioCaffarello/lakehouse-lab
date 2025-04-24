import { join } from 'path';
import { promises as fs } from 'fs';
import { FileRepository } from '../file.repository';
import { Entity } from '../../../../domain/entity';
import { ValueObject } from '../../../../domain/value-object';
import { Uuid } from '../../../../domain/value-objects/uuid.vo';

class DummyId extends Uuid {}

class Dummy extends Entity {
  constructor(public id: DummyId, public payload: string) {
    super();
  }
  get entity_id(): ValueObject {
    return this.id;
  }
  toJSON() {
    return { id: this.id.toString(), payload: this.payload };
  }
}

class DummyFileRepo extends FileRepository<Dummy, DummyId> {
  constructor(filePath: string) {
    super(filePath);
  }
  protected toEntity(raw: any): Dummy {
    return new Dummy(new DummyId(raw.id), raw.payload);
  }
  protected getIdKey(): string {
    return 'id';
  }
  getEntity(): new (...args: any[]) => Dummy {
    return Dummy;
  }
}

describe('FileRepository (CRUD)', () => {
  const TMP = join(process.cwd(), '.tmp', 'dummy.json');
  let repo: DummyFileRepo;

  beforeEach(async () => {
    await fs.rm(TMP, { force: true, recursive: true });
    repo = new DummyFileRepo(TMP);
  });

  it('should insert and findAll', async () => {
    const d1 = new Dummy(new DummyId(), 'foo');
    const d2 = new Dummy(new DummyId(), 'bar');
    await repo.insert(d1);
    await repo.bulkInsert([d2]);
    const all = await repo.findAll();
    expect(all.map((d) => d.payload)).toEqual(['foo', 'bar']);
  });

  it('should findById or return null', async () => {
    const d = new Dummy(new DummyId(), 'x');
    await repo.insert(d);
    const found = await repo.findById(d.id);
    expect(found).not.toBeNull();
    expect(found?.payload).toBe('x');
    const miss = await repo.findById(new DummyId());
    expect(miss).toBeNull();
  });

  it('should update existing entity', async () => {
    const d = new Dummy(new DummyId(), 'A');
    await repo.insert(d);
    d.payload = 'B';
    await repo.update(d);
    const re = await repo.findById(d.id);
    expect(re?.payload).toBe('B');
  });

  it('should throw on update/delete non-existent', async () => {
    const d = new Dummy(new DummyId(), 'z');
    await expect(repo.update(d)).rejects.toThrow();
    await expect(repo.delete(d.id)).rejects.toThrow();
  });

  it('should delete existing entity', async () => {
    const d = new Dummy(new DummyId(), 'toRemove');
    await repo.insert(d);
    await repo.delete(d.id);
    expect(await repo.findById(d.id)).toBeNull();
  });

  it('should findByIds and existsById', async () => {
    const a = new Dummy(new DummyId(), 'a');
    const b = new Dummy(new DummyId(), 'b');
    await repo.bulkInsert([a, b]);
    const found = await repo.findByIds([a.id, new DummyId()]);
    expect(found.map((e) => e.id.toString())).toEqual([a.id.toString()]);
    const { exists, not_exists } = await repo.existsById([a.id, new DummyId()]);
    expect(exists.map((id) => id.toString())).toEqual([a.id.toString()]);
    expect(not_exists.length).toBe(1);
  });
});
