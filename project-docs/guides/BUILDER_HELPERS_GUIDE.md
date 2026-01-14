# Builder Helpers Guide

## 概要

GEasy-Kitは、ゲームエンティティ（キャラクター、モンスター、ジョブ、アイテム、装備、スキル）を簡単に定義するためのBuilderパターンヘルパーを提供します。

さらに、**BuilderRegistry**を使用することで、エンティティ間の関係をIDではなく**名前で参照**できるようになり、より直感的なゲームデータ定義が可能になります。

### 解決する課題

従来の方法では、エンティティを定義する際に以下の問題がありました：

- 冗長なオブジェクトリテラルの記述
- 必須フィールドの記入漏れ
- デフォルト値の重複定義
- テストコードの可読性低下
- **エンティティ間の関係を作る際にIDを覚えておく必要がある** ← NEW!

Builderヘルパーと**BuilderRegistry**を使用することで、これらの問題を解決し、より直感的で保守性の高いコードを書くことができます。

## インストール

```bash
npm install geasy-kit
```

## 使用方法

### CharacterBuilder - キャラクターの作成

```typescript
import { CharacterBuilder } from 'geasy-kit';

// シンプルな例
const hero = new CharacterBuilder('hero1', 'Hero')
  .level(10)
  .hp(100)
  .mp(50)
  .attack(50)
  .defense(30)
  .build();

// 詳細な例
const mage = new CharacterBuilder('mage1', 'Mage')
  .level(15)
  .hp(80, 80)
  .mp(150, 150)
  .stats({
    magic: 70,
    magicDefense: 40,
    speed: 45,
    accuracy: 12,
  })
  .job('Mage', 5, 120)
  .position(1) // 後列
  .exp(1500)
  .build();
```

**従来の方法との比較:**

```typescript
// 従来の方法（冗長）
const hero: Character = {
  id: 'hero1',
  name: 'Hero',
  level: 10,
  stats: {
    maxHp: 100,
    maxMp: 50,
    attack: 50,
    defense: 30,
    magic: 10,
    magicDefense: 10,
    speed: 10,
    luck: 5,
    accuracy: 5,
    evasion: 5,
    criticalRate: 0.05,
  },
  currentHp: 100,
  currentMp: 50,
  statusEffects: [],
  position: 0,
  learnedSkills: [],
};

// Builderを使用（簡潔）
const hero = new CharacterBuilder('hero1', 'Hero')
  .level(10)
  .hp(100)
  .mp(50)
  .attack(50)
  .defense(30)
  .build();
```

### EnemyBuilder - 敵/モンスターの作成

```typescript
import { EnemyBuilder } from 'geasy-kit';

// 通常の敵
const slime = new EnemyBuilder('slime1', 'Slime', 'slime')
  .level(5)
  .hp(50)
  .attack(20)
  .defense(15)
  .aiStrategy('aggressive')
  .expReward(50)
  .moneyReward(20)
  .build();

// ボスエネミー（ドロップアイテム付き）
const dragon = new EnemyBuilder('dragon1', 'Ancient Dragon', 'dragon')
  .level(30)
  .hp(1000, 1000)
  .mp(500, 500)
  .stats({
    attack: 100,
    defense: 80,
    magic: 90,
    magicDefense: 70,
    speed: 60,
  })
  .aiStrategy('balanced')
  .expReward(2000)
  .moneyReward(1000)
  .jobExpReward(500)
  .addDropItem('dragon-scale', 0.8, 3)
  .addDropItem('legendary-sword', 0.1, 1)
  .addDropItem('rare-gem', 0.3, 2)
  .build();
```

### JobBuilder - ジョブ/職業の作成

```typescript
import { JobBuilder } from 'geasy-kit';

// 戦士ジョブ
const warrior = new JobBuilder('warrior', 'Warrior')
  .description('A mighty warrior skilled in physical combat')
  .statModifiers({
    attack: 15,
    defense: 10,
    maxHp: 30,
  })
  .levelRequirement(5)
  .availableSkills(['power-slash', 'shield-bash', 'war-cry'])
  .build();

// 上位職（前提条件付き）
const paladin = new JobBuilder('paladin', 'Paladin')
  .description('A holy knight combining combat and healing')
  .statModifiers({
    attack: 20,
    defense: 15,
    maxHp: 40,
    magic: 10,
  })
  .levelRequirement(20)
  .requiredJobs(['warrior', 'priest'])
  .availableSkills(['holy-strike', 'divine-shield', 'heal'])
  .build();
```

