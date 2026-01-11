# パーティ編成システム - 複数編成対応

## 概要

rpg-coreの複数パーティ編成管理システムの設計ドキュメント。プレイヤーが複数のパーティ編成を保存・切り替えできる機能を提供します。

---

## Core Engine層

### データ型定義

```typescript
interface PartyFormation {
  id: string;                    // 編成ID
  name: string;                  // 編成名
  members: Character[];          // パーティメンバー
  formationPositions: number[];  // 隊列位置
  createdAt: number;             // 作成日時
  updatedAt: number;             // 更新日時
}

interface PartyFormationStorage {
  formations: Map<string, PartyFormation>;
  activeFormationId: string | null;
}
```

### Core Engine関数

#### パーティ編成の保存

```typescript
function saveFormation(
  storage: PartyFormationStorage,
  id: string,
  name: string,
  members: Character[],
  formationPositions: number[]
): PartyFormation {
  const now = Date.now();
  
  const formation: PartyFormation = {
    id,
    name,
    members: [...members],  // コピーを保存
    formationPositions: [...formationPositions],
    createdAt: storage.formations.has(id) ? storage.formations.get(id)!.createdAt : now,
    updatedAt: now
  };
  
  storage.formations.set(id, formation);
  
  return formation;
}
```

#### パーティ編成の読み込み

```typescript
function loadFormation(
  storage: PartyFormationStorage,
  id: string
): PartyFormation | null {
  const formation = storage.formations.get(id);
  
  if (!formation) {
    return null;
  }
  
  // コピーを返す
  return {
    ...formation,
    members: [...formation.members],
    formationPositions: [...formation.formationPositions]
  };
}
```

#### パーティ編成の削除

```typescript
function deleteFormation(
  storage: PartyFormationStorage,
  id: string
): boolean {
  if (!storage.formations.has(id)) {
    return false;
  }
  
  // アクティブな編成を削除する場合はクリア
  if (storage.activeFormationId === id) {
    storage.activeFormationId = null;
  }
  
  storage.formations.delete(id);
  return true;
}
```

#### 全パーティ編成の取得

```typescript
function getAllFormations(
  storage: PartyFormationStorage
): PartyFormation[] {
  return Array.from(storage.formations.values())
    .map(formation => ({
      ...formation,
      members: [...formation.members],
      formationPositions: [...formation.formationPositions]
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);  // 更新日時でソート
}
```

#### パーティ編成の切り替え

```typescript
function switchToFormation(
  storage: PartyFormationStorage,
  id: string
): PartyFormation | null {
  const formation = loadFormation(storage, id);
  
  if (!formation) {
    return null;
  }
  
  storage.activeFormationId = id;
  return formation;
}
```

#### パーティ構成の検証

```typescript
interface PartyValidationOptions {
  minSize: number;
  maxSize: number;
  requireUniqueCharacters: boolean;
}

function validatePartyComposition(
  members: Character[],
  options: PartyValidationOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // サイズチェック
  if (members.length < options.minSize) {
    errors.push(`パーティは最低${options.minSize}人必要です`);
  }
  if (members.length > options.maxSize) {
    errors.push(`パーティは最大${options.maxSize}人までです`);
  }
  
  // 重複チェック
  if (options.requireUniqueCharacters) {
    const ids = members.map(m => m.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push('同じキャラクターを複数選択できません');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Service層

### PartyService拡張

```typescript
interface FormationResult {
  success: boolean;
  formation?: PartyFormation;
  error?: string;
}

interface FormationLoadResult {
  success: boolean;
  formation?: PartyFormation;
  error?: string;
}

interface FormationSwitchResult {
  success: boolean;
  formation?: PartyFormation;
  previousFormationId?: string;
  error?: string;
}

class PartyService {
  private storage: PartyFormationStorage;
  
  constructor(private coreEngine: CoreEngine) {
    this.storage = {
      formations: new Map(),
      activeFormationId: null
    };
  }
  
  // パーティ編成を保存
  saveFormation(
    id: string,
    name: string,
    party: Character[],
    formationPositions: number[]
  ): FormationResult {
    // 検証
    const validation = validatePartyComposition(party, {
      minSize: 1,
      maxSize: 4,
      requireUniqueCharacters: true
    });
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }
    
    // Core Engineに委譲
    const formation = saveFormation(this.storage, id, name, party, formationPositions);
    
