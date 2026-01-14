/**
 * RPGCore Usage Examples
 * 
 * このファイルは、GEasy-Kitの依存関係管理システムの使用例を示します。
 */

import { RPGCore } from '../src/core/RPGCore';
import type { Character, Enemy } from '../src/types';

/**
 * 例 1: 基本的な使用方法
 */
function basicExample() {
  console.log('=== Example 1: Basic Usage ===');
  
  // 1. RPGCoreインスタンスを作成
  const rpg = new RPGCore();
  
  // 2. サービスを取得（依存関係は自動解決）
  const battleService = rpg.services.battle;
  const itemService = rpg.services.item;
  const partyService = rpg.services.party;
  
  console.log('Services initialized:', {
    battle: !!battleService,
    item: !!itemService,
    party: !!partyService
  });
  
  // 3. コントローラーを作成
  const battleController = rpg.controllers.battle();
  const itemController = rpg.controllers.item();
  
  console.log('Controllers created:', {
    battle: !!battleController,
    item: !!itemController
  });
}

/**
 * 例 2: カスタム設定を使用
 */
function customConfigExample() {
  console.log('\n=== Example 2: Custom Configuration ===');
  
  const rpg = new RPGCore({
    config: {
      damageFormula: {
        physicalDamageMultiplier: 3.0,
        magicDamageMultiplier: 2.5,
        criticalHitMultiplier: 2.0
      },
      accuracyFormula: {
        baseHitRate: 0.95,
        minHitRate: 0.05,
        maxHitRate: 0.99
      }
    }
  });
  
  console.log('Custom config applied:', {
    physicalMultiplier: rpg.config.damageFormula?.physicalDamageMultiplier,
    magicMultiplier: rpg.config.damageFormula?.magicDamageMultiplier
  });
}

/**
 * 例 3: EventBusを使用してイベントを購読
 */
function eventBusExample() {
  console.log('\n=== Example 3: EventBus Integration ===');
  
  const rpg = new RPGCore({
    useEventBus: true
  });
  
  // EventBusからイベントを購読
  if (rpg.eventBus) {
    rpg.eventBus.on('data-changed', (event: any) => {
      console.log('Data changed:', event.type);
    });
    
    console.log('EventBus subscribed to data-changed events');
  }
}

/**
 * 例 4: カスタムサービスの追加
 */
class AnalyticsService {
  trackEvent(event: string, data: any) {
    console.log(`[Analytics] ${event}:`, JSON.stringify(data));
  }
}

function customServiceExample() {
  console.log('\n=== Example 4: Custom Service ===');
  
  const rpg = new RPGCore();
  
  // カスタムサービスを登録
  rpg.container.register('analytics', () => new AnalyticsService());
  
  // カスタムサービスを使用
  const analytics = rpg.container.resolve<AnalyticsService>('analytics');
  analytics.trackEvent('game-started', { timestamp: Date.now() });
  
  console.log('Custom service registered and used');
}

/**
 * 例 5: 登録されているサービスの確認
 */
function inspectServicesExample() {
  console.log('\n=== Example 5: Inspect Registered Services ===');
  
  const rpg = new RPGCore();
  
  // 登録されているサービスの一覧を取得
  const services = rpg.container.getRegisteredServices();
  
  console.log('Registered services:', services.length);
  console.log('Service names:', services.slice(0, 5).join(', '), '...');
  
  // 特定のサービスが登録されているかチェック
  console.log('Has battleService:', rpg.container.has('battleService'));
  console.log('Has nonexistentService:', rpg.container.has('nonexistentService'));
}

// すべての例を実行
async function runAllExamples() {
  try {
    basicExample();
    customConfigExample();
    eventBusExample();
    customServiceExample();
    inspectServicesExample();
    
    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error('\n✗ Error running examples:', error);
  }
}

// このファイルが直接実行された場合のみ例を実行
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  basicExample,
  customConfigExample,
  eventBusExample,
  customServiceExample,
  inspectServicesExample,
  runAllExamples
};