### SkillBuilder - スキルの作成

```typescript
import { SkillBuilder } from 'geasy-kit';

// 攻撃スキル
const fireball = new SkillBuilder('fireball', 'Fireball')
  .description('A powerful fire spell that damages a single enemy')
  .type('magic')
  .targetType('single-enemy')
  .power(80)
  .mpCost(25)
  .element('fire')
  .accuracy(0.95)
  .criticalBonus(0.1)
  .build();

// 回復スキル
const heal = new SkillBuilder('heal', 'Heal')
  .description('Restore HP to an ally')
  .type('heal')
  .targetType('single-ally')
  .power(100)
  .mpCost(20)
  .guaranteedHit()
  .levelRequirement(5)
  .build();

// 特殊スキル（複数コスト）
const ultimateAttack = new SkillBuilder('ultimate', 'Ultimate Strike')
  .description('A devastating attack that costs HP and MP')
  .type('special')
  .targetType('all-enemies')
  .power(200)
  .mpCost(50)
  .hpCost(20)
  .element('none')
  .cooldown(3)
  .build();
```

### ItemBuilder - アイテムの作成

```typescript
import { ItemBuilder } from 'geasy-kit';

// 消耗品
const potion = new ItemBuilder('potion', 'Health Potion')
  .type('consumable')
  .category('consumable')
  .description('Restores 50 HP')
  .value(50)
  .rarity(1)
  .stackable(99)
  .usableInBattle(true)
  .usableOutOfBattle(true)
  .build();

// キーアイテム
const ancientKey = new ItemBuilder('ancient-key', 'Ancient Key')
  .type('key-item')
  .category('key-item')
  .description('Opens the door to the ancient temple')
  .rarity(4)
  .notStackable()
  .usableOutOfBattle(true)
  .build();

// 素材アイテム
const dragonScale = new ItemBuilder('dragon-scale', 'Dragon Scale')
  .type('material')
  .category('material')
  .description('A scale from a mighty dragon')
  .value(500)
  .rarity(3)
  .stackable(50)
  .weight(2)
  .build();
```

### EquipmentBuilder - 装備の作成

```typescript
import { EquipmentBuilder } from 'geasy-kit';

// 武器
const ironSword = new EquipmentBuilder('iron-sword', 'Iron Sword')
  .type('weapon')
  .description('A sturdy iron sword')
  .levelRequirement(5)
  .statModifiers({
    attack: 20,
    accuracy: 5,
  })
  .build();

// 防具
const dragonArmor = new EquipmentBuilder('dragon-armor', 'Dragon Armor')
  .type('armor')
  .description('Armor crafted from dragon scales')
  .levelRequirement(20)
  .statModifiers({
    defense: 50,
    magicDefense: 30,
    maxHp: 100,
  })
  .build();

// アクセサリー
const speedRing = new EquipmentBuilder('speed-ring', 'Ring of Speed')
  .type('accessory')
  .description('Increases the wearer\'s speed')
  .levelRequirement(10)
  .statModifier('speed', 15)
  .statModifier('evasion', 10)
  .build();
```

## メソッドチェーンのパターン

Builderは流暢なインターフェース（Fluent Interface）を提供し、メソッドチェーンで複数の設定を連続して行えます：

```typescript
const character = new CharacterBuilder('id', 'Name')
  .level(10)           // レベル設定
  .hp(100)             // HP設定
  .attack(50)          // 攻撃力設定
  .defense(30)         // 防御力設定
  .build();            // 最後にbuild()でオブジェクトを生成
```

## テストでの活用

Builderはテストコードで特に有用です：

```typescript
describe('BattleService', () => {
  it('should calculate damage correctly', () => {
    // テスト用のキャラクターとエネミーを簡単に作成
    const attacker = new CharacterBuilder('hero', 'Hero')
      .attack(100)
      .build();
    
    const defender = new EnemyBuilder('slime', 'Slime', 'slime')
      .defense(20)
      .build();
    
    const damage = calculateDamage(attacker, defender);
    expect(damage).toBeGreaterThan(0);
  });
});
```

## デフォルト値

各Builderは適切なデフォルト値を提供するため、必要な値だけを設定できます：

