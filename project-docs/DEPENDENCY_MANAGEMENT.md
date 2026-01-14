# 依存関係管理システム (Dependency Management System)

GEasy-Kitライブラリの依存関係管理システムの完全ガイド

## 概要

GEasy-Kitは、サービス間およびコントローラー間の依存関係を自動的に解決するDependency Injection (DI) システムを提供します。このシステムにより、開発者は複雑な依存関係を気にすることなく、1カ所でアプリケーションを設定できます。

## 問題

従来の方法では、サービスやコントローラーを使用する際に以下の問題がありました：

```typescript
// ❌ 従来の方法：手動で依存関係を解決する必要がある
const config = defaultGameConfig;
const eventBus = new EventBus();
const inventory = { maxSlots: 100, slots: [] };

const itemService = new ItemService(eventBus);
const inventoryService = new InventoryService(inventory, eventBus);
const equipmentService = new EquipmentService(undefined, eventBus);
const craftService = new CraftService(inventoryService);

const battleService = new BattleService(config);

// コントローラーも同様に手動で依存を解決
const battleController = new BattleController(battleService);
const itemController = new ItemController(itemService);
```

この方法の問題点：
1. 依存関係が複雑になると管理が困難
2. サービスの初期化順序を考慮する必要がある
3. 同じ設定を複数箇所で繰り返す必要がある
4. 依存関係の変更時に多くのコードを修正する必要がある

## 解決策

GEasy-Kitの依存関係管理システムを使用すると、すべての依存関係が自動的に解決されます：

```typescript
// ✅ 新しい方法：RPGCoreクラスで一箇所設定
import { RPGCore } from 'GEasy-Kit';

const rpg = new RPGCore({
  config: customGameConfig,  // 省略可能
  useEventBus: true,         // 省略可能（デフォルト: true）
  initialInventory: myInventory  // 省略可能
});

// サービスに直接アクセス（依存関係は自動解決）
const battleService = rpg.services.battle;
const itemService = rpg.services.item;
const craftService = rpg.services.craft;

// コントローラーも簡単に取得
const battleController = rpg.controllers.battle();
const itemController = rpg.controllers.item();
```

## 主要コンポーネント

### 1. ServiceContainer

DIコンテナの実装。サービスの登録、解決、ライフタイム管理を担当します。

```typescript
import { ServiceContainer } from 'GEasy-Kit';

const container = new ServiceContainer();

// サービスを登録
container.register('myService', () => new MyService());
container.register('anotherService', (c) => new AnotherService(
  c.resolve('myService')
));

// サービスを解決
const service = container.resolve('myService');
```

**機能：**
- **Singleton**: デフォルト。同じインスタンスが再利用される
- **Transient**: 毎回新しいインスタンスを生成
- **循環依存検出**: 循環依存を自動的に検出してエラーを投げる
- **遅延初期化**: サービスは最初に使用される時に初期化される

### 2. RPGCore

GEasy-Kitの統一エントリーポイント。すべてのサービスとコントローラーにアクセスできます。

```typescript
import { RPGCore } from 'GEasy-Kit';

const rpg = new RPGCore({
  config: {
    // カスタムゲーム設定
    damageFormula: {
      physicalDamageMultiplier: 2.0,
      magicDamageMultiplier: 1.5,
    }
  }
});
```

## 使用例

### 基本的な使用

```typescript
import { RPGCore } from 'GEasy-Kit';

// 1. RPGCoreインスタンスを作成
const rpg = new RPGCore();

// 2. サービスを使用
const battleService = rpg.services.battle;
await battleService.startBattle(party, enemies);

// 3. コントローラーを作成
const battleController = rpg.controllers.battle();
battleController.subscribe((state) => {
  console.log('Battle state:', state);
});
```

### カスタム設定を使用

```typescript
import { RPGCore, defaultGameConfig } from 'GEasy-Kit';

const customConfig = {
  ...defaultGameConfig,
  damageFormula: {
    physicalDamageMultiplier: 3.0,
    magicDamageMultiplier: 2.0,
  }
};

const rpg = new RPGCore({
  config: customConfig
});
```

