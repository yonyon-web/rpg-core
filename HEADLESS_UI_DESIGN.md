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

## 3. その他のコントローラー（概要）

### ItemController

```typescript
interface ItemUIState {
  context: 'battle' | 'field';
  stage: 'selecting-item' | 'selecting-target' | 'confirming';
  availableItems: Item[];
  selectedItem: Item | null;
  selectedTargets: Character[];
  result: ItemUseResult | null;
}

class ItemController {
  // アイテム使用の全フローを管理
  // ItemServiceと連携
}
```

### EquipmentController

```typescript
interface EquipmentUIState {
  character: Character | null;
  slot: EquipmentType | null;
  availableEquipment: Equipment[];
  selectedEquipment: Equipment | null;
  comparison: EquipmentComparison | null;
  previewStats: Stats | null;
}

class EquipmentController {
  // 装備変更UIを制御
  // 装備比較とステータスプレビューを提供
}
```

### PartyController

```typescript
interface PartyUIState {
  allCharacters: Character[];
  currentParty: Character[];
  selectedCharacter: Character | null;
  maxPartySize: number;
  formationPositions: number[];
}

class PartyController {
  // パーティ編成UIを制御
  // ドラッグ&ドロップなどの操作をサポート
}
```

### CraftController

```typescript
interface CraftUIState {
  availableRecipes: Recipe[];
  selectedRecipe: Recipe | null;
  materialCheck: RecipeCheckResult | null;
  successRate: number;
  result: SynthesisResult | null;
  isProcessing: boolean;
}

class CraftController {
  // クラフトUIを制御
  // 材料チェックと成功率表示
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
1. BattleController
2. CommandController
3. EnemyAIController（自動実行、UIは不要）

**フェーズ2: 管理UI**
4. PartyController
5. EquipmentController
6. ItemController

**フェーズ3: 発展UI**
7. CraftController
8. EnhanceController
9. SaveLoadController

### 推奨パターン

- **小規模プロジェクト**: 単純なObservableStateで十分
- **中規模プロジェクト**: 状態マシンを追加
- **大規模プロジェクト**: Redux/Vuex/Zustandなどの状態管理ライブラリと統合

このヘッドレスUI設計により、rpg-coreのServiceを任意のUIフレームワークで簡単に利用できるようになります。
