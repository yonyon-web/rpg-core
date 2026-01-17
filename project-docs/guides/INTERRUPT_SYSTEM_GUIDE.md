# 割り込みシステム (Interrupt System)

## 概要

割り込みシステムは、戦闘アクションの結果に割り込んで追加処理を実行する柔軟な仕組みを提供します。ドラクエの「睡眠状態が一定ダメージで解除される」のような、アクション結果に応じた追加処理を実装できます。

## 主な特徴

- **多階層の割り込み対応**: 共通ルール、敵個別、キャラクター/ジョブ別の割り込みをサポート
- **優先度制御**: 優先度を設定して実行順序を制御
- **条件付き実行**: 条件を満たした場合のみ実行される割り込みを定義可能
- **エラーハンドリング**: 一つの割り込みでエラーが発生しても他の割り込みは続行

## 基本的な使い方

### 1. InterruptManagerの作成

```typescript
import { InterruptManager } from 'geasy-kit';

const interruptManager = new InterruptManager();
```

### 2. BattleActionExecutorに割り込みマネージャーを渡す

```typescript
import { BattleActionExecutor } from 'geasy-kit';

const executor = new BattleActionExecutor(gameConfig, interruptManager);
```

### 3. 割り込みを登録

#### 共通ルールの割り込み（全キャラ・全敵に適用）

```typescript
interruptManager.registerCommon({
  id: 'sleep-cancel-on-damage',
  name: 'Sleep Cancellation',
  priority: 100,
  handler: createSleepCancelOnDamageHandler(20), // 最大HPの20%のダメージで睡眠解除
  enabled: true,
});
```

#### 敵個別の割り込み

```typescript
interruptManager.registerEnemy('vampire', {
  id: 'vampire-drain',
  name: 'Vampire HP Drain',
  priority: 80,
  handler: createHPDrainHandler(0.5), // ダメージの50%を吸収
  enabled: true,
});
```

#### キャラクター個別の割り込み

```typescript
interruptManager.registerCharacter('warrior1', {
  id: 'warrior-counter',
  name: 'Warrior Counter Attack',
  priority: 70,
  handler: createCounterAttackHandler(0.3, 0.5), // 30%の確率でカウンター
  enabled: true,
});
```

#### ジョブ別の割り込み

```typescript
interruptManager.registerJob('monk', {
  id: 'monk-counter',
  name: 'Monk Counter',
  priority: 75,
  handler: createCounterAttackHandler(0.4, 0.6), // モンクは40%の確率でカウンター
  enabled: true,
});
```

#### 装備個別の割り込み

```typescript
// 武器「炎の剣」装備時
interruptManager.registerEquipment('flame-sword', {
  id: 'flame-sword-burn',
  name: 'Flame Sword Burn',
  priority: 85,
  handler: createStatusInflictWeaponHandler('burn', 0.25, 3, 5), // 25%の確率で火傷
  enabled: true,
});

// 鎧「棘の鎧」装備時
interruptManager.registerEquipment('thorns-armor', {
  id: 'thorns-reflect',
  name: 'Thorns Reflection',
  priority: 60,
  handler: createThornsArmorHandler(0.3), // 30%のダメージを反射
  enabled: true,
});
```

## 組み込み割り込みハンドラー

### createSleepCancelOnDamageHandler

睡眠状態が一定ダメージで解除される

```typescript
import { createSleepCancelOnDamageHandler } from 'geasy-kit';

const handler = createSleepCancelOnDamageHandler(20); // 最大HPの20%以上のダメージで解除
```

### createConfusionCancelOnDamageHandler

混乱状態が一定ダメージで解除される

```typescript
import { createConfusionCancelOnDamageHandler } from 'geasy-kit';

const handler = createConfusionCancelOnDamageHandler(25); // 最大HPの25%以上のダメージで解除
```

### createCounterAttackHandler

物理攻撃を受けた時に反撃する

```typescript
import { createCounterAttackHandler } from 'geasy-kit';

const handler = createCounterAttackHandler(
  0.3,  // 30%の発動率
  0.5   // 攻撃力の50%のダメージで反撃
);
```

