# カスタマイズ可能な型システム設計ガイド

## 概要

rpg-coreライブラリは、ゲームごとに異なる要素を自由に定義できる柔軟な設計を採用しています。

## カスタマイズ可能な要素

### 1. ステータス（Stats）

ゲームごとに異なるステータス項目を定義可能。

#### 基本的な使い方

```typescript
import { Combatant, BaseStats, DefaultStats } from 'rpg-core';

// カスタムステータス定義
interface MyStats extends BaseStats {
  strength: number;
  intelligence: number;
  dexterity: number;
  maxHp: number;
}

const hero: Combatant<MyStats> = {
  id: 'hero-1',
  name: '勇者',
  level: 10,
  stats: {
    strength: 80,
    intelligence: 45,
    dexterity: 60,
    maxHp: 150,
  },
  // ...
};
```

詳細は[カスタムステータス設計ガイド](./CUSTOM_STATS_GUIDE.md)を参照。

### 2. 状態異常（Status Effects）

#### なぜカスタマイズ可能にしたか

- ゲームジャンルによって必要な状態異常は大きく異なる
- ファンタジーRPGでは「毒」「麻痺」、SFゲームでは「感電」「放射能汚染」など
- 開発者が独自の世界観に合わせて状態異常を定義できるべき

#### デフォルト状態異常を使用

```typescript
import { Combatant, StatusEffect } from 'rpg-core';

const hero: Combatant = {
  id: 'hero-1',
  name: '勇者',
  level: 10,
  // ...
  statusEffects: [
    {
      id: 'effect-1',
      type: 'poison',        // デフォルトタイプ
      category: 'dot',       // デフォルトカテゴリ
      name: '毒',
      description: 'ターン毎にHPが減少',
      power: 5,
      duration: 3,
      maxDuration: 3,
      stackCount: 1,
      maxStack: 3,
      canBeDispelled: true,
      appliedAt: Date.now(),
    }
  ],
};
```

#### カスタム状態異常を使用

```typescript
import { 
  Combatant, 
  StatusEffect,
  BaseStatusEffectType,
  BaseStatusEffectCategory 
} from 'rpg-core';

// カスタム状態異常タイプを定義
type MyEffectType = 
  | 'freeze'          // 凍結
  | 'shock'           // 感電
  | 'bleeding'        // 出血
  | 'radiation'       // 放射能汚染
  | 'nanite-boost';   // ナナイト強化

// カスタムカテゴリを定義
type MyEffectCategory = 
  | 'elemental'       // 属性系
  | 'physical'        // 物理系
  | 'technology';     // テクノロジー系

// カスタム状態異常を使用
const scifiHero: Combatant<
  DefaultStats,              // ステータスはデフォルト
  MyEffectType,              // 状態異常タイプはカスタム
  MyEffectCategory           // カテゴリもカスタム
> = {
  id: 'hero-1',
  name: 'サイバー戦士',
  level: 10,
  stats: { /* DefaultStats */ },
  currentHp: 100,
  currentMp: 50,
  statusEffects: [
    {
      id: 'effect-1',
      type: 'shock',            // カスタムタイプ
      category: 'elemental',    // カスタムカテゴリ
      name: '感電',
      description: '電流によるダメージ',
      power: 10,
      duration: 2,
      maxDuration: 2,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: false,
      appliedAt: Date.now(),
    }
  ],
  position: 0,
};
```

#### スキルとの連携

```typescript
import { Skill } from 'rpg-core';

// カスタム状態異常を付与するスキル
const shockBlast: Skill<MyEffectType> = {
  id: 'skill-shock',
  name: '感電弾',
  type: 'magic',
  targetType: 'single-enemy',
  element: 'lightning',
  power: 1.2,
  mpCost: 15,
  accuracy: 0.9,
  criticalBonus: 0,
  isGuaranteedHit: false,
  statusEffects: [
    {
      effectType: 'shock',      // カスタム状態異常タイプ
      probability: 0.7,
      duration: 2,
      power: 10,
    }
  ],
  description: '電撃で敵を攻撃し、感電状態にする',
};
```

### 実装例

#### 例1: ファンタジーRPG

```typescript
// ファンタジー風の状態異常
type FantasyEffectType = 
  | 'poison'
  | 'petrify'       // 石化
  | 'curse'         // 呪い
  | 'holy-shield'   // 聖なる加護
  | 'berserk';      // 狂戦士化

type FantasyEffectCategory = 
  | 'ailment'       // 状態異常
  | 'blessing'      // 祝福
  | 'curse';        // 呪い

const fantasyHero: Combatant<DefaultStats, FantasyEffectType, FantasyEffectCategory> = {
  // ...
  statusEffects: [
    {
      type: 'holy-shield',
      category: 'blessing',
      // ...
    }
  ],
};
```

#### 例2: SFシューティング

```typescript
// SF風の状態異常
type SciFiEffectType = 
  | 'emp-stunned'     // EMP麻痺
  | 'shield-boost'    // シールド強化
  | 'overheated'      // オーバーヒート
  | 'cloaked'         // ステルス
  | 'hacked';         // ハッキング

type SciFiEffectCategory = 
  | 'tech-malfunction'  // 技術的故障
  | 'enhancement'       // 強化
  | 'tactical';         // 戦術的

const sciFiShip: Combatant<DefaultStats, SciFiEffectType, SciFiEffectCategory> = {
  // ...
  statusEffects: [
    {
      type: 'shield-boost',
      category: 'enhancement',
      // ...
    }
  ],
};
```

