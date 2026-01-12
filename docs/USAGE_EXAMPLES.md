# Phase 1 Core Engine - Usage Examples

This document demonstrates how to use the Phase 1 Core Engine modules.

## Basic Setup

```typescript
import {
  // Types
  Combatant,
  Skill,
  Stats,
  
  // Configuration
  defaultGameConfig,
  
  // Combat modules
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateHealAmount,
  calculateTurnOrder,
  calculateHitRate,
  calculateCriticalRate,
  checkPreemptiveStrike,
  
  // Character modules
  calculateFinalStats,
} from 'rpg-core';
```

## Example 1: Basic Physical Combat

```typescript
// Create a hero character
const hero: Combatant = {
  id: 'hero-1',
  name: 'Brave Hero',
  level: 10,
  stats: {
    maxHp: 150,
    maxMp: 60,
    attack: 50,
    defense: 30,
    magic: 35,
    magicDefense: 25,
    speed: 55,
    luck: 15,
    accuracy: 10,
    evasion: 8,
    criticalRate: 0.05,
  },
  currentHp: 150,
  currentMp: 60,
  statusEffects: [],
  position: 0,
};

// Create an enemy
const slime: Combatant = {
  id: 'slime-1',
  name: 'Slime',
  level: 5,
  stats: {
    maxHp: 80,
    maxMp: 0,
    attack: 25,
    defense: 15,
    magic: 10,
    magicDefense: 10,
    speed: 30,
    luck: 5,
    accuracy: 5,
    evasion: 10,
    criticalRate: 0,
  },
  currentHp: 80,
  currentMp: 0,
  statusEffects: [],
  position: 0,
};

// Define a basic attack skill
const basicAttack: Skill = {
  id: 'attack',
  name: 'Attack',
  type: 'physical',
  targetType: 'single-enemy',
  element: 'none',
  power: 1.0,
  mpCost: 0,
  accuracy: 0.95,
  criticalBonus: 0,
  isGuaranteedHit: false,
  description: 'A basic physical attack',
};

// Calculate damage
const damageResult = calculatePhysicalDamage(
  hero,
  slime,
  basicAttack,
  defaultGameConfig
);

console.log(`Attack ${damageResult.isHit ? 'hit' : 'missed'}!`);
if (damageResult.isHit) {
  console.log(`Dealt ${damageResult.finalDamage} damage${damageResult.isCritical ? ' (CRITICAL!)' : ''}`);
  console.log(`Base damage: ${damageResult.baseDamage}`);
  console.log(`Modifiers applied:`, damageResult.appliedModifiers);
}
```

## Example 2: Magic Combat

```typescript
// Create a mage character
const mage: Combatant = {
  id: 'mage-1',
  name: 'Wise Mage',
  level: 10,
  stats: {
    maxHp: 100,
    maxMp: 120,
    attack: 20,
    defense: 20,
    magic: 70,
    magicDefense: 40,
    speed: 45,
    luck: 12,
    accuracy: 15,
    evasion: 5,
    criticalRate: 0.08,
  },
  currentHp: 100,
  currentMp: 120,
  statusEffects: [],
  position: 1,
};

// Define a fire spell
const fireball: Skill = {
  id: 'fireball',
  name: 'Fireball',
  type: 'magic',
  targetType: 'single-enemy',
  element: 'fire',
  power: 1.5,
  mpCost: 15,
  accuracy: 1.0,
  criticalBonus: 0.05,
  isGuaranteedHit: false,
  description: 'A powerful fire spell',
};

// Calculate magic damage
const magicDamageResult = calculateMagicDamage(
  mage,
  slime,
  fireball,
  defaultGameConfig
);

console.log(`Fireball dealt ${magicDamageResult.finalDamage} damage!`);
```

## Example 3: Healing

```typescript
// Define a heal spell
const heal: Skill = {
  id: 'heal',
  name: 'Heal',
  type: 'heal',
  targetType: 'single-ally',
  element: 'none',
  power: 1.0,
  mpCost: 10,
  accuracy: 1.0,
  criticalBonus: 0,
  isGuaranteedHit: true,
  description: 'Restore HP to an ally',
};

// Calculate heal amount
const healAmount = calculateHealAmount(
  mage,
  hero,
  heal,
  defaultGameConfig
);

console.log(`Healed for ${healAmount} HP!`);
```

## Example 4: Turn Order Calculation

