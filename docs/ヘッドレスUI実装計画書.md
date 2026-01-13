# ヘッドレスUI実装計画書

**作成日**: 2026-01-13  
**対象**: rpg-core ライブラリ  
**目的**: 既存の16のServiceに対応するヘッドレスUIコントローラー層の実装

---

## 1. 実装概要

### 1.1 目的

rpg-coreライブラリの既存Service層（17サービス）を、任意のUIフレームワーク（React、Vue、Svelteなど）から使用できるようにするため、ヘッドレスUIコントローラー層を実装します。

### 1.2 ヘッドレスUIとは

**ヘッドレスUI**は、ロジックと状態管理を提供するが、実際のレンダリングは行わないUIパターンです。

**主なメリット**:
- **フレームワーク非依存**: React、Vue、Svelteなど任意のUIフレームワークで使用可能
- **ビジネスロジックの再利用**: UI実装を変えても、ロジックは共通
- **テスタビリティ**: UIレンダリングなしでロジックをテスト可能
- **柔軟性**: デザインシステムやコンポーネントライブラリを自由に選択可能

### 1.3 設計方針

- **Observable State**: 状態変更を購読可能にする
- **Event-Driven**: イベントベースの通信
- **Type-Safe**: TypeScriptによる型安全性
- **Immutable**: 状態は不変で、更新時は新しいオブジェクトを生成
- **Single Responsibility**: 各コントローラーは1つのServiceに対応

---

## 2. アーキテクチャ

```
┌─────────────────────────────────────────┐
│     UI Framework (React/Vue/Svelte)     │
│  (レンダリングとユーザー入力のハンドリング) │
└─────────────────┬───────────────────────┘
                  │
                  │ subscribe / dispatch
                  ↓
┌─────────────────────────────────────────┐
│       Headless UI Controllers           │
│  (状態管理、イベント処理、UIロジック)    │
│  - BattleController                     │
│  - CommandController                    │
│  - ItemController                       │
│  etc...                                 │
└─────────────────┬───────────────────────┘
                  │
                  │ call methods
                  ↓
┌─────────────────────────────────────────┐
│            Services                     │
│  (ビジネスロジック、フロー管理)          │
│  - BattleService                        │
│  - CommandService                       │
│  etc...                                 │
└─────────────────┬───────────────────────┘
                  │
                  │ delegate
                  ↓
┌─────────────────────────────────────────┐
│          Core Engine                    │
│  (計算、ルール判定)                      │
└─────────────────────────────────────────┘
```

---

## 3. 実装フェーズ

### Phase 1: 基盤の構築 【優先度: 最高】

**期間**: 2-3日  
**目的**: ヘッドレスUIの共通基盤を構築

#### 実装内容

1. **ObservableState クラス**
   - 状態の購読・通知機能
   - 型安全な状態管理
   - ファイル: `src/ui/core/ObservableState.ts`

2. **EventEmitter クラス**
   - イベントの登録・発火機能
   - 型安全なイベント管理
   - ファイル: `src/ui/core/EventEmitter.ts`

3. **共通型定義**
   - 全コントローラーで共通して使用する型
   - ファイル: `src/ui/types/common.ts`

4. **テスト**
   - ObservableStateのテスト
   - EventEmitterのテスト
   - ファイル: `tests/ui/core/`

#### 成果物
- [ ] `src/ui/core/ObservableState.ts`
- [ ] `src/ui/core/EventEmitter.ts`
- [ ] `src/ui/types/common.ts`
- [ ] `tests/ui/core/ObservableState.test.ts`
- [ ] `tests/ui/core/EventEmitter.test.ts`

---

### Phase 2: 戦闘関連コントローラー 【優先度: 高】

**期間**: 5-7日  
**目的**: ゲームの中核となる戦闘UIを実装

#### 2.1 BattleController

**対応Service**: BattleService  
**ファイル**: `src/ui/controllers/BattleController.ts`

**主な機能**:
- 戦闘の開始・進行管理
- ターン順の管理
- アニメーションキュー
- メッセージシステム
- 戦闘結果の処理

**状態定義**:
```typescript
interface BattleUIState {
  phase: 'initializing' | 'selecting-command' | 'executing-action' | 'animating' | 'ended';
  turnNumber: number;
  playerParty: Character[];
  enemyGroup: Enemy[];
  currentActor: Combatant | null;
  currentAnimation: BattleAnimation | null;
  animationQueue: BattleAnimation[];
  messages: BattleMessage[];
  result: 'victory' | 'defeat' | 'escaped' | null;
  rewards: BattleRewards | null;
  isWaitingForInput: boolean;
  canSkipAnimation: boolean;
}
```

