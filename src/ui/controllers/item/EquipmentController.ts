/**
 * EquipmentController
 * 装備変更のヘッドレスUIコントローラー
 */

import { ObservableState } from '../../core/ObservableState';
import { EventEmitter } from '../../core/EventEmitter';
import type { EquipmentService } from '../../../services/item/EquipmentService';
import type { 
  EquipmentUIState, 
  EquipmentEvents, 
  EquipmentUIStage,
  StatsComparison
} from '../../types/equipment';
import type { 
  Combatant, 
  Equipment, 
  BaseEquipmentSlot,
  DefaultEquipmentSlot,
  BaseEquipmentType,
  DefaultEquipmentType,
  BaseStats,
  DefaultStats
} from '../../../types';
import { 
  validateEquipmentSlot,
  defaultEquipmentSlotMapping,
  canEquip,
  type EquipmentSlotMapping
} from '../../../item/equipment';

/**
 * EquipmentController
 * 装備変更フローを管理
 * 
 * @example
 * ```typescript
 * const controller = new EquipmentController(equipmentService);
 * 
 * // キャラクターを設定して開始
 * controller.startEquipment(character, availableEquipment);
 * 
 * // スロットを選択
 * controller.selectSlot('weapon');
 * 
 * // 装備を選択（ステータス比較を表示）
 * controller.selectEquipment(newSword);
 * 
 * // 装備変更を確定
 * controller.confirmEquipment();
 * ```
 */