```typescript
// Create a party and enemies
const party = [hero, mage];
const enemies = [slime, 
  {
    ...slime,
    id: 'slime-2',
    name: 'Slime 2',
  }
];

// Combine all combatants
const allCombatants = [...party, ...enemies];

// Calculate turn order
const turnOrder = calculateTurnOrder(allCombatants, defaultGameConfig);

console.log('Turn order:');
turnOrder.forEach((combatant, index) => {
  console.log(`${index + 1}. ${combatant.name} (Speed: ${combatant.stats.speed})`);
});

// Check for preemptive strike
const hasPreemptiveStrike = checkPreemptiveStrike(
  party,
  enemies,
  defaultGameConfig
);

if (hasPreemptiveStrike) {
  console.log('Party gets a preemptive strike!');
}
```

## Example 5: Stat Calculation with Modifiers

```typescript
// Base stats
const baseStats: Stats = {
  maxHp: 100,
  maxMp: 50,
  attack: 40,
  defense: 25,
  magic: 30,
  magicDefense: 20,
  speed: 50,
  luck: 10,
  accuracy: 8,
  evasion: 5,
  criticalRate: 0.05,
};

// Equipment modifiers
const swordBonus: Partial<Stats> = {
  attack: 15,
  accuracy: 3,
};

const armorBonus: Partial<Stats> = {
  defense: 10,
  maxHp: 20,
};

// Job/class modifiers
const warriorBonus: Partial<Stats> = {
  attack: 5,
  defense: 5,
  maxHp: 30,
};

// Calculate final stats with all modifiers
const finalStats = calculateFinalStats(
  baseStats,
  [swordBonus, armorBonus, warriorBonus]
);

console.log('Final Stats:');
console.log(`HP: ${finalStats.maxHp} (base: ${baseStats.maxHp})`);
console.log(`Attack: ${finalStats.attack} (base: ${baseStats.attack})`);
console.log(`Defense: ${finalStats.defense} (base: ${baseStats.defense})`);
```

## Example 6: Combat Probabilities

```typescript
// Calculate hit rate
const hitRate = calculateHitRate(hero, slime, basicAttack);
console.log(`Hit chance: ${(hitRate * 100).toFixed(1)}%`);

// Calculate critical rate
const critRate = calculateCriticalRate(hero, basicAttack, defaultGameConfig);
console.log(`Critical chance: ${(critRate * 100).toFixed(1)}%`);
```

## Example 7: Custom Game Configuration

```typescript
import { GameConfig } from 'rpg-core';

// Create a custom configuration
const hardcoreConfig: GameConfig = {
  combat: {
    baseCriticalRate: 0.02,      // Lower crit rate (2% instead of 5%)
    criticalMultiplier: 3.0,     // Higher crit damage (3x instead of 2x)
    damageVariance: 0.15,        // More variance (±15%)
    escapeBaseRate: 0.3,         // Harder to escape (30% instead of 50%)
    escapeRateIncrement: 0.05,   // Slower escape rate increase
    preemptiveStrikeThreshold: 75, // Harder to get preemptive strike
    speedVariance: 0.15,         // More turn order variance
  },
  growth: {
    expCurve: 'exponential',
    baseExpRequired: 150,        // More exp needed
    expGrowthRate: 1.3,          // Steeper curve
    statGrowthRates: {
      maxHp: 8,                  // Slower HP growth
      maxMp: 4,
      attack: 2,
      defense: 2,
      magic: 2,
      magicDefense: 2,
      speed: 2,
      luck: 1,
    },
    maxLevel: 99,
  },
  balance: {
    maxPartySize: 3,             // Smaller party size
    dropRateModifier: 0.75,      // Lower drop rates
  },
};

// Use custom configuration
const hardcoreDamage = calculatePhysicalDamage(
  hero,
  slime,
  basicAttack,
  hardcoreConfig
);
```

## Running the Examples

To run these examples:

1. Install the package:
```bash
npm install rpg-core
```

2. Create a TypeScript file with the examples above

3. Run with ts-node:
```bash
npx ts-node examples.ts
```

## Example 8: カスタムステータスの使用

rpg-coreは、ゲームごとに自由にステータスを定義できます。