### createHPDrainHandler

ダメージの一定割合のHPを吸収する

```typescript
import { createHPDrainHandler } from 'geasy-kit';

const handler = createHPDrainHandler(0.5); // ダメージの50%を吸収
```

### createCriticalHealthPowerUpHandler

HPが一定以下になると攻撃力がアップする

```typescript
import { createCriticalHealthPowerUpHandler } from 'geasy-kit';

const handler = createCriticalHealthPowerUpHandler(
  25,   // HP25%以下で発動
  1.5   // 攻撃力1.5倍
);
```

## 武器・装備専用の割り込みハンドラー

**注意**: 装備効果は`registerEquipment`（装備ID指定）または`registerCharacter`（キャラクターID指定）のどちらでも登録できます。

- **`registerEquipment`**: 装備IDで登録。同じ装備を持つ全キャラに効果が適用される
- **`registerCharacter`**: キャラクターIDで登録。特定キャラのみに効果が適用される

### createThornsArmorHandler

攻撃を受けた時に攻撃者にダメージを反射する（棘の鎧効果）

```typescript
import { createThornsArmorHandler } from 'geasy-kit';

// 装備IDで登録（推奨）：棘の鎧を装備した全キャラに適用
manager.registerEquipment('thorns-armor', {
  id: 'thorns-armor-effect',
  name: 'Thorns Armor',
  priority: 60,
  handler: createThornsArmorHandler(0.3), // 30%のダメージを反射
  enabled: true
});

// または、特定キャラのみに適用
manager.registerCharacter('warrior1', {
  id: 'thorns-armor',
  name: 'Thorns Armor',
  priority: 60,
  handler: createThornsArmorHandler(0.3),
  enabled: true
});
```

### createStatusInflictWeaponHandler

攻撃が命中した時に一定確率で状態異常を付与する（毒の短剣など）

```typescript
import { createStatusInflictWeaponHandler } from 'geasy-kit';

// 装備IDで登録（推奨）：毒の短剣を装備した全キャラに適用
manager.registerEquipment('poison-dagger', {
  id: 'poison-dagger-effect',
  name: 'Poison Dagger',
  priority: 70,
  handler: createStatusInflictWeaponHandler('poison', 0.3, 3, 5),
  // 30%の確率で毒を3ターン、威力5で付与
  enabled: true
});
```

### createAutoReviveHandler

HPが0になった時に自動的に一度だけ復活する（不死鳥の羽など）

```typescript
import { createAutoReviveHandler } from 'geasy-kit';

// アクセサリー「不死鳥の羽」装備時
manager.registerCharacter('mage1', {
  id: 'phoenix-feather',
  name: 'Phoenix Feather',
  priority: 200, // 高優先度で他の処理より先に実行
  handler: createAutoReviveHandler(0.3), // 最大HPの30%で復活
  enabled: true
});
```

### createLifestealWeaponHandler

攻撃時にダメージの一定割合のHPを吸収する（吸血剣など）

```typescript
import { createLifestealWeaponHandler } from 'geasy-kit';

// 武器「吸血剣」装備時
manager.registerCharacter('knight1', {
  id: 'vampire-sword',
  name: 'Vampire Sword',
  priority: 85,
  handler: createLifestealWeaponHandler(0.2, true), // 物理攻撃の20%を吸収
  enabled: true
});
```

### createCriticalBonusWeaponHandler

クリティカルヒット時に追加ダメージを与える（会心の剣など）

```typescript
import { createCriticalBonusWeaponHandler } from 'geasy-kit';

// 武器「会心の剣」装備時
manager.registerCharacter('warrior1', {
  id: 'critical-sword',
  name: 'Critical Sword',
  priority: 90,
  handler: createCriticalBonusWeaponHandler(0.5), // クリティカル時に50%追加ダメージ
  enabled: true
});
```

## カスタム割り込みハンドラーの作成

### 基本的な形

