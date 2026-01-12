import { version, defaultGameConfig, calculatePhysicalDamage } from '../src/index';

describe('rpg-core', () => {
  describe('exports', () => {
    it('should export version string', () => {
      expect(version).toBe('1.0.0');
      expect(typeof version).toBe('string');
    });

    it('should export default game config', () => {
      expect(defaultGameConfig).toBeDefined();
      expect(defaultGameConfig.combat).toBeDefined();
      expect(defaultGameConfig.growth).toBeDefined();
      expect(defaultGameConfig.balance).toBeDefined();
    });

    it('should export combat functions', () => {
      expect(typeof calculatePhysicalDamage).toBe('function');
    });
  });
});