```typescript
import { 
  Combatant, 
  BaseStats, 
  calculateFinalStats,
  StatusEffect 
} from 'rpg-core';

// 独自のステータス型を定義
interface MyGameStats extends BaseStats {
  // 基本能力値
  strength: number;      // 力
  intelligence: number;  // 知力
  dexterity: number;     // 器用さ
  vitality: number;      // 体力
  
  // 戦闘用ステータス
  maxHp: number;
  maxMp: number;
  physicalAttack: number;
  magicalAttack: number;
  defense: number;
  speed: number;
}

// カスタムステータスを持つキャラクター
const customHero: Combatant<MyGameStats> = {
  id: 'custom-hero-1',
  name: 'カスタム勇者',
  level: 10,
  stats: {
    strength: 75,
    intelligence: 45,
    dexterity: 60,
    vitality: 80,
    maxHp: 180,    // vitality * 2 + level * 5
    maxMp: 90,     // intelligence * 2
    physicalAttack: 90,  // strength * 1.2
    magicalAttack: 54,   // intelligence * 1.2
    defense: 70,   // vitality * 0.8 + strength * 0.2
    speed: 65,     // dexterity * 1.0 + 5
  },
  currentHp: 180,
  currentMp: 90,
  statusEffects: [],
  position: 0,
};

// 装備によるステータス修飾子
const swordBonus: Partial<MyGameStats> = {
  strength: 15,
  physicalAttack: 20,
};

const armorBonus: Partial<MyGameStats> = {
  vitality: 10,
  defense: 15,
  maxHp: 25,
};

// 最終ステータスを計算
const finalStats = calculateFinalStats<MyGameStats>(
  customHero.stats,
  [swordBonus, armorBonus]
);

console.log('カスタムステータス:');
console.log(`力: ${finalStats.strength} (+15 from sword)`);
console.log(`体力: ${finalStats.vitality} (+10 from armor)`);
console.log(`物理攻撃: ${finalStats.physicalAttack} (+20 from sword)`);
console.log(`防御: ${finalStats.defense} (+15 from armor)`);
console.log(`最大HP: ${finalStats.maxHp} (+25 from armor)`);

// 別のゲーム用のステータス定義
interface StrategyGameStats extends BaseStats {
  hp: number;
  movement: number;
  shortRangeAttack: number;
  longRangeAttack: number;
  defense: number;
  magicDefense: number;
}

const knight: Combatant<StrategyGameStats> = {
  id: 'knight-1',
  name: 'ナイト',
  level: 5,
  stats: {
    hp: 45,
    movement: 5,
    shortRangeAttack: 12,
    longRangeAttack: 0,
    defense: 10,
    magicDefense: 3,
  },
  currentHp: 45,
  currentMp: 0,
  statusEffects: [],
  position: 0,
};

console.log('戦略ゲーム用ステータス:');
console.log(`HP: ${knight.stats.hp}`);
console.log(`移動力: ${knight.stats.movement}`);
console.log(`近接攻撃: ${knight.stats.shortRangeAttack}`);
console.log(`遠距離攻撃: ${knight.stats.longRangeAttack}`);
```

詳細な説明とベストプラクティスについては、[カスタムステータス設計ガイド](./CUSTOM_STATS_GUIDE.md)を参照してください。

## Example 9: カスタム状態異常の使用

rpg-coreは、状態異常の種類とカテゴリも自由に定義できます。

