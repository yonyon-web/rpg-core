# EquipmentService カスタマイズガイド

## 概要

EquipmentServiceは装備スロットと装備タイプをゲームごとにカスタマイズできます。
ゲームのジャンルや設計に応じて、独自の装備システムを構築できます。

## 装備スロットのカスタマイズ

### デフォルト装備スロット

```typescript
// デフォルトでは6つのスロット
type DefaultEquipmentSlot = 
  | 'weapon'      // 武器
  | 'shield'      // 盾
  | 'head'        // 頭
  | 'body'        // 体
  | 'accessory1'  // アクセサリー1
  | 'accessory2'; // アクセサリー2

const service = new EquipmentService();
service.equipItem(character, weapon, 'weapon');
```

### カスタム装備スロット

独自の装備スロットを定義できます：

```typescript
// アクションRPG向け
type ActionRPGSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'feet' | 'ring1' | 'ring2';

// シンプルRPG向け
type SimpleSlot = 'weapon' | 'armor';

// MMO向け
type MMOSlot = 'mainHand' | 'offHand' | 'head' | 'shoulders' | 'chest' | 'hands' | 'waist' | 'legs' | 'feet' | 'neck' | 'ring1' | 'ring2';
```

## 装備タイプのカスタマイズ

### デフォルト装備タイプ

```typescript
// デフォルトでは5つのタイプ
type DefaultEquipmentType =
  | 'weapon'
  | 'shield'
  | 'helmet'
  | 'armor'
  | 'accessory';
```

### カスタム装備タイプ

独自の装備タイプを定義できます：

```typescript
// 武器種別が細かいゲーム
type DetailedWeaponType = 'sword' | 'axe' | 'bow' | 'staff' | 'dagger' | 'spear';

// シンプルなゲーム
type SimpleEquipType = 'weapon' | 'outfit' | 'accessory';

// MMO向け
type MMOEquipType = 
  | 'one-hand-sword' | 'two-hand-sword' | 'one-hand-axe' | 'two-hand-axe'
  | 'bow' | 'crossbow' | 'staff' | 'wand'
  | 'shield'
  | 'cloth' | 'leather' | 'plate'
  | 'ring' | 'necklace';
```

## スロットマッピングの設定

装備タイプとスロットの対応関係を定義します：

```typescript
import { EquipmentService } from 'rpg-core';

// カスタムスロットとタイプを定義
type MySlot = 'mainHand' | 'offHand' | 'head';
type MyEquipType = 'sword' | 'dagger' | 'helmet';

// スロットマッピングを定義
const customMapping = {
  // 各装備タイプのデフォルトスロット
  defaultSlot: {
    sword: 'mainHand',
    dagger: 'offHand',
    helmet: 'head'
  },
  // 各装備タイプが装備可能なスロットのリスト
  validSlots: {
    sword: ['mainHand'],              // 剣は片手のみ
    dagger: ['mainHand', 'offHand'],  // 短剣は両手どちらでも
    helmet: ['head']                  // ヘルメットは頭のみ
  }
};

// サービスを初期化
const service = new EquipmentService<DefaultStats, MySlot, MyEquipType>({
  slotMapping: customMapping
});

// 使用例
const character: Combatant<DefaultStats, any, any, MySlot, MyEquipType> = { ... };
const sword: Equipment<DefaultStats, MyEquipType> = {
  id: 'iron-sword',
  name: '鉄の剣',
  type: 'sword',
  levelRequirement: 1,
  statModifiers: { attack: 10 }
};

service.equipItem(character, sword, 'mainHand');
```

## 実用例

### 例1: 両手武器システム

```typescript
type TwoHandSlot = 'rightHand' | 'leftHand' | 'head' | 'body';
type TwoHandEquipType = 'one-hand-weapon' | 'two-hand-weapon' | 'shield' | 'helmet' | 'armor';

const twoHandMapping = {
  defaultSlot: {
    'one-hand-weapon': 'rightHand',
    'two-hand-weapon': 'rightHand',
    'shield': 'leftHand',
    'helmet': 'head',
    'armor': 'body'
  },
  validSlots: {
    'one-hand-weapon': ['rightHand', 'leftHand'],
    'two-hand-weapon': ['rightHand'], // 両手武器は右手のみ（左手も使用する実装は別途必要）
    'shield': ['leftHand'],
    'helmet': ['head'],
    'armor': ['body']
  }
};

const service = new EquipmentService<DefaultStats, TwoHandSlot, TwoHandEquipType>({
  slotMapping: twoHandMapping
});
```

### 例2: シンプルな装備システム

```typescript
type SimpleSlot = 'weapon' | 'armor';
type SimpleEquipType = 'weapon' | 'armor';

const simpleMapping = {
  defaultSlot: {
    weapon: 'weapon',
    armor: 'armor'
  },
  validSlots: {
    weapon: ['weapon'],
    armor: ['armor']
  }
};

const service = new EquipmentService<DefaultStats, SimpleSlot, SimpleEquipType>({
  slotMapping: simpleMapping
});
```

### 例3: 複雑なMMOスタイル

```typescript
type MMOSlot = 'mainHand' | 'offHand' | 'head' | 'shoulders' | 'chest' | 'hands' | 'waist' | 'legs' | 'feet' | 'neck' | 'ring1' | 'ring2' | 'trinket1' | 'trinket2';
type MMOEquipType = 'sword' | 'shield' | 'helmet' | 'shoulders' | 'chest-armor' | 'gloves' | 'belt' | 'pants' | 'boots' | 'necklace' | 'ring' | 'trinket';

const mmoMapping = {
  defaultSlot: {
    sword: 'mainHand',
    shield: 'offHand',
    helmet: 'head',
    shoulders: 'shoulders',
    'chest-armor': 'chest',
    gloves: 'hands',
    belt: 'waist',
    pants: 'legs',
    boots: 'feet',
    necklace: 'neck',
    ring: 'ring1',
    trinket: 'trinket1'
  },
  validSlots: {
    sword: ['mainHand'],
    shield: ['offHand'],
    helmet: ['head'],
    shoulders: ['shoulders'],
    'chest-armor': ['chest'],
    gloves: ['hands'],
    belt: ['waist'],
    pants: ['legs'],
    boots: ['feet'],
    necklace: ['neck'],
    ring: ['ring1', 'ring2'],        // リングは2つのスロットに装備可能
    trinket: ['trinket1', 'trinket2'] // トリンケットも2つのスロットに装備可能
  }
};

const service = new EquipmentService<DefaultStats, MMOSlot, MMOEquipType>({
  slotMapping: mmoMapping
});
```

## 後方互換性

設定を指定しない場合、デフォルトの装備システムが使用されます：

```typescript
// これまで通り動作します
const service = new EquipmentService();
service.equipItem(character, weapon, 'weapon');
```

## 型安全性

TypeScriptの型システムにより、カスタムスロットとタイプは完全に型安全です：

```typescript
type MySlot = 'slot1' | 'slot2';
type MyEquipType = 'type1' | 'type2';

const service = new EquipmentService<DefaultStats, MySlot, MyEquipType>({ ... });

// コンパイルエラー: 'slot3' は MySlot に存在しない
service.equipItem(character, equipment, 'slot3');

// コンパイルエラー: type が 'type3' の Equipment は MyEquipType に互換性がない
const invalidEquip: Equipment<DefaultStats, 'type3'> = { ... };
```