**イベント定義**:
```typescript
type BattleEvents = {
  'battle-started': { party: Character[]; enemies: Enemy[] };
  'turn-started': { turnNumber: number; actor: Combatant };
  'action-executed': { action: BattleAction; result: ActionResult };
  'battle-ended': { result: 'victory' | 'defeat' | 'escaped'; rewards?: BattleRewards };
  'animation-started': BattleAnimation;
  'animation-completed': BattleAnimation;
  'message-added': BattleMessage;
};
```

#### 2.2 CommandController

**対応Service**: CommandService  
**ファイル**: `src/ui/controllers/CommandController.ts`

**主な機能**:
- コマンド選択フロー管理
- スキル・アイテム選択
- ターゲット選択
- ダメージプレビュー
- カーソル移動

**状態定義**:
```typescript
interface CommandUIState {
  stage: 'selecting-command' | 'selecting-skill' | 'selecting-item' | 'selecting-target' | 'confirmed';
  actor: Character | null;
  availableCommands: CommandOption[];
  availableSkills: Skill[];
  availableItems: Item[];
  availableTargets: Combatant[];
  selectedCommand: string | null;
  selectedSkill: Skill | null;
  selectedItem: Item | null;
  selectedTargets: Combatant[];
  cursorIndex: number;
  damagePreview: number | null;
  targetPreview: Combatant | null;
}
```

#### 2.3 StatusEffectController

**対応Service**: StatusEffectService  
**ファイル**: `src/ui/controllers/StatusEffectController.ts`

**主な機能**:
- 状態異常の表示
- フィルタリング（buff/debuff/ailment）
- ソート機能
- 解除試行

**状態定義**:
```typescript
interface StatusEffectUIState {
  target: Combatant | null;
  activeEffects: ActiveStatusEffect[];
  selectedEffect: ActiveStatusEffect | null;
  filterType: 'all' | 'buff' | 'debuff' | 'ailment' | null;
  sortBy: 'duration' | 'severity' | 'name';
  cursorIndex: number;
}
```

#### 成果物
- [ ] `src/ui/controllers/BattleController.ts`
- [ ] `src/ui/controllers/CommandController.ts`
- [ ] `src/ui/controllers/StatusEffectController.ts`
- [ ] `src/ui/types/battle.ts`
- [ ] `src/ui/types/command.ts`
- [ ] `src/ui/types/statusEffect.ts`
- [ ] `tests/ui/controllers/BattleController.test.ts`
- [ ] `tests/ui/controllers/CommandController.test.ts`
- [ ] `tests/ui/controllers/StatusEffectController.test.ts`

---

### Phase 3: 管理系コントローラー 【優先度: 中】

**期間**: 6-8日  
**目的**: アイテム、装備、パーティの管理UIを実装

#### 3.1 InventoryController

**対応Service**: InventoryService  
**ファイル**: `src/ui/controllers/InventoryController.ts`

**主な機能**:
- インベントリの表示
- フィルタリング・ソート
- ページネーション
- アイテム操作（使用・破棄）

#### 3.2 EquipmentController

**対応Service**: EquipmentService  
**ファイル**: `src/ui/controllers/EquipmentController.ts`

**主な機能**:
- 装備変更フロー
- ステータス比較
- 装備可能判定

#### 3.3 PartyController

**対応Service**: PartyService  
**ファイル**: `src/ui/controllers/PartyController.ts`

**主な機能**:
- パーティメンバー選択
- 編成検証
- 隊列変更

#### 3.4 ItemController

**対応Service**: ItemService  
**ファイル**: `src/ui/controllers/ItemController.ts`

**主な機能**:
- アイテム使用フロー
- コンテキスト管理（戦闘/フィールド）
- ターゲット選択
- 効果プレビュー

#### 成果物
- [ ] `src/ui/controllers/InventoryController.ts`
- [ ] `src/ui/controllers/EquipmentController.ts`
- [ ] `src/ui/controllers/PartyController.ts`
- [ ] `src/ui/controllers/ItemController.ts`
- [ ] 対応する型定義ファイル
- [ ] 対応するテストファイル

