import { ValueObject } from '../value-object';

class DummyValueObject extends ValueObject {
  constructor(public readonly prop1: string, public readonly prop2: number) {
    super();
  }
}

describe('ValueObject', () => {
  test('should return true for equal objects', () => {
    const obj1 = new DummyValueObject('test', 123);
    const obj2 = new DummyValueObject('test', 123);

    expect(obj1.equals(obj2)).toBe(true);
  });

  test('should return false for objects with different values', () => {
    const obj1 = new DummyValueObject('test', 123);
    const obj2 = new DummyValueObject('test', 456);

    expect(obj1.equals(obj2)).toBe(false);
  });

  test('should return false if compared object is null', () => {
    const obj1 = new DummyValueObject('test', 123);

    expect(obj1.equals(null as any)).toBe(false);
  });

  test('should return false if compared object is undefined', () => {
    const obj1 = new DummyValueObject('test', 123);

    expect(obj1.equals(undefined as any)).toBe(false);
  });

  test('should return false for objects of different classes', () => {
    class AnotherValueObject extends ValueObject {}
    const obj1 = new DummyValueObject('test', 123);
    const obj2 = new AnotherValueObject();

    expect(obj1.equals(obj2 as any)).toBe(false);
  });
});
