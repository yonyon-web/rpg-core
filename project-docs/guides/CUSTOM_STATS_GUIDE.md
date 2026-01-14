# カスタムステータス設計ガイド

## 概要

GEasy-Kitライブラリは、ゲームごとに異なるステータス項目を自由に定義できる柔軟な設計を採用しています。

## 設計思想

### なぜカスタマイズ可能にしたか

- ゲームジャンルによって必要なステータスは大きく異なる
- 固定されたステータス項目では、多様なゲームデザインに対応できない
- 開発者が独自の世界観に合わせてステータスを定義できるべき

### 設計の特徴

1. **型安全性**: TypeScriptのジェネリクスを使用し、コンパイル時に型チェック
2. **後方互換性**: デフォルトステータス（`DefaultStats`）を提供し、既存コードとの互換性を維持
3. **拡張性**: `BaseStats`を継承することで、任意のステータスを追加可能
4. **柔軟性**: ライブラリの計算関数はカスタムステータスでも動作

## 基本的な使い方

### デフォルトステータスを使用

```typescript
import { Combatant, DefaultStats } from 'GEasy-Kit';

// デフォルトのステータスを使用（型を明示的に指定しない場合）
const hero: Combatant = {
  id: 'hero-1',
  name: '勇者',
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
};
```

### カスタムステータスを定義

```typescript
import { Combatant, BaseStats, calculateFinalStats } from 'GEasy-Kit';

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
  
  // 派生ステータス（計算で求められる）
  physicalAttack: number;
  magicalAttack: number;
  defense: number;
  speed: number;
}

// カスタムステータスを持つ戦闘者
const warrior: Combatant<MyGameStats> = {
  id: 'warrior-1',
  name: '戦士',
  level: 15,
  stats: {
    strength: 80,
    intelligence: 30,
    dexterity: 45,
    vitality: 70,
    maxHp: 150,
    maxMp: 30,
    physicalAttack: 95,  // strength * 1.2 等の計算結果
    magicalAttack: 35,
    defense: 60,
    speed: 50,
  },
  currentHp: 150,
  currentMp: 30,
  statusEffects: [],
  position: 0,
};

// ステータス修飾子の適用もカスタムステータスに対応
const equipmentBonus: Partial<MyGameStats> = {
  strength: 10,
  defense: 15,
  maxHp: 20,
};

const finalStats = calculateFinalStats<MyGameStats>(
  warrior.stats,
  [equipmentBonus]
);
```

## 実装例

### 例1: クラシックRPG風

```typescript
interface ClassicRPGStats extends BaseStats {
  // HP/MP
  maxHp: number;
  maxMp: number;
  
  // 基本能力
  strength: number;     // 腕力
  vitality: number;     // 体力
  intelligence: number; // 知力
  spirit: number;       // 精神
  agility: number;      // 素早さ
  luck: number;         // 運
}
```

### 例2: アクションRPG風

```typescript
interface ActionRPGStats extends BaseStats {
  // 基本
  health: number;
  stamina: number;
  
  // 攻撃
  meleeDamage: number;
  rangedDamage: number;
  criticalChance: number;
  criticalMultiplier: number;
  
  // 防御
  physicalResistance: number;
  magicalResistance: number;
  dodgeChance: number;
  
  // その他
  movementSpeed: number;
  carryCapacity: number;
}
```

### 例3: 戦略シミュレーション風

```typescript
interface StrategyGameStats extends BaseStats {
  // 基本
  hp: number;
  movement: number;
  
  // 攻撃
  shortRangeAttack: number;
  longRangeAttack: number;
  magicAttack: number;
  
  // 防御
  physicalDefense: number;
  magicDefense: number;
  
  // 地形適性
  plainBonus: number;
  forestBonus: number;
  mountainBonus: number;
}
```

## 型システムの詳細

### BaseStats

すべてのカスタムステータスの基底型。

```typescript
type BaseStats = Record<string, number>;
```

- すべてのステータス値は`number`型
- キーは任意の文字列を使用可能
- オブジェクトとして自由に拡張可能

### DefaultStats

ライブラリが提供する標準的なステータス定義。

```typescript
interface DefaultStats extends BaseStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  magicDefense: number;
  speed: number;
  luck: number;
  accuracy: number;
  evasion: number;
  criticalRate: number;
}
```

### Combatant<TStats>

ジェネリック型で、カスタムステータスをサポート。

```typescript
interface Combatant<TStats extends BaseStats = DefaultStats>
```

- デフォルトでは`DefaultStats`を使用
- 型パラメータで独自のステータス型を指定可能

## ライブラリ関数との統合

### ステータス計算関数

`calculateFinalStats`はジェネリック関数として実装されています。

