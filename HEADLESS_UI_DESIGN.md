# Headless UI 設計

rpg-coreの15のServiceを利用するヘッドレスUIレイヤーの設計ドキュメント

## ヘッドレスUIとは

ヘッドレスUIは、**ロジックと状態管理を提供するが、実際のレンダリングは行わない**UIパターンです。

### メリット

1. **フレームワーク非依存**: React、Vue、Svelteなど任意のUIフレームワークで使用可能
2. **ビジネスロジックの再利用**: UI実装を変えても、ロジックは共通
3. **テスタビリティ**: UIレンダリングなしでロジックをテスト可能
4. **柔軟性**: デザインシステムやコンポーネントライブラリを自由に選択可能

### 設計方針

- **Observable State**: 状態変更を購読可能
- **Event-Driven**: イベントベースの通信
- **Type-Safe**: TypeScriptによる型安全性
- **Immutable**: 状態は不変で、更新時は新しいオブジェクトを生成
- **Single Responsibility**: 各コントローラーは1つのServiceに対応

---

## アーキテクチャ

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

## 基本パターン

### Observable State パターン

```typescript
// 基本的なObservableStateの実装
type Listener<T> = (state: T) => void;

class ObservableState<T> {
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
    // 即座に現在の状態を通知
    listener(this.state);
    
    // unsubscribe関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### Event Emitter パターン

```typescript
type EventMap = Record<string, any>;
type EventListener<T = any> = (data: T) => void;

class EventEmitter<Events extends EventMap> {
  private listeners: Map<keyof Events, Set<EventListener>> = new Map();
  
  on<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    // unsubscribe関数を返す
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }
  
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
}
```

---

## 1. BattleController - 戦闘UI制御

### 状態定義

```typescript
interface BattleUIState {
  // 戦闘状態
  phase: 'initializing' | 'selecting-command' | 'executing-action' | 'animating' | 'ended';
  turnNumber: number;
  
  // 参加者
  playerParty: Character[];
  enemyGroup: Enemy[];
  
  // 現在のアクター
  currentActor: Combatant | null;
  
  // アニメーション
  currentAnimation: BattleAnimation | null;
  animationQueue: BattleAnimation[];
  
  // メッセージ
  messages: BattleMessage[];
  
  // 結果
  result: 'victory' | 'defeat' | 'escaped' | null;
  rewards: BattleRewards | null;
  
  // UI制御
  isWaitingForInput: boolean;
  canSkipAnimation: boolean;
}

interface BattleAnimation {
  type: 'damage' | 'heal' | 'skill' | 'status-effect' | 'ko';
  actor: Combatant;
  targets: Combatant[];
  value?: number;
  skillName?: string;
  duration: number;
}

type BattleMessageType = 
  | 'battle-start'
  | 'action-execute'
  | 'damage'
  | 'heal'
  | 'battle-end'
  | 'turn-start';

interface BattleMessageData {
  actorName?: string;
  actionName?: string;
  damage?: number;
  heal?: number;
  result?: 'victory' | 'defeat' | 'escaped';
  turnNumber?: number;
  [key: string]: any; // 拡張可能
}

interface BattleMessage {
  id: string;
  type: BattleMessageType;
  data: BattleMessageData;
  timestamp: number;
}
```

### コントローラー実装

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

class BattleController {
  private state: ObservableState<BattleUIState>;
  private events: EventEmitter<BattleEvents>;
  private service: BattleService;
  private commandController: CommandController;
  
  constructor(service: BattleService) {
    this.service = service;
    this.state = new ObservableState<BattleUIState>({
      phase: 'initializing',
      turnNumber: 0,
      playerParty: [],
      enemyGroup: [],
      currentActor: null,
      currentAnimation: null,
      animationQueue: [],
      messages: [],
      result: null,
      rewards: null,
      isWaitingForInput: false,
      canSkipAnimation: true
    });
    this.events = new EventEmitter<BattleEvents>();
    this.commandController = new CommandController(service.commandService);
  }
  
  // 状態の購読
  subscribe(listener: (state: BattleUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  // イベントの購読
  on<K extends keyof BattleEvents>(
    event: K,
    listener: (data: BattleEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 戦闘開始
  async startBattle(party: Character[], enemies: Enemy[]): Promise<void> {
    await this.service.startBattle(party, enemies);
    
    this.state.setState({
      ...this.state.getState(),
      phase: 'selecting-command',
      playerParty: [...party],
      enemyGroup: [...enemies],
      turnNumber: 1
    });
    
    this.events.emit('battle-started', { party, enemies });
    this.addMessage('battle-start', {});
    
    await this.advanceTurn();
  }
  
  // ターン進行
  private async advanceTurn(): Promise<void> {
    const turnOrder = this.service.getState().turnOrder;
    const currentIndex = this.service.getState().currentActorIndex;
    const actor = turnOrder[currentIndex];
    
    if (!actor) {
      // 戦闘終了チェック
      const endCheck = this.service.checkBattleEnd();
      if (endCheck.isEnded) {
        await this.endBattle(endCheck.result!);
        return;
      }
      
      // 新しいターン開始
      this.state.setState(prev => ({
        ...prev,
        turnNumber: prev.turnNumber + 1
      }));
      await this.service.advanceTurn();
      return this.advanceTurn();
    }
    
    this.state.setState(prev => ({
      ...prev,
      currentActor: actor
    }));
    
    this.events.emit('turn-started', { turnNumber: this.state.getState().turnNumber, actor });
    
    // プレイヤーか敵かで分岐
    if (this.isPlayerCharacter(actor)) {
      // プレイヤーターン - コマンド選択待ち
      this.state.setState(prev => ({
        ...prev,
        phase: 'selecting-command',
        isWaitingForInput: true
      }));
      
      this.commandController.startCommandSelection(actor as Character);
    } else {
      // 敵ターン - AI行動
      this.state.setState(prev => ({
        ...prev,
        phase: 'executing-action',
        isWaitingForInput: false
      }));
      
      const action = await this.service.enemyAIService.decideAction(
        actor as Enemy,
        this.service.getState()
      );
      
      await this.executeAction(action);
    }
  }
  
  // 行動実行
  async executeAction(action: BattleAction): Promise<void> {
    this.state.setState(prev => ({
      ...prev,
      phase: 'executing-action',
      isWaitingForInput: false
    }));
    
    // アクションメッセージ
    this.addMessage('action-execute', {
      actorName: action.actor.name,
      actionName: this.getActionName(action)
    });
    
    // Service経由で実行
    const result = await this.service.executeAction(action.actor, action);
    
    // アニメーション追加
    this.queueAnimation({
      type: this.getAnimationType(action),
      actor: action.actor,
      targets: action.targets,
      value: result.damage || result.heal,
      skillName: action.skill?.name,
      duration: 1000
    });
    
    // 結果メッセージ
    if (result.damage) {
      this.addMessage('damage', { damage: result.damage });
    }
    if (result.heal) {
      this.addMessage('heal', { heal: result.heal });
    }
    
    this.events.emit('action-executed', { action, result });
    
    // アニメーション再生
    await this.playAnimations();
    
    // 次のターンへ
    await this.advanceTurn();
  }
  
  // アニメーション再生
  private async playAnimations(): Promise<void> {
    const queue = this.state.getState().animationQueue;
    
    for (const animation of queue) {
      this.state.setState(prev => ({
        ...prev,
        phase: 'animating',
        currentAnimation: animation
      }));
      
      this.events.emit('animation-started', animation);
      
      // アニメーション時間待機
      await this.wait(animation.duration);
      
      this.events.emit('animation-completed', animation);
    }
    
    // キュークリア
    this.state.setState(prev => ({
      ...prev,
      currentAnimation: null,
      animationQueue: []
    }));
  }
  
  // アニメーションキュー追加
  private queueAnimation(animation: BattleAnimation): void {
    this.state.setState(prev => ({
      ...prev,
      animationQueue: [...prev.animationQueue, animation]
    }));
  }
  
  // メッセージ追加
  private addMessage(type: BattleMessageType, data: BattleMessageData): void {
    const message: BattleMessage = {
      id: `msg-${Date.now()}`,
      type,
      data,
      timestamp: Date.now()
    };
    
    this.state.setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
    
    this.events.emit('message-added', message);
  }
  
  // 戦闘終了
  private async endBattle(result: 'victory' | 'defeat' | 'escaped'): Promise<void> {
    const rewards = result === 'victory' ? this.service.endBattle() : null;
    
    this.state.setState(prev => ({
      ...prev,
      phase: 'ended',
      result,
      rewards,
      isWaitingForInput: false
    }));
    
    this.events.emit('battle-ended', { result, rewards });
    
    this.addMessage('battle-end', { result });
  }
  
  // コマンド決定時のハンドラー
  onCommandConfirmed(action: BattleAction): void {
    this.executeAction(action);
  }
  
  // ユーティリティ
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private isPlayerCharacter(combatant: Combatant): boolean {
    return this.state.getState().playerParty.some(c => c.id === combatant.id);
  }
  
  private getActionName(action: BattleAction): string {
    if (action.type === 'attack') return '攻撃';
    if (action.type === 'skill') return action.skill?.name || 'スキル';
    if (action.type === 'item') return action.item?.name || 'アイテム';
    if (action.type === 'defend') return '防御';
    return '行動';
  }
  
  private getAnimationType(action: BattleAction): BattleAnimation['type'] {
    if (action.type === 'skill') return 'skill';
    return 'damage';
  }
}
```

### 使用例（React）

```typescript
// メッセージフォーマット関数（ゲームごとにカスタマイズ可能）
function formatBattleMessage(message: BattleMessage): string {
  switch (message.type) {
    case 'battle-start':
      return '戦闘開始！';
    case 'action-execute':
      return `${message.data.actorName}の${message.data.actionName}！`;
    case 'damage':
      return `${message.data.damage}のダメージ！`;
    case 'heal':
      return `${message.data.heal}回復！`;
    case 'battle-end':
      if (message.data.result === 'victory') return '勝利！';
      if (message.data.result === 'defeat') return '全滅...';
      if (message.data.result === 'escaped') return '逃げ出した！';
      return '戦闘終了';
    case 'turn-start':
      return `ターン${message.data.turnNumber}`;
    default:
      return '';
  }
}

function BattleScreen() {
  const [state, setState] = useState<BattleUIState>();
  const controllerRef = useRef<BattleController>();
  
  useEffect(() => {
    // コントローラー初期化
    const service = new BattleService(coreEngine);
    const controller = new BattleController(service);
    controllerRef.current = controller;
    
    // 状態購読
    const unsubscribe = controller.subscribe(setState);
    
    // イベント購読
    const unsubscribeMessage = controller.on('message-added', (msg) => {
      console.log('New message:', formatBattleMessage(msg));
    });
    
    // 戦闘開始
    controller.startBattle(party, enemies);
    
    return () => {
      unsubscribe();
      unsubscribeMessage();
    };
  }, []);
  
  if (!state) return <div>Loading...</div>;
  
  // 最新のメッセージを取得してフォーマット
  const currentMessage = state.messages.length > 0 
    ? formatBattleMessage(state.messages[state.messages.length - 1])
    : null;
  
  return (
    <div className="battle-screen">
      <BattleField 
        playerParty={state.playerParty}
        enemyGroup={state.enemyGroup}
        currentAnimation={state.currentAnimation}
      />
      
      <MessageBox message={currentMessage} />
      
      {state.phase === 'selecting-command' && state.isWaitingForInput && (
        <CommandMenu
          actor={state.currentActor}
          onConfirm={(action) => controllerRef.current?.onCommandConfirmed(action)}
        />
      )}
      
      {state.phase === 'ended' && state.result && (
        <BattleResult result={state.result} rewards={state.rewards} />
      )}
    </div>
  );
}
```

### メッセージのカスタマイズ

新しい`BattleMessage`構造では、メッセージタイプとデータを分離することで、各ゲームが独自のメッセージフォーマットを実装できます。

**利点：**

