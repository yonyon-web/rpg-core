# 敵AIシステム設計

敵の行動決定とグループ管理に関する設計。Core Engine、Service、Headless UIの3層で構成。

## 目次

1. [概要](#概要)
2. [Core Engine層](#core-engine層)
3. [Service層](#service層)
4. [Headless UI層](#headless-ui層)

---

## 概要

### 3層アーキテクチャ

```
┌─────────────────────────────────────┐
│  Headless UI Layer                  │
│  Controller                         │  ← UI状態管理、ユーザー操作
└─────────────────────────────────────┘
              ↓ 委譲
┌─────────────────────────────────────┐
│  Service Layer                      │
│  Service                            │  ← ビジネスロジック
└─────────────────────────────────────┘
              ↓ 委譲
┌─────────────────────────────────────┐
│  Core Engine Layer                  │
│  モジュール                          │  ← 純粋な計算
└─────────────────────────────────────┘
```

---

## Core Engine層

### 🧠 敵とAIに関する計算

#### 敵のステータス計算
- 敵の初期ステータス設定
  - レベルに応じた能力値
  - 敵種別による補正
- 使用可能なスキルの列挙
  - スキルの使用条件チェック
  - MP/SPコストの確認

#### ドロップとリワードの計算
- ドロップ判定の計算
  - アイテムドロップ率
  - レアドロップ判定
  - ドロップ個数の決定
- 対象候補の評価
  - AI用のターゲット選定
  - 脅威度の計算
  - 優先度の算出


---

## Service層

---

## 4. EnemyAIService - 敵の行動自動決定

### 概要
敵の行動を自動決定する。AI戦略に基づいてスキルとターゲットを選択。

### 状態管理

```typescript
interface AIDecisionState {
  // 判断中の敵
  enemy: Enemy;
  
  // 戦闘状況
  situation: BattleSituation;
  
  // 評価結果
  skillEvaluations: SkillEvaluation[];
  targetEvaluations: TargetEvaluation[];
  
  // 決定結果
  decision?: AIDecision;
}
```

### 公開インターフェース

```typescript
class EnemyAIService {
  // 行動決定
  decideAction(enemy: Enemy, battleState: BattleState): Promise<BattleAction>;
  
  // スキル評価
  evaluateSkills(enemy: Enemy, situation: BattleSituation): SkillEvaluation[];
  
  // ターゲット評価
  evaluateTargets(enemy: Enemy, skill: Skill, targets: Character[]): TargetEvaluation[];
  
  // 最適なスキル選択
  selectBestSkill(evaluations: SkillEvaluation[]): Skill;
  
  // 最適なターゲット選択
  selectBestTarget(evaluations: TargetEvaluation[]): Character;
}
```

### Core Engine 委譲

- `enemy/ai.evaluateSkill()` - スキル評価
- `enemy/ai.selectBestSkill()` - 最適スキル選択
- `enemy/ai.evaluateTarget()` - ターゲット評価
- `enemy/ai.selectBestTarget()` - 最適ターゲット選択
- `character/skill.checkSkillUsable()` - スキル使用可否

### 実装例

```typescript
class EnemyAIService {
  constructor(private coreEngine: CoreEngine) {}
  
  async decideAction(enemy: Enemy, battleState: BattleState): Promise<BattleAction> {
    // 戦闘状況を構築
    const situation: BattleSituation = {
      turn: battleState.turnNumber,
      allyParty: battleState.enemyGroup,
      enemyParty: battleState.playerParty,
      averageAllyHpRate: this.calculateAverageHpRate(battleState.enemyGroup),
      averageEnemyHpRate: this.calculateAverageHpRate(battleState.playerParty),
      defeatedAllies: battleState.enemyGroup.filter(e => e.currentHp <= 0).length,
      defeatedEnemies: battleState.playerParty.filter(c => c.currentHp <= 0).length
    };
    
    // 使用可能なスキルを取得
    const availableSkills = enemy.skills.filter(skill =>
      this.coreEngine.checkSkillUsable(enemy, skill)
    );
    
    // スキル評価
    const skillEvaluations = availableSkills.map(skill =>
      this.coreEngine.evaluateSkill(enemy, skill, situation)
    );
    
    // 最適スキル選択
    const bestSkill = this.coreEngine.selectBestSkill(
      enemy,
      availableSkills,
      situation,
      enemy.aiStrategy
    );
    
    // ターゲット候補
    const possibleTargets = battleState.playerParty.filter(c => c.currentHp > 0);
    
    // ターゲット評価
    const targetEvaluations = possibleTargets.map(target =>
      this.coreEngine.evaluateTarget(enemy, target, bestSkill)
    );
    
    // 最適ターゲット選択
    const bestTarget = this.coreEngine.selectBestTarget(
      enemy,
      possibleTargets,
      bestSkill,
      enemy.aiStrategy
    );
    
    return {
      actor: enemy,
      type: 'skill',
      skill: bestSkill,
      targets: [bestTarget]
    };
  }
}
```


---

## 5. EnemyGroupService - 敵グループ管理

### 概要
戦闘に登場する敵グループの生成、管理、ドロップアイテムの決定を行う。

### 状態管理

```typescript
interface EnemyGroupState {
  // 敵グループ
  enemies: Enemy[];
  
  // グループ情報
  groupType: string;
  difficulty: number;
  
  // ドロップ
  potentialDrops: DropItem[];
}
```

### 公開インターフェース

```typescript
class EnemyGroupService {
  // 敵グループ生成
  generateEnemyGroup(groupType: string, level: number): Enemy[];
  
  // 敵の初期化
  initializeEnemy(enemyType: EnemyType, level: number): Enemy;
  
  // ドロップアイテム決定
  rollDrops(defeatedEnemies: Enemy[]): Item[];
  
  // 経験値・お金計算
  calculateRewards(defeatedEnemies: Enemy[]): { exp: number; money: number };
}
```

### Core Engine 委譲

- `enemy/stats.generateEnemyStats()` - 敵ステータス生成
- `enemy/stats.getEnemySkills()` - 敵スキル取得
- `enemy/drops.rollDrops()` - ドロップ判定
- `enemy/drops.calculateExpReward()` - 経験値計算
- `enemy/drops.calculateMoneyReward()` - お金計算

### 実装例

```typescript
class EnemyGroupService {
  constructor(private coreEngine: CoreEngine) {}
  
  initializeEnemy(enemyType: EnemyType, level: number): Enemy {
    // ステータス生成
    const stats = this.coreEngine.generateEnemyStats(enemyType, level);
    
    // スキル取得
    const skills = this.coreEngine.getEnemySkills(enemyType);
    
    return {
      id: generateId(),
      enemyType,
      level,
      stats,
      currentHp: stats.maxHp,
      currentMp: stats.maxMp,
      skills,
      statusEffects: [],
      aiStrategy: enemyType.aiStrategy,
      position: 0,
      name: enemyType.name
    };
  }
  
  rollDrops(defeatedEnemies: Enemy[]): Item[] {
    const allDrops: Item[] = [];
    
    for (const enemy of defeatedEnemies) {
      const drops = this.coreEngine.rollDrops(enemy);
      allDrops.push(...drops);
    }
    
    return allDrops;
  }
  
  calculateRewards(defeatedEnemies: Enemy[]): { exp: number; money: number } {
    let totalExp = 0;
    let totalMoney = 0;
    
    for (const enemy of defeatedEnemies) {
      totalExp += this.coreEngine.calculateExpReward(enemy);
      totalMoney += this.coreEngine.calculateMoneyReward(enemy);
    }
    
    return { exp: totalExp, money: totalMoney };
  }
}
```



---

## Headless UI層

このシステムのHeadless UI層の実装は将来追加される予定です。