```typescript
// カスタムステータスでも動作
interface MyStats extends BaseStats {
  power: number;
  defense: number;
}

const base: MyStats = { power: 50, defense: 30 };
const bonus: Partial<MyStats> = { power: 10 };

const final = calculateFinalStats<MyStats>(base, [bonus]);
// final.power === 60
// final.defense === 30
```

### ダメージ計算関数

ダメージ計算関数はデフォルトステータスの特定プロパティ（`attack`, `defense`等）を使用します。

カスタムステータスを使用する場合は、以下のアプローチが可能です：

#### アプローチ1: デフォルトステータスを含める

```typescript
interface MyStats extends DefaultStats {
  // デフォルトステータスを含む
  // 独自のステータスを追加
  customStat1: number;
  customStat2: number;
}
```

#### アプローチ2: ラッパー関数を作成

```typescript
interface MyStats extends BaseStats {
  strength: number;
  toughness: number;
}

// カスタムステータスをデフォルトステータスに変換
function convertToDefaultStats(custom: MyStats): DefaultStats {
  return {
    maxHp: 0, // 必要に応じて計算
    maxMp: 0,
    attack: custom.strength,
    defense: custom.toughness,
    // ... 他のマッピング
  };
}

// 独自のダメージ計算関数を実装
function calculateCustomDamage(
  attacker: Combatant<MyStats>,
  target: Combatant<MyStats>,
  skill: Skill
): DamageResult {
  // MyStatsを使った独自の計算ロジック
  const baseDamage = attacker.stats.strength * 2 - target.stats.toughness;
  // ...
}
```

## ベストプラクティス

### 1. ステータスの命名規則

- 英語の小文字で開始（camelCase）
- 意味が明確な名前を使用
- 略語は避ける（例: `str` より `strength`）

### 2. ステータスの整理

関連するステータスをグループ化してコメントを付ける。

```typescript
interface WellOrganizedStats extends BaseStats {
  // 基本能力値
  strength: number;
  intelligence: number;
  dexterity: number;
  
  // HP/MPシステム
  maxHp: number;
  hpRegen: number;
  maxMp: number;
  mpRegen: number;
  
  // 攻撃系
  physicalDamage: number;
  magicalDamage: number;
  criticalRate: number;
  
  // 防御系
  armor: number;
  resistance: number;
  evasion: number;
}
```

### 3. 型の再利用

複数のキャラクタータイプで共通のステータスを使用する。

```typescript
// 基本ステータスを定義
interface CoreStats extends BaseStats {
  hp: number;
  attack: number;
  defense: number;
}

// プレイヤー用に拡張
interface PlayerStats extends CoreStats {
  experience: number;
  gold: number;
}

// 敵用に拡張
interface EnemyStats extends CoreStats {
  expReward: number;
  goldReward: number;
}
```

## マイグレーションガイド

### 既存コードからの移行

既存のコードは、後方互換性により変更なしで動作します。

```typescript
// 変更前（引き続き動作）
import { Combatant, Stats } from 'GEasy-Kit';

const hero: Combatant = {
  stats: { /* DefaultStatsと同じ */ }
};

// 変更後（推奨）
import { Combatant, DefaultStats } from 'GEasy-Kit';

const hero: Combatant<DefaultStats> = {
  stats: { /* ... */ }
};
```

### 段階的な移行

1. まず`DefaultStats`を使用したままテスト
2. 新機能でカスタムステータスを試す
3. 必要に応じて既存コードをカスタムステータスに移行

## よくある質問（FAQ）

### Q: デフォルトステータスは必須ですか？

A: いいえ。完全にカスタムステータスのみを使用することも可能です。ただし、ライブラリの一部機能（ダメージ計算等）はデフォルトステータスのプロパティを期待するため、独自の計算ロジックを実装する必要があります。

### Q: ステータスに非数値型を含めることはできますか？

A: `BaseStats`は`Record<string, number>`として定義されているため、すべての値は`number`型である必要があります。文字列や配列などを含める場合は、別のプロパティとして定義してください。

### Q: 動的にステータスを追加できますか？

A: TypeScriptの型システムはコンパイル時に決定されるため、実行時に新しいステータスを型として追加することはできません。ただし、`Record<string, number>`として扱うことで、実行時の柔軟性を持たせることは可能です。

### Q: パフォーマンスへの影響はありますか？

A: ジェネリクスはコンパイル時に解決されるため、実行時のパフォーマンスへの影響はありません。

## まとめ

- GEasy-Kitのステータスシステムは完全にカスタマイズ可能
- `BaseStats`を継承して独自のステータス型を定義
- ジェネリクスにより型安全性を維持
- `DefaultStats`により後方互換性を確保
- ゲームの世界観に合わせて自由にステータスを設計可能
