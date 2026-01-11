# Core Engine 拡張性ガイド

ゲームによって変わりうる要素を拡張可能にするための設計ガイド

## 概要

このドキュメントでは、ゲーム固有の要件に対応するためにCore Engineで拡張可能にすべき要素を洗い出し、それぞれの拡張方法を示します。

---

## 拡張可能にすべき要素の分類

### 🎯 優先度：高（ゲーム毎に必ず変わる）

#### 1. ダメージ計算式

**変わりうる理由**: ゲームバランスの根幹。FF風、DQ風、独自式など多様

**拡張方法**: Strategy パターン

```typescript
/**
 * ダメージ計算式のインターフェース
 */
type DamageFormula = (
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
) => number;

/**
 * 拡張可能な計算式の例
 */
interface DamageCalculator {
  // 物理ダメージ計算式
  calculatePhysicalDamage: DamageFormula;
  
  // 魔法ダメージ計算式
  calculateMagicDamage: DamageFormula;
  
  // 回復量計算式
  calculateHealAmount: (
    caster: Combatant,
    target: Combatant,
    skill: Skill,
    config: GameConfig
  ) => number;
}

/**
 * 使用例：FF風の計算式
 */
const ffStyleCalculator: DamageCalculator = {
  calculatePhysicalDamage: (attacker, target, skill, config) => {
    const power = attacker.stats.attack;
    const defense = Math.max(1, target.stats.defense);
    return Math.floor((power * power) / defense * skill.power / 16);
  },
  // ...
};

/**
 * 使用例：DQ風の計算式
 */
const dqStyleCalculator: DamageCalculator = {
  calculatePhysicalDamage: (attacker, target, skill, config) => {
    const attack = attacker.stats.attack * skill.power;
    const defense = target.stats.defense / 2;
    return Math.max(1, Math.floor(attack - defense));
  },
  // ...
};
```

**推奨実装**: 
- デフォルトの計算式を提供
- カスタム計算式を注入可能に
- 計算式のプリセット集を用意（FF風、DQ風、ポケモン風など）

---

#### 2. 経験値曲線

**変わりうる理由**: ゲームの進行速度とバランスに直結

**拡張方法**: 曲線タイプと計算式の選択

```typescript
/**
 * 経験値曲線のタイプ
 */
type ExpCurveType = 
  | 'linear'           // 線形: level × base
  | 'exponential'      // 指数: base × level ^ rate
  | 'fast'             // 速い成長（ポケモン等）
  | 'medium-fast'      // やや速い
  | 'medium-slow'      // やや遅い
  | 'slow'             // 遅い成長
  | 'erratic'          // 不規則（ポケモン等）
  | 'fluctuating'      // 変動型
  | 'custom';          // カスタム式

/**
 * 経験値曲線計算インターフェース
 */
type ExpCurveFormula = (level: number, config: GameConfig) => number;

/**
 * 曲線プリセット
 */
const EXP_CURVE_PRESETS: Record<ExpCurveType, ExpCurveFormula> = {
  'linear': (level, config) => config.growth.baseExpRequired * level,
  
  'exponential': (level, config) => {
    const base = config.growth.baseExpRequired;
    const rate = config.growth.expGrowthRate;
    return Math.floor(base * Math.pow(level, rate));
  },
  
  'fast': (level, _config) => Math.floor(0.8 * Math.pow(level, 3)),
  
  'medium-fast': (level, _config) => Math.floor(Math.pow(level, 3)),
  
  'medium-slow': (level, _config) => {
    return Math.floor(1.2 * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140);
  },
  
  'slow': (level, _config) => Math.floor(1.25 * Math.pow(level, 3)),
  
  'erratic': (level, _config) => {
    // ポケモン風の不規則な曲線
    if (level <= 50) return Math.floor(Math.pow(level, 3) * (100 - level) / 50);
    if (level <= 68) return Math.floor(Math.pow(level, 3) * (150 - level) / 100);
    if (level <= 98) return Math.floor(Math.pow(level, 3) * ((1911 - 10 * level) / 3) / 500);
    return Math.floor(Math.pow(level, 3) * (160 - level) / 100);
  },
  
  'fluctuating': (level, _config) => {
    // 変動型の曲線
    if (level <= 15) return Math.floor(Math.pow(level, 3) * ((level + 1) / 3 + 24) / 50);
    if (level <= 36) return Math.floor(Math.pow(level, 3) * (level + 14) / 50);
    return Math.floor(Math.pow(level, 3) * (level / 2 + 32) / 50);
  },
  
  'custom': (level, config) => {
    // カスタム式へのフォールバック
    return config.growth.baseExpRequired * level;
  }
};
```