1. **多言語対応**: メッセージタイプとデータから各言語のテキストを生成可能
2. **表現の自由度**: 同じデータから異なるスタイルのメッセージを作成可能
3. **拡張性**: 新しいメッセージタイプを追加しやすい
4. **ログ分析**: メッセージタイプで戦闘ログを分析可能

**使用例：異なるスタイル**

```typescript
// カジュアルなスタイル
function formatCasual(message: BattleMessage): string {
  switch (message.type) {
    case 'action-execute':
      return `${message.data.actorName}が${message.data.actionName}を使った！`;
    case 'damage':
      return `${message.data.damage}ダメージ！`;
    // ...
  }
}

// フォーマルなスタイル
function formatFormal(message: BattleMessage): string {
  switch (message.type) {
    case 'action-execute':
      return `${message.data.actorName}は${message.data.actionName}を実行しました。`;
    case 'damage':
      return `${message.data.damage}ポイントのダメージを与えました。`;
    // ...
  }
}

// 英語版
function formatEnglish(message: BattleMessage): string {
  switch (message.type) {
    case 'action-execute':
      return `${message.data.actorName} used ${message.data.actionName}!`;
    case 'damage':
      return `${message.data.damage} damage!`;
    // ...
  }
}
```

---

## 2. CommandController - コマンド選択UI制御

### 状態定義

```typescript
interface CommandUIState {
  // 選択段階
  stage: 'selecting-command' | 'selecting-skill' | 'selecting-item' | 'selecting-target' | 'confirmed';
  
  // 現在のアクター
  actor: Character | null;
  
  // 選択肢
  availableCommands: CommandOption[];
  availableSkills: Skill[];
  availableItems: Item[];
  availableTargets: Combatant[];
  
  // 選択中
  selectedCommand: string | null;
  selectedSkill: Skill | null;
  selectedItem: Item | null;
  selectedTargets: Combatant[];
  
  // カーソル位置
  cursorIndex: number;
  
  // プレビュー情報
  damagePreview: number | null;
  targetPreview: Combatant | null;
}
```

### コントローラー実装

```typescript
type CommandEvents = {
  'command-selected': { command: string };
  'skill-selected': { skill: Skill };
  'item-selected': { item: Item };
  'target-selected': { target: Combatant };
  'command-confirmed': { action: BattleAction };
  'command-cancelled': {};
};

class CommandController {
  private state: ObservableState<CommandUIState>;
  private events: EventEmitter<CommandEvents>;
  private service: CommandService;
  
  constructor(service: CommandService) {
    this.service = service;
    this.state = new ObservableState<CommandUIState>({
      stage: 'selecting-command',
      actor: null,
      availableCommands: [],
      availableSkills: [],
      availableItems: [],
      availableTargets: [],
      selectedCommand: null,
      selectedSkill: null,
      selectedItem: null,
      selectedTargets: [],
      cursorIndex: 0,
      damagePreview: null,
      targetPreview: null
    });
    this.events = new EventEmitter<CommandEvents>();
  }
  
  subscribe(listener: (state: CommandUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof CommandEvents>(
    event: K,
    listener: (data: CommandEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // コマンド選択開始
  startCommandSelection(actor: Character): void {
    const availableCommands = this.service.getAvailableCommands(actor);
    
    this.state.setState({
      stage: 'selecting-command',
      actor,
      availableCommands,
      availableSkills: [],
      availableItems: [],
      availableTargets: [],
      selectedCommand: null,
      selectedSkill: null,
      selectedItem: null,
      selectedTargets: [],
      cursorIndex: 0,
      damagePreview: null,
      targetPreview: null
    });
  }
  
  // コマンド選択
  selectCommand(command: string): void {
    this.service.selectCommand(command);
    
    this.state.setState(prev => ({
      ...prev,
      selectedCommand: command
    }));
    
    this.events.emit('command-selected', { command });
    
    // 次のステージへ
    switch (command) {
      case 'attack':
        this.moveToTargetSelection();
        break;
      case 'skill':
        this.moveToSkillSelection();
        break;
      case 'item':
        this.moveToItemSelection();
        break;
      case 'defend':
      case 'escape':
        this.confirm();
        break;
    }
  }
  
  // スキル選択へ移動
  private moveToSkillSelection(): void {
    const actor = this.state.getState().actor!;
    const availableSkills = this.service.getUsableSkills(actor);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-skill',
      availableSkills,
      cursorIndex: 0
    }));
  }
  
  // スキル選択
  selectSkill(skill: Skill): void {
    this.service.selectSkill(skill);
    
    this.state.setState(prev => ({
      ...prev,
      selectedSkill: skill
    }));
    
    this.events.emit('skill-selected', { skill });
    this.moveToTargetSelection();
  }
  
  // アイテム選択へ移動
  private moveToItemSelection(): void {
    const availableItems = this.service.getUsableItemsInBattle();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-item',
      availableItems,
      cursorIndex: 0
    }));
  }
  
  // アイテム選択
  selectItem(item: Item): void {
    this.service.selectItem(item);
    
    this.state.setState(prev => ({
      ...prev,
      selectedItem: item
    }));
    
    this.events.emit('item-selected', { item });
    this.moveToTargetSelection();
  }
  
  // ターゲット選択へ移動
  private moveToTargetSelection(): void {
    const availableTargets = this.service.getAvailableTargets();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-target',
      availableTargets,
      cursorIndex: 0
    }));
  }
  
  // ターゲット選択
  selectTarget(target: Combatant): void {
    this.service.selectTarget(target);
    
    this.state.setState(prev => ({
      ...prev,
      selectedTargets: [target],
      targetPreview: target
    }));
    
    this.events.emit('target-selected', { target });
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    let maxIndex = 0;
    
    switch (currentState.stage) {
      case 'selecting-command':
        maxIndex = currentState.availableCommands.length - 1;
        break;
      case 'selecting-skill':
        maxIndex = currentState.availableSkills.length - 1;
        break;
      case 'selecting-item':
        maxIndex = currentState.availableItems.length - 1;
        break;
      case 'selecting-target':
        maxIndex = currentState.availableTargets.length - 1;
        break;
    }
    
    const newIndex = Math.max(0, Math.min(maxIndex, currentState.cursorIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
    
    // ターゲット選択時はプレビュー更新
    if (currentState.stage === 'selecting-target') {
      const target = currentState.availableTargets[newIndex];
      this.updateDamagePreview(target);
    }
  }
  
  // ダメージプレビュー更新
  private updateDamagePreview(target: Combatant): void {
    const actor = this.state.getState().actor!;
    const skill = this.state.getState().selectedSkill;
    
    if (!skill) return;
    
    // Core Engineでダメージ計算（プレビュー用）
    const damagePreview = this.service.previewDamage(actor, target, skill);
    
    this.state.setState(prev => ({
      ...prev,
      damagePreview,
      targetPreview: target
    }));
  }
  
  // 決定
  confirm(): void {
    const action = this.service.confirm();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirmed'
    }));
    
    this.events.emit('command-confirmed', { action });
  }
  
  // キャンセル
  cancel(): void {
    this.service.cancel();
    
    const currentState = this.state.getState();
    
    // ステージを1つ戻す
    switch (currentState.stage) {
      case 'selecting-skill':
      case 'selecting-item':
        this.state.setState(prev => ({
          ...prev,
          stage: 'selecting-command',
          selectedCommand: null,
          cursorIndex: 0
        }));
        break;
        
      case 'selecting-target':
        if (currentState.selectedSkill) {
          this.state.setState(prev => ({
            ...prev,
            stage: 'selecting-skill',
            selectedSkill: null,
            selectedTargets: [],
            cursorIndex: 0
          }));
        } else if (currentState.selectedItem) {
          this.state.setState(prev => ({
            ...prev,
            stage: 'selecting-item',
            selectedItem: null,
            selectedTargets: [],
            cursorIndex: 0
          }));
        } else {
          this.state.setState(prev => ({
            ...prev,
            stage: 'selecting-command',
            selectedCommand: null,
            selectedTargets: [],
            cursorIndex: 0
          }));
        }
        break;
    }
    
    this.events.emit('command-cancelled', {});
  }
}
```

---

## 3. ItemController - アイテム使用UI制御

### 状態定義

```typescript
interface ItemUIState {
  // 使用段階
  stage: 'selecting-item' | 'selecting-target' | 'confirming' | 'applying' | 'completed';
  
  // コンテキスト
  context: 'battle' | 'field';
  
  // アイテム一覧
  availableItems: Item[];
  itemCategories: ItemCategory[];
  currentCategory: ItemCategory | null;
  
  // ターゲット候補（コンテキストに応じて設定）
  allTargets: Combatant[]; // 元のターゲットリスト（フィルタリング前）
  availableTargets: Combatant[]; // 現在利用可能なターゲット（フィルタリング後）
  
  // 選択
  selectedItem: Item | null;
  selectedTargets: Combatant[];
  
  // カーソル
  cursorIndex: number;
  
  // 効果プレビュー
  effectPreview: ItemEffectPreview | null;
  
  // 結果
  result: ItemUseResult | null;
  isProcessing: boolean;
}

interface ItemEffectPreview {
  item: Item;
  target: Combatant;
  expectedHeal?: number;
  expectedDamage?: number;
  statusEffects?: StatusEffect[];
}

interface ItemUseResult {
  success: boolean;
  item: Item;
  targets: Combatant[];
  effects: {
    target: Combatant;
    heal?: number;
    damage?: number;
    statusEffectsApplied?: StatusEffect[];
    statusEffectsRemoved?: StatusEffectType[];
  }[];
  message: string;
}
```

### コントローラー実装