#### 例3: ホラーゲーム

```typescript
// ホラー風の状態異常
type HorrorEffectType = 
  | 'sanity-drain'    // 正気度低下
  | 'possessed'       // 憑依
  | 'hallucination'   // 幻覚
  | 'fear'            // 恐怖
  | 'madness';        // 狂気

type HorrorEffectCategory = 
  | 'psychological'   // 精神的
  | 'supernatural'    // 超常的
  | 'physical';       // 肉体的

const horrorCharacter: Combatant<DefaultStats, HorrorEffectType, HorrorEffectCategory> = {
  // ...
  statusEffects: [
    {
      type: 'sanity-drain',
      category: 'psychological',
      // ...
    }
  ],
};
```

## 型システムの詳細

### StatusEffect<TType, TCategory>

ジェネリック型で、カスタム状態異常タイプとカテゴリをサポート。

```typescript
interface StatusEffect<
  TType extends BaseStatusEffectType = DefaultStatusEffectType,
  TCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory
>
```

- `TType`: 状態異常の種類（文字列のユニオン型）
- `TCategory`: 状態異常のカテゴリ（文字列のユニオン型）
- デフォルトでは標準的なJRPGの状態異常を使用

### Combatant<TStats, TEffectType, TEffectCategory>

戦闘者インターフェースは3つのジェネリック型をサポート。

```typescript
interface Combatant<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory
>
```

### Skill<TEffectType>

スキルインターフェースは状態異常タイプのジェネリック型をサポート。

```typescript
interface Skill<
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType
>
```

## ベストプラクティス

### 1. 一貫性のある命名

状態異常タイプには一貫性のある命名規則を使用する。

```typescript
// 良い例
type GoodEffectType = 
  | 'poison'
  | 'paralysis'
  | 'sleep';

// 避けるべき例（不統一）
type BadEffectType = 
  | 'poison'
  | 'paralyzed'    // -ed形で統一されていない
  | 'sleeping';    // -ing形で統一されていない
```

### 2. カテゴリの明確化

カテゴリは効果の性質を明確に表す。

```typescript
type EffectCategory = 
  | 'positive'      // ポジティブ効果
  | 'negative'      // ネガティブ効果
  | 'neutral';      // ニュートラル効果
```

### 3. 型の再利用

複数のエンティティで同じ状態異常タイプを使用する。

```typescript
// 共通の状態異常タイプを定義
type GameEffectType = 'poison' | 'burn' | 'freeze';
type GameEffectCategory = 'elemental' | 'physical';

// プレイヤー
const player: Combatant<PlayerStats, GameEffectType, GameEffectCategory> = { /* ... */ };

// 敵
const enemy: Combatant<EnemyStats, GameEffectType, GameEffectCategory> = { /* ... */ };

// スキル
const skill: Skill<GameEffectType> = { /* ... */ };
```

## マイグレーションガイド

### 既存コードからの移行

既存のコードは、後方互換性により変更なしで動作します。

```typescript
// 変更前（引き続き動作）
import { StatusEffect } from 'rpg-core';

const effect: StatusEffect = {
  type: 'poison',     // DefaultStatusEffectType
  category: 'dot',    // DefaultStatusEffectCategory
  // ...
};

// 変更後（推奨）
import { StatusEffect, DefaultStatusEffectType, DefaultStatusEffectCategory } from 'rpg-core';

const effect: StatusEffect<DefaultStatusEffectType, DefaultStatusEffectCategory> = {
  type: 'poison',
  category: 'dot',
  // ...
};
```

### 段階的な移行

1. まず`DefaultStatusEffectType`/`DefaultStatusEffectCategory`を使用したままテスト
2. 新機能でカスタム状態異常を試す
3. 必要に応じて既存コードをカスタム状態異常に移行

## よくある質問（FAQ）

### Q: デフォルト状態異常は必須ですか？

A: いいえ。完全にカスタム状態異常のみを使用することも可能です。

### Q: 状態異常タイプに非文字列型を使えますか？

A: `BaseStatusEffectType`は`string`として定義されているため、文字列のユニオン型である必要があります。数値や他の型を使用したい場合は、文字列に変換してください。

### Q: 状態異常の処理ロジックはどこに実装しますか？

A: Phase 1では状態異常の定義のみをサポートしています。実際の処理ロジック（ダメージ適用、効果の発動など）は将来のフェーズで実装予定です。現時点では、ゲーム開発者が独自に実装する必要があります。

### Q: カテゴリは必須ですか？

A: `StatusEffect`インターフェースでは必須フィールドですが、カスタマイズは可能です。カテゴリが不要な場合は、単一の値（例: `type SingleCategory = 'effect'`）を使用することもできます。

## まとめ

- rpg-coreの状態異常システムは完全にカスタマイズ可能
- `BaseStatusEffectType`を使用して独自の状態異常タイプを定義
- `BaseStatusEffectCategory`を使用して独自のカテゴリを定義
- ジェネリクスにより型安全性を維持
- デフォルト型により後方互換性を確保
- ゲームの世界観に合わせて自由に状態異常を設計可能
- ステータスと状態異常を組み合わせて、完全にカスタマイズされたゲームを作成可能
