/**
 * Dependency Injection Examples
 * 
 * このファイルは、依存関係注入の改善を示す例を提供します。
 * This file provides examples demonstrating the dependency injection improvements.
 */

import { RPGCore } from '../src/core/RPGCore';
import { BattleService } from '../src/services/battle/BattleService';
import { RewardService } from '../src/services/system/RewardService';
import { BattleActionExecutor } from '../src/services/battle/BattleActionExecutor';
import { defaultGameConfig } from '../src/config/defaultConfig';

/**
 * 例1: RPGCoreを使用した依存関係の自動注入
 * Example 1: Automatic dependency injection using RPGCore
 */
function example1_AutomaticInjection() {
  console.log('=== Example 1: Automatic Dependency Injection ===\n');
  
  // RPGCoreが全ての依存関係を自動的に解決
  // RPGCore automatically resolves all dependencies
  const rpg = new RPGCore();
  
  // BattleServiceはRewardServiceとBattleActionExecutorが既に注入されている
  // BattleService already has RewardService and BattleActionExecutor injected
  const battleService = rpg.services.battle;
  
  console.log('✅ BattleService initialized with dependencies');
  console.log('   - RewardService: injected');
  console.log('   - BattleActionExecutor: injected');
  console.log('   - Config: injected\n');
}

/**
 * 例2: テスト用のモック注入
 * Example 2: Injecting mocks for testing
 */
function example2_MockInjection() {
  console.log('=== Example 2: Mock Injection for Testing ===\n');
  
  // テスト用のモックRewardServiceを作成
  // Create a mock RewardService for testing
  class MockRewardService extends RewardService {
    distributeExp(party: any[], totalExp: number) {
      console.log(`[Mock] Distributing ${totalExp} exp to ${party.length} members`);
      return super.distributeExp(party, totalExp);
    }
  }
  
  const mockRewardService = new MockRewardService();
  const mockActionExecutor = new BattleActionExecutor(defaultGameConfig);
  
  // モックを注入してBattleServiceを作成
  // Create BattleService with injected mocks
  const battleService = new BattleService(
    defaultGameConfig,
    mockRewardService,
    mockActionExecutor
  );
  
  console.log('✅ BattleService initialized with mocks');
  console.log('   - MockRewardService: injected');
  console.log('   - MockBattleActionExecutor: injected\n');
}

/**
 * 例3: カスタム設定での依存関係注入
 * Example 3: Dependency injection with custom configuration
 */
function example3_CustomConfiguration() {
  console.log('=== Example 3: Custom Configuration ===\n');
  
  const customConfig = {
    combat: {
      baseCriticalRate: 0.1,
      criticalMultiplier: 3.0,
      damageVariance: 0.15,
      escapeBaseRate: 0.6,
      escapeRateIncrement: 0.15,
      preemptiveStrikeThreshold: 40,
      speedVariance: 0.15,
    },
    growth: {
      expCurve: 'exponential' as const,
      baseExpRequired: 150,
      expGrowthRate: 1.3,
      maxLevel: 99,
      statGrowthRates: {
        maxHp: 15,
        maxMp: 8,
        attack: 4,
        defense: 3,
        magic: 4,
        magicDefense: 3,
        speed: 3,
        luck: 2,
        accuracy: 1,
        evasion: 1,
        criticalRate: 0.01,
      },
    },
    balance: {
      maxPartySize: 6,
      dropRateModifier: 1.2,
    },
  };
  
  // カスタム設定でRPGCoreを初期化
  // Initialize RPGCore with custom configuration
  const rpg = new RPGCore({ config: customConfig });
  
  const battleService = rpg.services.battle;
  
  console.log('✅ BattleService with custom config');
  console.log(`   - Critical multiplier: ${rpg.config.combat.criticalMultiplier}x`);
  console.log(`   - Max party size: ${rpg.config.balance.maxPartySize}`);
  console.log(`   - Exp growth rate: ${rpg.config.growth.expGrowthRate}x\n`);
}

/**
 * 例4: データパラメータの柔軟な使用
 * Example 4: Flexible use of data parameters
 */
function example4_DataParameters() {
  console.log('=== Example 4: Data Parameters (Not Injected) ===\n');
  
  const rpg = new RPGCore();
  
  // これらはサービスではなくデータなので、メソッドパラメータとして渡す
  // These are data (not services), so they are passed as method parameters
  
  const party1 = [/* characters */];
  const party2 = [/* other characters */];
  
  // 同じサービスで複数のパーティを処理できる
  // Can process multiple parties with the same service
  rpg.services.party.addMember(party1, {} as any);
  rpg.services.party.addMember(party2, {} as any);
  
  console.log('✅ Flexibility with data parameters');
  console.log('   - Same service can process multiple parties');
  console.log('   - No need to create separate service instances');
  console.log('   - Easy to test with mock data\n');
}

/**
 * 例5: サービスコンテナの直接使用
 * Example 5: Direct use of ServiceContainer
 */
function example5_ServiceContainer() {
  console.log('=== Example 5: Direct ServiceContainer Usage ===\n');
  
  const rpg = new RPGCore();
  
  // カスタムサービスを登録
  // Register a custom service
  class AnalyticsService {
    trackBattle(battleId: string) {
      console.log(`[Analytics] Battle tracked: ${battleId}`);
    }
  }
  
  rpg.container.register('analytics', () => new AnalyticsService());
  
  // カスタムサービスを解決
  // Resolve the custom service
  const analytics = rpg.container.resolve<AnalyticsService>('analytics');
  analytics.trackBattle('battle-001');
  
  // 登録されているサービスの一覧を表示
  // Display registered services
  const services = rpg.container.getRegisteredServices();
  console.log(`\n✅ Total registered services: ${services.length}`);
  console.log(`   Includes: battleService, itemService, analytics, etc.\n`);
}

/**
 * 例6: 後方互換性の維持
 * Example 6: Maintaining backward compatibility
 */
function example6_BackwardCompatibility() {
  console.log('=== Example 6: Backward Compatibility ===\n');
  
  // 従来の方法（まだ動作する）
  // Old way (still works)
  const battleService1 = new BattleService();
  console.log('✅ Old way still works: new BattleService()');
  
  // 設定を渡す方法（まだ動作する）
  // With config (still works)
  const battleService2 = new BattleService(defaultGameConfig);
  console.log('✅ With config still works: new BattleService(config)');
  
  // 新しい方法（推奨）
  // New way (recommended)
  const rpg = new RPGCore();
  const battleService3 = rpg.services.battle;
  console.log('✅ New way recommended: rpg.services.battle\n');
}

/**
 * すべての例を実行
 * Run all examples
 */
function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Dependency Injection Examples                         ║');
  console.log('║  依存関係注入の例                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    example1_AutomaticInjection();
    example2_MockInjection();
    example3_CustomConfiguration();
    example4_DataParameters();
    example5_ServiceContainer();
    example6_BackwardCompatibility();
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✓ All examples completed successfully!                ║');
    console.log('║  ✓ すべての例が正常に完了しました！                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n✗ Error running examples:', error);
  }
}

// このファイルが直接実行された場合のみ例を実行
// Run examples only if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_AutomaticInjection,
  example2_MockInjection,
  example3_CustomConfiguration,
  example4_DataParameters,
  example5_ServiceContainer,
  example6_BackwardCompatibility,
  runAllExamples
};