```typescript
type ItemEvents = {
  'item-selected': { item: Item };
  'target-selected': { target: Combatant };
  'item-used': { result: ItemUseResult };
  'item-cancelled': {};
};

class ItemController {
  private state: ObservableState<ItemUIState>;
  private events: EventEmitter<ItemEvents>;
  private service: ItemService;
  
  constructor(service: ItemService) {
    this.service = service;
    this.state = new ObservableState<ItemUIState>({
      stage: 'selecting-item',
      context: 'field',
      availableItems: [],
      itemCategories: [],
      currentCategory: null,
      allTargets: [],
      availableTargets: [],
      selectedItem: null,
      selectedTargets: [],
      cursorIndex: 0,
      effectPreview: null,
      result: null,
      isProcessing: false
    });
    this.events = new EventEmitter<ItemEvents>();
  }
  
  subscribe(listener: (state: ItemUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof ItemEvents>(
    event: K,
    listener: (data: ItemEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // アイテム使用開始（フィールド用）
  startItemUse(context: 'field', party: Character[]): void;
  // アイテム使用開始（戦闘用）
  startItemUse(context: 'battle', party: Character[], enemies: Enemy[]): void;
  startItemUse(context: 'battle' | 'field', party: Character[], enemies?: Enemy[]): void {
    this.service.startItemUse(context);
    
    const availableItems = this.service.getUsableItems(context);
    const categories = this.categorizeItems(availableItems);
    
    // コンテキストに応じてターゲット候補を設定
    // フィールドではパーティメンバーのみ、戦闘では味方と敵の両方
    const allTargets: Combatant[] = context === 'battle' && enemies
      ? [...party, ...enemies]
      : party;
    
    this.state.setState({
      stage: 'selecting-item',
      context,
      availableItems,
      itemCategories: categories,
      currentCategory: categories[0] || null,
      allTargets, // 元のリストを保持
      availableTargets: allTargets, // 初期状態では全ターゲット
      selectedItem: null,
      selectedTargets: [],
      cursorIndex: 0,
      effectPreview: null,
      result: null,
      isProcessing: false
    });
  }
  
  // カテゴリー変更
  selectCategory(category: ItemCategory): void {
    const filteredItems = this.state.getState().availableItems.filter(
      item => item.category === category
    );
    
    this.state.setState(prev => ({
      ...prev,
      currentCategory: category,
      cursorIndex: 0
    }));
  }
  
  // アイテム選択
  selectItem(item: Item): void {
    this.service.selectItem(item);
    
    this.state.setState(prev => ({
      ...prev,
      selectedItem: item
    }));
    
    this.events.emit('item-selected', { item });
    
    // ターゲット選択が必要か判定
    if (this.requiresTargetSelection(item)) {
      this.moveToTargetSelection(item);
    } else {
      // ターゲット不要（全体効果など）
      this.confirm();
    }
  }
  
  // ターゲット選択へ移動
  private moveToTargetSelection(item: Item): void {
    // allTargetsから元のターゲットリストを取得
    const allTargets = this.state.getState().allTargets;
    const filteredTargets = this.filterTargetsByItemType(item, allTargets);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-target',
      availableTargets: filteredTargets, // フィルタリング後のリストのみ更新
      cursorIndex: 0
    }));
  }
  
  // アイテムタイプに応じたターゲットフィルタリング
  private filterTargetsByItemType(item: Item, allTargets: Combatant[]): Combatant[] {
    const context = this.state.getState().context;
    
    if (context === 'field') {
      // フィールドでは常に味方のみ
      return allTargets.filter(t => 'job' in t); // Character判定
    }
    
    // 戦闘中
    switch (item.targetType) {
      case 'ally':
      case 'single-ally':
        // 味方のみ（Character）
        return allTargets.filter(t => 'job' in t && t.currentHp > 0);
        
      case 'enemy':
      case 'single-enemy':
        // 敵のみ（Enemy）
        return allTargets.filter(t => !('job' in t) && t.currentHp > 0);
        
      case 'single':
      case 'any':
        // 味方・敵どちらでも可
        return allTargets.filter(t => t.currentHp > 0);
        
      case 'all-allies':
        // 全味方
        return allTargets.filter(t => 'job' in t);
        
      case 'all-enemies':
        // 全敵
        return allTargets.filter(t => !('job' in t));
        
      case 'all':
        // 全員
        return allTargets;
        
      default:
        return allTargets;
    }
  }
  
  // ターゲット選択
  selectTarget(target: Combatant): void {
    const item = this.state.getState().selectedItem!;
    
    this.service.selectTargets([target]);
    
    // 効果プレビュー更新
    const preview = this.createEffectPreview(item, target);
    
    this.state.setState(prev => ({
      ...prev,
      selectedTargets: [target],
      effectPreview: preview
    }));
    
    this.events.emit('target-selected', { target });
  }
  
  // 効果プレビュー作成
  private createEffectPreview(item: Item, target: Combatant): ItemEffectPreview {
    // Serviceを通じて効果を計算
    const expectedHeal = item.healAmount ? item.healAmount : undefined;
    const expectedDamage = item.damageAmount ? item.damageAmount : undefined;
    const statusEffects = item.statusEffects || [];
    
    return {
      item,
      target,
      expectedHeal,
      expectedDamage,
      statusEffects
    };
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    let maxIndex = 0;
    
    if (currentState.stage === 'selecting-item') {
      const filteredItems = currentState.currentCategory
        ? currentState.availableItems.filter(i => i.category === currentState.currentCategory)
        : currentState.availableItems;
      maxIndex = filteredItems.length - 1;
    } else if (currentState.stage === 'selecting-target') {
      // 利用可能なターゲット数
      maxIndex = currentState.availableTargets.length - 1;
    }
    
    const newIndex = Math.max(0, Math.min(maxIndex, currentState.cursorIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // 確認・使用実行
  async confirm(): Promise<void> {
    this.state.setState(prev => ({
      ...prev,
      stage: 'applying',
      isProcessing: true
    }));
    
    try {
      const result = await this.service.useItem();
      
      this.state.setState(prev => ({
        ...prev,
        stage: 'completed',
        result: result as ItemUseResult,
        isProcessing: false
      }));
      
      this.events.emit('item-used', { result: result as ItemUseResult });
    } catch (error) {
      // エラー処理
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-item',
        isProcessing: false
      }));
    }
  }
  
  // キャンセル
  cancel(): void {
    this.service.cancel();
    
    const currentState = this.state.getState();
    
    if (currentState.stage === 'selecting-target') {
      // アイテム選択に戻る
      // allTargetsを保持しているので、availableTargetsをリセット
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-item',
        selectedItem: null,
        selectedTargets: [],
        availableTargets: prev.allTargets, // 元のリストに戻す
        effectPreview: null,
        cursorIndex: 0
      }));
    } else {
      // 完全にキャンセル
      this.events.emit('item-cancelled', {});
    }
  }
  
  // ユーティリティ
  private requiresTargetSelection(item: Item): boolean {
    // 全体効果以外はターゲット選択が必要
    return item.targetType !== 'all' && 
           item.targetType !== 'all-allies' && 
           item.targetType !== 'all-enemies';
  }
  
  private categorizeItems(items: Item[]): ItemCategory[] {
    const categories = new Set(items.map(item => item.category));
    return Array.from(categories);
  }
}
```

### 使用例（React）

```typescript
// フィールドでの使用例
function ItemMenuField() {
  const [state, setState] = useState<ItemUIState>();
  const controllerRef = useRef<ItemController>();
  
  useEffect(() => {
    const service = new ItemService(coreEngine);
    const controller = new ItemController(service);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    // フィールドではパーティのみ渡す
    controller.startItemUse('field', party);
    
    return unsubscribe;
  }, []);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="item-menu">
      {state.stage === 'selecting-item' && (
        <ItemList
          items={state.availableItems}
          categories={state.itemCategories}
          currentCategory={state.currentCategory}
          cursorIndex={state.cursorIndex}
          onSelectItem={(item) => controllerRef.current?.selectItem(item)}
          onSelectCategory={(cat) => controllerRef.current?.selectCategory(cat)}
        />
      )}
      
      {state.stage === 'selecting-target' && (
        <TargetSelection
          targets={state.availableTargets}
          selectedTargets={state.selectedTargets}
          preview={state.effectPreview}
          onSelectTarget={(target) => controllerRef.current?.selectTarget(target)}
        />
      )}
      
      {state.stage === 'completed' && state.result && (
        <ItemUseResult result={state.result} />
      )}
    </div>
  );
}

// 戦闘中での使用例
function ItemMenuBattle({ party, enemies }: { party: Character[]; enemies: Enemy[] }) {
  const [state, setState] = useState<ItemUIState>();
  const controllerRef = useRef<ItemController>();
  
  useEffect(() => {
    const service = new ItemService(coreEngine);
    const controller = new ItemController(service);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    // 戦闘中はパーティと敵を両方渡す
    controller.startItemUse('battle', party, enemies);
    
    return unsubscribe;
  }, [party, enemies]);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="item-menu-battle">
      {state.stage === 'selecting-item' && (
        <ItemList
          items={state.availableItems}
          categories={state.itemCategories}
          currentCategory={state.currentCategory}
          cursorIndex={state.cursorIndex}
          onSelectItem={(item) => controllerRef.current?.selectItem(item)}
          onSelectCategory={(cat) => controllerRef.current?.selectCategory(cat)}
        />
      )}
      
      {state.stage === 'selecting-target' && (
        <BattleTargetSelection
          allies={party}
          enemies={enemies}
          availableTargets={state.availableTargets}
          selectedTargets={state.selectedTargets}
          preview={state.effectPreview}
          onSelectTarget={(target) => controllerRef.current?.selectTarget(target)}
        />
      )}
      
      {state.stage === 'completed' && state.result && (
        <ItemUseResult result={state.result} />
      )}
    </div>
  );
}
```

---

## 4. EquipmentController - 装備変更UI制御

### 状態定義

```typescript
interface EquipmentUIState {
  // 対象キャラクター
  character: Character | null;
  
  // 選択段階
  stage: 'selecting-slot' | 'selecting-equipment' | 'confirming' | 'completed';
  
  // スロット
  selectedSlot: EquipmentType | null;
  availableSlots: EquipmentType[];
  currentEquipment: Map<EquipmentType, Equipment | null>;
  
  // 装備一覧
  availableEquipment: Equipment[];
  selectedEquipment: Equipment | null;
  
  // 比較・プレビュー
  comparison: EquipmentComparison | null;
  previewStats: Stats | null;
  
  // カーソル
  cursorIndex: number;
  
  // 結果
  result: EquipResult | null;
}

interface EquipmentComparison {
  slot: EquipmentType;
  current: Equipment | null;
  new: Equipment;
  statDifferences: {
    [key: string]: number; // 'attack': +10, 'defense': -5, etc.
  };
  betterStats: string[];
  worseStats: string[];
}

interface EquipResult {
  success: boolean;
  character: Character;
  slot: EquipmentType;
  equipped: Equipment | null;
  unequipped: Equipment | null;
  newStats: Stats;
}
```

### コントローラー実装

```typescript
type EquipmentEvents = {
  'slot-selected': { slot: EquipmentType };
  'equipment-selected': { equipment: Equipment };
  'equipment-equipped': { result: EquipResult };
  'equipment-unequipped': { slot: EquipmentType };
  'cancelled': {};
};

class EquipmentController {
  private state: ObservableState<EquipmentUIState>;
  private events: EventEmitter<EquipmentEvents>;
  private service: EquipmentService;
  private equipmentSlotConfig: EquipmentType[];
  
  constructor(service: EquipmentService, equipmentSlotConfig?: EquipmentType[]) {
    this.service = service;
    // デフォルトのスロット構成。使用者が独自の構成を渡すことも可能
    // 装備スロット構成の詳細は CORE_ENGINE_EXTENSIBILITY.md の「装備スロット構成」を参照
    this.equipmentSlotConfig = equipmentSlotConfig || ['weapon', 'armor', 'accessory'] as EquipmentType[];
    
    this.state = new ObservableState<EquipmentUIState>({
      character: null,
      stage: 'selecting-slot',
      selectedSlot: null,
      availableSlots: [],
      currentEquipment: new Map(),
      availableEquipment: [],
      selectedEquipment: null,
      comparison: null,
      previewStats: null,
      cursorIndex: 0,
      result: null
    });
    this.events = new EventEmitter<EquipmentEvents>();
  }
  
  subscribe(listener: (state: EquipmentUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof EquipmentEvents>(
    event: K,
    listener: (data: EquipmentEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 装備変更開始
  startEquipmentChange(character: Character): void {
    const availableSlots = this.getAvailableSlots(character);
    const currentEquipment = this.getCurrentEquipment(character);
    
    this.state.setState({
      character,
      stage: 'selecting-slot',
      selectedSlot: null,
      availableSlots,
      currentEquipment,
      availableEquipment: [],
      selectedEquipment: null,
      comparison: null,
      previewStats: null,
      cursorIndex: 0,
      result: null
    });
  }
  
  // スロット選択
  selectSlot(slot: EquipmentType): void {
    const character = this.state.getState().character!;
    
    // そのスロットに装備可能な装備を取得
    const availableEquipment = this.service.getEquipableItems(character, slot);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-equipment',
      selectedSlot: slot,
      availableEquipment,
      cursorIndex: 0
    }));
    
    this.events.emit('slot-selected', { slot });
  }
  
  // 装備選択
  selectEquipment(equipment: Equipment): void {
    const character = this.state.getState().character!;
    const slot = this.state.getState().selectedSlot!;
    const currentEquip = this.state.getState().currentEquipment.get(slot);
    
    // 装備比較を作成
    const comparison = this.service.compareEquipment(character, currentEquip || null, equipment);
    
    // ステータスプレビューを作成
    const previewStats = this.calculatePreviewStats(character, slot, equipment);
    
    this.state.setState(prev => ({
      ...prev,
      selectedEquipment: equipment,
      comparison: comparison as EquipmentComparison,
      previewStats
    }));
    
    this.events.emit('equipment-selected', { equipment });
  }
  
  // 装備確定
  async equipItem(): Promise<void> {
    const character = this.state.getState().character!;
    const slot = this.state.getState().selectedSlot!;
    const equipment = this.state.getState().selectedEquipment!;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
    
    const result = this.service.equipItem(character, equipment, slot);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed',
      result: result as EquipResult,
      currentEquipment: this.getCurrentEquipment(character)
    }));
    
    this.events.emit('equipment-equipped', { result: result as EquipResult });
  }
  
  // 装備解除
  async unequipItem(slot: EquipmentType): Promise<void> {
    const character = this.state.getState().character!;
    
    this.service.unequipItem(character, slot);
    
    this.state.setState(prev => ({
      ...prev,
      currentEquipment: this.getCurrentEquipment(character),
      stage: 'selecting-slot'
    }));
    
    this.events.emit('equipment-unequipped', { slot });
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    let maxIndex = 0;
    
    if (currentState.stage === 'selecting-slot') {
      maxIndex = currentState.availableSlots.length - 1;
    } else if (currentState.stage === 'selecting-equipment') {
      maxIndex = currentState.availableEquipment.length - 1;
    }
    
    const newIndex = Math.max(0, Math.min(maxIndex, currentState.cursorIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'selecting-equipment') {
      // スロット選択に戻る
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-slot',
        selectedSlot: null,
        selectedEquipment: null,
        comparison: null,
        previewStats: null,
        cursorIndex: 0
      }));
    } else {
      // 完全にキャンセル
      this.events.emit('cancelled', {});
    }
  }
  
  // ユーティリティ
  private getAvailableSlots(character: Character): EquipmentType[] {
    // 設定されたスロット構成を使用
    // Characterオブジェクトから動的に取得する実装も可能
    return [...this.equipmentSlotConfig];
  }
  
  private getCurrentEquipment(character: Character): Map<EquipmentType, Equipment | null> {
    const equipmentMap = new Map<EquipmentType, Equipment | null>();
    
    // 設定されたスロットに基づいて装備を取得
    for (const slotType of this.equipmentSlotConfig) {
      // character.equipmentオブジェクトから動的にアクセス
      const equipment = character.equipment[slotType as string] || null;
      equipmentMap.set(slotType, equipment);
    }
    
    return equipmentMap;
  }
  
  private calculatePreviewStats(character: Character, slot: EquipmentType, newEquipment: Equipment): Stats {
    // Serviceを通じて新しいステータスを計算
    return this.service.calculateStatsWithEquipment(character, slot, newEquipment);
  }
}
```