```typescript
// 最小限の設定でも動作する
const character = new CharacterBuilder('hero', 'Hero').build();

// デフォルト値:
// - level: 1
// - stats: すべて基本値（attack: 10, defense: 10, etc.）
// - currentHp: 100
// - currentMp: 50
// - statusEffects: []
// - learnedSkills: []
```

## ベストプラクティス

### 1. ファクトリー関数として使用

```typescript
function createWarrior(id: string, name: string, level: number) {
  return new CharacterBuilder(id, name)
    .level(level)
    .job('Warrior')
    .stats({
      attack: 30 + level * 3,
      defense: 25 + level * 2,
      maxHp: 100 + level * 10,
    })
    .build();
}

const warrior1 = createWarrior('w1', 'Warrior1', 10);
const warrior2 = createWarrior('w2', 'Warrior2', 15);
```

### 2. テンプレートとして使用

```typescript
// 基本テンプレートを作成
const baseSlime = new EnemyBuilder('', 'Slime', 'slime')
  .hp(50)
  .attack(15)
  .defense(10)
  .aiStrategy('aggressive')
  .expReward(30)
  .moneyReward(10);

// テンプレートから複数インスタンスを作成
const slime1 = Object.assign(
  Object.create(Object.getPrototypeOf(baseSlime)),
  baseSlime
).build();
// 実際には新しいインスタンスを作る方が良い
```

### 3. バリデーション付きBuilderの作成

必要に応じて、独自のバリデーションロジックを持つBuilderを作成できます：

```typescript
class ValidatedCharacterBuilder extends CharacterBuilder {
  build(): Character {
    const char = super.build();
    
    // カスタムバリデーション
    if (char.level < 1 || char.level > 99) {
      throw new Error('Level must be between 1 and 99');
    }
    
    if (char.currentHp > char.stats.maxHp) {
      throw new Error('Current HP cannot exceed max HP');
    }
    
    return char;
  }
}
```

## まとめ

Builderヘルパーを使用することで：

✅ コードが簡潔で読みやすくなる
✅ デフォルト値が自動的に設定される
✅ メソッドチェーンで直感的に定義できる
✅ テストコードの記述が楽になる
✅ タイプセーフで型エラーを防げる

## BuilderRegistry - 名前でエンティティを参照

### 概要

`BuilderRegistry`を使用すると、エンティティ間の関係を**IDではなく名前で参照**できるようになります。これにより、複雑なIDを覚える必要がなくなり、より直感的なゲームデータ定義が可能になります。

### 基本的な使い方

```typescript
import { BuilderRegistry, SkillBuilder, JobBuilder } from 'geasy-kit';

// 1. レジストリを作成
const registry = new BuilderRegistry();

// 2. スキルを作成して登録
const fireball = new SkillBuilder('fireball-id', 'Fireball')
  .type('magic')
  .power(80)
  .build();

registry.registerSkill(fireball);

// 3. ジョブを作成する際に、スキルを名前で参照
const mage = new JobBuilder('mage-id', 'Mage')
  .description('A master of magic')
  .availableSkillsByName(['Fireball'], registry) // IDではなく名前で参照！
  .build();

console.log(mage.availableSkills); // ['fireball-id']
```

### Before / After 比較

**Before (IDを使用):**
```typescript
// IDを覚えておく必要がある
const mage = new JobBuilder('mage', 'Mage')
  .availableSkills(['fireball-id', 'ice-blast-id', 'heal-id']) // IDを記憶...
  .build();
```

**After (名前を使用):**
```typescript
const registry = new BuilderRegistry();
registry.registerSkill(fireball);
registry.registerSkill(iceBlast);
registry.registerSkill(heal);

// 名前で参照できる！
const mage = new JobBuilder('mage', 'Mage')
  .availableSkillsByName(['Fireball', 'Ice Blast', 'Heal'], registry)
  .build();
```

### 主な機能

#### 1. スキルを名前で参照

```typescript
const registry = new BuilderRegistry();

// スキルを登録
const skill1 = new SkillBuilder('s1', 'Power Strike').build();
const skill2 = new SkillBuilder('s2', 'Magic Missile').build();
registry.registerSkill(skill1);
registry.registerSkill(skill2);

// ジョブで名前を使って参照
const warrior = new JobBuilder('warrior', 'Warrior')
  .availableSkillsByName(['Power Strike', 'Magic Missile'], registry)
  .build();
```