**推奨実装**:
- 複数のプリセット曲線を用意
- カスタム曲線関数を注入可能に
- 曲線のビジュアル化ツールを提供

---

#### 3. ステータス成長率

**変わりうる理由**: キャラクター特性とジョブシステムの多様性

**拡張方法**: ジョブ毎の成長率テーブル + ランダム要素

```typescript
/**
 * ステータス成長パターン
 */
interface StatGrowthPattern {
  // 固定値成長
  fixed?: Partial<Stats>;
  
  // 成長率（0.0〜1.0）
  rates?: Partial<Record<keyof Stats, number>>;
  
  // 成長範囲（最小〜最大）
  ranges?: Partial<Record<keyof Stats, { min: number; max: number }>>;
  
  // 成長タイプ
  type: 'fixed' | 'random' | 'curved';
}

/**
 * ジョブ毎の成長パターン
 */
const jobGrowthPatterns: Record<string, StatGrowthPattern> = {
  'warrior': {
    type: 'random',
    ranges: {
      hp: { min: 8, max: 12 },
      mp: { min: 0, max: 2 },
      attack: { min: 3, max: 5 },
      defense: { min: 2, max: 4 },
      magic: { min: 0, max: 1 },
      speed: { min: 1, max: 2 }
    }
  },
  'mage': {
    type: 'random',
    ranges: {
      hp: { min: 3, max: 5 },
      mp: { min: 5, max: 8 },
      attack: { min: 0, max: 1 },
      defense: { min: 1, max: 2 },
      magic: { min: 4, max: 6 },
      speed: { min: 2, max: 3 }
    }
  },
  // カスタムジョブを追加可能
};
```

**推奨実装**:
- ジョブ毎の成長パターンを外部データとして定義
- ランダム、固定、曲線型の成長方式を選択可能に
- キャラクター固有の成長補正を追加可能に

---

#### 4. 属性システム

**変わりうる理由**: ゲーム世界観によって属性の種類と相性が異なる

**拡張方法**: 属性定義と相性テーブルの外部化

```typescript
/**
 * 拡張可能な属性システム
 */
interface ElementSystem {
  // 属性リスト
  elements: Element[];
  
  // 相性テーブル [攻撃属性][防御属性] = 倍率
  effectivenessTable: Map<Element, Map<Element, number>>;
  
  // デフォルト倍率
  defaultMultiplier: number;
}

/**
 * 使用例1: シンプルな4属性システム
 */
const simpleElementSystem: ElementSystem = {
  elements: ['fire', 'water', 'earth', 'wind'],
  effectivenessTable: new Map([
    ['fire', new Map([
      ['fire', 0.5],    // 炎→炎: 半減
      ['water', 0.5],   // 炎→水: 半減
      ['earth', 2.0],   // 炎→土: 効果大
      ['wind', 1.0]     // 炎→風: 通常
    ])],
    // ...
  ]),
  defaultMultiplier: 1.0
};

/**
 * 使用例2: ポケモン風の複雑な属性システム
 */
const pokemonStyleElementSystem: ElementSystem = {
  elements: [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic',
    'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ],
  effectivenessTable: new Map([
    // 複雑な相性テーブル
    ['fire', new Map([
      ['grass', 2.0],
      ['ice', 2.0],
      ['bug', 2.0],
      ['steel', 2.0],
      ['fire', 0.5],
      ['water', 0.5],
      ['rock', 0.5],
      ['dragon', 0.5]
    ])],
    // ...
  ]),
  defaultMultiplier: 1.0
};
```

**推奨実装**:
- 属性の種類を設定ファイルで定義
- 相性テーブルをJSON/YAMLで外部化
- 複数段階の相性（無効、半減、通常、効果大、超効果大など）に対応

---

### 🔧 優先度：中（ゲームタイプで変わる）

#### 5. 状態異常の種類と効果

**変わりうる理由**: ゲームシステムによって状態異常の種類が異なる

**拡張方法**: 状態異常定義の外部化

