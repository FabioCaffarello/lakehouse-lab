import { AggregateRoot } from '../aggregate-root';
import { IDomainEvent } from '../events/domain-event.interface';
import { ValueObject } from '../value-object';

class DummyValueObject extends ValueObject {
  constructor(public readonly id: string) {
    super();
  }
}

class DummyEvent implements IDomainEvent {
  aggregate_id: ValueObject;
  occurred_on: Date;
  event_version: number;

  constructor(public data: string, aggregate_id: ValueObject) {
    this.aggregate_id = aggregate_id;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}

class DummyAggregateRoot extends AggregateRoot {
  entity_id: ValueObject;

  constructor(id: string) {
    super();
    this.entity_id = new DummyValueObject(id);
  }

  toJSON() {
    return {
      id: this.entity_id,
    };
  }
}

describe('AggregateRoot', () => {
  let aggregate: DummyAggregateRoot;

  beforeEach(() => {
    aggregate = new DummyAggregateRoot('test-id');
  });

  test('should apply event and add to events set', () => {
    const event = new DummyEvent('event-data', aggregate.entity_id);
    aggregate.applyEvent(event);

    expect(aggregate.events.has(event)).toBe(true);
  });

  test('should emit event to registered handlers', () => {
    const event = new DummyEvent('event-data', aggregate.entity_id);
    const handler = jest.fn();

    aggregate.registerHandler(DummyEvent.name, handler);
    aggregate.applyEvent(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  test('should mark event as dispatched', () => {
    const event = new DummyEvent('event-data', aggregate.entity_id);
    aggregate.applyEvent(event);
    aggregate.markEventAsDispatched(event);

    expect(aggregate.dispatchedEvents.has(event)).toBe(true);
  });

  test('should return uncommitted events correctly', () => {
    const event1 = new DummyEvent('event-1', aggregate.entity_id);
    const event2 = new DummyEvent('event-2', aggregate.entity_id);

    aggregate.applyEvent(event1);
    aggregate.applyEvent(event2);
    aggregate.markEventAsDispatched(event1);

    const uncommitted = aggregate.getUncommittedEvents();
    expect(uncommitted).toEqual([event2]);
  });

  test('should clear all events', () => {
    const event = new DummyEvent('event-data', aggregate.entity_id);
    aggregate.applyEvent(event);
    aggregate.markEventAsDispatched(event);

    aggregate.clearEvents();

    expect(aggregate.events.size).toBe(0);
    expect(aggregate.dispatchedEvents.size).toBe(0);
  });
});
