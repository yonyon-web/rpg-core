/**
 * 割り込みシステムの使用例
 * Interrupt System Usage Examples
 */

import {
  BattleActionExecutor,
  InterruptManager,
  createSleepCancelOnDamageHandler,
  createConfusionCancelOnDamageHandler,
  createCounterAttackHandler,
  createHPDrainHandler,
  createCriticalHealthPowerUpHandler,
  defaultGameConfig,
  Character,
  Enemy,
  BattleAction,
  InterruptHandler,
  InterruptContext,
  InterruptResult,
} from '../src';

// ========================================
// 例1: 基本的なセットアップ
// ========================================

function example1_BasicSetup() {
  console.log('=== 例1: 基本的なセットアップ ===\n');

  // 1. InterruptManagerを作成
  const interruptManager = new InterruptManager();

  // 2. BattleActionExecutorに割り込みマネージャーを渡す
  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  console.log('割り込みマネージャーが設定されました');
  console.log(`登録済み割り込み数: ${interruptManager.getCount()}\n`);
}

// ========================================
// 例2: ドラクエ風の睡眠解除システム
// ========================================

async function example2_SleepCancellation() {
  console.log('=== 例2: ドラクエ風の睡眠解除システム ===\n');

  const interruptManager = new InterruptManager();

  // 共通ルール: 睡眠状態は最大HPの20%のダメージで解除される
  interruptManager.registerCommon({
    id: 'sleep-cancel',
    name: 'Sleep Cancellation on Damage',
    priority: 100,
    handler: createSleepCancelOnDamageHandler(20),
    enabled: true,
  });

  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  // キャラクターと敵を作成
  const hero: Character = {
    id: 'hero1',
    name: 'Hero',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 15,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  };

  const slime: Enemy = {
    id: 'slime1',
    name: 'Slime',
    level: 5,
    stats: {
      maxHp: 50,
      maxMp: 20,
      attack: 30,
      defense: 20,
      magic: 25,
      magicDefense: 15,
      speed: 40,
      luck: 10,
      accuracy: 8,
      evasion: 3,
      criticalRate: 0.03,
    },
    currentHp: 50,
    currentMp: 20,
    statusEffects: [
      {
        id: 'sleep-1',
        type: 'sleep',
        category: 'disable',
        name: 'Sleep',
        description: 'Cannot act',
        power: 1,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
      },
    ],
    position: 0,
    enemyType: 'slime',
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  };

  console.log(`${slime.name} is sleeping (${slime.statusEffects.length} status effects)`);

  const action: BattleAction = {
    actor: hero,
    type: 'attack',
    targets: [slime],
  };

  // 攻撃を実行
  const result = await executor.executeAttack(action);

  console.log(`Attack result: ${result.message}`);
  if (result.damage) {
    console.log(`Damage: ${result.damage}`);
    console.log(`Remaining status effects: ${slime.statusEffects.length}`);
    if (slime.statusEffects.length === 0) {
      console.log('Sleep status was cancelled by damage!\n');
    }
  }
}

// ========================================
// 例3: 敵個別の特殊能力（吸血鬼のHP吸収）
// ========================================

async function example3_VampireDrain() {
  console.log('=== 例3: 敵個別の特殊能力（吸血鬼のHP吸収） ===\n');

  const interruptManager = new InterruptManager();

  // 吸血鬼専用のHP吸収割り込み
  interruptManager.registerEnemy('vampire', {
    id: 'vampire-drain',
    name: 'Vampire HP Drain',
    priority: 80,
    handler: createHPDrainHandler(0.5), // ダメージの50%を吸収
    enabled: true,
  });

  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  const vampire: Enemy = {
    id: 'vampire1',
    name: 'Vampire',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 60,
      defense: 30,
      magic: 50,
      magicDefense: 35,
      speed: 70,
      luck: 20,
      accuracy: 12,
      evasion: 8,
      criticalRate: 0.08,
    },
    currentHp: 50, // HPが減っている
    currentMp: 50,
    statusEffects: [],
    position: 0,
    enemyType: 'vampire',
    skills: [],
    aiStrategy: 'aggressive',
    expReward: 200,
    moneyReward: 100,
  };

  const hero: Character = {
    id: 'hero1',
    name: 'Hero',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 10,
      defense: 10,
      magic: 10,
      magicDefense: 10,
      speed: 10,
      luck: 10,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  };

  console.log(`${vampire.name} HP: ${vampire.currentHp}/${vampire.stats.maxHp}`);

  const action: BattleAction = {
    actor: vampire,
    type: 'attack',
    targets: [hero],
  };

  // 吸血鬼が攻撃
  const result = await executor.executeAttack(action);

  console.log(`Attack result: ${result.message}`);
  if (result.damage) {
    console.log(`Damage dealt: ${result.damage}`);
    console.log(`${vampire.name} HP after drain: ${vampire.currentHp}/${vampire.stats.maxHp}\n`);
  }
}