```typescript
import { 
  Combatant, 
  Skill,
  DefaultStats,
  BaseStatusEffectType,
  BaseStatusEffectCategory 
} from 'rpg-core';

// SF風の独自状態異常タイプを定義
type SciFiEffectType = 
  | 'emp-stunned'     // EMP麻痺
  | 'shield-boost'    // シールド強化
  | 'overheated'      // オーバーヒート
  | 'cloaked'         // ステルス
  | 'system-hacked';  // システムハッキング

type SciFiEffectCategory = 
  | 'malfunction'     // 機能障害
  | 'enhancement'     // 強化
  | 'tactical';       // 戦術的

// カスタム状態異常を持つキャラクター
const cyberWarrior: Combatant<
  DefaultStats,           // ステータスはデフォルト
  SciFiEffectType,        // 状態異常タイプはカスタム
  SciFiEffectCategory     // カテゴリもカスタム
> = {
  id: 'cyber-1',
  name: 'サイバー戦士',
  level: 15,
  stats: {
    maxHp: 120,
    maxMp: 80,
    attack: 55,
    defense: 45,
    magic: 60,
    magicDefense: 40,
    speed: 70,
    luck: 20,
    accuracy: 15,
    evasion: 12,
    criticalRate: 0.08,
  },
  currentHp: 120,
  currentMp: 80,
  statusEffects: [
    {
      id: 'effect-1',
      type: 'shield-boost',     // カスタムタイプ
      category: 'enhancement',  // カスタムカテゴリ
      name: 'シールド強化',
      description: '防御力が50%上昇',
      power: 50,
      duration: 3,
      maxDuration: 3,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: true,
      appliedAt: Date.now(),
    }
  ],
  position: 0,
};

// カスタム状態異常を付与するスキル
const empBlast: Skill<SciFiEffectType> = {
  id: 'skill-emp',
  name: 'EMP爆弾',
  type: 'special',
  targetType: 'single-enemy',
  element: 'lightning',
  power: 0.8,
  mpCost: 20,
  accuracy: 0.95,
  criticalBonus: 0,
  isGuaranteedHit: false,
  statusEffects: [
    {
      effectType: 'emp-stunned',  // カスタム状態異常
      probability: 0.8,
      duration: 2,
      power: 0,
    }
  ],
  description: 'EMP爆弾で敵の電子機器を無効化',
};

console.log('SF風カスタム状態異常:');
console.log(`キャラクター: ${cyberWarrior.name}`);
console.log(`状態異常: ${cyberWarrior.statusEffects[0].name}`);
console.log(`カテゴリ: ${cyberWarrior.statusEffects[0].category}`);
console.log(`スキル: ${empBlast.name} - ${empBlast.description}`);

// ホラーゲーム風の状態異常
type HorrorEffectType = 
  | 'sanity-drain'    // 正気度低下
  | 'possessed'       // 憑依
  | 'hallucination';  // 幻覚

type HorrorEffectCategory = 
  | 'psychological'   // 精神的
  | 'supernatural';   // 超常的

const investigator: Combatant<DefaultStats, HorrorEffectType, HorrorEffectCategory> = {
  id: 'investigator-1',
  name: '探偵',
  level: 8,
  stats: {
    maxHp: 80,
    maxMp: 60,
    attack: 30,
    defense: 25,
    magic: 40,
    magicDefense: 50,
    speed: 55,
    luck: 25,
    accuracy: 12,
    evasion: 10,
    criticalRate: 0.05,
  },
  currentHp: 80,
  currentMp: 60,
  statusEffects: [
    {
      id: 'effect-2',
      type: 'sanity-drain',
      category: 'psychological',
      name: '正気度低下',
      description: '精神的な恐怖により正気度が低下',
      power: 10,
      duration: 5,
      maxDuration: 10,
      stackCount: 2,
      maxStack: 5,
      canBeDispelled: false,
      appliedAt: Date.now(),
    }
  ],
  position: 0,
};

console.log('ホラー風カスタム状態異常:');
console.log(`キャラクター: ${investigator.name}`);
console.log(`状態異常: ${investigator.statusEffects[0].name}`);
console.log(`スタック数: ${investigator.statusEffects[0].stackCount}/${investigator.statusEffects[0].maxStack}`);
```

詳細な説明とベストプラクティスについては、[カスタマイズ可能な型システム設計ガイド](./CUSTOMIZATION_GUIDE.md)を参照してください。

## Example 10: すべてのカスタマイズ可能な型を使用（SF風戦略ゲーム）

