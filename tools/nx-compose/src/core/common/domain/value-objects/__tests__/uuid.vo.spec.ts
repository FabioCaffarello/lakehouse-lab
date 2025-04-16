import { InvalidUuidError, Uuid } from '../uuid.vo';
import { validate as uuidValidate } from 'uuid';

describe('Uuid Unit Tests', () => {
  let validateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create a fresh spy for every test case.
    validateSpy = jest.spyOn(Uuid.prototype as any, 'validate');
  });

  afterEach(() => {
    // Clear all mocks to ensure no call history is carried between tests.
    jest.clearAllMocks();
  });

  test('should throw error when uuid is invalid', () => {
    expect(() => {
      new Uuid('invalid-uuid');
    }).toThrowError(new InvalidUuidError());
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should create a valid uuid', () => {
    const uuid = new Uuid();
    expect(uuid.id).toBeDefined();
    expect(uuidValidate(uuid.id)).toBe(true);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should accept a valid uuid', () => {
    const uuid = new Uuid('c3e9b0d0-7b6f-4a8e-8e1f-3f9e6a2f7e3c');
    expect(uuid.id).toBe('c3e9b0d0-7b6f-4a8e-8e1f-3f9e6a2f7e3c');
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });
});
