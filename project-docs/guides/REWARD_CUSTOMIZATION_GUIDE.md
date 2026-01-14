# RewardService カスタマイズガイド

## 概要

RewardServiceは経験値曲線とステータス成長率をカスタマイズできるようになりました。
ゲームの難易度やジャンルに応じて、レベルアップの速度やキャラクターの成長率を調整できます。

## 経験値曲線のカスタマイズ

### デフォルト（線形）

```typescript
// デフォルトは線形曲線
const service = new RewardService();
// レベル2: 200exp, レベル3: 500exp, レベル4: 900exp
```

### 指数曲線を使用

より急激な成長曲線を使用したい場合：

```typescript
const service = new RewardService({
  expCurve: {
    type: 'exponential',
    baseExpRequired: 100,
    expGrowthRate: 1.5  // 1.5倍ずつ増加
  }
});
```

### カスタム経験値曲線

完全にカスタムの経験値計算式を指定できます：

```typescript
const service = new RewardService({
  expCurve: {
    type: 'custom',
    customCurve: (level, baseExp, growthRate) => {
      // レベル * レベル * baseExp のような独自の計算
      return level * level * baseExp;
    }
  }
});
```

## ステータス成長のカスタマイズ

### 固定成長率

毎レベル確実に固定値だけ成長させたい場合：

```typescript
const service = new RewardService({
  statGrowth: {
    growthRates: {
      maxHp: 20,
      maxMp: 10,
      attack: 5,
      defense: 3,
      magic: 4,
      magicDefense: 3,
      speed: 3,
      luck: 2,
      accuracy: 1,
      evasion: 1,
      criticalRate: 0.02
    },
    useRandomVariance: false  // 固定値で成長
  }
});
// レベルアップ時、必ず maxHp +20, attack +5 になる
```

### ランダム分散あり成長率

基準値を設定し、そこから±分散する成長：

```typescript
const service = new RewardService({
  statGrowth: {
    growthRates: {
      maxHp: 10,
      maxMp: 5,
      attack: 3,
      defense: 2,
      magic: 3,
      magicDefense: 2,
      speed: 2,
      luck: 1,
      accuracy: 1,
      evasion: 1,
      criticalRate: 0.01
    },
    useRandomVariance: true,
    variancePercent: 0.1  // ±10%の分散
  }
});
// maxHpは 9-11 の範囲でランダムに成長
```

### デフォルト動作（従来互換）

設定を省略すると、従来通りの動作：

```typescript
const service = new RewardService();
// HP: 8-12, MP: 3-5, Attack: 2-3 のランダム成長
```

## 組み合わせ例

### 高速成長・高ステータスゲーム

```typescript
const service = new RewardService({
  expCurve: {
    type: 'linear',
    baseExpRequired: 50  // レベルアップが早い
  },
  statGrowth: {
    growthRates: {
      maxHp: 30,  // 高めの成長
      maxMp: 15,
      attack: 8,
      defense: 5,
      magic: 8,
      magicDefense: 5,
      speed: 5,
      luck: 3,
      accuracy: 2,
      evasion: 2,
      criticalRate: 0.03
    },
    useRandomVariance: true,
    variancePercent: 0.15  // やや大きめの分散
  }
});
```

### 低速成長・バランス重視ゲーム

```typescript
const service = new RewardService({
  expCurve: {
    type: 'exponential',
    baseExpRequired: 200,  // レベルアップが遅い
    expGrowthRate: 1.8
  },
  statGrowth: {
    growthRates: {
      maxHp: 8,
      maxMp: 4,
      attack: 2,
      defense: 2,
      magic: 2,
      magicDefense: 2,
      speed: 2,
      luck: 1,
      accuracy: 1,
      evasion: 1,
      criticalRate: 0.005
    },
    useRandomVariance: false  // 確実な成長
  }
});
```

## Core Engine 関数の直接利用

Serviceを使わず、Core Engine関数を直接使うこともできます：

```typescript
import * as growth from 'rpg-core/character/growth';

// 経験値計算
const expRequired = growth.getExpForLevel(5, {
  type: 'exponential',
  baseExpRequired: 100,
  expGrowthRate: 1.5
});

// レベルアップ判定
const canLevel = growth.canLevelUp(1000, 3, {
  type: 'linear',
  baseExpRequired: 100
});

// ステータス成長計算
const statGrowth = growth.calculateStatGrowth(10, {
  growthRates: { maxHp: 15, attack: 4, ... },
  useRandomVariance: true,
  variancePercent: 0.2
});
```

## 型安全性

カスタムステータス型にも対応：

```typescript
interface CustomStats extends BaseStats {
  strength: number;
  intelligence: number;
  vitality: number;
}

const service = new RewardService<'linear', CustomStats>({
  statGrowth: {
    growthRates: {
      strength: 5,
      intelligence: 3,
      vitality: 4
    }
  }
});
```
