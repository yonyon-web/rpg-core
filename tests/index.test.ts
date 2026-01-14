import { version, defaultGameConfig, calculatePhysicalDamage } from '../src/index';

describe('GEasy-Kit（パッケージ）', () => {
  describe('エクスポート', () => {
    it('バージョン文字列をエクスポートする', () => {
      expect(version).toBe('1.0.0');
      expect(typeof version).toBe('string');
    });

    it('デフォルトゲーム設定をエクスポートする', () => {
      expect(defaultGameConfig).toBeDefined();
      expect(defaultGameConfig.combat).toBeDefined();
      expect(defaultGameConfig.growth).toBeDefined();
      expect(defaultGameConfig.balance).toBeDefined();
    });

    it('戦闘関数をエクスポートする', () => {
      expect(typeof calculatePhysicalDamage).toBe('function');
    });
  });
});
