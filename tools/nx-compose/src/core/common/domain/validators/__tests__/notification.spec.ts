import { Notification } from '../notification';

describe('Notification', () => {
  let notification: Notification;

  beforeEach(() => {
    notification = new Notification();
  });

  test('should add an error without field', () => {
    notification.addError('General error');
    expect(notification.errors.get('General error')).toBe('General error');
    expect(notification.hasErrors()).toBe(true);
  });

  test('should add an error with a field', () => {
    notification.addError('Field error', 'field1');
    expect(notification.errors.get('field1')).toEqual(['Field error']);
    expect(notification.hasErrors()).toBe(true);
  });

  test('should not duplicate field errors', () => {
    notification.addError('Field error', 'field1');
    notification.addError('Field error', 'field1');
    expect(notification.errors.get('field1')).toEqual(['Field error']);
  });

  test('should set a single error without field', () => {
    notification.setError('Single general error');
    expect(notification.errors.get('Single general error')).toBe(
      'Single general error'
    );
  });

  test('should set multiple errors without field', () => {
    notification.setError(['Error 1', 'Error 2']);
    expect(notification.errors.get('Error 1')).toBe('Error 1');
    expect(notification.errors.get('Error 2')).toBe('Error 2');
  });

  test('should set a single error with field', () => {
    notification.setError('Single field error', 'field2');
    expect(notification.errors.get('field2')).toEqual(['Single field error']);
  });

  test('should set multiple errors with field', () => {
    notification.setError(['Error A', 'Error B'], 'field3');
    expect(notification.errors.get('field3')).toEqual(['Error A', 'Error B']);
  });

  test('should correctly copy errors from another notification', () => {
    const otherNotification = new Notification();
    otherNotification.addError('Error copied 1', 'fieldX');
    otherNotification.addError('General copied error');

    notification.copyErrors(otherNotification);

    expect(notification.errors.get('fieldX')).toEqual(['Error copied 1']);
    expect(notification.errors.get('General copied error')).toBe(
      'General copied error'
    );
  });

  test('should correctly convert errors to JSON', () => {
    notification.addError('General error');
    notification.addError('Field error 1', 'field1');
    notification.addError('Field error 2', 'field1');

    expect(notification.toJSON()).toEqual([
      'General error',
      { field1: ['Field error 1', 'Field error 2'] },
    ]);
  });

  test('should initially have no errors', () => {
    expect(notification.hasErrors()).toBe(false);
    expect(notification.toJSON()).toEqual([]);
  });
});
