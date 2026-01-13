/**
 * CommandController
 * 
 * コマンド選択UIの状態管理とイベント処理を行うコントローラー
 * CommandServiceと連携してコマンド選択フローを管理する
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { CommandUIState, CommandEvents, CommandUIStage } from '../types/command';
import type { CommandService } from '../../services/CommandService';
import type { Character, BattleAction, BattleState } from '../../types/battle';
import type { Combatant } from '../../types/combatant';
import type { Skill } from '../../types/skill';
import type { Item } from '../../types/item';
import type { GameConfig } from '../../types/config';
import { calculateDamage } from '../../combat/damage';
import { defaultGameConfig } from '../../config/defaultConfig';
import { BASIC_ATTACK_SKILL } from '../../combat/constants';

/**
 * CommandController クラス
 * 
 * @example
 * ```typescript
 * const commandService = new CommandService();
 * const controller = new CommandController(commandService);
 * 
 * // 状態を購読
 * controller.subscribe((state) => {
 *   console.log('Command state:', state);
 * });
 * 
 * // コマンド選択を開始
 * controller.startCommandSelection(character, battleState);
 * 
 * // コマンドを選択
 * controller.selectCommand('attack');
 * ```
 */
export class CommandController {
  private state: ObservableState<CommandUIState>;
  private events: EventEmitter<CommandEvents>;
  private service: CommandService;
  private config: GameConfig;