---

### Phase 4: 成長・報酬系コントローラー 【優先度: 中】

**期間**: 4-5日  
**目的**: キャラクター成長と報酬UIを実装

#### 4.1 RewardController

**対応Service**: RewardService  
**ファイル**: `src/ui/controllers/RewardController.ts`

**主な機能**:
- 報酬表示
- 経験値配分アニメーション
- レベルアップ演出
- 新スキル習得表示

#### 4.2 SkillLearnController

**対応Service**: SkillLearnService  
**ファイル**: `src/ui/controllers/SkillLearnController.ts`

**主な機能**:
- 習得可能スキル表示
- 条件チェック
- コスト表示
- 習得確認フロー

#### 4.3 JobChangeController

**対応Service**: JobChangeService  
**ファイル**: `src/ui/controllers/JobChangeController.ts`

**主な機能**:
- ジョブ選択
- ステータス変化プレビュー
- スキル変更表示
- 転職確認フロー

#### 成果物
- [ ] `src/ui/controllers/RewardController.ts`
- [ ] `src/ui/controllers/SkillLearnController.ts`
- [ ] `src/ui/controllers/JobChangeController.ts`
- [ ] 対応する型定義ファイル
- [ ] 対応するテストファイル

---

### Phase 5: 発展系コントローラー 【優先度: 低】

**期間**: 5-6日  
**目的**: クラフト、強化、ショップ、セーブ/ロードUIを実装

#### 5.1 CraftController

**対応Service**: CraftService  
**ファイル**: `src/ui/controllers/CraftController.ts`

**主な機能**:
- レシピ選択
- 材料チェック
- 成功率表示
- 合成実行

#### 5.2 EnhanceController

**対応Service**: EnhanceService  
**ファイル**: `src/ui/controllers/EnhanceController.ts`

**主な機能**:
- 強化対象選択
- 材料選択
- 成功率計算
- 強化実行

#### 5.3 ShopController

**対応Service**: ShopService  
**ファイル**: `src/ui/controllers/ShopController.ts`

**主な機能**:
- ショップアイテム一覧表示
- アイテム購入フロー
- アイテム売却フロー
- 価格計算とプレビュー
- 在庫管理
- 購入条件チェック

**状態定義**:
```typescript
interface ShopUIState {
  // 段階
  stage: 'browsing' | 'buying' | 'selling' | 'confirming' | 'completed';
  
  // ショップ情報
  shop: Shop | null;
  displayedItems: ShopItem[];
  
  // フィルタ・ソート
  filter: {
    category?: ItemCategory;
    affordable?: boolean;  // 購入可能なアイテムのみ
    purchasable?: boolean;  // 条件を満たすアイテムのみ
  };
  sortBy: 'name' | 'price' | 'level';
  
  // 選択状態
  selectedItem: ShopItem | null;
  selectedQuantity: number;
  transactionType: 'buy' | 'sell' | null;
  
  // プレビュー
  totalPrice: number;
  canAfford: boolean;
  purchaseCondition: {
    canPurchase: boolean;
    reasons: string[];
  } | null;
  
  // 売却候補（プレイヤーのインベントリから）
  sellableItems: Item[];
  
  // カーソル
  cursorIndex: number;
  
  // 結果
  result: ShopTransaction | null;
  isProcessing: boolean;
}
```

**イベント定義**:
```typescript
type ShopEvents = {
  'shop-opened': { shop: Shop };
  'item-selected': { item: ShopItem; type: 'buy' | 'sell' };
  'quantity-changed': { quantity: number };
  'transaction-completed': { result: ShopTransaction };
  'shop-closed': {};
};
```

#### 5.4 SaveLoadController

**対応Service**: SaveLoadService  
**ファイル**: `src/ui/controllers/SaveLoadController.ts`

**主な機能**:
- セーブスロット表示
- セーブ/ロード実行
- スロット情報管理
- エラーハンドリング

#### 成果物
- [ ] `src/ui/controllers/CraftController.ts`
- [ ] `src/ui/controllers/EnhanceController.ts`
- [ ] `src/ui/controllers/ShopController.ts`
- [ ] `src/ui/controllers/SaveLoadController.ts`
- [ ] 対応する型定義ファイル
- [ ] 対応するテストファイル

---

### Phase 6: テストとドキュメント 【優先度: 高】