```typescript
import { 
  Combatant, 
  Skill,
  GameConfig,
  BaseStats,
  BaseElement,
  BaseSkillType,
  BaseTargetType,
  BaseStatusEffectType,
  BaseStatusEffectCategory,
  BaseExpCurveType
} from 'rpg-core';

// SF風のカスタム属性
type SciFiElement = 
  | 'plasma'      // プラズマ
  | 'laser'       // レーザー
  | 'emp'         // EMP
  | 'kinetic'     // 運動エネルギー
  | 'thermal';    // 熱エネルギー

// 戦略ゲーム風のスキルタイプ
type TacticsSkillType = 
  | 'tech-weapon'  // テクノロジー武器
  | 'hack'         // ハッキング
  | 'support'      // 支援
  | 'tactical';    // 戦術

// 戦略ゲーム風の対象タイプ
type TacticsTargetType = 
  | 'single'       // 単体
  | 'range-2'      // 範囲2マス
  | 'range-3'      // 範囲3マス
  | 'line'         // 直線
  | 'all';         // 全体

// SF風の状態異常
type SciFiEffectType = 
  | 'emp-stunned'    // EMP麻痺
  | 'overheated'     // オーバーヒート
  | 'shield-boost'   // シールド強化
  | 'cloaked';       // ステルス

type SciFiEffectCategory = 
  | 'malfunction'    // 機能不全
  | 'enhancement'    // 強化
  | 'tactical';      // 戦術的

// カスタムステータス
interface MechStats extends BaseStats {
  hull: number;        // 装甲
  shield: number;      // シールド
  energy: number;      // エネルギー
  firepower: number;   // 火力
  mobility: number;    // 機動力
}

// カスタム経験値曲線
type MechExpCurve = 
  | 'pilot-training'   // パイロット訓練型
  | 'combat-veteran'   // 戦闘ベテラン型
  | 'ace-pilot';       // エースパイロット型

// すべてのカスタム型を使用したメック（戦闘機体）
const battleMech: Combatant<
  MechStats,
  SciFiEffectType,
  SciFiEffectCategory
> = {
  id: 'mech-001',
  name: 'タイタンアルファ',
  level: 15,
  stats: {
    hull: 120,
    shield: 80,
    energy: 100,
    firepower: 95,
    mobility: 70,
  },
  currentHp: 120,
  currentMp: 100,
  statusEffects: [
    {
      id: 'effect-shield',
      type: 'shield-boost',
      category: 'enhancement',
      name: 'シールド強化',
      description: 'エネルギーシールドが強化されている',
      power: 25,
      duration: 3,
      maxDuration: 3,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: true,
      appliedAt: Date.now(),
    }
  ],
  position: 0,
};

// カスタム型を使用したスキル
const empCannon: Skill<
  SciFiElement,
  TacticsSkillType,
  TacticsTargetType,
  SciFiEffectType
> = {
  id: 'skill-emp-cannon',
  name: 'EMP砲',
  type: 'tech-weapon',
  targetType: 'range-2',
  element: 'emp',
  power: 1.3,
  mpCost: 30,
  accuracy: 0.85,
  criticalBonus: 0.1,
  isGuaranteedHit: false,
  statusEffects: [
    {
      effectType: 'emp-stunned',
      probability: 0.6,
      duration: 2,
      power: 15,
    }
  ],
  description: 'EMP砲で範囲2マスの敵を攻撃し、機能不全を引き起こす',
};

// カスタム経験値曲線を使用したゲーム設定
const scifiGameConfig: GameConfig<MechExpCurve> = {
  combat: {
    baseCriticalRate: 0.08,
    criticalMultiplier: 2.5,
    damageVariance: 0.15,
    escapeBaseRate: 0.3,
    escapeRateIncrement: 0.1,
    preemptiveStrikeThreshold: 30,
    speedVariance: 0.2,
  },
  growth: {
    expCurve: 'combat-veteran',
    baseExpRequired: 150,
    expGrowthRate: 1.3,
    statGrowthRates: {
      maxHp: 8,
      maxMp: 5,
      attack: 3,
      defense: 2,
      magic: 1,
      magicDefense: 2,
      speed: 2,
      luck: 1,
    },
    maxLevel: 50,
  },
  balance: {
    maxPartySize: 4,
    dropRateModifier: 1.0,
  },
};

console.log('SF戦略ゲームのカスタマイズ例:');
console.log(`メック: ${battleMech.name} (Lv.${battleMech.level})`);
console.log(`ステータス:`);
console.log(`  装甲: ${battleMech.stats.hull}`);
console.log(`  シールド: ${battleMech.stats.shield}`);
console.log(`  火力: ${battleMech.stats.firepower}`);
console.log(`  機動力: ${battleMech.stats.mobility}`);
console.log(`スキル: ${empCannon.name}`);
console.log(`  タイプ: ${empCannon.type}`);
console.log(`  対象: ${empCannon.targetType}`);
console.log(`  属性: ${empCannon.element}`);
console.log(`経験値曲線: ${scifiGameConfig.growth.expCurve}`);
```

この例では、以下のすべてのカスタマイズ可能な型を使用しています：
- **Stats**: MechStats（装甲、シールド、エネルギーなど）
- **Element**: SciFiElement（プラズマ、レーザー、EMPなど）
- **SkillType**: TacticsSkillType（テクノロジー武器、ハッキングなど）
- **TargetType**: TacticsTargetType（範囲2マス、直線など）
- **StatusEffect**: SciFiEffectType/Category（EMP麻痺、シールド強化など）
- **ExpCurveType**: MechExpCurve（パイロット訓練型など）

これにより、標準的なJRPGとは全く異なるSF戦略ゲームの世界観を、型安全に実装できます。

詳細な説明とベストプラクティスについては、[カスタマイズ可能な型システム設計ガイド](./CUSTOMIZATION_GUIDE.md)を参照してください。

## Next Steps

Phase 1 provides the foundation for combat calculations. Future phases will add:
- Experience and leveling system
- Item and equipment management
- Status effects and buffs/debuffs
- Enemy AI decision making
- And more!