### 使用例（React）

```typescript
function EquipmentScreen({ character }: { character: Character }) {
  const [state, setState] = useState<EquipmentUIState>();
  const controllerRef = useRef<EquipmentController>();
  
  useEffect(() => {
    const service = new EquipmentService(coreEngine);
    
    // デフォルトのスロット構成を使用する場合
    const controller = new EquipmentController(service);
    
    // カスタムスロット構成を使用する場合の例
    // const customSlots: EquipmentType[] = ['weapon', 'shield', 'helmet', 'armor', 'boots', 'accessory1', 'accessory2'];
    // const controller = new EquipmentController(service, customSlots);
    
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    controller.startEquipmentChange(character);
    
    return unsubscribe;
  }, [character]);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="equipment-screen">
      <CharacterStats character={state.character!} previewStats={state.previewStats} />
      
      {state.stage === 'selecting-slot' && (
        <EquipmentSlotList
          slots={state.availableSlots}
          currentEquipment={state.currentEquipment}
          cursorIndex={state.cursorIndex}
          onSelectSlot={(slot) => controllerRef.current?.selectSlot(slot)}
          onUnequip={(slot) => controllerRef.current?.unequipItem(slot)}
        />
      )}
      
      {state.stage === 'selecting-equipment' && (
        <>
          <EquipmentList
            equipment={state.availableEquipment}
            cursorIndex={state.cursorIndex}
            onSelectEquipment={(eq) => controllerRef.current?.selectEquipment(eq)}
          />
          
          {state.comparison && (
            <EquipmentComparison comparison={state.comparison} />
          )}
        </>
      )}
    </div>
  );
}

// ExtensibleConfigから装備スロット構成を取得する例
function EquipmentScreenWithConfig({ character, coreEngine }: { 
  character: Character; 
  coreEngine: ExtensibleCoreEngine;
}) {
  const [state, setState] = useState<EquipmentUIState>();
  const controllerRef = useRef<EquipmentController>();
  
  useEffect(() => {
    const service = new EquipmentService(coreEngine);
    
    // Core Engineの拡張設定から装備スロットを取得
    // CORE_ENGINE_EXTENSIBILITY.mdで定義された構成を使用
    const equipmentSlots = coreEngine.config.definitions.equipmentSlots || ['weapon', 'armor', 'accessory'];
    const controller = new EquipmentController(service, equipmentSlots);
    
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(setState);
    controller.startEquipmentChange(character);
    
    return unsubscribe;
  }, [character, coreEngine]);
  
  // ... rest of the component
}

// プリセット構成を使用する例
function EquipmentScreenWithPreset({ character, presetName }: { 
  character: Character; 
  presetName: 'simple' | 'advanced' | 'action-rpg' | 'minimal';
}) {
  const [state, setState] = useState<EquipmentUIState>();
  const controllerRef = useRef<EquipmentController>();
  
  useEffect(() => {
    const service = new EquipmentService(coreEngine);
    
    // CORE_ENGINE_EXTENSIBILITY.mdで定義されたプリセットを使用
    const equipmentConfigPresets = {
      'simple': ['weapon', 'armor', 'shield', 'accessory'],
      'advanced': ['weapon', 'offhand', 'head', 'body', 'arms', 'accessory1', 'accessory2'],
      'action-rpg': ['mainWeapon', 'subWeapon', 'armor', 'charm'],
      'minimal': ['weapon', 'armor', 'accessory']
    };
    
    const equipmentSlots = equipmentConfigPresets[presetName];
    const controller = new EquipmentController(service, equipmentSlots);
    
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(setState);
    controller.startEquipmentChange(character);
    
    return unsubscribe;
  }, [character, presetName]);
  
  // ... rest of the component
}
```

**装備スロット構成について**:
- 装備スロットの定義方法については `CORE_ENGINE_EXTENSIBILITY.md` の「装備スロット構成」セクションを参照
- ゲームごとに自由にスロット構成を定義可能
- プリセット構成（simple, advanced, action-rpg, minimal）を利用可能

---

## 5. PartyController - パーティ編成UI制御

### 状態定義

```typescript
interface PartyUIState {
  // 全キャラクター
  allCharacters: Character[];
  
  // 現在のパーティ
  currentParty: Character[];
  
  // 編成段階
  stage: 'selecting-member' | 'reordering' | 'confirming' | 'completed';
  
  // 選択
  selectedCharacter: Character | null;
  selectedPosition: number | null;
  
  // パーティ制約
  maxPartySize: number;
  minPartySize: number;
  
  // 隊列
  formationPositions: number[];
  
  // ドラッグ&ドロップ状態
  isDragging: boolean;
  draggedCharacter: Character | null;
  draggedFromPosition: number | null;
  
  // カーソル
  cursorIndex: number;
  
  // プレビュー
  previewParty: Character[] | null;
  partyStats: PartyStats | null;
}

interface PartyStats {
  totalLevel: number;
  averageLevel: number;
  totalHp: number;
  totalMp: number;
  physicalAttackers: number;
  magicalAttackers: number;
  healers: number;
  tanks: number;
}
```

### コントローラー実装

```typescript
type PartyEvents = {
  'member-added': { character: Character; position: number };
  'member-removed': { character: Character; position: number };
  'members-swapped': { position1: number; position2: number };
  'formation-changed': { formation: number[] };
  'party-confirmed': { party: Character[] };
  'cancelled': {};
};

class PartyController {
  private state: ObservableState<PartyUIState>;
  private events: EventEmitter<PartyEvents>;
  private service: PartyService;
  
  constructor(service: PartyService) {
    this.service = service;
    this.state = new ObservableState<PartyUIState>({
      allCharacters: [],
      currentParty: [],
      stage: 'selecting-member',
      selectedCharacter: null,
      selectedPosition: null,
      maxPartySize: 4,
      minPartySize: 1,
      formationPositions: [0, 1, 2, 3],
      isDragging: false,
      draggedCharacter: null,
      draggedFromPosition: null,
      cursorIndex: 0,
      previewParty: null,
      partyStats: null
    });
    this.events = new EventEmitter<PartyEvents>();
  }
  
  subscribe(listener: (state: PartyUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof PartyEvents>(
    event: K,
    listener: (data: PartyEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // パーティ編成開始
  startPartyFormation(allCharacters: Character[], currentParty: Character[]): void {
    const partyStats = this.calculatePartyStats(currentParty);
    
    this.state.setState({
      allCharacters,
      currentParty: [...currentParty],
      stage: 'selecting-member',
      selectedCharacter: null,
      selectedPosition: null,
      maxPartySize: 4,
      minPartySize: 1,
      formationPositions: currentParty.map((_, i) => i),
      isDragging: false,
      draggedCharacter: null,
      draggedFromPosition: null,
      cursorIndex: 0,
      previewParty: null,
      partyStats
    });
  }
  
  // メンバー追加
  addMember(character: Character, position?: number): void {
    const currentState = this.state.getState();
    
    if (currentState.currentParty.length >= currentState.maxPartySize) {
      // パーティが満員
      return;
    }
    
    const targetPosition = position !== undefined 
      ? position 
      : currentState.currentParty.length;
    
    const result = this.service.addMember(currentState.currentParty, character);
    
    if (result.success) {
      const newParty = [...currentState.currentParty];
      newParty.splice(targetPosition, 0, character);
      
      this.state.setState(prev => ({
        ...prev,
        currentParty: newParty,
        partyStats: this.calculatePartyStats(newParty)
      }));
      
      this.events.emit('member-added', { character, position: targetPosition });
    }
  }
  
  // メンバー削除
  removeMember(position: number): void {
    const currentState = this.state.getState();
    const character = currentState.currentParty[position];
    
    if (!character) return;
    
    if (currentState.currentParty.length <= currentState.minPartySize) {
      // 最小人数を下回る
      return;
    }
    
    const result = this.service.removeMember(currentState.currentParty, character);
    
    if (result.success) {
      const newParty = currentState.currentParty.filter((_, i) => i !== position);
      
      this.state.setState(prev => ({
        ...prev,
        currentParty: newParty,
        partyStats: this.calculatePartyStats(newParty)
      }));
      
      this.events.emit('member-removed', { character, position });
    }
  }
  
  // メンバー入れ替え
  swapMembers(position1: number, position2: number): void {
    const currentState = this.state.getState();
    
    const result = this.service.swapMembers(currentState.currentParty, position1, position2);
    
    if (result.success) {
      const newParty = [...currentState.currentParty];
      [newParty[position1], newParty[position2]] = [newParty[position2], newParty[position1]];
      
      this.state.setState(prev => ({
        ...prev,
        currentParty: newParty
      }));
      
      this.events.emit('members-swapped', { position1, position2 });
    }
  }
  
  // ドラッグ開始
  startDrag(character: Character, position: number): void {
    this.state.setState(prev => ({
      ...prev,
      isDragging: true,
      draggedCharacter: character,
      draggedFromPosition: position
    }));
  }
  
  // ドロップ
  drop(targetPosition: number): void {
    const currentState = this.state.getState();
    
    if (!currentState.isDragging || currentState.draggedFromPosition === null) {
      return;
    }
    
    // パーティ内での移動か、外からの追加かを判定
    if (currentState.draggedFromPosition >= 0) {
      // パーティ内での入れ替え
      this.swapMembers(currentState.draggedFromPosition, targetPosition);
    } else {
      // 新規追加
      if (currentState.draggedCharacter) {
        this.addMember(currentState.draggedCharacter, targetPosition);
      }
    }
    
    this.endDrag();
  }
  
  // ドラッグ終了
  endDrag(): void {
    this.state.setState(prev => ({
      ...prev,
      isDragging: false,
      draggedCharacter: null,
      draggedFromPosition: null
    }));
  }
  
  // 隊列変更
  changeFormation(formation: number[]): void {
    const currentState = this.state.getState();
    
    const result = this.service.changeFormation(currentState.currentParty, formation);
    
    if (result.success) {
      this.state.setState(prev => ({
        ...prev,
        formationPositions: formation
      }));
      
      this.events.emit('formation-changed', { formation });
    }
  }
  
  // 確認
  confirm(): void {
    const currentState = this.state.getState();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed'
    }));
    
    this.events.emit('party-confirmed', { party: currentState.currentParty });
  }
  
  // キャンセル
  cancel(): void {
    this.events.emit('cancelled', {});
  }
  
  // パーティ統計計算
  private calculatePartyStats(party: Character[]): PartyStats {
    if (party.length === 0) {
      return {
        totalLevel: 0,
        averageLevel: 0,
        totalHp: 0,
        totalMp: 0,
        physicalAttackers: 0,
        magicalAttackers: 0,
        healers: 0,
        tanks: 0
      };
    }
    
    const totalLevel = party.reduce((sum, c) => sum + c.level, 0);
    const totalHp = party.reduce((sum, c) => sum + c.currentHp, 0);
    const totalMp = party.reduce((sum, c) => sum + c.currentMp, 0);
    
    // 役割の判定（簡易版）
    const physicalAttackers = party.filter(c => c.stats.attack > c.stats.magic).length;
    const magicalAttackers = party.filter(c => c.stats.magic > c.stats.attack).length;
    const healers = party.filter(c => c.skills.some(s => s.type === 'heal')).length;
    const tanks = party.filter(c => c.stats.defense > 50).length;
    
    return {
      totalLevel,
      averageLevel: totalLevel / party.length,
      totalHp,
      totalMp,
      physicalAttackers,
      magicalAttackers,
      healers,
      tanks
    };
  }
}
```