```typescript
import { InterruptHandler, InterruptContext, InterruptResult } from 'geasy-kit';

const customHandler: InterruptHandler = async (context: InterruptContext): Promise<InterruptResult> => {
  const { actor, target, result, skill } = context;
  
  // 何か処理をする
  // 例: 対象が特定の状態異常を持っているかチェック
  if (target.statusEffects.some(e => e.type === 'poison')) {
    // 毒状態の敵に追加ダメージ
    const bonusDamage = 10;
    target.currentHp = Math.max(0, target.currentHp - bonusDamage);
    
    return {
      executed: true,
      stateChanged: true,
      message: `Bonus damage to poisoned enemy: ${bonusDamage}`,
    };
  }
  
  return { executed: false };
};
```

### 条件付き割り込み

```typescript
const conditionalInterrupt = {
  id: 'high-damage-bonus',
  name: 'High Damage Bonus',
  priority: 90,
  handler: async (context) => {
    // 追加処理
    return { executed: true };
  },
  enabled: true,
  condition: (context) => {
    // クリティカルヒット時のみ実行
    return context.result.critical === true;
  },
} as any; // ConditionalInterruptDefinitionとして扱う

manager.registerCommon(conditionalInterrupt);
```

## 割り込みの管理

### 割り込みの有効化/無効化

```typescript
// 無効化
interruptManager.setEnabled('sleep-cancel-on-damage', false);

// 有効化
interruptManager.setEnabled('sleep-cancel-on-damage', true);
```

### 割り込みの削除

```typescript
interruptManager.unregister('sleep-cancel-on-damage');
```

### 全割り込みのクリア

```typescript
interruptManager.clear();
```

### 割り込み数の取得

```typescript
// 全体の数
const totalCount = interruptManager.getCount();

// タイプ別の数
const commonCount = interruptManager.getCountByType('common');
const enemyCount = interruptManager.getCountByType('enemy');
```

## 実行順序と優先度

割り込みは**優先度の高い順（降順）**に実行されます。

```typescript
// 優先度100 → 優先度50 → 優先度10 の順に実行
interruptManager.registerCommon({
  id: 'high-priority',
  priority: 100,
  handler: async () => ({ executed: true }),
  enabled: true,
});

interruptManager.registerCommon({
  id: 'medium-priority',
  priority: 50,
  handler: async () => ({ executed: true }),
  enabled: true,
});

interruptManager.registerCommon({
  id: 'low-priority',
  priority: 10,
  handler: async () => ({ executed: true }),
  enabled: true,
});
```

## 使用例: ドラクエ風の睡眠解除システム

```typescript
import { 
  BattleActionExecutor, 
  InterruptManager,
  createSleepCancelOnDamageHandler 
} from 'geasy-kit';

// 割り込みマネージャーを作成
const interruptManager = new InterruptManager();

// 共通ルール: 睡眠状態は最大HPの20%のダメージで解除
interruptManager.registerCommon({
  id: 'sleep-cancel',
  name: 'Sleep Cancellation',
  priority: 100,
  handler: createSleepCancelOnDamageHandler(20),
  enabled: true,
});

// 戦闘アクション実行サービスに割り込みマネージャーを渡す
const executor = new BattleActionExecutor(gameConfig, interruptManager);

// 戦闘中、通常通りアクションを実行すると、自動的に割り込みが処理される
const result = await executor.executeAttack(action);
// ダメージが閾値以上なら睡眠状態が自動的に解除される
```

## 注意事項

1. **割り込みの実行はasync**: 割り込みハンドラーは非同期関数として実装できますが、executeInterruptsは順次実行します
2. **エラーハンドリング**: 一つの割り込みでエラーが発生しても、他の割り込みは続行されます
3. **状態変更**: 割り込みハンドラー内で対象のステータスを変更した場合、`stateChanged: true`を返すことを推奨します
4. **優先度の設定**: 重要な割り込みほど高い優先度を設定してください

## テスト

割り込みシステムは包括的にテストされています：

- InterruptManager: 18個のテストケース
- 割り込みハンドラー: 14個のテストケース
- BattleActionExecutorとの統合: 6個のテストケース

詳細は`tests/core/InterruptManager.test.ts`、`tests/core/interruptHandlers.test.ts`、`tests/integration/BattleActionExecutor.interrupt.test.ts`を参照してください。