```typescript
/**
 * 状態異常定義
 */
interface StatusEffectDefinition {
  id: UniqueId;
  type: string;                     // カスタム状態異常タイプ
  category: StatusEffectCategory;
  name: string;
  description: string;
  
  // 効果定義
  effects: {
    // ダメージ/回復効果
    damagePerTurn?: number | ((target: Combatant) => number);
    healPerTurn?: number | ((target: Combatant) => number);
    
    // ステータス変動
    statModifiers?: Partial<Stats>;
    
    // 行動制限
    restrictions?: {
      canAct?: boolean;
      canMove?: boolean;
      canUseSkills?: boolean;
      canUseItems?: boolean;
    };
    
    // カスタム効果
    customEffect?: (target: Combatant, context: BattleContext) => void;
  };
  
  // デフォルト持続時間
  defaultDuration: number;
  
  // スタック可否
  stackable: boolean;
  maxStack: number;
  
  // 解除条件
  removalConditions?: {
    onBattleEnd?: boolean;
    onTurnEnd?: boolean;
    onHit?: boolean;
    probability?: number;
  };
}

/**
 * 状態異常ライブラリ
 */
const statusEffectLibrary: Record<string, StatusEffectDefinition> = {
  'poison': {
    id: 'poison',
    type: 'poison',
    category: 'dot',
    name: '毒',
    description: '毎ターン最大HPの5%のダメージ',
    effects: {
      damagePerTurn: (target) => Math.floor(target.stats.maxHp * 0.05)
    },
    defaultDuration: 3,
    stackable: false,
    maxStack: 1,
    removalConditions: {
      onBattleEnd: true
    }
  },
  // カスタム状態異常を追加可能
  'custom-frozen': {
    id: 'custom-frozen',
    type: 'frozen',
    category: 'disable',
    name: '凍結',
    description: '行動不能、物理攻撃を受けると解除',
    effects: {
      restrictions: {
        canAct: false,
        canMove: false
      }
    },
    defaultDuration: 2,
    stackable: false,
    maxStack: 1,
    removalConditions: {
      onHit: true,
      probability: 1.0
    }
  }
};
```

**推奨実装**:
- 状態異常定義をプラグイン形式で追加可能に
- カスタム効果関数をサポート
- プリセット状態異常ライブラリを提供

---

#### 6. ドロップ率計算

**変わりうる理由**: ゲームバランスとリワードシステムの方針

**拡張方法**: ドロップ率計算式のカスタマイズ

```typescript
/**
 * ドロップ率計算式
 */
type DropRateFormula = (
  baseRate: Probability,
  enemy: Enemy,
  dropItem: DropItem,
  config: GameConfig
) => Probability;

/**
 * ドロップ率計算のバリエーション
 */
const dropRateCalculators = {
  // シンプル: 基本レートのみ
  'simple': (baseRate) => baseRate,
  
  // 運補正あり
  'with-luck': (baseRate, enemy, dropItem, config) => {
    const luckBonus = config.combat.partyAverageLuck * 0.001;
    return Math.min(1.0, baseRate + luckBonus);
  },
  
  // レベル差補正
  'level-scaled': (baseRate, enemy, dropItem, config) => {
    const levelDiff = config.combat.partyAverageLevel - enemy.level;
    const modifier = 1 + (levelDiff * 0.02); // レベル差1毎に+2%
    return Math.min(1.0, baseRate * modifier);
  },
  
  // 複合型
  'complex': (baseRate, enemy, dropItem, config) => {
    let finalRate = baseRate;
    
    // グローバル補正
    finalRate *= config.balance.dropRateModifier;
    
    // 運補正
    const luckBonus = config.combat.partyAverageLuck * 0.001;
    finalRate += luckBonus;
    
    // レアアイテムは確率低下
    if (dropItem.isRare) {
      finalRate *= 0.5;
    }
    
    // 連続戦闘ボーナス
    if (config.combat.consecutiveBattles > 10) {
      finalRate *= 1.2;
    }
    
    return Math.min(1.0, finalRate);
  }
};
```

**推奨実装**:
- 複数のドロップ率計算方式を提供
- グローバル補正、運補正、レベル差補正などを組み合わせ可能に
- イベント期間中のドロップ率倍増などに対応

---

#### 7. AI行動パターン

**変わりうる理由**: 敵の個性とゲームの難易度設計

**拡張方法**: AIストラテジーパターン