### 使用例（React）

```typescript
function PartyFormationScreen() {
  const [state, setState] = useState<PartyUIState>();
  const controllerRef = useRef<PartyController>();
  
  useEffect(() => {
    const service = new PartyService(coreEngine);
    const controller = new PartyController(service);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    controller.startPartyFormation(allCharacters, currentParty);
    
    return unsubscribe;
  }, []);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="party-formation">
      <PartyStats stats={state.partyStats} />
      
      <div className="party-slots">
        {Array.from({ length: state.maxPartySize }).map((_, i) => (
          <PartySlot
            key={i}
            position={i}
            character={state.currentParty[i]}
            onDrop={(pos) => controllerRef.current?.drop(pos)}
            onRemove={() => controllerRef.current?.removeMember(i)}
          />
        ))}
      </div>
      
      <CharacterList
        characters={state.allCharacters.filter(
          c => !state.currentParty.includes(c)
        )}
        onDragStart={(char, pos) => controllerRef.current?.startDrag(char, pos)}
      />
      
      <button onClick={() => controllerRef.current?.confirm()}>
        確定
      </button>
    </div>
  );
}
```

---

## 6. CraftController - アイテム合成UI制御

### 状態定義

```typescript
interface CraftUIState {
  // 選択段階
  stage: 'selecting-recipe' | 'confirming' | 'synthesizing' | 'completed';
  
  // レシピ
  availableRecipes: Recipe[];
  selectedRecipe: Recipe | null;
  
  // 材料チェック
  materialCheck: RecipeCheckResult | null;
  
  // 合成
  successRate: number;
  isProcessing: boolean;
  
  // 結果
  result: SynthesisResult | null;
  
  // カーソル
  cursorIndex: number;
  
  // フィルタ
  categoryFilter: CraftCategory | null;
  availableOnlyFilter: boolean;
}

interface RecipeCheckResult {
  recipe: Recipe;
  canCraft: boolean;
  missingMaterials: {
    item: Item;
    required: number;
    current: number;
  }[];
  availableMaterials: {
    item: Item;
    required: number;
    current: number;
  }[];
}

interface SynthesisResult {
  success: boolean;
  recipe: Recipe;
  resultItem: Item | null;
  bonusItems: Item[];
  materialsConsumed: Item[];
  materialsReturned: Item[];
  message: string;
}
```

### コントローラー実装

```typescript
type CraftEvents = {
  'recipe-selected': { recipe: Recipe };
  'synthesis-started': { recipe: Recipe };
  'synthesis-completed': { result: SynthesisResult };
  'cancelled': {};
};

class CraftController {
  private state: ObservableState<CraftUIState>;
  private events: EventEmitter<CraftEvents>;
  private service: CraftService;
  
  constructor(service: CraftService, private inventory: Inventory) {
    this.service = service;
    this.state = new ObservableState<CraftUIState>({
      stage: 'selecting-recipe',
      availableRecipes: [],
      selectedRecipe: null,
      materialCheck: null,
      successRate: 0,
      isProcessing: false,
      result: null,
      cursorIndex: 0,
      categoryFilter: null,
      availableOnlyFilter: false
    });
    this.events = new EventEmitter<CraftEvents>();
  }
  
  subscribe(listener: (state: CraftUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof CraftEvents>(
    event: K,
    listener: (data: CraftEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // クラフト開始
  startCrafting(): void {
    const availableRecipes = this.service.getAvailableRecipes();
    
    this.state.setState({
      stage: 'selecting-recipe',
      availableRecipes,
      selectedRecipe: null,
      materialCheck: null,
      successRate: 0,
      isProcessing: false,
      result: null,
      cursorIndex: 0,
      categoryFilter: null,
      availableOnlyFilter: false
    });
  }
  
  // レシピ選択
  selectRecipe(recipe: Recipe): void {
    // 材料チェック
    const materialCheck = this.service.checkMaterials(recipe, this.inventory);
    
    // 成功率取得
    const successRate = this.calculateSuccessRate(recipe);
    
    this.state.setState(prev => ({
      ...prev,
      selectedRecipe: recipe,
      materialCheck: materialCheck as RecipeCheckResult,
      successRate
    }));
    
    this.events.emit('recipe-selected', { recipe });
  }
  
  // フィルタ設定
  setFilter(category: CraftCategory | null, availableOnly: boolean): void {
    this.state.setState(prev => ({
      ...prev,
      categoryFilter: category,
      availableOnlyFilter: availableOnly,
      cursorIndex: 0
    }));
  }
  
  // フィルタリングされたレシピを取得
  getFilteredRecipes(): Recipe[] {
    const currentState = this.state.getState();
    let recipes = currentState.availableRecipes;
    
    // カテゴリフィルタ
    if (currentState.categoryFilter) {
      recipes = recipes.filter(r => r.category === currentState.categoryFilter);
    }
    
    // 作成可能フィルタ
    if (currentState.availableOnlyFilter) {
      recipes = recipes.filter(r => {
        const check = this.service.checkMaterials(r, this.inventory);
        return check.canCraft;
      });
    }
    
    return recipes;
  }
  
  // 確認画面へ
  moveToConfirming(): void {
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
  }
  
  // 合成実行
  async synthesize(): Promise<void> {
    const recipe = this.state.getState().selectedRecipe!;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'synthesizing',
      isProcessing: true
    }));
    
    this.events.emit('synthesis-started', { recipe });
    
    try {
      // 合成実行
      const result = this.service.synthesize(recipe, this.inventory);
      
      this.state.setState(prev => ({
        ...prev,
        stage: 'completed',
        result: result as SynthesisResult,
        isProcessing: false
      }));
      
      this.events.emit('synthesis-completed', { result: result as SynthesisResult });
    } catch (error) {
      // エラー処理
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-recipe',
        isProcessing: false
      }));
    }
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const filteredRecipes = this.getFilteredRecipes();
    const maxIndex = filteredRecipes.length - 1;
    const currentIndex = this.state.getState().cursorIndex;
    
    const newIndex = Math.max(0, Math.min(maxIndex, currentIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'confirming') {
      // レシピ選択に戻る
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-recipe'
      }));
    } else {
      // 完全にキャンセル
      this.events.emit('cancelled', {});
    }
  }
  
  // 成功率計算
  private calculateSuccessRate(recipe: Recipe): number {
    // Serviceを通じて成功率を計算
    return recipe.baseSuccessRate || 100;
  }
}
```

### 使用例（React）

```typescript
function CraftScreen() {
  const [state, setState] = useState<CraftUIState>();
  const controllerRef = useRef<CraftController>();
  
  useEffect(() => {
    const service = new CraftService(coreEngine);
    const controller = new CraftController(service, inventory);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    controller.startCrafting();
    
    return unsubscribe;
  }, []);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="craft-screen">
      {state.stage === 'selecting-recipe' && (
        <>
          <RecipeFilters
            categoryFilter={state.categoryFilter}
            availableOnlyFilter={state.availableOnlyFilter}
            onFilterChange={(cat, avail) => 
              controllerRef.current?.setFilter(cat, avail)
            }
          />
          
          <RecipeList
            recipes={controllerRef.current?.getFilteredRecipes() || []}
            cursorIndex={state.cursorIndex}
            onSelectRecipe={(recipe) => controllerRef.current?.selectRecipe(recipe)}
          />
          
          {state.selectedRecipe && state.materialCheck && (
            <RecipeDetail
              recipe={state.selectedRecipe}
              materialCheck={state.materialCheck}
              successRate={state.successRate}
              onConfirm={() => controllerRef.current?.moveToConfirming()}
            />
          )}
        </>
      )}
      
      {state.stage === 'confirming' && (
        <ConfirmDialog
          recipe={state.selectedRecipe!}
          onConfirm={() => controllerRef.current?.synthesize()}
          onCancel={() => controllerRef.current?.cancel()}
        />
      )}
      
      {state.stage === 'synthesizing' && (
        <SynthesisAnimation isProcessing={state.isProcessing} />
      )}
      
      {state.stage === 'completed' && state.result && (
        <SynthesisResult result={state.result} />
      )}
    </div>
  );
}
```

---

## 7. SkillLearnController - スキル習得UI制御

### 状態定義

```typescript
interface SkillLearnUIState {
  // 対象キャラクター
  character: Character | null;
  
  // 選択段階
  stage: 'selecting-skill' | 'confirming' | 'completed';
  
  // スキル
  learnableSkills: Skill[];
  selectedSkill: Skill | null;
  
  // 条件
  learnCondition: LearnConditionCheck | null;
  
  // コスト
  cost: SkillLearnCost | null;
  
  // カーソル
  cursorIndex: number;
  
  // 結果
  result: LearnResult | null;
}

interface LearnConditionCheck {
  skill: Skill;
  canLearn: boolean;
  conditions: {
    type: 'level' | 'job' | 'prerequisite' | 'cost';
    met: boolean;
    requirement: string;
    current: string;
  }[];
}

interface SkillLearnCost {
  skillPoints?: number;
  money?: number;
  items?: { item: Item; quantity: number }[];
}

interface LearnResult {
  success: boolean;
  character: Character;
  skill: Skill;
  message: string;
}
```

### コントローラー実装

```typescript
type SkillLearnEvents = {
  'skill-selected': { skill: Skill };
  'skill-learned': { result: LearnResult };
  'cancelled': {};
};

class SkillLearnController {
  private state: ObservableState<SkillLearnUIState>;
  private events: EventEmitter<SkillLearnEvents>;
  private service: SkillLearnService;
  
  constructor(service: SkillLearnService) {
    this.service = service;
    this.state = new ObservableState<SkillLearnUIState>({
      character: null,
      stage: 'selecting-skill',
      learnableSkills: [],
      selectedSkill: null,
      learnCondition: null,
      cost: null,
      cursorIndex: 0,
      result: null
    });
    this.events = new EventEmitter<SkillLearnEvents>();
  }
  
  subscribe(listener: (state: SkillLearnUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof SkillLearnEvents>(
    event: K,
    listener: (data: SkillLearnEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // スキル習得開始
  startSkillLearn(character: Character): void {
    const learnableSkills = this.service.getLearnableSkills(character);
    
    this.state.setState({
      character,
      stage: 'selecting-skill',
      learnableSkills,
      selectedSkill: null,
      learnCondition: null,
      cost: null,
      cursorIndex: 0,
      result: null
    });
  }
  
  // スキル選択
  selectSkill(skill: Skill): void {
    const character = this.state.getState().character!;
    
    // 習得条件チェック
    const condition = this.service.checkLearnCondition(character, skill);
    
    // コスト計算
    const cost = this.calculateCost(skill);
    
    this.state.setState(prev => ({
      ...prev,
      selectedSkill: skill,
      learnCondition: condition as LearnConditionCheck,
      cost
    }));
    
    this.events.emit('skill-selected', { skill });
  }
  
  // 確認画面へ
  moveToConfirming(): void {
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
  }
  
  // スキル習得実行
  async learnSkill(): Promise<void> {
    const character = this.state.getState().character!;
    const skill = this.state.getState().selectedSkill!;
    
    const result = this.service.learnSkill(character, skill);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed',
      result: result as LearnResult
    }));
    
    this.events.emit('skill-learned', { result: result as LearnResult });
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const maxIndex = this.state.getState().learnableSkills.length - 1;
    const currentIndex = this.state.getState().cursorIndex;
    const newIndex = Math.max(0, Math.min(maxIndex, currentIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'confirming') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-skill'
      }));
    } else {
      this.events.emit('cancelled', {});
    }
  }
  
  // コスト計算
  private calculateCost(skill: Skill): SkillLearnCost {
    return {
      skillPoints: skill.learnCost?.skillPoints || 0,
      money: skill.learnCost?.money || 0,
      items: skill.learnCost?.items || []
    };
  }
}
```