  /**
   * コンストラクタ
   * 
   * @param service - CommandService インスタンス
   * @param config - GameConfig インスタンス（オプショナル、デフォルト設定を使用）
   */
  constructor(service: CommandService, config?: GameConfig) {
    this.service = service;
    this.config = config || defaultGameConfig;
    
    // 初期状態を設定
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

  /**
   * 状態を購読
   * 
   * @param listener - 状態変更時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  subscribe(listener: (state: CommandUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   * 
   * @param event - イベント名
   * @param listener - イベント発火時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  on<K extends keyof CommandEvents>(
    event: K,
    listener: (data: CommandEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   * 
   * @returns 現在のコマンドUI状態
   */
  getState(): CommandUIState {
    return this.state.getState();
  }

  /**
   * コマンド選択を開始
   * 
   * @param actor - 行動するキャラクター
   * @param battleState - 現在の戦闘状態
   */
  startCommandSelection(actor: Character, battleState: BattleState): void {
    const commandState = this.service.startCommandSelection(actor, battleState);
    
    this.state.setState({
      stage: 'selecting-command',
      actor,
      availableCommands: commandState.availableCommands,
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

  /**
   * コマンドを選択
   * 
   * @param command - 選択するコマンド
   */
  selectCommand(command: string): void {
    const currentState = this.state.getState();
    
    this.state.setState(prev => ({
      ...prev,
      selectedCommand: command,
      cursorIndex: 0
    }));
    
    this.events.emit('command-selected', { command });
    
    // コマンドに応じて次のステージに進む
    if (command === 'attack') {
      this.moveToTargetSelection();
    } else if (command === 'skill') {
      this.moveToSkillSelection();
    } else if (command === 'item') {
      this.moveToItemSelection();
    } else if (command === 'defend') {
      this.confirmAction();
    }
  }

  /**
   * スキル選択に移動
   */
  private moveToSkillSelection(): void {
    const currentState = this.state.getState();
    
    if (!currentState.actor) {
      return;
    }
    
    // ServiceでコマンドHを選択（これでavailableSkillsが更新される）
    this.service.selectCommand('skill');
    const commandState = this.service.getState();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-skill',
      availableSkills: commandState?.availableSkills || [],
      cursorIndex: 0
    }));
  }

  /**
   * アイテム選択に移動
   */
  private moveToItemSelection(): void {
    // Serviceでコマンドを選択
    this.service.selectCommand('item');
    const commandState = this.service.getState();
    
    // アイテムリストはInventoryServiceから取得する必要があるため、ここでは空配列
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-item',
      availableItems: [],  // 実際のアイテムはInventoryServiceから取得
      cursorIndex: 0
    }));
  }

  /**
   * ターゲット選択に移動
   */
  private moveToTargetSelection(): void {
    const commandState = this.service.getState();
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'selecting-target',
      availableTargets: commandState?.availableTargets || [],
      cursorIndex: 0
    }));
  }

  /**
   * スキルを選択
   * 
   * @param skill - 選択するスキル
   */
  selectSkill(skill: Skill): void {
    this.state.setState(prev => ({
      ...prev,
      selectedSkill: skill
    }));
    
    this.events.emit('skill-selected', { skill });
    
    // ターゲット選択に移動
    this.moveToTargetSelection();
  }

  /**
   * アイテムを選択
   * 
   * @param item - 選択するアイテム
   */
  selectItem(item: Item): void {
    this.state.setState(prev => ({
      ...prev,
      selectedItem: item
    }));
    
    this.events.emit('item-selected', { item });
    
    // ターゲット選択に移動
    this.moveToTargetSelection();
  }

  /**
   * ターゲットを選択
   * 
   * @param target - 選択するターゲット
   */
  selectTarget(target: Combatant): void {
    this.state.setState(prev => ({
      ...prev,
      selectedTargets: [target],
      targetPreview: target
    }));
    
    this.events.emit('target-selected', { target });
  }

  /**
   * カーソルを移動
   * 
   * @param direction - 移動方向（1: 下、-1: 上）
   */
  moveCursor(direction: number): void {
    const currentState = this.state.getState();
    let maxIndex = 0;
    
    // ステージに応じて最大インデックスを設定
    if (currentState.stage === 'selecting-command') {
      maxIndex = currentState.availableCommands.length - 1;
    } else if (currentState.stage === 'selecting-skill') {
      maxIndex = currentState.availableSkills.length - 1;
    } else if (currentState.stage === 'selecting-item') {
      maxIndex = currentState.availableItems.length - 1;
    } else if (currentState.stage === 'selecting-target') {
      maxIndex = currentState.availableTargets.length - 1;
    }
    
    let newIndex = currentState.cursorIndex + direction;
    
    // ループさせる
    if (newIndex < 0) {
      newIndex = maxIndex;
    } else if (newIndex > maxIndex) {
      newIndex = 0;
    }
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
  }

  /**
   * アクションを確定
   */
  confirmAction(): void {
    const currentState = this.state.getState();
    
    if (!currentState.actor) {
      return;
    }
    
    // BattleActionを構築
    const action: BattleAction = {
      actor: currentState.actor,
      type: currentState.selectedCommand === 'attack' ? 'attack' 
           : currentState.selectedCommand === 'skill' ? 'skill'
           : currentState.selectedCommand === 'item' ? 'item'
           : 'defend',
      targets: currentState.selectedTargets,
      skill: currentState.selectedSkill || undefined,
      itemId: currentState.selectedItem?.id || undefined
    };
    
    this.state.setState(prev => ({
      ...prev,
      stage: 'confirmed'
    }));
    
    this.events.emit('action-confirmed', { action });
  }

  /**
   * 選択をキャンセル
   */
  cancel(): void {
    const currentState = this.state.getState();
    
    // ステージに応じて前のステージに戻る
    if (currentState.stage === 'selecting-target') {
      if (currentState.selectedSkill) {
        this.state.setState(prev => ({
          ...prev,
          stage: 'selecting-skill',
          selectedTargets: [],
          targetPreview: null,
          cursorIndex: 0
        }));
      } else if (currentState.selectedItem) {
        this.state.setState(prev => ({
          ...prev,
          stage: 'selecting-item',
          selectedTargets: [],
          targetPreview: null,
          cursorIndex: 0
        }));
      } else {
        this.state.setState(prev => ({
          ...prev,
          stage: 'selecting-command',
          selectedTargets: [],
          targetPreview: null,
          cursorIndex: 0
        }));
      }
    } else if (currentState.stage === 'selecting-skill' || currentState.stage === 'selecting-item') {
      this.state.setState(prev => ({
        ...prev,
        stage: 'selecting-command',
        selectedSkill: null,
        selectedItem: null,
        cursorIndex: 0
      }));
    }
    
    this.events.emit('action-cancelled', {});
  }

  /**
   * ダメージプレビューを計算
   * 
   * @param target - プレビュー対象
   */
  calculateDamagePreview(target: Combatant): void {
    const currentState = this.state.getState();
    let preview: number | null = null;
    
    // actorが存在しない場合は何もしない
    if (!currentState.actor) {
      return;
    }
    
    try {
      // 選択されたスキルがある場合
      if (currentState.selectedSkill) {
        const damageResult = calculateDamage(
          currentState.actor,
          target,
          currentState.selectedSkill,
          this.config
        );
        preview = damageResult.finalDamage;
      }
      // 通常攻撃の場合
      else if (currentState.selectedCommand === 'attack') {
        const damageResult = calculateDamage(
          currentState.actor,
          target,
          BASIC_ATTACK_SKILL,
          this.config
        );
        preview = damageResult.finalDamage;
      }
    } catch (error) {
      // エラーが発生した場合は null を設定
      preview = null;
    }
    
    this.state.setState(prev => ({
      ...prev,
      damagePreview: preview,
      targetPreview: target
    }));
  }
}