```typescript
/**
 * AI戦略の基本インターフェース
 */
interface AIStrategy {
  id: UniqueId;
  name: string;
  
  // スキル選択ロジック
  selectSkill(
    enemy: Enemy,
    situation: BattleSituation,
    availableSkills: Skill[]
  ): Skill;
  
  // ターゲット選択ロジック
  selectTarget(
    enemy: Enemy,
    situation: BattleSituation,
    possibleTargets: Combatant[]
  ): Combatant;
}

/**
 * プリセットAI戦略
 */
const aiStrategyPresets: Record<string, AIStrategy> = {
  // ランダムAI
  'random': {
    id: 'random',
    name: 'ランダム',
    selectSkill: (enemy, situation, skills) => {
      return skills[Math.floor(Math.random() * skills.length)];
    },
    selectTarget: (enemy, situation, targets) => {
      return targets[Math.floor(Math.random() * targets.length)];
    }
  },
  
  // HP最小優先AI
  'target-lowest-hp': {
    id: 'target-lowest-hp',
    name: 'HP最小優先',
    selectSkill: (enemy, situation, skills) => {
      // 状況に応じたスキル選択
      if (situation.averageAllyHpRate < 0.3) {
        // 味方が危険なら回復優先
        return skills.find(s => s.type === 'heal') || skills[0];
      }
      // 攻撃スキルを優先
      return skills.find(s => s.type === 'physical' || s.type === 'magic') || skills[0];
    },
    selectTarget: (enemy, situation, targets) => {
      // HP最小の対象を選択
      return targets.reduce((min, target) => 
        target.currentHp < min.currentHp ? target : min
      );
    }
  },
  
  // 戦術的AI
  'tactical': {
    id: 'tactical',
    name: '戦術的',
    selectSkill: (enemy, situation, skills) => {
      // 複雑な判断ロジック
      const hpRate = enemy.currentHp / enemy.stats.maxHp;
      
      // HP低下時は回復や防御スキルを優先
      if (hpRate < 0.3) {
        const healSkill = skills.find(s => s.type === 'heal');
        if (healSkill) return healSkill;
      }
      
      // MP豊富なら強力なスキルを使用
      const mpRate = enemy.currentMp / enemy.stats.maxMp;
      if (mpRate > 0.5) {
        const powerfulSkills = skills.filter(s => s.mpCost > 20);
        if (powerfulSkills.length > 0) {
          return powerfulSkills[0];
        }
      }
      
      // 通常は基本攻撃
      return skills.find(s => s.mpCost === 0) || skills[0];
    },
    selectTarget: (enemy, situation, targets) => {
      // 脅威度の高い対象を優先
      return targets.reduce((max, target) => {
        const threat = target.stats.attack + target.stats.magic;
        const currentThreat = max.stats.attack + max.stats.magic;
        return threat > currentThreat ? target : max;
      });
    }
  }
};
```

**推奨実装**:
- プリセットAI戦略を複数用意
- カスタムAI戦略を作成可能に
- 行動パターンをスクリプトで記述できるようにDSLを提供

---

#### 8. クリティカルヒットの判定

**変わりうる理由**: ゲームバランスと戦略性

**拡張方法**: クリティカル計算式のカスタマイズ

```typescript
/**
 * クリティカル計算インターフェース
 */
interface CriticalCalculator {
  // クリティカル率の計算
  calculateRate(
    attacker: Combatant,
    target: Combatant,
    skill: Skill,
    config: GameConfig
  ): Probability;
  
  // クリティカル倍率の計算
  calculateMultiplier(
    attacker: Combatant,
    target: Combatant,
    skill: Skill,
    config: GameConfig
  ): number;
}

/**
 * クリティカル計算のバリエーション
 */
const criticalCalculators = {
  // シンプル: 固定率・固定倍率
  'simple': {
    calculateRate: (attacker, target, skill, config) => {
      return config.combat.baseCriticalRate;
    },
    calculateMultiplier: (attacker, target, skill, config) => {
      return config.combat.criticalMultiplier;
    }
  },
  
  // 運依存型
  'luck-based': {
    calculateRate: (attacker, target, skill, config) => {
      const baseRate = config.combat.baseCriticalRate;
      const luckBonus = attacker.stats.luck * 0.001;
      const skillBonus = skill.criticalBonus || 0;
      return Math.min(1.0, baseRate + luckBonus + skillBonus);
    },
    calculateMultiplier: (attacker, target, skill, config) => {
      // 運が高いほど倍率も上がる
      const baseMul = config.combat.criticalMultiplier;
      const luckBonus = attacker.stats.luck * 0.01;
      return baseMul + luckBonus;
    }
  },
  
  // ポケモン風: 急所システム
  'pokemon-style': {
    calculateRate: (attacker, target, skill, config) => {
      // 急所ランク（0〜3）
      let criticalStage = 0;
      criticalStage += skill.criticalBonus || 0;
      
      // 急所ランクに応じた確率
      const rates = [1/24, 1/8, 1/2, 1];
      return rates[Math.min(criticalStage, 3)];
    },
    calculateMultiplier: (attacker, target, skill, config) => {
      // ポケモンは固定1.5倍（世代により異なる）
      return 1.5;
    }
  }
};
```