---

## 8. RewardController - 報酬受取UI制御

### 状態定義

```typescript
interface RewardUIState {
  // 報酬内容
  rewards: BattleRewards | null;
  
  // 段階
  stage: 'displaying-rewards' | 'distributing-exp' | 'level-ups' | 'completed';
  
  // 経験値配分
  expDistribution: Map<Character, number>;
  
  // レベルアップ
  levelUpQueue: LevelUpResult[];
  currentLevelUp: LevelUpResult | null;
  
  // アニメーション
  isAnimating: boolean;
  animationProgress: number;
  
  // 結果
  finalPartyState: Character[];
}

interface LevelUpResult {
  character: Character;
  oldLevel: number;
  newLevel: number;
  statGains: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    magic: number;
    speed: number;
  };
  newSkills: Skill[];
}
```

### コントローラー実装

```typescript
type RewardEvents = {
  'rewards-displayed': { rewards: BattleRewards };
  'exp-distributed': { distribution: Map<Character, number> };
  'level-up': { result: LevelUpResult };
  'all-complete': { party: Character[] };
};

class RewardController {
  private state: ObservableState<RewardUIState>;
  private events: EventEmitter<RewardEvents>;
  private service: RewardService;
  
  constructor(service: RewardService) {
    this.service = service;
    this.state = new ObservableState<RewardUIState>({
      rewards: null,
      stage: 'displaying-rewards',
      expDistribution: new Map(),
      levelUpQueue: [],
      currentLevelUp: null,
      isAnimating: false,
      animationProgress: 0,
      finalPartyState: []
    });
    this.events = new EventEmitter<RewardEvents>();
  }
  
  subscribe(listener: (state: RewardUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof RewardEvents>(
    event: K,
    listener: (data: RewardEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 報酬処理開始
  async processRewards(party: Character[], rewards: BattleRewards): Promise<void> {
    this.state.setState(prev => ({
      ...prev,
      rewards,
      stage: 'displaying-rewards',
      finalPartyState: [...party]
    }));
    
    this.events.emit('rewards-displayed', { rewards });
    
    // 少し待機
    await this.wait(1000);
    
    // 経験値配分
    await this.distributeExp(party, rewards.exp);
  }
  
  // 経験値配分
  private async distributeExp(party: Character[], totalExp: number): Promise<void> {
    this.state.setState(prev => ({
      ...prev,
      stage: 'distributing-exp',
      isAnimating: true
    }));
    
    const distribution = this.service.distributeExp(party, totalExp);
    
    this.state.setState(prev => ({
      ...prev,
      expDistribution: distribution
    }));
    
    this.events.emit('exp-distributed', { distribution });
    
    // アニメーション
    await this.animateExpGain();
    
    // レベルアップチェック
    await this.checkLevelUps(party, distribution);
  }
  
  // 経験値獲得アニメーション
  private async animateExpGain(): Promise<void> {
    for (let i = 0; i <= 100; i += 10) {
      this.state.setState(prev => ({
        ...prev,
        animationProgress: i
      }));
      await this.wait(50);
    }
    
    this.state.setState(prev => ({
      ...prev,
      isAnimating: false,
      animationProgress: 0
    }));
  }
  
  // レベルアップチェック
  private async checkLevelUps(
    party: Character[],
    expDistribution: Map<Character, number>
  ): Promise<void> {
    const levelUpQueue: LevelUpResult[] = [];
    
    for (const [character, exp] of expDistribution.entries()) {
      const levelUps = this.service.processLevelUps(character, exp);
      levelUpQueue.push(...(levelUps as LevelUpResult[]));
    }
    
    if (levelUpQueue.length > 0) {
      this.state.setState(prev => ({
        ...prev,
        stage: 'level-ups',
        levelUpQueue
      }));
      
      await this.displayLevelUps(levelUpQueue);
    } else {
      this.complete();
    }
  }
  
  // レベルアップ表示
  private async displayLevelUps(levelUps: LevelUpResult[]): Promise<void> {
    for (const levelUp of levelUps) {
      this.state.setState(prev => ({
        ...prev,
        currentLevelUp: levelUp
      }));
      
      this.events.emit('level-up', { result: levelUp });
      
      // レベルアップ演出待機
      await this.wait(2000);
    }
    
    this.complete();
  }
  
  // 完了
  private complete(): void {
    const finalParty = this.state.getState().finalPartyState;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed',
      currentLevelUp: null
    }));
    
    this.events.emit('all-complete', { party: finalParty });
  }
  
  // スキップ
  skipAnimations(): void {
    this.complete();
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 9. EnhanceController - 強化UI制御

### 状態定義

```typescript
interface EnhanceUIState {
  // 段階
  stage: 'selecting-target' | 'selecting-materials' | 'confirming' | 'enhancing' | 'completed';
  
  // 強化対象
  enhanceTarget: EnhanceTarget | null;
  targetType: 'equipment' | 'character';
  
  // 材料
  availableMaterials: Item[];
  selectedMaterials: Item[];
  
  // 強化情報
  currentLevel: number;
  maxLevel: number;
  cost: EnhanceCost | null;
  successRate: number;
  
  // プレビュー
  previewStats: any | null;
  
  // 結果
  result: EnhanceResult | null;
  isProcessing: boolean;
  
  // カーソル
  cursorIndex: number;
}

interface EnhanceTarget {
  id: string;
  name: string;
  type: 'equipment' | 'character';
  currentLevel: number;
}

interface EnhanceCost {
  money: number;
  materials: { item: Item; quantity: number }[];
}

interface EnhanceResult {
  success: boolean;
  target: EnhanceTarget;
  oldLevel: number;
  newLevel: number;
  bonusApplied?: any;
  message: string;
}
```

### コントローラー実装

```typescript
type EnhanceEvents = {
  'target-selected': { target: EnhanceTarget };
  'materials-selected': { materials: Item[] };
  'enhance-started': { target: EnhanceTarget };
  'enhance-completed': { result: EnhanceResult };
  'cancelled': {};
};

class EnhanceController {
  private state: ObservableState<EnhanceUIState>;
  private events: EventEmitter<EnhanceEvents>;
  private service: EnhanceService;
  
  constructor(service: EnhanceService) {
    this.service = service;
    this.state = new ObservableState<EnhanceUIState>({
      stage: 'selecting-target',
      enhanceTarget: null,
      targetType: 'equipment',
      availableMaterials: [],
      selectedMaterials: [],
      currentLevel: 0,
      maxLevel: 10,
      cost: null,
      successRate: 0,
      previewStats: null,
      result: null,
      isProcessing: false,
      cursorIndex: 0
    });
    this.events = new EventEmitter<EnhanceEvents>();
  }
  