### React での使用例

```tsx
import React, { createContext, useContext, useMemo } from 'react';
import { RPGCore } from 'GEasy-Kit';

// RPGCoreのコンテキストを作成
const RPGContext = createContext<RPGCore | null>(null);

// プロバイダーコンポーネント
export const RPGProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const rpg = useMemo(() => new RPGCore(), []);
  
  return (
    <RPGContext.Provider value={rpg}>
      {children}
    </RPGContext.Provider>
  );
};

// カスタムフック
export const useRPG = () => {
  const rpg = useContext(RPGContext);
  if (!rpg) {
    throw new Error('useRPG must be used within RPGProvider');
  }
  return rpg;
};

// コンポーネント内での使用
const BattleComponent: React.FC = () => {
  const rpg = useRPG();
  const [controller] = useState(() => rpg.controllers.battle());
  
  useEffect(() => {
    const unsubscribe = controller.subscribe((state) => {
      // 状態の更新
    });
    return unsubscribe;
  }, [controller]);
  
  return <div>Battle UI</div>;
};
```

### Vue での使用例

```typescript
// store/rpg.ts
import { defineStore } from 'pinia';
import { RPGCore } from 'GEasy-Kit';

export const useRPGStore = defineStore('rpg', {
  state: () => ({
    rpg: new RPGCore(),
  }),
  getters: {
    battleService: (state) => state.rpg.services.battle,
    itemService: (state) => state.rpg.services.item,
  },
  actions: {
    getBattleController() {
      return this.rpg.controllers.battle();
    },
  },
});
```

```vue
<!-- BattleView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRPGStore } from '@/store/rpg';

const rpgStore = useRPGStore();
const controller = rpgStore.getBattleController();
const battleState = ref(controller.getState());

onMounted(() => {
  const unsubscribe = controller.subscribe((state) => {
    battleState.value = state;
  });
  
  onUnmounted(() => {
    unsubscribe();
  });
});
</script>
```

### カスタムサービスの追加

高度な使用例として、独自のサービスをDIコンテナに登録できます：

```typescript
import { RPGCore } from 'GEasy-Kit';

// カスタムサービス
class AnalyticsService {
  trackEvent(event: string, data: any) {
    console.log('Analytics:', event, data);
  }
}

const rpg = new RPGCore();

// カスタムサービスを登録
rpg.container.register('analytics', () => new AnalyticsService());

// カスタムサービスを使用
const analytics = rpg.container.resolve<AnalyticsService>('analytics');
analytics.trackEvent('battle-started', { partySize: 4 });
```

## 利用可能なサービス

RPGCoreインスタンスから以下のサービスにアクセスできます：

```typescript
rpg.services.battle       // BattleService
rpg.services.item         // ItemService
rpg.services.equipment    // EquipmentService
rpg.services.party        // PartyService
rpg.services.statusEffect // StatusEffectService
rpg.services.inventory    // InventoryService
rpg.services.reward       // RewardService
rpg.services.skillLearn   // SkillLearnService
rpg.services.jobChange    // JobChangeService
rpg.services.craft        // CraftService
rpg.services.enhance      // EnhanceService
rpg.services.shop         // ShopService
rpg.services.command      // CommandService
rpg.services.enemyAI      // EnemyAIService
rpg.services.enemyGroup   // EnemyGroupService
rpg.services.saveLoad     // SaveLoadService
rpg.services.simulation   // SimulationService
```

## 利用可能なコントローラー

```typescript
rpg.controllers.battle()      // BattleController
rpg.controllers.item()        // ItemController
rpg.controllers.equipment()   // EquipmentController
rpg.controllers.party()       // PartyController
rpg.controllers.craft()       // CraftController
rpg.controllers.skillLearn()  // SkillLearnController
rpg.controllers.reward()      // RewardController
rpg.controllers.enhance()     // EnhanceController
rpg.controllers.jobChange()   // JobChangeController
rpg.controllers.statusEffect() // StatusEffectController
rpg.controllers.inventory()   // InventoryController
rpg.controllers.shop()        // ShopController
rpg.controllers.command()     // CommandController
```

