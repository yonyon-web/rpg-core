import type { EnhanceService } from '../../../services/craft/EnhanceService';
import type { EnhancableEquipment } from '../../../types/craft/craft';
import type { BaseStats } from '../../../types/character/stats';
import { ObservableState } from '../../core/ObservableState';
import { EventEmitter } from '../../core/EventEmitter';
import type {
  EnhanceUIState,
  EnhanceEvents,
  EnhanceUIStage,
  EnhanceFilterType,
  EnhanceSortBy,
  EnhanceStatsPreview,
} from '../../types/enhance';

/**
 * 強化コントローラー
 * 装備の強化UIを管理します
 */
export class EnhanceController<TStats extends BaseStats = BaseStats> {
  private state: ObservableState<EnhanceUIState<TStats>>;
  private events: EventEmitter<EnhanceEvents<TStats>>;
  private service: EnhanceService;

  constructor(service: EnhanceService) {
    this.service = service;
    
    this.state = new ObservableState<EnhanceUIState<TStats>>({
      stage: 'browsing',
      availableEquipment: [],
      selectedEquipment: null,
      selectedMaterials: [],
      enhanceLevel: 0,
      maxEnhanceLevel: 10,
      successRate: 100,
      cost: null,
      canEnhance: false,
      statsPreview: null,
      filterType: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      loading: { isLoading: false },
      error: { hasError: false },
    });
    
    this.events = new EventEmitter<EnhanceEvents<TStats>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: EnhanceUIState<TStats>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof EnhanceEvents<TStats>>(
    event: K,
    listener: (data: EnhanceEvents<TStats>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 強化開始
   */
  startEnhancing(equipment: EnhancableEquipment[], maxLevel: number = 10): void {
    this.state.setState({
      stage: 'browsing',
      availableEquipment: equipment,
      selectedEquipment: null,
      selectedMaterials: [],
      maxEnhanceLevel: maxLevel,
      statsPreview: null,
    });

    this.events.emit('enhance-started', { equipment });
    this.applyFiltersAndSort();
  }

  /**
   * 装備を選択
   */
  selectEquipment(equipment: EnhancableEquipment): void {
    const currentLevel = equipment.enhanceLevel || 0;

    this.state.setState({
      selectedEquipment: equipment,
      stage: 'selected',
      enhanceLevel: currentLevel,
      selectedMaterials: [],
      statsPreview: null,
    });

    this.checkEnhanceability();
    this.events.emit('equipment-selected', { equipment });
  }

  /**
   * 素材を選択
   */
  selectMaterial(itemId: string, quantity: number): void {
    const currentState = this.state.getState();
    const materials = [...currentState.selectedMaterials];
    
    const existingIndex = materials.findIndex(m => m.itemId === itemId);
    if (existingIndex >= 0) {
      materials[existingIndex].quantity = quantity;
    } else {
      materials.push({ itemId, quantity });
    }

    this.state.setState({ 
      selectedMaterials: materials,
      stage: 'material-selection',
    });

    this.checkEnhanceability();
    this.events.emit('material-selected', { itemId, quantity });
  }

  /**
   * ステータスプレビューを表示
   */
  previewStats(): void {
    const currentState = this.state.getState();
    if (!currentState.selectedEquipment) return;

    const equipment = currentState.selectedEquipment;
    const currentStats = equipment.baseStats || {} as Record<string, number>;
    
    // 強化後のステータスを計算
    const afterStats = { ...currentStats };
    const differences: Partial<Record<keyof TStats, number>> = {};

    // 装備固有の強化率を取得（装備に定義されていなければデフォルト10%）
    const enhanceRate = (equipment as any).enhanceRate || 0.1;

    // 各ステータスに強化率に応じたボーナスを付与
    for (const key in currentStats) {
      const currentValue = currentStats[key] as number;
      const increase = Math.floor(currentValue * enhanceRate);
      (afterStats as any)[key] = currentValue + increase;
      (differences as any)[key] = increase;
    }

    const preview: EnhanceStatsPreview<TStats> = {
      current: currentStats as any,
      after: afterStats as any,
      differences: differences as any,
    };

    this.state.setState({ statsPreview: preview });
    this.events.emit('stats-previewed', { preview });
  }

  /**
   * 強化を確認
   */
  confirmEnhance(): void {
    const currentState = this.state.getState();
    if (!currentState.canEnhance || !currentState.selectedEquipment) return;

    this.state.setState({ stage: 'confirming' });
    this.events.emit('stage-changed', { stage: 'confirming' });
  }

  /**
   * 強化を実行
   */
  async executeEnhance(): Promise<boolean> {
    const currentState = this.state.getState();
    if (!currentState.selectedEquipment) return false;

    this.state.setState({ 
      stage: 'enhancing',
      loading: { isLoading: true } 
    });

    try {
      const result = this.service.enhance(
        currentState.selectedEquipment
      );

      if (result.success) {
        const newLevel = result.newLevel;
        
        this.state.setState({
          stage: 'completed',
          loading: { isLoading: false },
        });

        this.events.emit('enhance-executed', {
          equipment: currentState.selectedEquipment,
          success: true,
          newLevel,
        });

        this.events.emit('enhance-succeeded', {
          equipment: currentState.selectedEquipment,
          newLevel,
          stats: currentState.statsPreview?.after || {},
        });

        return true;
      } else {
        this.state.setState({
          stage: 'selected',
          loading: { isLoading: false },
          error: { hasError: true, errorMessage: result.message },
        });

        this.events.emit('enhance-failed', {
          equipment: currentState.selectedEquipment,
          reason: result.message || '強化に失敗しました',
        });

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '強化エラー';
      this.state.setState({
        stage: 'selected',
        loading: { isLoading: false },
        error: { hasError: true, errorMessage: errorMessage },
      });

      this.events.emit('enhance-failed', {
        equipment: currentState.selectedEquipment,
        reason: errorMessage,
      });

      return false;
    }
  }

  /**
   * フィルタを設定
   */
  setFilter(filterType: EnhanceFilterType): void {
    this.state.setState({ filterType });
    this.applyFiltersAndSort();
    this.events.emit('filter-changed', { filterType });
  }

  /**
   * ソートを設定
   */
  setSortBy(sortBy: EnhanceSortBy, order: 'asc' | 'desc' = 'asc'): void {
    this.state.setState({ sortBy, sortOrder: order });
    this.applyFiltersAndSort();
    this.events.emit('sort-changed', { sortBy, order });
  }

  /**
   * キャンセル
   */
  cancel(): void {
    this.state.setState({
      stage: 'browsing',
      selectedEquipment: null,
      selectedMaterials: [],
      statsPreview: null,
    });
  }

  /**
   * 強化可能性をチェック
   */
  private checkEnhanceability(): void {
    const currentState = this.state.getState();
    if (!currentState.selectedEquipment) {
      this.state.setState({ canEnhance: false });
      return;
    }

    const equipment = currentState.selectedEquipment;
    const currentLevel = equipment.enhanceLevel || 0;

    // 最大レベルチェック
    if (currentLevel >= currentState.maxEnhanceLevel) {
      this.state.setState({ canEnhance: false });
      return;
    }

    // 素材チェック（簡略化）
    const hasMaterials = currentState.selectedMaterials.length > 0;
    
    // 成功率を計算（簡略化：レベルが高いほど成功率が下がる）
    const successRate = Math.max(100 - (currentLevel * 10), 10);

    // コストを計算（簡略化）
    const cost = {
      resourceId: 'money',
      amount: (currentLevel + 1) * 1000,
    };

    this.state.setState({
      canEnhance: hasMaterials,
      successRate,
      cost,
    });
  }

  /**
   * フィルタとソートを適用
   */
  private applyFiltersAndSort(): void {
    const currentState = this.state.getState();
    let equipment = [...currentState.availableEquipment];

    // フィルタ適用
    if (currentState.filterType === 'enhanceable') {
      equipment = equipment.filter(eq => (eq.enhanceLevel || 0) < currentState.maxEnhanceLevel);
    } else if (currentState.filterType === 'max-level') {
      equipment = equipment.filter(eq => (eq.enhanceLevel || 0) >= currentState.maxEnhanceLevel);
    }

    // ソート適用
    equipment.sort((a, b) => {
      let comparison = 0;
      switch (currentState.sortBy) {
        case 'name':
          // EnhancableEquipment doesn't have a name property, sort by ID
          comparison = a.id.toString().localeCompare(b.id.toString());
          break;
        case 'level':
          // EnhancableEquipment doesn't have levelRequirement, sort by ID
          comparison = a.id.toString().localeCompare(b.id.toString());
          break;
        case 'enhance-level':
          comparison = (a.enhanceLevel || 0) - (b.enhanceLevel || 0);
          break;
      }
      return currentState.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.state.setState({ availableEquipment: equipment });
  }
}
