import { greet, version } from '../src/index';

describe('rpg-core', () => {
  describe('greet', () => {
    it('should return a greeting message', () => {
      const result = greet('Player');
      expect(result).toBe('Hello, Player! Welcome to rpg-core.');
    });

    it('should work with different names', () => {
      const result = greet('Hero');
      expect(result).toBe('Hello, Hero! Welcome to rpg-core.');
    });
  });

  describe('version', () => {
    it('should export version string', () => {
      expect(version).toBe('1.0.0');
      expect(typeof version).toBe('string');
    });
  });
});
