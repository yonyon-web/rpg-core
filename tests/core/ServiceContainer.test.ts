/**
 * ServiceContainer Tests
 */

import { ServiceContainer } from '../../src/core/ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('register and resolve', () => {
    it('should register and resolve a simple service', () => {
      const service = { name: 'TestService' };
      container.register('test', () => service);

      const resolved = container.resolve('test');
      expect(resolved).toBe(service);
    });

    it('should throw error when resolving unregistered service', () => {
      expect(() => container.resolve('nonexistent')).toThrow(
        "Service 'nonexistent' is not registered"
      );
    });
  });

  describe('singleton lifetime', () => {
    it('should return same instance for singleton services', () => {
      let counter = 0;
      container.register('counter', () => ({ value: ++counter }));

      const first = container.resolve<{ value: number }>('counter');
      const second = container.resolve<{ value: number }>('counter');

      expect(first).toBe(second);
      expect(first.value).toBe(1);
      expect(second.value).toBe(1);
    });
  });

  describe('transient lifetime', () => {
    it('should return new instance for transient services', () => {
      let counter = 0;
      container.register('counter', () => ({ value: ++counter }), 'transient');

      const first = container.resolve<{ value: number }>('counter');
      const second = container.resolve<{ value: number }>('counter');

      expect(first).not.toBe(second);
      expect(first.value).toBe(1);
      expect(second.value).toBe(2);
    });
  });

  describe('dependency resolution', () => {
    it('should resolve dependencies', () => {
      container.register('config', () => ({ setting: 'value' }));
      container.register('service', (c) => {
        const config = c.resolve<{ setting: string }>('config');
        return { config };
      });

      const service = container.resolve<{ config: { setting: string } }>('service');
      expect(service.config.setting).toBe('value');
    });

    it('should resolve nested dependencies', () => {
      container.register('a', () => ({ name: 'A' }));
      container.register('b', (c) => ({ a: c.resolve('a'), name: 'B' }));
      container.register('c', (c) => ({ b: c.resolve('b'), name: 'C' }));

      const c = container.resolve<any>('c');
      expect(c.name).toBe('C');
      expect(c.b.name).toBe('B');
      expect(c.b.a.name).toBe('A');
    });
  });

  describe('circular dependency detection', () => {
    it('should detect direct circular dependency', () => {
      container.register('a', (c) => ({ b: c.resolve('b') }));
      container.register('b', (c) => ({ a: c.resolve('a') }));

      expect(() => container.resolve('a')).toThrow('Circular dependency detected: a');
    });

    it('should detect indirect circular dependency', () => {
      container.register('a', (c) => ({ b: c.resolve('b') }));
      container.register('b', (c) => ({ c: c.resolve('c') }));
      container.register('c', (c) => ({ a: c.resolve('a') }));

      expect(() => container.resolve('a')).toThrow('Circular dependency detected: a');
    });
  });

  describe('has', () => {
    it('should return true for registered services', () => {
      container.register('test', () => ({}));
      expect(container.has('test')).toBe(true);
    });

    it('should return false for unregistered services', () => {
      expect(container.has('nonexistent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a service', () => {
      container.register('test', () => ({}));
      expect(container.has('test')).toBe(true);

      container.unregister('test');
      expect(container.has('test')).toBe(false);
    });

    it('should return true when unregistering existing service', () => {
      container.register('test', () => ({}));
      expect(container.unregister('test')).toBe(true);
    });

    it('should return false when unregistering non-existing service', () => {
      expect(container.unregister('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all registered services', () => {
      container.register('a', () => ({}));
      container.register('b', () => ({}));
      container.register('c', () => ({}));

      container.clear();

      expect(container.has('a')).toBe(false);
      expect(container.has('b')).toBe(false);
      expect(container.has('c')).toBe(false);
    });
  });

  describe('getRegisteredServices', () => {
    it('should return list of registered services', () => {
      container.register('a', () => ({}));
      container.register('b', () => ({}));
      container.register('c', () => ({}));

      const services = container.getRegisteredServices();
      expect(services).toContain('a');
      expect(services).toContain('b');
      expect(services).toContain('c');
      expect(services.length).toBe(3);
    });

    it('should return empty array when no services registered', () => {
      const services = container.getRegisteredServices();
      expect(services).toEqual([]);
    });
  });

  describe('lazy initialization', () => {
    it('should not initialize service until first resolve', () => {
      let initialized = false;
      container.register('lazy', () => {
        initialized = true;
        return { value: 'initialized' };
      });

      expect(initialized).toBe(false);

      container.resolve('lazy');
      expect(initialized).toBe(true);
    });

    it('should initialize singleton only once', () => {
      let initCount = 0;
      container.register('singleton', () => {
        initCount++;
        return { count: initCount };
      });

      container.resolve('singleton');
      container.resolve('singleton');
      container.resolve('singleton');

      expect(initCount).toBe(1);
    });
  });
});
