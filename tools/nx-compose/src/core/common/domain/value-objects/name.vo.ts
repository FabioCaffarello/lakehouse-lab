import { ValueObject } from '../value-object';

export class InvalidNameError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid name');
    this.name = 'InvalidNameError';
  }
}

export class Name extends ValueObject {
  private _value: string;

  constructor(value: string) {
    super();
    const trimmed = value?.trim();

    if (!trimmed) {
      throw new InvalidNameError('Name should not be empty');
    }

    if (trimmed.length < 2) {
      throw new InvalidNameError('Name must be at least 2 characters');
    }

    if (trimmed.length > 255) {
      throw new InvalidNameError('Name must be less than 256 characters');
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }

  toLowerCase(): string {
    return this._value.toLowerCase();
  }
}