**推奨実装**:
- 複数のクリティカル計算方式を提供
- 運、レベル、スキルによる補正をカスタマイズ可能に
- 倍率を固定値または変動値として設定可能に

---

### 💡 優先度：低（拡張性があると便利）

#### 9. 装備スロット構成

**変わりうる理由**: ゲームによって装備システムが大きく異なる

**拡張方法**: 装備スロットの種類を設定可能に

```typescript
/**
 * 装備スロットのタイプ定義
 * ゲームごとに自由に定義可能
 */
type EquipmentType = string; // 'weapon' | 'armor' | 'accessory' | 'shield' | 'helmet' | ...

/**
 * 装備スロット構成の定義
 */
interface EquipmentSlotConfig {
  // スロットの種類一覧
  slots: EquipmentType[];
  
  // スロットごとの表示名（多言語対応）
  slotNames?: Record<EquipmentType, string>;
  
  // スロットごとの制約（オプション）
  slotConstraints?: {
    [key in EquipmentType]?: {
      maxCount?: number;        // 同時装備可能数（例：アクセサリー×2）
      requiredJob?: string[];   // 装備可能な職業
      mutuallyExclusive?: EquipmentType[]; // 排他的なスロット
    };
  };
}

/**
 * 一般的な装備構成の例
 */
const equipmentConfigPresets = {
  // シンプルなRPG（DQ風）
  'simple': {
    slots: ['weapon', 'armor', 'shield', 'accessory']
  },
  
  // 多スロットRPG（FF風）
  'advanced': {
    slots: ['weapon', 'offhand', 'head', 'body', 'arms', 'accessory1', 'accessory2']
  },
  
  // アクションRPG風
  'action-rpg': {
    slots: ['mainWeapon', 'subWeapon', 'armor', 'charm']
  },
  
  // 最小構成
  'minimal': {
    slots: ['weapon', 'armor', 'accessory']
  },
  
  // 職業別装備
  'job-based': {
    slots: ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'accessory1', 'accessory2'],
    slotConstraints: {
      weapon: {
        requiredJob: ['warrior', 'knight', 'thief']
      },
      helmet: {
        requiredJob: ['warrior', 'knight']
      }
    }
  }
};

/**
 * キャラクターの装備データ構造
 * スロット構成に応じて動的に扱う
 */
interface CharacterEquipment {
  [slotType: string]: Equipment | null;
}

/**
 * 使用例：カスタム装備構成
 */
const customEquipmentConfig: EquipmentSlotConfig = {
  slots: ['rightHand', 'leftHand', 'head', 'body', 'feet', 'ring1', 'ring2', 'necklace'],
  slotNames: {
    rightHand: '右手',
    leftHand: '左手',
    head: '頭',
    body: '身体',
    feet: '足',
    ring1: '指輪1',
    ring2: '指輪2',
    necklace: '首飾り'
  },
  slotConstraints: {
    ring1: { maxCount: 1 },
    ring2: { maxCount: 1 },
    rightHand: {
      mutuallyExclusive: ['leftHand'] // 両手武器の場合
    }
  }
};
```

**推奨実装**:
- 装備スロットの種類をゲーム設定として定義可能に
- プリセット構成を提供（シンプル、標準、複雑など）
- スロットごとの制約条件をサポート
- UIコントローラーは設定されたスロット構成を使用
- **Core Engineでデフォルト構成を定義し、全体で共有**