export class EquipmentController<
  TStats extends BaseStats = DefaultStats,
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  private state: ObservableState<EquipmentUIState<TStats, TSlot, TEquipType>>;
  private events: EventEmitter<EquipmentEvents<TStats, TEquipType>>;
  private service: EquipmentService<TStats, TSlot, TEquipType>;
  private slotMapping: EquipmentSlotMapping<TSlot, TEquipType>;

  constructor(
    service: EquipmentService<TStats, TSlot, TEquipType>,
    slotMapping?: EquipmentSlotMapping<TSlot, TEquipType>
  ) {
    this.service = service;
    this.slotMapping = slotMapping || (defaultEquipmentSlotMapping as any);
    
    this.state = new ObservableState<EquipmentUIState<TStats, TSlot, TEquipType>>({
      stage: 'selecting-slot',
      character: null,
      selectedSlot: null,
      selectedEquipment: null,
      availableEquipment: [],
      statsComparison: null,
      cursorIndex: 0,
      canEquip: false,
      equipmentReasons: []
    });

    this.events = new EventEmitter<EquipmentEvents<TStats, TEquipType>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: EquipmentUIState<TStats, TSlot, TEquipType>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof EquipmentEvents<TStats, TEquipType>>(
    event: K,
    listener: (data: EquipmentEvents<TStats, TEquipType>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): EquipmentUIState<TStats, TSlot, TEquipType> {
    return this.state.getState();
  }

  /**
   * 装備変更を開始
   */
  startEquipment(
    character: Combatant<TStats, any, any, TSlot, TEquipType>,
    availableEquipment: Equipment<TStats, TEquipType>[]
  ): void {
    this.state.setState({
      stage: 'selecting-slot',
      character,
      availableEquipment,
      selectedSlot: null,
      selectedEquipment: null,
      statsComparison: null,
      cursorIndex: 0,
      canEquip: false,
      equipmentReasons: []
    });
    
    this.events.emit('stage-changed', { stage: 'selecting-slot' });
  }

  /**
   * スロットを選択
   */
  selectSlot(slot: TSlot): void {
    const currentState = this.state.getState();
    
    if (!currentState.character) {
      return;
    }
    
    // そのスロットに装備可能なアイテムをフィルタ（装備タイプとスロットの対応をチェック）
    const equipableForSlot = currentState.availableEquipment.filter(equipment => {
      return validateEquipmentSlot(slot, equipment.type, this.slotMapping);
    });
    
    this.state.setState({
      selectedSlot: slot,
      stage: 'selecting-equipment',
      selectedEquipment: null,
      cursorIndex: 0
    });
    
    this.events.emit('slot-selected', { slot });
    this.events.emit('stage-changed', { stage: 'selecting-equipment' });
  }

  /**
   * 装備を選択
   */
  selectEquipment(equipment: Equipment<TStats, TEquipType> | null): void {
    const currentState = this.state.getState();
    
    if (!currentState.character || !currentState.selectedSlot) {
      return;
    }
    
    // 装備可能性をチェック
    let canEquipItem = true;
    const equipmentReasons: string[] = [];
    
    if (equipment) {
      // Core EngineのcanEquip関数を使用して装備可能性をチェック
      canEquipItem = canEquip(currentState.character, equipment);
      
      if (!canEquipItem) {
        // レベル要件チェック
        if (currentState.character.level < equipment.levelRequirement) {
          equipmentReasons.push(`レベル${equipment.levelRequirement}以上が必要です`);
        }
      }
    }
    // 装備解除は常に可能（equipment が null の場合）
    
    // ステータス比較を計算
    const statsComparison = equipment
      ? this.calculateStatsComparison(currentState.character, currentState.selectedSlot, equipment)
      : null;
    
    this.state.setState({
      selectedEquipment: equipment,
      statsComparison,
      canEquip: canEquipItem,
      equipmentReasons
    });
    
    if (equipment) {
      this.events.emit('equipment-selected', { equipment });
    }
  }

  /**
   * 装備変更を確定
   */
  confirmEquipment(): boolean {
    const currentState = this.state.getState();
    
    if (!currentState.character || !currentState.selectedSlot) {
      return false;
    }
    
    const character = currentState.character;
    const slot = currentState.selectedSlot;
    const equipment = currentState.selectedEquipment;
    
    // 現在の装備を取得
    const oldEquipment = character.equipment?.[slot] as Equipment<TStats, TEquipType> | undefined;
    
    if (equipment) {
      // 新しい装備を装着
      const result = this.service.equipItem(character, equipment, slot);
      
      if (result.success) {
        this.events.emit('equipment-changed', {
          slot,
          oldEquipment: oldEquipment || null,
          newEquipment: equipment
        });
        
        this.state.setState({ stage: 'completed' });
        this.events.emit('stage-changed', { stage: 'completed' });
        return true;
      }
    } else if (oldEquipment) {
      // 装備を解除
      const result = this.service.unequipItem(character, slot);
      
      if (result.success) {
        this.events.emit('equipment-unequipped', { slot, equipment: oldEquipment });
        this.events.emit('equipment-changed', {
          slot,
          oldEquipment: oldEquipment,
          newEquipment: null
        });
        
        this.state.setState({ stage: 'completed' });
        this.events.emit('stage-changed', { stage: 'completed' });
        return true;
      }
    }
    
    return false;
  }

  /**
   * キャンセル
   */
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'selecting-equipment') {
      this.state.setState({
        stage: 'selecting-slot',
        selectedSlot: null,
        selectedEquipment: null,
        statsComparison: null
      });
      this.events.emit('stage-changed', { stage: 'selecting-slot' });
    } else {
      this.reset();
    }
  }

  /**
   * リセット
   */
  reset(): void {
    this.state.setState({
      stage: 'selecting-slot',
      character: null,
      selectedSlot: null,
      selectedEquipment: null,
      availableEquipment: [],
      statsComparison: null,
      cursorIndex: 0,
      canEquip: false,
      equipmentReasons: []
    });
  }

  /**
   * カーソルを移動
   */
  moveCursor(direction: 'up' | 'down'): void {
    const currentState = this.state.getState();
    const maxIndex = currentState.availableEquipment.length - 1;
    
    let newIndex = currentState.cursorIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(maxIndex, newIndex + 1);
    }
    
    this.state.setState({ cursorIndex: newIndex });
  }

  /**
   * ステータス比較を計算
   */
  private calculateStatsComparison(
    character: Combatant<TStats, any, any, TSlot, TEquipType>,
    slot: TSlot,
    newEquipment: Equipment<TStats, TEquipType>
  ): StatsComparison<TStats> {
    // 現在のステータスを取得
    const currentStats = character.stats as Partial<TStats>;
    
    // 新しい装備でのステータスを計算（簡略化）
    // 実際にはEquipmentServiceのcalculateTotalStatsを使用
    const previewStats = { ...currentStats } as Partial<TStats>;
    
    // 装備の効果を追加（簡略化）
    if (newEquipment.statModifiers) {
      for (const key in newEquipment.statModifiers) {
        const currentValue = (currentStats as any)[key] || 0;
        const bonusValue = (newEquipment.statModifiers as any)[key] || 0;
        (previewStats as any)[key] = currentValue + bonusValue;
      }
    }
    
    // 差分を計算
    const difference: Partial<TStats> = {};
    for (const key in currentStats) {
      const current = currentStats[key as keyof TStats] as number;
      const preview = previewStats[key as keyof TStats] as number;
      if (typeof current === 'number' && typeof preview === 'number') {
        (difference as any)[key] = preview - current;
      }
    }
    
    return {
      current: currentStats,
      preview: previewStats,
      difference
    };
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.events.clear();
  }
}