  subscribe(listener: (state: EnhanceUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof EnhanceEvents>(
    event: K,
    listener: (data: EnhanceEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 強化開始
  startEnhance(targetType: 'equipment' | 'character'): void {
    this.state.setState({
      stage: 'selecting-target',
      enhanceTarget: null,
      targetType,
      availableMaterials: [],
      selectedMaterials: [],
      currentLevel: 0,
      maxLevel: 10,
      cost: null,
      successRate: 0,
      previewStats: null,
      result: null,
      isProcessing: false,
      cursorIndex: 0
    });
  }
  
  // 対象選択
  selectTarget(target: EnhanceTarget): void {
    // コスト計算
    const cost = this.service.calculateCost(target, target.currentLevel);
    
    // 成功率取得
    const successRate = this.service.getSuccessRate(target, target.currentLevel);
    
    // 利用可能な材料取得
    const availableMaterials = this.getAvailableMaterials();
    
    this.state.setState(prev => ({
      ...prev,
      enhanceTarget: target,
      currentLevel: target.currentLevel,
      cost: cost as EnhanceCost,
      successRate,
      availableMaterials,
      stage: 'selecting-materials'
    }));
    
    this.events.emit('target-selected', { target });
  }
  
  // 材料選択
  selectMaterial(material: Item): void {
    const currentMaterials = this.state.getState().selectedMaterials;
    
    // 材料を追加
    this.state.setState(prev => ({
      ...prev,
      selectedMaterials: [...currentMaterials, material]
    }));
    
    // 成功率再計算（材料によってボーナスがある場合）
    this.updateSuccessRate();
  }
  
  // 材料削除
  removeMaterial(index: number): void {
    const currentMaterials = this.state.getState().selectedMaterials;
    const newMaterials = currentMaterials.filter((_, i) => i !== index);
    
    this.state.setState(prev => ({
      ...prev,
      selectedMaterials: newMaterials
    }));
    
    this.updateSuccessRate();
  }
  
  // 成功率更新
  private updateSuccessRate(): void {
    const target = this.state.getState().enhanceTarget!;
    const materials = this.state.getState().selectedMaterials;
    
    // 基本成功率
    let successRate = this.service.getSuccessRate(target, target.currentLevel);
    
    // 材料ボーナス計算
    const materialBonus = materials.reduce((bonus, mat) => {
      return bonus + (mat.enhanceBonus || 0);
    }, 0);
    
    successRate = Math.min(100, successRate + materialBonus);
    
    this.state.setState(prev => ({
      ...prev,
      successRate
    }));
  }
  
  // 確認画面へ
  moveToConfirming(): void {
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
  }
  
  // 強化実行
  async enhance(): Promise<void> {
    const target = this.state.getState().enhanceTarget!;
    const materials = this.state.getState().selectedMaterials;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'enhancing',
      isProcessing: true
    }));
    
    this.events.emit('enhance-started', { target });
    
    // 強化演出待機
    await this.wait(2000);
    
    const result = this.service.enhance(target, materials);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed',
      result: result as EnhanceResult,
      isProcessing: false
    }));
    
    this.events.emit('enhance-completed', { result: result as EnhanceResult });
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    let maxIndex = 0;
    
    if (currentState.stage === 'selecting-materials') {
      maxIndex = currentState.availableMaterials.length - 1;
    }
    
    const newIndex = Math.max(0, Math.min(maxIndex, currentState.cursorIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'selecting-materials') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-target'
      }));
    } else if (currentState.stage === 'confirming') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-materials'
      }));
    } else {
      this.events.emit('cancelled', {});
    }
  }
  
  private getAvailableMaterials(): Item[] {
    // インベントリから強化材料を取得
    return [];
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 10. SaveLoadController - セーブ/ロードUI制御

### 状態定義

```typescript
interface SaveLoadUIState {
  // モード
  mode: 'save' | 'load';
  
  // 段階
  stage: 'selecting-slot' | 'confirming' | 'processing' | 'completed';
  
  // セーブスロット
  saveSlots: SaveSlotInfo[];
  selectedSlot: number | null;
  
  // ゲーム状態
  currentGameState: GameState | null;
  
  // 結果
  result: SaveLoadResult | null;
  isProcessing: boolean;
  
  // エラー
  error: string | null;
  
  // カーソル
  cursorIndex: number;
}

interface SaveSlotInfo {
  slot: number;
  exists: boolean;
  saveData?: {
    timestamp: number;
    playTime: number;
    location: string;
    partyLevel: number;
    characters: { name: string; level: number }[];
  };
}

interface SaveLoadResult {
  success: boolean;
  slot: number;
  message: string;
}
```

### コントローラー実装

```typescript
type SaveLoadEvents = {
  'slot-selected': { slot: number };
  'save-completed': { result: SaveLoadResult };
  'load-completed': { result: SaveLoadResult; gameState: GameState };
  'cancelled': {};
};

class SaveLoadController {
  private state: ObservableState<SaveLoadUIState>;
  private events: EventEmitter<SaveLoadEvents>;
  private service: SaveLoadService;
  
  constructor(service: SaveLoadService) {
    this.service = service;
    this.state = new ObservableState<SaveLoadUIState>({
      mode: 'save',
      stage: 'selecting-slot',
      saveSlots: [],
      selectedSlot: null,
      currentGameState: null,
      result: null,
      isProcessing: false,
      error: null,
      cursorIndex: 0
    });
    this.events = new EventEmitter<SaveLoadEvents>();
  }
  
  subscribe(listener: (state: SaveLoadUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof SaveLoadEvents>(
    event: K,
    listener: (data: SaveLoadEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // セーブモード開始
  startSave(gameState: GameState): void {
    const saveSlots = this.loadSaveSlots();
    
    this.state.setState({
      mode: 'save',
      stage: 'selecting-slot',
      saveSlots,
      selectedSlot: null,
      currentGameState: gameState,
      result: null,
      isProcessing: false,
      error: null,
      cursorIndex: 0
    });
  }
  
  // ロードモード開始
  startLoad(): void {
    const saveSlots = this.loadSaveSlots();
    
    this.state.setState({
      mode: 'load',
      stage: 'selecting-slot',
      saveSlots,
      selectedSlot: null,
      currentGameState: null,
      result: null,
      isProcessing: false,
      error: null,
      cursorIndex: 0
    });
  }
  
  // スロット選択
  selectSlot(slot: number): void {
    this.state.setState(prev => ({
      ...prev,
      selectedSlot: slot
    }));
    
    this.events.emit('slot-selected', { slot });
  }
  
  // 確認画面へ
  moveToConfirming(): void {
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
  }
  
  // セーブ実行
  async save(): Promise<void> {
    const slot = this.state.getState().selectedSlot!;
    const gameState = this.state.getState().currentGameState!;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'processing',
      isProcessing: true,
      error: null
    }));
    
    try {
      const result = await this.service.save(slot, gameState);
      
      this.state.setState(prev => ({
        ...prev,
        stage: 'completed',
        result: result as SaveLoadResult,
        isProcessing: false,
        saveSlots: this.loadSaveSlots() // リロード
      }));
      
      this.events.emit('save-completed', { result: result as SaveLoadResult });
    } catch (error) {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-slot',
        isProcessing: false,
        error: (error as Error).message
      }));
    }
  }
  
  // ロード実行
  async load(): Promise<void> {
    const slot = this.state.getState().selectedSlot!;
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'processing',
      isProcessing: true,
      error: null
    }));
    
    try {
      const gameState = await this.service.load(slot);
      
      this.state.setState(prev => ({
        ...prev,
        stage: 'completed',
        currentGameState: gameState,
        isProcessing: false,
        result: {
          success: true,
          slot,
          message: 'ロードしました'
        }
      }));
      
      this.events.emit('load-completed', {
        result: { success: true, slot, message: 'ロードしました' },
        gameState
      });
    } catch (error) {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-slot',
        isProcessing: false,
        error: (error as Error).message
      }));
    }
  }
  
  // セーブ削除
  async deleteSave(slot: number): Promise<void> {
    try {
      await this.service.deleteSave(slot);
      
      // スロット情報リロード
      this.state.setState(prev => ({
        ...prev,
        saveSlots: this.loadSaveSlots()
      }));
    } catch (error) {
      this.state.setState(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const maxIndex = this.state.getState().saveSlots.length - 1;
    const currentIndex = this.state.getState().cursorIndex;
    const newIndex = Math.max(0, Math.min(maxIndex, currentIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'confirming') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-slot'
      }));
    } else {
      this.events.emit('cancelled', {});
    }
  }
  
  // セーブスロット情報読み込み
  private loadSaveSlots(): SaveSlotInfo[] {
    const saves = this.service.listSaves();
    const slots: SaveSlotInfo[] = [];
    
    for (let i = 0; i < 10; i++) {
      const saveData = saves.find(s => s.slot === i);
      slots.push({
        slot: i,
        exists: !!saveData,
        saveData: saveData ? {
          timestamp: saveData.timestamp,
          playTime: saveData.playTime,
          location: saveData.location,
          partyLevel: saveData.partyLevel,
          characters: saveData.characters
        } : undefined
      });
    }
    
    return slots;
  }
}
```

---

## 11. JobChangeController - 職業変更UI制御

### 状態定義

```typescript
interface JobChangeUIState {
  // 対象キャラクター
  character: Character | null;
  
  // 選択段階
  stage: 'selecting-job' | 'confirming' | 'completed';
  
  // ジョブ
  currentJob: Job | null;
  availableJobs: Job[];
  selectedJob: Job | null;
  
  // 条件
  jobChangeCondition: JobChangeConditionCheck | null;
  
  // プレビュー
  previewStats: Stats | null;
  statChanges: StatChanges | null;
  newSkills: Skill[];
  lostSkills: Skill[];
  
  // カーソル
  cursorIndex: number;
  
  // 結果
  result: JobChangeResult | null;
}

interface JobChangeConditionCheck {
  job: Job;
  canChange: boolean;
  conditions: {
    type: 'level' | 'prerequisite-job' | 'item' | 'quest';
    met: boolean;
    requirement: string;
    current: string;
  }[];
}

interface StatChanges {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
}

interface JobChangeResult {
  success: boolean;
  character: Character;
  oldJob: Job;
  newJob: Job;
  statChanges: StatChanges;
  gainedSkills: Skill[];
  lostSkills: Skill[];
  message: string;
}
```

### コントローラー実装

```typescript
type JobChangeEvents = {
  'job-selected': { job: Job };
  'job-changed': { result: JobChangeResult };
  'cancelled': {};
};

class JobChangeController {
  private state: ObservableState<JobChangeUIState>;
  private events: EventEmitter<JobChangeEvents>;
  private service: JobChangeService;
  
  constructor(service: JobChangeService) {
    this.service = service;
    this.state = new ObservableState<JobChangeUIState>({
      character: null,
      stage: 'selecting-job',
      currentJob: null,
      availableJobs: [],
      selectedJob: null,
      jobChangeCondition: null,
      previewStats: null,
      statChanges: null,
      newSkills: [],
      lostSkills: [],
      cursorIndex: 0,
      result: null
    });
    this.events = new EventEmitter<JobChangeEvents>();
  }
  
  subscribe(listener: (state: JobChangeUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof JobChangeEvents>(
    event: K,
    listener: (data: JobChangeEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 職業変更開始
  startJobChange(character: Character): void {
    const availableJobs = this.service.getAvailableJobs(character);
    
    this.state.setState({
      character,
      stage: 'selecting-job',
      currentJob: character.job,
      availableJobs,
      selectedJob: null,
      jobChangeCondition: null,
      previewStats: null,
      statChanges: null,
      newSkills: [],
      lostSkills: [],
      cursorIndex: 0,
      result: null
    });
  }
  
  // ジョブ選択
  selectJob(job: Job): void {
    const character = this.state.getState().character!;
    
    // 変更条件チェック
    const condition = this.service.checkJobChangeCondition(character, job);
    
    // ステータスプレビュー
    const previewStats = this.calculatePreviewStats(character, job);
    const statChanges = this.calculateStatChanges(character, job);
    
    // スキル変更予測
    const newSkills = this.getNewSkills(character, job);
    const lostSkills = this.getLostSkills(character, job);
    
    this.state.setState(prev => ({
      ...prev,
      selectedJob: job,
      jobChangeCondition: condition as JobChangeConditionCheck,
      previewStats,
      statChanges,
      newSkills,
      lostSkills
    }));
    
    this.events.emit('job-selected', { job });
  }
  
  // 確認画面へ
  moveToConfirming(): void {
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirming'
    }));
  }
  
  // ジョブ変更実行
  async changeJob(): Promise<void> {
    const character = this.state.getState().character!;
    const job = this.state.getState().selectedJob!;
    
    const result = this.service.changeJob(character, job);
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'completed',
      result: result as JobChangeResult,
      currentJob: job
    }));
    
    this.events.emit('job-changed', { result: result as JobChangeResult });
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const maxIndex = this.state.getState().availableJobs.length - 1;
    const currentIndex = this.state.getState().cursorIndex;
    const newIndex = Math.max(0, Math.min(maxIndex, currentIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // キャンセル
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'confirming') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-job'
      }));
    } else {
      this.events.emit('cancelled', {});
    }
  }
  
  // ユーティリティ
  private calculatePreviewStats(character: Character, job: Job): Stats {
    // Serviceを通じて新しいステータスを計算
    const baseStats = character.stats;
    const jobModifier = job.statModifiers;
    
    return {
      maxHp: baseStats.maxHp + jobModifier.hp,
      maxMp: baseStats.maxMp + jobModifier.mp,
      attack: baseStats.attack + jobModifier.attack,
      defense: baseStats.defense + jobModifier.defense,
      magic: baseStats.magic + jobModifier.magic,
      speed: baseStats.speed + jobModifier.speed
    };
  }
  
  private calculateStatChanges(character: Character, job: Job): StatChanges {
    const currentStats = character.stats;
    const previewStats = this.calculatePreviewStats(character, job);
    
    return {
      hp: previewStats.maxHp - currentStats.maxHp,
      mp: previewStats.maxMp - currentStats.maxMp,
      attack: previewStats.attack - currentStats.attack,
      defense: previewStats.defense - currentStats.defense,
      magic: previewStats.magic - currentStats.magic,
      speed: previewStats.speed - currentStats.speed
    };
  }
  
  private getNewSkills(character: Character, job: Job): Skill[] {
    // ジョブ固有スキルから、まだ持っていないものを取得
    return job.skills.filter(skill => 
      !character.skills.some(s => s.id === skill.id)
    );
  }
  
  private getLostSkills(character: Character, job: Job): Skill[] {
    // 現在のジョブ固有スキルで、新ジョブでは使えなくなるものを取得
    const currentJobSkills = character.job.skills;
    return currentJobSkills.filter(skill => 
      !job.skills.some(s => s.id === skill.id)
    );
  }
}
```

### 使用例（React）

```typescript
function JobChangeScreen({ character }: { character: Character }) {
  const [state, setState] = useState<JobChangeUIState>();
  const controllerRef = useRef<JobChangeController>();
  
  useEffect(() => {
    const service = new JobChangeService(coreEngine);
    const controller = new JobChangeController(service);
    controllerRef.current = controller;
    
    const unsubscribe = controller.subscribe(setState);
    
    controller.startJobChange(character);
    
    return unsubscribe;
  }, [character]);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="job-change-screen">
      <CharacterInfo character={state.character!} currentJob={state.currentJob} />
      
      {state.stage === 'selecting-job' && (
        <>
          <JobList
            jobs={state.availableJobs}
            cursorIndex={state.cursorIndex}
            onSelectJob={(job) => controllerRef.current?.selectJob(job)}
          />
          
          {state.selectedJob && (
            <JobPreview
              job={state.selectedJob}
              condition={state.jobChangeCondition}
              statChanges={state.statChanges}
              newSkills={state.newSkills}
              lostSkills={state.lostSkills}
              onConfirm={() => controllerRef.current?.moveToConfirming()}
            />
          )}
        </>
      )}
      
      {state.stage === 'confirming' && (
        <ConfirmDialog
          message={`${state.selectedJob?.name}に転職しますか？`}
          onConfirm={() => controllerRef.current?.changeJob()}
          onCancel={() => controllerRef.current?.cancel()}
        />
      )}
      
      {state.stage === 'completed' && state.result && (
        <JobChangeResult result={state.result} />
      )}
    </div>
  );
}
```

---

## 12. StatusEffectController - 状態異常表示UI制御

### 状態定義

```typescript
interface StatusEffectUIState {
  // 対象
  target: Combatant | null;
  
  // 状態異常一覧
  activeEffects: ActiveStatusEffect[];
  
  // 詳細表示
  selectedEffect: ActiveStatusEffect | null;
  
  // フィルタ
  filterType: 'all' | 'buff' | 'debuff' | 'ailment' | null;
  
  // ソート
  sortBy: 'duration' | 'severity' | 'name';
  
  // カーソル
  cursorIndex: number;
}

interface ActiveStatusEffect {
  id: string;
  effect: StatusEffect;
  target: Combatant;
  source: Combatant | null;
  appliedAt: number;
  duration: number;
  remainingTurns: number;
  stackCount: number;
  category: 'buff' | 'debuff' | 'ailment';
  canDispel: boolean;
}
```

### コントローラー実装

```typescript
type StatusEffectEvents = {
  'effect-selected': { effect: ActiveStatusEffect };
  'effect-expired': { effect: ActiveStatusEffect };
  'effect-dispelled': { effect: ActiveStatusEffect };
};

class StatusEffectController {
  private state: ObservableState<StatusEffectUIState>;
  private events: EventEmitter<StatusEffectEvents>;
  private service: StatusEffectService;
  
  constructor(service: StatusEffectService) {
    this.service = service;
    this.state = new ObservableState<StatusEffectUIState>({
      target: null,
      activeEffects: [],
      selectedEffect: null,
      filterType: 'all',
      sortBy: 'duration',
      cursorIndex: 0
    });
    this.events = new EventEmitter<StatusEffectEvents>();
  }
  
  subscribe(listener: (state: StatusEffectUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof StatusEffectEvents>(
    event: K,
    listener: (data: StatusEffectEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // 状態異常表示開始
  showStatusEffects(target: Combatant): void {
    const activeEffects = this.getActiveEffects(target);
    
    this.state.setState({
      target,
      activeEffects,
      selectedEffect: null,
      filterType: 'all',
      sortBy: 'duration',
      cursorIndex: 0
    });
  }
  
  // エフェクト選択
  selectEffect(effect: ActiveStatusEffect): void {
    this.state.setState(prev => ({
      ...prev,
      selectedEffect: effect
    }));
    
    this.events.emit('effect-selected', { effect });
  }
  
  // フィルタ変更
  setFilter(filterType: 'all' | 'buff' | 'debuff' | 'ailment'): void {
    this.state.setState(prev => ({
      ...prev,
      filterType,
      cursorIndex: 0
    }));
  }
  
  // ソート変更
  setSortBy(sortBy: 'duration' | 'severity' | 'name'): void {
    this.state.setState(prev => ({
      ...prev,
      sortBy
    }));
  }
  
  // フィルタ・ソート済みエフェクト取得
  getFilteredEffects(): ActiveStatusEffect[] {
    const currentState = this.state.getState();
    let effects = currentState.activeEffects;
    
    // フィルタ適用
    if (currentState.filterType !== 'all') {
      effects = effects.filter(e => e.category === currentState.filterType);
    }
    
    // ソート適用
    effects = [...effects].sort((a, b) => {
      switch (currentState.sortBy) {
        case 'duration':
          return a.remainingTurns - b.remainingTurns;
        case 'name':
          return a.effect.name.localeCompare(b.effect.name);
        case 'severity':
          return (b.effect.severity || 0) - (a.effect.severity || 0);
        default:
          return 0;
      }
    });
    
    return effects;
  }
  
  // 解除試行
  async tryDispel(effect: ActiveStatusEffect): Promise<void> {
    if (!effect.canDispel) {
      return;
    }
    
    const result = this.service.removeStatusEffect(
      effect.target,
      effect.effect.type
    );
    
    if (result.success) {
      // 状態を更新
      this.refreshEffects();
      this.events.emit('effect-dispelled', { effect });
    }
  }
  
  // エフェクト更新
  refreshEffects(): void {
    const target = this.state.getState().target;
    if (target) {
      const activeEffects = this.getActiveEffects(target);
      this.state.setState(prev => ({
        ...prev,
        activeEffects
      }));
    }
  }
  
  // カーソル移動
  moveCursor(delta: number): void {
    const filteredEffects = this.getFilteredEffects();
    const maxIndex = filteredEffects.length - 1;
    const currentIndex = this.state.getState().cursorIndex;
    const newIndex = Math.max(0, Math.min(maxIndex, currentIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }
  
  // アクティブエフェクト取得
  private getActiveEffects(target: Combatant): ActiveStatusEffect[] {
    return target.statusEffects.map(effect => ({
      id: `${target.id}-${effect.type}`,
      effect,
      target,
      source: null, // 付与者情報があれば設定
      appliedAt: Date.now(), // 実際の適用時刻
      duration: effect.duration,
      remainingTurns: effect.remainingTurns || 0,
      stackCount: effect.stackCount || 1,
      category: this.categorizeEffect(effect),
      canDispel: effect.canDispel !== false
    }));
  }
  
  private categorizeEffect(effect: StatusEffect): 'buff' | 'debuff' | 'ailment' {
    // エフェクトの種類に基づいて分類
    if (effect.type.includes('poison') || effect.type.includes('paralyze')) {
      return 'ailment';
    }
    if (effect.statModifiers) {
      const hasPositive = Object.values(effect.statModifiers).some(v => v > 0);
      return hasPositive ? 'buff' : 'debuff';
    }
    return 'buff';
  }
}
```

---

## UI Framework統合

### React統合

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
      controllerRef.current?.startBattle(party, enemies),
    onCommandConfirmed: (action: BattleAction) =>
      controllerRef.current?.onCommandConfirmed(action)
  };
}