**期間**: 3-4日  
**目的**: テストとドキュメントの整備

#### 6.1 テスト

**単体テスト**:
- 各コントローラーの動作テスト
- 状態遷移のテスト
- イベント発火のテスト

**統合テスト**:
- コントローラーとServiceの統合テスト
- 複数コントローラーの連携テスト

#### 6.2 ドキュメント

**使用例**:
- React統合例
- Vue統合例
- Svelte統合例

**ベストプラクティス**:
- カスタムフック/Composableの作成方法
- 状態管理ライブラリとの統合
- パフォーマンス最適化

**APIリファレンス**:
- 各コントローラーのAPIドキュメント
- 型定義の説明
- イベントリファレンス

#### 成果物
- [ ] 全コントローラーのテスト（カバレッジ80%以上）
- [ ] `docs/UI_INTEGRATION_GUIDE.md` - UIフレームワーク統合ガイド
- [ ] `docs/CONTROLLER_API_REFERENCE.md` - コントローラーAPIリファレンス
- [ ] `examples/react/` - React統合例
- [ ] `examples/vue/` - Vue統合例
- [ ] `examples/svelte/` - Svelte統合例

---

## 4. ディレクトリ構造

```
rpg-core/
├── src/
│   ├── ui/                          # 新規: ヘッドレスUI層
│   │   ├── core/                    # Phase 1
│   │   │   ├── ObservableState.ts
│   │   │   ├── EventEmitter.ts
│   │   │   └── index.ts
│   │   ├── types/                   # Phase 1-5
│   │   │   ├── common.ts
│   │   │   ├── battle.ts
│   │   │   ├── command.ts
│   │   │   ├── item.ts
│   │   │   ├── inventory.ts
│   │   │   ├── equipment.ts
│   │   │   ├── party.ts
│   │   │   ├── craft.ts
│   │   │   ├── enhance.ts
│   │   │   ├── reward.ts
│   │   │   ├── skill.ts
│   │   │   ├── job.ts
│   │   │   ├── statusEffect.ts
│   │   │   ├── shop.ts
│   │   │   ├── saveLoad.ts
│   │   │   └── index.ts
│   │   ├── controllers/             # Phase 2-5
│   │   │   ├── BattleController.ts
│   │   │   ├── CommandController.ts
│   │   │   ├── StatusEffectController.ts
│   │   │   ├── InventoryController.ts
│   │   │   ├── EquipmentController.ts
│   │   │   ├── PartyController.ts
│   │   │   ├── ItemController.ts
│   │   │   ├── RewardController.ts
│   │   │   ├── SkillLearnController.ts
│   │   │   ├── JobChangeController.ts
│   │   │   ├── CraftController.ts
│   │   │   ├── EnhanceController.ts
│   │   │   ├── ShopController.ts
│   │   │   ├── SaveLoadController.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts                     # エクスポートを更新
├── tests/
│   └── ui/                          # 新規: UIテスト
│       ├── core/
│       │   ├── ObservableState.test.ts
│       │   └── EventEmitter.test.ts
│       └── controllers/
│           ├── BattleController.test.ts
│           ├── CommandController.test.ts
│           └── ... (各コントローラー)
├── examples/                        # 新規: 使用例
│   ├── react/
│   │   ├── package.json
│   │   └── src/
│   ├── vue/
│   │   ├── package.json
│   │   └── src/
│   └── svelte/
│       ├── package.json
│       └── src/
└── docs/
    ├── UI_INTEGRATION_GUIDE.md      # 新規
    └── CONTROLLER_API_REFERENCE.md  # 新規
```

---

## 5. 技術仕様

### 5.1 ObservableState の実装

```typescript
type Listener<T> = (state: T) => void;

export class ObservableState<T> {
  private state: T;
  private listeners: Set<Listener<T>> = new Set();
  
  constructor(initialState: T) {
    this.state = initialState;
  }
  
  getState(): T {
    return this.state;
  }
  
  setState(newState: T | ((prev: T) => T)): void {
    const nextState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(this.state)
      : newState;
    
    this.state = nextState;
    this.notify();
  }
  
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### 5.2 EventEmitter の実装

```typescript
type EventMap = Record<string, any>;
type EventListener<T = any> = (data: T) => void;

export class EventEmitter<Events extends EventMap> {
  private listeners: Map<keyof Events, Set<EventListener>> = new Map();
  
