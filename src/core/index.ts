/**
 * Core module exports
 * 
 * Core Engine層のエクスポート
 */

// System core
export * from './EventBus';
export * from './ServiceContainer';
export * from './GEasyKit';
export * from './persistence';

// Backward compatibility - export old name
export { GEasyKit as RPGCore, GEasyKitOptions as RPGCoreOptions } from './GEasyKit';

// Character core
export * from './character';

// Combat core
export * from './combat';

// Item core
export * from './item';

// Craft core
export * from './craft';

// Party core
export * from './party';

// Status core
export * from './status';

// Shop core
export * from './shop';