// 使用例
function BattleComponent() {
  const { state, startBattle, onCommandConfirmed } = useBattleController(battleService);
  
  // ... レンダリング
}
```

### Vue統合

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
  
  const startBattle = (party: Character[], enemies: Enemy[]) => {
    controller.startBattle(party, enemies);
  };
  
  const onCommandConfirmed = (action: BattleAction) => {
    controller.onCommandConfirmed(action);
  };
  
  return {
    state,
    startBattle,
    onCommandConfirmed
  };
}
```

### Svelte統合

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
      controller.startBattle(party, enemies),
    onCommandConfirmed: (action: BattleAction) =>
      controller.onCommandConfirmed(action)
  };
}

// 使用例
const battle = createBattleStore(battleService);
```

---

## 状態マシン

複雑なフローは状態マシンで管理することを推奨：

```typescript
type BattlePhase =
  | { type: 'initializing' }
  | { type: 'player-turn'; actor: Character }
  | { type: 'enemy-turn'; enemy: Enemy }
  | { type: 'animating'; animation: BattleAnimation }
  | { type: 'ended'; result: 'victory' | 'defeat' | 'escaped' };

type BattleEvent =
  | { type: 'START_BATTLE'; party: Character[]; enemies: Enemy[] }
  | { type: 'NEXT_TURN' }
  | { type: 'EXECUTE_ACTION'; action: BattleAction }
  | { type: 'ANIMATION_COMPLETE' }
  | { type: 'BATTLE_END'; result: 'victory' | 'defeat' | 'escaped' };

function battleReducer(phase: BattlePhase, event: BattleEvent): BattlePhase {
  switch (phase.type) {
    case 'initializing':
      if (event.type === 'START_BATTLE') {
        // 戦闘開始処理
        return { type: 'player-turn', actor: event.party[0] };
      }
      break;
      
    case 'player-turn':
      if (event.type === 'EXECUTE_ACTION') {
        return { type: 'animating', animation: createAnimation(event.action) };
      }
      break;
      
    case 'animating':
      if (event.type === 'ANIMATION_COMPLETE') {
        return { type: 'player-turn', actor: getNextActor() };
      }
      break;
      
    // ... その他の遷移
  }
  
  return phase;
}
```

---

## テスト例

```typescript
describe('BattleController', () => {
  it('should start battle and emit event', async () => {
    const service = new BattleService(coreEngine);
    const controller = new BattleController(service);
    
    let battleStarted = false;
    controller.on('battle-started', () => {
      battleStarted = true;
    });
    
    await controller.startBattle(mockParty, mockEnemies);
    
    expect(battleStarted).toBe(true);
    expect(controller.getState().phase).toBe('selecting-command');
  });
  
  it('should handle command selection', () => {
    const commandController = new CommandController(commandService);
    
    commandController.startCommandSelection(mockCharacter);
    commandController.selectCommand('attack');
    
    expect(commandController.getState().stage).toBe('selecting-target');
  });
});
```

---

## まとめ

### ヘッドレスUIの利点

1. **再利用性**: 同じロジックを複数のUIフレームワークで使用可能
2. **テスタビリティ**: UIレンダリングなしでロジックをテスト
3. **保守性**: UIとロジックの分離により、それぞれを独立して変更可能
4. **柔軟性**: デザインシステムを自由に選択可能

### 実装優先度

**フェーズ1: 戦闘UI**
1. BattleController - 戦闘全体の進行管理
2. CommandController - コマンド選択UI
3. StatusEffectController - 状態異常表示（戦闘中に使用）

**フェーズ2: 管理UI**
4. PartyController - パーティ編成
5. EquipmentController - 装備変更
6. ItemController - アイテム使用

**フェーズ3: 成長・報酬UI**
7. RewardController - 戦闘報酬とレベルアップ
8. SkillLearnController - スキル習得
9. JobChangeController - 職業変更

**フェーズ4: 発展UI**
10. CraftController - アイテム合成
11. EnhanceController - 装備・キャラ強化
12. SaveLoadController - セーブ/ロード

### 推奨パターン

- **小規模プロジェクト**: 単純なObservableStateで十分
- **中規模プロジェクト**: 状態マシンを追加
- **大規模プロジェクト**: Redux/Vuex/Zustandなどの状態管理ライブラリと統合

### コントローラー一覧

本ドキュメントでは、以下の12のコントローラーの詳細設計を記載しました：

| # | Controller | 対応Service | 概要 |
|---|-----------|------------|------|
| 1 | BattleController | BattleService | 戦闘全体の進行、ターン管理、アニメーション制御 |
| 2 | CommandController | CommandService | 戦闘中のコマンド選択フロー |
| 3 | ItemController | ItemService | アイテム使用の全フロー（戦闘/フィールド） |
| 4 | EquipmentController | EquipmentService | 装備変更、比較、ステータスプレビュー |
| 5 | PartyController | PartyService | パーティ編成、メンバー入れ替え、隊列変更 |
| 6 | CraftController | CraftService | アイテム合成、材料チェック、成功率表示 |
| 7 | SkillLearnController | SkillLearnService | スキル習得、条件チェック、コスト管理 |
| 8 | RewardController | RewardService | 戦闘報酬配分、レベルアップ演出 |
| 9 | EnhanceController | EnhanceService | 装備・キャラ強化、成功判定 |
| 10 | SaveLoadController | SaveLoadService | セーブ/ロード、スロット管理 |
| 11 | JobChangeController | JobChangeService | 職業変更、条件チェック、ステータス変化プレビュー |
| 12 | StatusEffectController | StatusEffectService | 状態異常の表示、フィルタ、解除 |

### UI不要または内部的に使用されるService

以下のServiceは独立したコントローラーを持たず、他のコントローラー内で使用されます：

- **EnemyAIService**: BattleController内で敵ターン時に自動的に使用
- **EnemyGroupService**: BattleController開始時に敵グループ生成に使用
- **SimulationService**: 高度な機能として、必要に応じて専用UIを実装

このヘッドレスUI設計により、rpg-coreのServiceを任意のUIフレームワークで簡単に利用できるようになります。