    return {
      success: true,
      formation
    };
  }
  
  // パーティ編成を読み込み
  loadFormation(id: string): FormationLoadResult {
    const formation = loadFormation(this.storage, id);
    
    if (!formation) {
      return {
        success: false,
        error: '編成が見つかりません'
      };
    }
    
    return {
      success: true,
      formation
    };
  }
  
  // パーティ編成を削除
  deleteFormation(id: string): FormationResult {
    const success = deleteFormation(this.storage, id);
    
    if (!success) {
      return {
        success: false,
        error: '編成が見つかりません'
      };
    }
    
    return { success: true };
  }
  
  // 全パーティ編成を取得
  getAllFormations(): PartyFormation[] {
    return getAllFormations(this.storage);
  }
  
  // パーティ編成を切り替え
  switchToFormation(id: string): FormationSwitchResult {
    const previousId = this.storage.activeFormationId;
    const formation = switchToFormation(this.storage, id);
    
    if (!formation) {
      return {
        success: false,
        error: '編成が見つかりません'
      };
    }
    
    return {
      success: true,
      formation,
      previousFormationId: previousId || undefined
    };
  }
  
  // アクティブな編成IDを取得
  getActiveFormationId(): string | null {
    return this.storage.activeFormationId;
  }
}
```

---

## Headless UI層

### PartyController拡張

詳細は `HEADLESS_UI_DESIGN.md` の「PartyController」セクションを参照。

主な機能：
- `openFormationMenu()` - 編成管理メニューを開く
- `closeFormationMenu()` - 編成管理メニューを閉じる
- `saveCurrentFormation(id, name)` - 現在の編成を保存
- `loadFormation(id)` - 編成を読み込み
- `deleteFormation(id)` - 編成を削除
- `switchToFormation(id)` - 編成を切り替え

---

## 使用例

### ゲーム初期化時に編成を読み込む

```typescript
// ゲーム開始時
const partyService = new PartyService(coreEngine);

// 保存済み編成を取得
const formations = partyService.getAllFormations();

if (formations.length > 0) {
  // 最後に使用した編成を読み込む
  const lastFormationId = partyService.getActiveFormationId();
  if (lastFormationId) {
    const result = partyService.switchToFormation(lastFormationId);
    if (result.success) {
      currentParty = result.formation!.members;
    }
  }
}
```

### 戦闘前に編成を切り替える

```typescript
// ボス戦用の編成に切り替え
const result = partyService.switchToFormation('boss-formation');

if (result.success) {
  battleService.startBattle(result.formation!.members, enemies);
}
```

### 複数の編成を作成・管理

```typescript
// 通常戦闘用編成
partyService.saveFormation(
  'normal-battles',
  '通常戦闘用',
  [warrior, healer, mage, archer],
  [0, 1, 2, 3]
);

// ボス戦用編成（タンク重視）
partyService.saveFormation(
  'boss-battles',
  'ボス戦用',
  [paladin, warrior, healer, mage],
  [0, 1, 2, 3]
);

// 探索用編成（バランス型）
partyService.saveFormation(
  'exploration',
  '探索用',
  [rogue, ranger, healer, mage],
  [0, 1, 2, 3]
);

// 編成一覧を取得
const allFormations = partyService.getAllFormations();
console.log(`保存済み編成数: ${allFormations.length}`);
```

---

## 拡張性

### カスタム検証ルール

```typescript
// ゲーム固有の制約を追加
function validateCustomPartyRules(members: Character[]): ValidationResult {
  const errors: string[] = [];
  
  // 例: 最低1人のヒーラーが必要
  const healers = members.filter(m => m.job === 'healer');
  if (healers.length === 0) {
    errors.push('パーティには最低1人のヒーラーが必要です');
  }
  
  // 例: 重複する職業は2人まで
  const jobCounts = new Map<string, number>();
  members.forEach(m => {
    jobCounts.set(m.job, (jobCounts.get(m.job) || 0) + 1);
  });
  
  for (const [job, count] of jobCounts) {
    if (count > 2) {
      errors.push(`${job}は最大2人までです`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 編成のインポート/エクスポート

```typescript
// 編成をJSONとしてエクスポート
function exportFormation(formation: PartyFormation): string {
  return JSON.stringify(formation);
}

// JSONから編成をインポート
function importFormation(json: string): PartyFormation {
  return JSON.parse(json);
}

// 使用例
const exported = exportFormation(myFormation);
// ... クリップボードにコピーやファイルに保存

const imported = importFormation(exported);
partyService.saveFormation(
  imported.id,
  imported.name,
  imported.members,
  imported.formationPositions
);
```

### プリセット編成の提供

```typescript
const presetFormations = {
  'balanced': {
    name: 'バランス型',
    positions: [0, 1, 2, 3]
  },
  'offensive': {
    name: '攻撃重視',
    positions: [0, 1, 2, 3]
  },
  'defensive': {
    name: '防御重視',
    positions: [0, 1, 2, 3]
  }
};

// プリセットを適用
function applyPreset(presetName: keyof typeof presetFormations, members: Character[]) {
  const preset = presetFormations[presetName];
  partyService.saveFormation(
    `preset-${presetName}`,
    preset.name,
    members,
    preset.positions
  );
}
```

---

このシステムにより、プレイヤーは状況に応じて最適なパーティ編成を素早く切り替えることができ、戦略的なゲームプレイ体験が向上します。
