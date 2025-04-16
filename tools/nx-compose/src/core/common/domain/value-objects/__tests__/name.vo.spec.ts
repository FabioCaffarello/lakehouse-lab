import { Name } from '../name.vo';

describe('Name Value Object', () => {
  test('should create a valid name', () => {
    const name = new Name('valid-name');
    expect(name.value).toBe('valid-name');
    expect(name.toString()).toBe('valid-name');
  });

  test('should trim name value', () => {
    const name = new Name('  padded-name  ');
    expect(name.value).toBe('padded-name');
  });

  test('should throw error if name is empty', () => {
    expect(() => new Name('')).toThrow('Name should not be empty');
  });

  test('should throw error if name is too short', () => {
    expect(() => new Name('a')).toThrow('Name must be at least 2 characters');
  });

  test('should throw error if name is too long', () => {
    const longName = 'a'.repeat(256);
    expect(() => new Name(longName)).toThrow(
      'Name must be less than 256 characters'
    );
  });

  test('should convert name to JSON', () => {
    const name = new Name('json-name');
    expect(name.toJSON()).toBe('json-name');
  });

  test('should convert name to lowercase', () => {
    const name = new Name('UPPERCASE');
    expect(name.toLowerCase()).toBe('uppercase');
  });
});