#### 2. ジョブの前提条件を名前で参照

```typescript
// 基本ジョブを登録
const apprentice = new JobBuilder('apprentice', 'Apprentice').build();
const priest = new JobBuilder('priest', 'Priest').build();
registry.registerJob(apprentice);
registry.registerJob(priest);

// 上位ジョブで前提条件を名前で指定
const paladin = new JobBuilder('paladin', 'Paladin')
  .requiredJobsByName(['Apprentice', 'Priest'], registry)
  .build();
```

#### 3. 敵のドロップアイテムを名前で参照

```typescript
// アイテムを登録
const scale = new ItemBuilder('scale-id', 'Dragon Scale').build();
const gem = new ItemBuilder('gem-id', 'Rare Gem').build();
registry.registerItem(scale);
registry.registerItem(gem);

// 敵のドロップを名前で定義
const dragon = new EnemyBuilder('dragon', 'Dragon', 'dragon')
  .addDropItemByName('Dragon Scale', 0.9, 3, registry)
  .addDropItemByName('Rare Gem', 0.3, 1, registry)
  .build();
```

#### 4. 一つずつ追加する方法

```typescript
const job = new JobBuilder('test', 'Test Job')
  .addAvailableSkillByName('Skill 1', registry)
  .addAvailableSkillByName('Skill 2', registry)
  .addRequiredJobByName('Base Job', registry)
  .build();
```

### 完全な例：ゲームデータのセットアップ

```typescript
import { BuilderRegistry, SkillBuilder, JobBuilder, ItemBuilder, EnemyBuilder } from 'geasy-kit';

// レジストリを作成
const registry = new BuilderRegistry();

// 1. すべてのスキルを定義・登録
const fireball = new SkillBuilder('fireball', 'Fireball')
  .type('magic').power(80).build();
const heal = new SkillBuilder('heal', 'Heal')
  .type('heal').power(100).build();

registry.registerSkill(fireball);
registry.registerSkill(heal);

// 2. 基本ジョブを定義・登録
const apprentice = new JobBuilder('apprentice', 'Apprentice')
  .availableSkillsByName(['Fireball'], registry)
  .build();

registry.registerJob(apprentice);

// 3. 上位ジョブを定義（前提条件とスキルを名前で参照）
const archmage = new JobBuilder('archmage', 'Archmage')
  .requiredJobsByName(['Apprentice'], registry)
  .availableSkillsByName(['Fireball', 'Heal'], registry)
  .levelRequirement(20)
  .build();

// 4. アイテムを定義・登録
const potion = new ItemBuilder('potion', 'Health Potion')
  .type('consumable').build();
const scale = new ItemBuilder('scale', 'Dragon Scale')
  .type('material').build();

registry.registerItem(potion);
registry.registerItem(scale);

// 5. 敵を定義（ドロップアイテムを名前で参照）
const dragon = new EnemyBuilder('dragon', 'Ancient Dragon', 'dragon')
  .level(30)
  .hp(1000)
  .addDropItemByName('Dragon Scale', 0.9, 3, registry)
  .addDropItemByName('Health Potion', 0.5, 2, registry)
  .build();

console.log('Setup complete!');
console.log('Archmage requires:', archmage.requiredJobs);
console.log('Dragon drops:', dragon.dropItems);
```

### エラーハンドリング

存在しないエンティティを参照した場合、そのエンティティは無視されます：

```typescript
const job = new JobBuilder('test', 'Test Job')
  .availableSkillsByName(['Existing Skill', 'Non-Existent Skill'], registry)
  .build();

// 'Existing Skill' のみが追加され、'Non-Existent Skill' は無視される
```

### レジストリの管理

```typescript
// 登録されているエンティティ名を取得
const skillNames = registry.getSkillNames();
const itemNames = registry.getItemNames();

// エンティティをIDで取得
const skillId = registry.getSkillId('Fireball');

// エンティティ自体を取得
const skill = registry.getSkill('Fireball');

// レジストリをクリア
registry.clear();
```

### メリット

✅ **IDを覚える必要がない** - 直感的な名前で参照
✅ **可読性向上** - コードが読みやすくなる
✅ **保守性向上** - エンティティ名の変更が容易
✅ **エラー削減** - IDのタイポを防ぐ
✅ **チーム開発** - IDを共有する必要がない

詳細は各Builderクラスのドキュメントを参照してください。