  on<K extends keyof Events>(
    event: K, 
    listener: EventListener<Events[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }
  
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
}
```

### 5.3 コントローラー基本パターン

```typescript
export class ExampleController {
  private state: ObservableState<ExampleUIState>;
  private events: EventEmitter<ExampleEvents>;
  private service: ExampleService;
  
  constructor(service: ExampleService) {
    this.service = service;
    this.state = new ObservableState<ExampleUIState>({ /* 初期状態 */ });
    this.events = new EventEmitter<ExampleEvents>();
  }
  
  // 状態の購読
  subscribe(listener: (state: ExampleUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  // イベントの購読
  on<K extends keyof ExampleEvents>(
    event: K,
    listener: (data: ExampleEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 公開メソッド（UIから呼ばれる）
  async someAction(): Promise<void> {
    // 状態更新
    this.state.setState(prev => ({ ...prev, isLoading: true }));
    
    // Serviceを呼び出し
    const result = await this.service.doSomething();
    
    // 状態更新
    this.state.setState(prev => ({ ...prev, result, isLoading: false }));
    
    // イベント発火
    this.events.emit('action-completed', { result });
  }
}
```

---

## 6. テスト戦略

### 6.1 単体テスト

各コントローラーについて以下をテスト:

1. **初期化テスト**
   - コンストラクタで正しい初期状態が設定されるか
   - Serviceとの連携が正しく設定されるか

2. **状態管理テスト**
   - setState による状態更新が正しく動作するか
   - subscribe で状態変更が通知されるか

3. **イベント管理テスト**
   - イベントが正しく発火されるか
   - リスナーが正しく呼ばれるか

4. **ビジネスロジックテスト**
   - 各メソッドが正しい状態遷移を行うか
   - Serviceメソッドが正しく呼ばれるか

### 6.2 統合テスト

1. **コントローラー連携テスト**
   - BattleController と CommandController の連携
   - InventoryController と ItemController の連携

2. **エンドツーエンドフローテスト**
   - 戦闘開始から終了までの完全なフロー
   - アイテム使用の完全なフロー

### 6.3 テストカバレッジ目標

- **行カバレッジ**: 80%以上
- **分岐カバレッジ**: 75%以上
- **関数カバレッジ**: 90%以上

---

## 7. UIフレームワーク統合例

### 7.1 React統合

```typescript
// カスタムフック
function useBattleController(service: BattleService) {
  const [state, setState] = useState<BattleUIState>();
  const controllerRef = useRef<BattleController>();
  
  useEffect(() => {
    const controller = new BattleController(service);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    return unsubscribe;
  }, [service]);
  
  return {
    state,
    controller: controllerRef.current,
    startBattle: (party: Character[], enemies: Enemy[]) => 
      controllerRef.current?.startBattle(party, enemies)
  };
}
```

### 7.2 Vue統合

```typescript
// Composable
export function useBattleController(service: BattleService) {
  const state = ref<BattleUIState>();
  let controller: BattleController;
  
  onMounted(() => {
    controller = new BattleController(service);
    controller.subscribe((newState) => {
      state.value = newState;
    });
  });
  
  return {
    state,
    startBattle: (party: Character[], enemies: Enemy[]) => 
      controller.startBattle(party, enemies)
  };
}
```

### 7.3 Svelte統合

```typescript
// Store
import { writable } from 'svelte/store';

export function createBattleStore(service: BattleService) {
  const { subscribe, set } = writable<BattleUIState>();
  
  const controller = new BattleController(service);
  controller.subscribe(set);
  
  return {
    subscribe,
    startBattle: (party: Character[], enemies: Enemy[]) =>
      controller.startBattle(party, enemies)
  };
}
```

---

## 8. スケジュール

### 総期間: 約4-5週間

| フェーズ | 期間 | 開始日 | 終了日 |
|---------|------|--------|--------|
| Phase 1: 基盤構築 | 2-3日 | Day 1 | Day 3 |
| Phase 2: 戦闘UI | 5-7日 | Day 4 | Day 10 |
| Phase 3: 管理UI | 6-8日 | Day 11 | Day 18 |
| Phase 4: 成長UI | 4-5日 | Day 19 | Day 23 |
| Phase 5: 発展UI | 5-6日 | Day 24 | Day 29 |
| Phase 6: テスト・ドキュメント | 3-4日 | Day 30 | Day 33 |

---

## 9. リスクと対策

### 9.1 技術的リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| ObservableStateのパフォーマンス問題 | 中 | 大量の状態更新時の最適化、debounce実装 |
| Serviceとの不整合 | 高 | 密接なテストと型定義の活用 |
| メモリリーク | 中 | unsubscribe の適切な実装とテスト |

### 9.2 スケジュールリスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| Phase 2の遅延 | 高 | 最優先で実装、必要に応じて他フェーズを後回し |
| テスト作成の遅延 | 中 | 各フェーズで並行してテスト作成 |

---

## 10. 成功基準

### 10.1 機能面

- [ ] 13のコントローラーすべてが実装されている
- [ ] 各コントローラーが対応するServiceと正しく連携している
- [ ] すべてのコントローラーで状態管理とイベント管理が動作している

### 10.2 品質面

- [ ] テストカバレッジが目標値を達成している
- [ ] すべてのテストがパスしている
- [ ] TypeScriptの型エラーがない

### 10.3 ドキュメント面

- [ ] 各コントローラーのAPIドキュメントが完成している
- [ ] React/Vue/Svelteの統合例が完成している
- [ ] 使用例とベストプラクティスが文書化されている

### 10.4 実用性

- [ ] 実際のUIフレームワークで使用できることが確認されている
- [ ] パフォーマンスが許容範囲内である
- [ ] メモリリークがない

---

## 11. 次のステップ

実装完了後の展開:

1. **npm パッケージとして公開**
   - バージョン 2.0.0 としてリリース
   - ヘッドレスUI対応を大きく宣伝

2. **サンプルプロジェクト作成**
   - 完全なRPGゲームのサンプル
   - 各フレームワーク用のスターターキット

3. **コミュニティフィードバック**
   - 実際の使用例を収集
   - 改善点を反映

4. **パフォーマンス最適化**
   - 大規模ゲームでのベンチマーク
   - 最適化実施

---

## 12. 参考資料

- [ヘッドレスUI設計.md](./ヘッドレスUI設計.md) - 詳細な設計ドキュメント
- [実装状況.md](./実装状況.md) - 現在の実装状況
- [サービス設計.md](./サービス設計.md) - Service層の設計

---

## 付録A: コントローラー一覧

| # | Controller | 対応Service | 優先度 | フェーズ |
|---|-----------|------------|-------|---------|
| 1 | BattleController | BattleService | 最高 | Phase 2 |
| 2 | CommandController | CommandService | 最高 | Phase 2 |
| 3 | StatusEffectController | StatusEffectService | 高 | Phase 2 |
| 4 | InventoryController | InventoryService | 中 | Phase 3 |
| 5 | EquipmentController | EquipmentService | 中 | Phase 3 |
| 6 | PartyController | PartyService | 中 | Phase 3 |
| 7 | ItemController | ItemService | 中 | Phase 3 |
| 8 | RewardController | RewardService | 中 | Phase 4 |
| 9 | SkillLearnController | SkillLearnService | 中 | Phase 4 |
| 10 | JobChangeController | JobChangeService | 中 | Phase 4 |
| 11 | CraftController | CraftService | 低 | Phase 5 |
| 12 | EnhanceController | EnhanceService | 低 | Phase 5 |
| 13 | ShopController | ShopService | 低 | Phase 5 |
| 14 | SaveLoadController | SaveLoadService | 低 | Phase 5 |

**注**: EnemyAIService、EnemyGroupService、SimulationServiceは他のコントローラー内で使用されるため、独立したコントローラーは不要です。

---

## 付録B: 見積もり

### 工数見積もり（1人あたり）

| フェーズ | 実装工数 | テスト工数 | ドキュメント工数 | 合計 |
|---------|---------|-----------|----------------|------|
| Phase 1 | 1.5日 | 0.5日 | 0.5日 | 2.5日 |
| Phase 2 | 4日 | 2日 | 1日 | 7日 |
| Phase 3 | 5日 | 2日 | 1日 | 8日 |
| Phase 4 | 3日 | 1日 | 0.5日 | 4.5日 |
| Phase 5 | 3.5日 | 1日 | 0.5日 | 5日 |
| Phase 6 | 1日 | 1.5日 | 1.5日 | 4日 |
| **合計** | **18.5日** | **8日** | **5日** | **31.5日** |

---

**以上でヘッドレスUI実装計画書を完了します。**
