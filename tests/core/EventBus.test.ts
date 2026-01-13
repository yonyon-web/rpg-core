/**
 * EventBus テスト
 */

import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('constructor', () => {
    test('should create a new EventBus instance', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
      expect(eventBus.eventNames()).toEqual([]);
    });
  });

  describe('on', () => {
    test('should register an event listener', () => {
      const listener = jest.fn();
      eventBus.on('test-event', listener);
      
      expect(eventBus.listenerCount('test-event')).toBe(1);
    });

    test('should register multiple listeners for the same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      
      expect(eventBus.listenerCount('test-event')).toBe(2);
    });

    test('should not register the same listener twice', () => {
      const listener = jest.fn();
      
      eventBus.on('test-event', listener);
      eventBus.on('test-event', listener);
      
      expect(eventBus.listenerCount('test-event')).toBe(1);
    });
  });

  describe('emit', () => {
    test('should call registered listener when event is emitted', () => {
      const listener = jest.fn();
      eventBus.on('test-event', listener);
      
      const eventData = { message: 'test' };
      eventBus.emit('test-event', eventData);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(eventData);
    });

    test('should call all registered listeners when event is emitted', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      
      const eventData = { message: 'test' };
      eventBus.emit('test-event', eventData);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledWith(eventData);
      expect(listener2).toHaveBeenCalledWith(eventData);
    });

    test('should not throw error if event has no listeners', () => {
      expect(() => {
        eventBus.emit('non-existent-event', {});
      }).not.toThrow();
    });

    test('should continue calling other listeners if one throws error', () => {
      const listener1 = jest.fn(() => {
        throw new Error('Listener 1 error');
      });
      const listener2 = jest.fn();
      
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      
      eventBus.emit('test-event', {});
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('off', () => {
    test('should remove a registered listener', () => {
      const listener = jest.fn();
      
      eventBus.on('test-event', listener);
      expect(eventBus.listenerCount('test-event')).toBe(1);
      
      eventBus.off('test-event', listener);
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });

    test('should not call removed listener when event is emitted', () => {
      const listener = jest.fn();
      
      eventBus.on('test-event', listener);
      eventBus.off('test-event', listener);
      eventBus.emit('test-event', {});
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should not affect other listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      
      eventBus.off('test-event', listener1);
      eventBus.emit('test-event', {});
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    test('should handle removing non-existent listener gracefully', () => {
      const listener = jest.fn();
      
      expect(() => {
        eventBus.off('non-existent-event', listener);
      }).not.toThrow();
    });
  });

  describe('once', () => {
    test('should register a one-time listener', () => {
      const listener = jest.fn();
      
      eventBus.once('test-event', listener);
      
      eventBus.emit('test-event', { count: 1 });
      eventBus.emit('test-event', { count: 2 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    test('should automatically remove listener after first call', () => {
      const listener = jest.fn();
      
      eventBus.once('test-event', listener);
      eventBus.emit('test-event', {});
      
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('removeAllListeners', () => {
    test('should remove all listeners for a specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      eventBus.on('other-event', listener1);
      
      eventBus.removeAllListeners('test-event');
      
      expect(eventBus.listenerCount('test-event')).toBe(0);
      expect(eventBus.listenerCount('other-event')).toBe(1);
    });

    test('should remove all listeners for all events when no event name provided', () => {
      const listener = jest.fn();
      
      eventBus.on('event1', listener);
      eventBus.on('event2', listener);
      eventBus.on('event3', listener);
      
      eventBus.removeAllListeners();
      
      expect(eventBus.eventNames()).toEqual([]);
    });
  });

  describe('listenerCount', () => {
    test('should return 0 for event with no listeners', () => {
      expect(eventBus.listenerCount('non-existent-event')).toBe(0);
    });

    test('should return correct count of listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);
      eventBus.on('test-event', listener3);
      
      expect(eventBus.listenerCount('test-event')).toBe(3);
    });
  });

  describe('eventNames', () => {
    test('should return empty array when no events registered', () => {
      expect(eventBus.eventNames()).toEqual([]);
    });

    test('should return array of registered event names', () => {
      const listener = jest.fn();
      
      eventBus.on('event1', listener);
      eventBus.on('event2', listener);
      eventBus.on('event3', listener);
      
      const names = eventBus.eventNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('event1');
      expect(names).toContain('event2');
      expect(names).toContain('event3');
    });
  });

  describe('integration scenarios', () => {
    test('should handle data-changed event scenario', () => {
      const listener = jest.fn();
      
      eventBus.on('data-changed', listener);
      
      const event = {
        type: 'item-used',
        timestamp: Date.now(),
        data: { itemId: 'potion-1' }
      };
      
      eventBus.emit('data-changed', event);
      
      expect(listener).toHaveBeenCalledWith(event);
    });

    test('should handle multiple event types independently', () => {
      const dataListener = jest.fn();
      const saveListener = jest.fn();
      
      eventBus.on('data-changed', dataListener);
      eventBus.on('auto-save-completed', saveListener);
      
      eventBus.emit('data-changed', { type: 'item-used', timestamp: Date.now() });
      eventBus.emit('auto-save-completed', { timestamp: Date.now() });
      
      expect(dataListener).toHaveBeenCalledTimes(1);
      expect(saveListener).toHaveBeenCalledTimes(1);
    });
  });
});