// ========================================
// 例4: ジョブ別の特殊能力（モンクのカウンター）
// ========================================

async function example4_MonkCounter() {
  console.log('=== 例4: ジョブ別の特殊能力（モンクのカウンター） ===\n');

  const interruptManager = new InterruptManager();

  // モンク専用のカウンター攻撃
  interruptManager.registerJob('monk', {
    id: 'monk-counter',
    name: 'Monk Counter Attack',
    priority: 75,
    handler: createCounterAttackHandler(1.0, 0.6), // 100%の確率でカウンター（テスト用）
    enabled: true,
  });

  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  const monk: Character = {
    id: 'monk1',
    name: 'Monk',
    job: 'monk',
    level: 10,
    stats: {
      maxHp: 120,
      maxMp: 30,
      attack: 70,
      defense: 50,
      magic: 20,
      magicDefense: 40,
      speed: 80,
      luck: 15,
      accuracy: 12,
      evasion: 10,
      criticalRate: 0.1,
    },
    currentHp: 120,
    currentMp: 30,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  };

  const enemy: Enemy = {
    id: 'goblin1',
    name: 'Goblin',
    level: 5,
    stats: {
      maxHp: 60,
      maxMp: 10,
      attack: 40,
      defense: 20,
      magic: 10,
      magicDefense: 15,
      speed: 50,
      luck: 10,
      accuracy: 8,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 60,
    currentMp: 10,
    statusEffects: [],
    position: 0,
    enemyType: 'goblin',
    skills: [],
    aiStrategy: 'aggressive',
    expReward: 30,
    moneyReward: 15,
  };

  console.log(`${enemy.name} HP: ${enemy.currentHp}/${enemy.stats.maxHp}`);
  console.log(`${monk.name} is targeted by ${enemy.name}'s attack`);

  const action: BattleAction = {
    actor: enemy,
    type: 'attack',
    targets: [monk],
  };

  // 敵がモンクを攻撃
  const result = await executor.executeAttack(action);

  console.log(`Attack result: ${result.message}`);
  if (result.damage) {
    console.log(`Damage to ${monk.name}: ${result.damage}`);
    console.log(`${enemy.name} HP after counter: ${enemy.currentHp}/${enemy.stats.maxHp}\n`);
  }
}

// ========================================
// 例5: カスタム割り込みハンドラー
// ========================================

async function example5_CustomInterrupt() {
  console.log('=== 例5: カスタム割り込みハンドラー ===\n');

  const interruptManager = new InterruptManager();

  // カスタム割り込み: 毒状態の敵に追加ダメージ
  const poisonBonusHandler: InterruptHandler = async (
    context: InterruptContext
  ): Promise<InterruptResult> => {
    const { target, result } = context;

    // ダメージがない場合は何もしない
    if (!result.damage || result.damage <= 0) {
      return { executed: false };
    }

    // 毒状態でない場合は何もしない
    const hasPoisonEffect = target.statusEffects.some((e) => e.type === 'poison');
    if (!hasPoisonEffect) {
      return { executed: false };
    }

    // 毒状態の敵に追加ダメージ
    const bonusDamage = Math.floor(result.damage * 0.5); // 元のダメージの50%
    target.currentHp = Math.max(0, target.currentHp - bonusDamage);

    return {
      executed: true,
      stateChanged: true,
      message: `Bonus damage to poisoned enemy: ${bonusDamage}!`,
      customData: {
        bonusDamage,
      },
    };
  };

  // 共通ルールとして登録
  interruptManager.registerCommon({
    id: 'poison-bonus',
    name: 'Poison Bonus Damage',
    priority: 90,
    handler: poisonBonusHandler,
    enabled: true,
  });

  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  const hero: Character = {
    id: 'hero1',
    name: 'Hero',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 15,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  };

  const poisonedEnemy: Enemy = {
    id: 'enemy1',
    name: 'Poisoned Slime',
    level: 5,
    stats: {
      maxHp: 50,
      maxMp: 20,
      attack: 30,
      defense: 20,
      magic: 25,
      magicDefense: 15,
      speed: 40,
      luck: 10,
      accuracy: 8,
      evasion: 3,
      criticalRate: 0.03,
    },
    currentHp: 50,
    currentMp: 20,
    statusEffects: [
      {
        id: 'poison-1',
        type: 'poison',
        category: 'dot',
        name: 'Poison',
        description: 'Takes damage over time',
        power: 5,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 3,
        canBeDispelled: true,
        appliedAt: Date.now(),
      },
    ],
    position: 0,
    enemyType: 'slime',
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  };

  console.log(`${poisonedEnemy.name} is poisoned!`);
  console.log(`${poisonedEnemy.name} HP: ${poisonedEnemy.currentHp}/${poisonedEnemy.stats.maxHp}`);

  const action: BattleAction = {
    actor: hero,
    type: 'attack',
    targets: [poisonedEnemy],
  };

  // 攻撃を実行
  const result = await executor.executeAttack(action);

  console.log(`Attack result: ${result.message}`);
  if (result.damage) {
    console.log(`Normal damage: ${result.damage}`);
    console.log(`${poisonedEnemy.name} HP after attack: ${poisonedEnemy.currentHp}/${poisonedEnemy.stats.maxHp}`);
    console.log('Additional poison bonus damage was applied!\n');
  }
}

// ========================================
// 例6: 複数の割り込みと優先度
// ========================================

async function example6_MultiplePriorities() {
  console.log('=== 例6: 複数の割り込みと優先度 ===\n');

  const interruptManager = new InterruptManager();
  const executionLog: string[] = [];

  // 優先度100: 睡眠解除
  interruptManager.registerCommon({
    id: 'sleep-cancel',
    name: 'Sleep Cancellation',
    priority: 100,
    handler: async (context) => {
      executionLog.push('sleep-cancel');
      return createSleepCancelOnDamageHandler(20)(context);
    },
    enabled: true,
  });

  // 優先度90: 瀕死時パワーアップ
  interruptManager.registerCommon({
    id: 'critical-power',
    name: 'Critical Health Power Up',
    priority: 90,
    handler: async (context) => {
      executionLog.push('critical-power');
      return createCriticalHealthPowerUpHandler(25, 1.5)(context);
    },
    enabled: true,
  });

  // 優先度80: ログ出力（テスト用）
  interruptManager.registerCommon({
    id: 'log-damage',
    name: 'Log Damage',
    priority: 80,
    handler: async (context) => {
      executionLog.push('log-damage');
      if (context.result.damage) {
        console.log(`  [割り込み] ダメージログ: ${context.result.damage}`);
      }
      return { executed: true };
    },
    enabled: true,
  });

  const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

  const hero: Character = {
    id: 'hero1',
    name: 'Hero',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 15,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  };

  const enemy: Enemy = {
    id: 'enemy1',
    name: 'Weak Slime',
    level: 5,
    stats: {
      maxHp: 50,
      maxMp: 20,
      attack: 30,
      defense: 20,
      magic: 25,
      magicDefense: 15,
      speed: 40,
      luck: 10,
      accuracy: 8,
      evasion: 3,
      criticalRate: 0.03,
    },
    currentHp: 10, // HPが低い
    currentMp: 20,
    statusEffects: [],
    position: 0,
    enemyType: 'slime',
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  };

  console.log(`${enemy.name} HP: ${enemy.currentHp}/${enemy.stats.maxHp} (低HP状態)`);

  const action: BattleAction = {
    actor: hero,
    type: 'attack',
    targets: [enemy],
  };

  // 攻撃を実行
  await executor.executeAttack(action);

  console.log(`\n割り込み実行順序: ${executionLog.join(' -> ')}`);
  console.log('優先度順（100 -> 90 -> 80）に実行されました\n');
}

// ========================================
// メイン実行
// ========================================

async function runAllExamples() {
  example1_BasicSetup();
  await example2_SleepCancellation();
  await example3_VampireDrain();
  await example4_MonkCounter();
  await example5_CustomInterrupt();
  await example6_MultiplePriorities();
}

// 実行
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicSetup,
  example2_SleepCancellation,
  example3_VampireDrain,
  example4_MonkCounter,
  example5_CustomInterrupt,
  example6_MultiplePriorities,
};