**デフォルト装備スロット構成**:
```typescript
/**
 * Core Engineが提供するデフォルト装備スロット構成
 * ゲーム設定で上書きされない場合に使用される
 */
const DEFAULT_EQUIPMENT_SLOTS: EquipmentType[] = ['weapon', 'armor', 'accessory'];

/**
 * Core Engineの設定
 */
interface CoreEngineConfig {
  // ... 他の設定
  
  // 装備スロット構成（未設定の場合はDEFAULT_EQUIPMENT_SLOTSを使用）
  equipmentSlots?: EquipmentType[];
}

/**
 * Core Engineクラス
 */
class CoreEngine {
  private config: CoreEngineConfig;
  
  constructor(config: CoreEngineConfig) {
    this.config = {
      ...config,
      // デフォルト値を適用
      equipmentSlots: config.equipmentSlots || DEFAULT_EQUIPMENT_SLOTS
    };
  }
  
  // 装備スロット構成を取得
  getEquipmentSlots(): EquipmentType[] {
    return this.config.equipmentSlots!;
  }
}
```

**EquipmentControllerでの使用例**:
```typescript
// Core Engineから装備スロット構成を取得（推奨）
const equipmentSlots = coreEngine.getEquipmentSlots();
const controller = new EquipmentController(service, equipmentSlots);

// または、旧方式（直接指定、非推奨）
// const gameConfig = {
//   equipmentSlots: ['weapon', 'shield', 'helmet', 'armor', 'boots', 'accessory1', 'accessory2']
// };
// const controller = new EquipmentController(service, gameConfig.equipmentSlots);
```

---

#### 10. ステータス計算式

**変わりうる理由**: 装備やバフの計算方法がゲームにより異なる

**拡張方法**: ステータス合成ルールのカスタマイズ

```typescript
/**
 * ステータス合成方法
 */
type StatAggregationType = 
  | 'additive'      // 加算: base + equip + buff
  | 'multiplicative' // 乗算: base × (1 + equip) × (1 + buff)
  | 'hybrid';       // ハイブリッド

interface StatCalculationRules {
  // ステータス毎の合成方法
  aggregation: Record<keyof Stats, StatAggregationType>;
  
  // 装備補正の適用方法
  equipmentApplication: 'flat' | 'percentage' | 'both';
  
  // バフ/デバフのスタック方法
  buffStacking: 'additive' | 'multiplicative' | 'diminishing';
}
```

**推奨実装**:
- ステータス計算ルールを設定可能に
- 加算、乗算、ハイブリッドの方式を選択可能に

---

#### 11. ターン順の決定方法

**変わりうる理由**: ゲームシステムの多様性（ATB、CTBなど）

**拡張方法**: ターンシステムのプラグイン化

```typescript
/**
 * ターンシステムのインターフェース
 */
interface TurnSystem {
  id: string;
  name: string;
  
  // 初期化
  initialize(participants: Combatant[]): void;
  
  // 次の行動者を取得
  getNextActor(): Combatant | null;
  
  // 行動完了時の処理
  onActionComplete(actor: Combatant): void;
  
  // ターン経過
  advanceTurn(): void;
}

/**
 * ターンシステムのプリセット
 */
const turnSystemPresets = {
  // 速度順ターン制
  'speed-based': {
    // 実装...
  },
  
  // ATB (Active Time Battle)
  'atb': {
    // 時間経過でゲージが溜まる
  },
  
  // CTB (Count Time Battle)
  'ctb': {
    // カウント値に基づく行動順
  }
};
```

**推奨実装**:
- 複数のターンシステムを提供
- カスタムターンシステムを実装可能に

---

## 拡張方法の実装パターン

### パターン1: Strategy パターン

```typescript
/**
 * 計算ロジックをインターフェースで抽象化
 */
interface CalculationStrategy<TInput, TOutput> {
  calculate(input: TInput): TOutput;
}

// Core Engineで使用
class CoreEngine {
  constructor(
    private damageStrategy: CalculationStrategy<DamageInput, number>,
    private expStrategy: CalculationStrategy<ExpInput, number>
  ) {}
}
```

### パターン2: Plugin パターン

```typescript
/**
 * プラグインを動的に追加
 */
interface Plugin {
  id: string;
  install(engine: CoreEngine): void;
  uninstall(engine: CoreEngine): void;
}

class CoreEngine {
  private plugins: Map<string, Plugin> = new Map();
  
  use(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
    plugin.install(this);
  }
}
```

### パターン3: Configuration パターン