## メリット

### 1. シンプルな初期化
1カ所で設定するだけで、すべてのサービスとコントローラーが使用可能になります。

### 2. 自動的な依存関係解決
サービス間の依存関係を気にする必要がありません。DIコンテナが自動的に解決します。

### 3. 保守性の向上
- 依存関係の変更が1カ所で完結
- 新しいサービスの追加が簡単
- テストが容易（モックの注入が簡単）

### 4. 型安全性
TypeScriptの型システムと完全に統合されており、型安全なコードが書けます。

### 5. 拡張性
カスタムサービスを簡単に追加でき、既存のサービスと統合できます。

## デメリット・注意点

### 1. 学習コスト
DIパターンに慣れていない開発者には、最初は理解が必要です。

**緩和策**: 
- 豊富なドキュメントと例
- RPGCoreクラスが複雑さを隠蔽

### 2. デバッグの複雑さ
依存関係が自動解決されるため、問題の原因を追跡しにくい場合があります。

**緩和策**:
- 明確なエラーメッセージ（循環依存検出など）
- `container.getRegisteredServices()`でサービス一覧を確認可能

### 3. オーバーヘッド
小規模なプロジェクトでは、DIコンテナのオーバーヘッドが不要な場合があります。

**緩和策**:
- 従来の手動初期化も引き続きサポート
- DIコンテナは軽量で、パフォーマンスへの影響は最小限

### 4. シングルトンの状態管理
デフォルトでサービスはシングルトンとして管理されるため、状態の共有に注意が必要です。

**緩和策**:
- イミュータブルなデータ構造を推奨
- 必要に応じてトランジェントライフタイムを使用

## 他の問題点

### 循環依存
サービスAがサービスBに依存し、サービスBがサービスAに依存するような循環依存は自動的に検出され、エラーが発生します。

```typescript
// ❌ エラー: 循環依存
container.register('serviceA', (c) => new ServiceA(c.resolve('serviceB')));
container.register('serviceB', (c) => new ServiceB(c.resolve('serviceA')));

// これを解決しようとするとエラー
container.resolve('serviceA'); // Error: Circular dependency detected
```

**解決方法**:
- サービスの設計を見直し、循環依存を避ける
- 必要に応じて、インターフェースやイベントバスを使用して疎結合にする

### マルチインスタンス
複数のRPGCoreインスタンスを作成する場合、それぞれが独立したサービスのセットを持ちます。

```typescript
const rpg1 = new RPGCore();
const rpg2 = new RPGCore();

// rpg1とrpg2のサービスは完全に独立
rpg1.services.battle !== rpg2.services.battle // true
```

これは通常は問題ありませんが、グローバルな状態を共有したい場合は注意が必要です。

## まとめ

GEasy-Kitの依存関係管理システムは、以下の利点を提供します：

✅ **シンプルな初期化**: 1カ所で全体を設定  
✅ **自動依存解決**: 手動での依存管理が不要  
✅ **保守性**: 変更が局所化される  
✅ **拡張性**: カスタムサービスの追加が容易  
✅ **型安全性**: TypeScriptの型システムとの完全な統合  

一方で、以下の点に注意が必要です：

⚠️ **学習コスト**: DIパターンの理解が必要  
⚠️ **デバッグ**: 自動解決による追跡の困難さ  
⚠️ **状態管理**: シングルトンの状態共有に注意  

総合的には、中規模以上のプロジェクトや、複数のサービスを組み合わせて使用する場合に、このシステムは大きな価値を提供します。

## 移行ガイド

既存のコードから新しいシステムへの移行は段階的に行えます：

```typescript
// 既存のコード（そのまま動作）
const battleService = new BattleService(config);

// 新しいコード（推奨）
const rpg = new RPGCore({ config });
const battleService = rpg.services.battle;
```

両方のアプローチが共存できるため、徐々に移行できます。
