import {
  EntityValidationError,
  SearchValidationError,
  LoadEntityError,
} from '../validation.error';

describe('Validation Errors', () => {
  const mockErrors = [
    { name: ['must not be empty'] },
    { email: ['invalid format'] },
  ];

  describe('EntityValidationError', () => {
    it('should instantiate with default message and expose errors', () => {
      const error = new EntityValidationError(mockErrors);
      expect(error).toBeInstanceOf(EntityValidationError);
      expect(error.message).toBe('Entity Validation Error');
      expect(error.name).toBe('EntityValidationError');
      expect(error.error).toBe(mockErrors);
      expect(error.count()).toBe(2);
    });
  });

  describe('SearchValidationError', () => {
    it('should instantiate with correct type and message', () => {
      const error = new SearchValidationError(mockErrors);
      expect(error).toBeInstanceOf(SearchValidationError);
      expect(error.message).toBe('Search Validation Error');
      expect(error.name).toBe('SearchValidationError');
      expect(error.count()).toBe(2);
    });
  });

  describe('LoadEntityError', () => {
    it('should instantiate with correct type and message', () => {
      const error = new LoadEntityError(mockErrors);
      expect(error).toBeInstanceOf(LoadEntityError);
      expect(error.message).toBe('LoadEntityError');
      expect(error.name).toBe('LoadEntityError');
      expect(error.count()).toBe(2);
    });
  });
});