```typescript
/**
 * 設定オブジェクトで動作を制御
 */
interface ExtensibleConfig {
  // 計算式
  formulas: {
    damage?: DamageFormula;
    exp?: ExpCurveFormula;
    // ...
  };
  
  // パラメータ
  parameters: GameConfig;
  
  // 定義データ
  definitions: {
    statusEffects?: StatusEffectDefinition[];
    aiStrategies?: AIStrategy[];
    equipmentSlots?: EquipmentType[]; // 装備スロット構成
    // ...
  };
}

const engine = new CoreEngine(extensibleConfig);
```

---

## 推奨される拡張ポイントの優先順位

### フェーズ1: 必須の拡張ポイント

1. **ダメージ計算式** - ゲームバランスの根幹
2. **経験値曲線** - 成長速度の調整
3. **ステータス成長率** - キャラクター育成の多様性
4. **属性システム** - 戦略性の提供

### フェーズ2: 推奨される拡張ポイント

5. **状態異常システム** - ゲームメカニクスの深さ
6. **ドロップ率計算** - リワードバランス
7. **AI行動パターン** - 敵の個性
8. **クリティカル計算** - 戦闘の爽快感

### フェーズ3: あると便利な拡張ポイント

9. **装備スロット構成** - ゲームごとの装備システムの違い
10. **ステータス計算式** - 細かいバランス調整
11. **ターンシステム** - ゲームシステムの根本変更

---

## 実装例：拡張可能なCore Engine

```typescript
/**
 * 完全にカスタマイズ可能なCore Engine
 */
class ExtensibleCoreEngine {
  constructor(
    private config: ExtensibleConfig
  ) {
    // デフォルト値の設定
    this.applyDefaults();
  }
  
  // ダメージ計算（カスタマイズ可能）
  calculateDamage(
    attacker: Combatant,
    target: Combatant,
    skill: Skill
  ): DamageResult {
    const formula = this.config.formulas.damage || defaultDamageFormula;
    const baseDamage = formula(attacker, target, skill, this.config.parameters);
    
    // クリティカル判定（カスタマイズ可能）
    const criticalCalc = this.config.formulas.critical || defaultCriticalCalculator;
    const isCritical = Math.random() < criticalCalc.calculateRate(attacker, target, skill, this.config.parameters);
    const criticalMul = isCritical ? criticalCalc.calculateMultiplier(attacker, target, skill, this.config.parameters) : 1.0;
    
    // 属性相性（カスタマイズ可能）
    const elementSystem = this.config.definitions.elementSystem || defaultElementSystem;
    const elementMul = elementSystem.effectivenessTable.get(skill.element)?.get(target.element) ?? 1.0;
    
    const finalDamage = Math.floor(baseDamage * criticalMul * elementMul);
    
    return {
      finalDamage,
      baseDamage,
      isCritical,
      elementalModifier: elementMul,
      // ...
    };
  }
  
  // プラグインの追加
  use(plugin: Plugin): void {
    plugin.install(this);
  }
  
  // 設定の更新
  updateConfig(partial: Partial<ExtensibleConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}

// 使用例
const myGameEngine = new ExtensibleCoreEngine({
  formulas: {
    damage: myCustomDamageFormula,
    exp: pokemonStyleExpCurve,
    critical: luckBasedCriticalCalculator
  },
  parameters: {
    combat: {
      baseCriticalRate: 0.05,
      criticalMultiplier: 1.5,
      // ...
    },
    // ...
  },
  definitions: {
    statusEffects: myCustomStatusEffects,
    aiStrategies: myGameAIStrategies,
    elementSystem: myElementSystem
  }
});

// プラグインの追加
myGameEngine.use(new WeatherSystemPlugin());
myGameEngine.use(new ComboSystemPlugin());
```

---

## まとめ

### 拡張性設計の原則

1. **優先度に基づく実装**: 必須の拡張ポイントから順に実装
2. **デフォルト値の提供**: すぐに使えるデフォルト実装を用意
3. **プリセットの提供**: 有名ゲームスタイルのプリセットを用意
4. **段階的な拡張**: 簡単な設定変更から高度なカスタマイズまで対応
5. **型安全性の維持**: TypeScriptの型システムで安全性を確保

### 実装のベストプラクティス

- **Strategy パターン**: 計算ロジックの差し替え
- **Plugin パターン**: 機能の動的追加
- **Configuration パターン**: パラメータの外部化
- **Factory パターン**: プリセットの提供
- **Dependency Injection**: テスタビリティの向上

この設計により、開発者は自分のゲームに最適な設定を選択でき、独自のゲームメカニクスも容易に実装できます。
