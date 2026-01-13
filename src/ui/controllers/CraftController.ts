import type { CraftService } from '../../services/CraftService';
import type { Item } from '../../types/item';
import type { CraftRecipe } from '../../types/craft';
import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type {
  CraftUIState,
  CraftEvents,
  CraftUIStage,
  CraftFilterType,
  CraftSortBy,
} from '../types/craft';

/**
 * クラフトコントローラー
 * アイテムのクラフトUIを管理します
 */
export class CraftController {
  private state: ObservableState<CraftUIState>;
  private events: EventEmitter<CraftEvents>;
  private service: CraftService;

  constructor(service: CraftService) {
    this.service = service;
    
    this.state = new ObservableState<CraftUIState>({
      stage: 'browsing',
      availableRecipes: [],
      selectedRecipe: null,
      quantity: 1,
      canCraft: false,
      missingMaterials: [],
      filterType: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      loading: { isLoading: false },
      error: { hasError: false },
    });
    
    this.events = new EventEmitter<CraftEvents>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: CraftUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof CraftEvents>(
    event: K,
    listener: (data: CraftEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * クラフト開始
   */
  startCrafting(recipes: CraftRecipe[]): void {
    this.state.setState({
      stage: 'browsing',
      availableRecipes: recipes,
      selectedRecipe: null,
      quantity: 1,
      canCraft: false,
      missingMaterials: [],
    });

    this.events.emit('craft-started', { recipes });
    this.applyFiltersAndSort();
  }

  /**
   * レシピを選択
   */
  selectRecipe(recipe: CraftRecipe): void {
    this.state.setState({
      selectedRecipe: recipe,
      stage: 'selected',
      quantity: 1,
    });

    this.checkCraftability();
    this.events.emit('recipe-selected', { recipe });
  }

  /**
   * クラフト数量を設定
   */
  setQuantity(quantity: number): void {
    if (quantity < 1) return;

    this.state.setState({ quantity });
    this.checkCraftability();
    this.events.emit('quantity-changed', { quantity });
  }

  /**
   * クラフト実行を確認
   */
  confirmCraft(): void {
    const currentState = this.state.getState();
    if (!currentState.canCraft || !currentState.selectedRecipe) return;

    this.state.setState({ stage: 'confirming' });
    this.events.emit('stage-changed', { stage: 'confirming' });
  }

  /**
   * クラフトを実行
   */
  async executeCraft(): Promise<boolean> {
    const currentState = this.state.getState();
    if (!currentState.selectedRecipe) return false;

    this.state.setState({ 
      stage: 'crafting',
      loading: { isLoading: true } 
    });

    try {
      const result = this.service.craft(currentState.selectedRecipe.id, currentState.quantity);

      if (result.success && result.items) {
        this.state.setState({
          stage: 'completed',
          loading: { isLoading: false },
        });

        this.events.emit('craft-executed', {
          recipe: currentState.selectedRecipe,
          quantity: currentState.quantity,
          result: result.items,
        });

        return true;
      } else {
        this.state.setState({
          stage: 'selected',
          loading: { isLoading: false },
          error: { hasError: true, errorMessage: result.failureReason },
        });

        this.events.emit('craft-failed', {
          recipe: currentState.selectedRecipe,
          reason: result.failureReason || 'クラフトに失敗しました',
        });

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'クラフトエラー';
      this.state.setState({
        stage: 'selected',
        loading: { isLoading: false },
        error: { hasError: true, errorMessage: errorMessage },
      });

      this.events.emit('craft-failed', {
        recipe: currentState.selectedRecipe,
        reason: errorMessage,
      });

      return false;
    }
  }

  /**
   * フィルタを設定
   */
  setFilter(filterType: CraftFilterType): void {
    this.state.setState({ filterType });
    this.applyFiltersAndSort();
    this.events.emit('filter-changed', { filterType });
  }

  /**
   * ソートを設定
   */
  setSortBy(sortBy: CraftSortBy, order: 'asc' | 'desc' = 'asc'): void {
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
      selectedRecipe: null,
      quantity: 1,
      canCraft: false,
      missingMaterials: [],
    });
  }

  /**
   * クラフト可能性をチェック
   */
  private checkCraftability(): void {
    const currentState = this.state.getState();
    if (!currentState.selectedRecipe) {
      this.state.setState({ canCraft: false, missingMaterials: [] });
      return;
    }

    const inventory = this.service.getInventory();
    const recipe = currentState.selectedRecipe;
    const missing: Array<{ itemId: string; required: number; current: number }> = [];

    let canCraft = true;

    // 材料チェック
    for (const material of recipe.materials) {
      const required = material.quantity * currentState.quantity;
      const inventorySlot = inventory.slots.find(s => s.item.id === material.itemId);
      const current = inventorySlot?.quantity || 0;

      if (current < required) {
        canCraft = false;
        missing.push({
          itemId: material.itemId,
          required,
          current,
        });
      }
    }

    this.state.setState({
      canCraft,
      missingMaterials: missing,
    });
  }

  /**
   * フィルタとソートを適用
   */
  private applyFiltersAndSort(): void {
    const currentState = this.state.getState();
    let recipes = [...currentState.availableRecipes];

    // フィルタ適用
    if (currentState.filterType === 'craftable') {
      recipes = recipes.filter(recipe => this.canCraftRecipe(recipe));
    } else if (currentState.filterType === 'uncraftable') {
      recipes = recipes.filter(recipe => !this.canCraftRecipe(recipe));
    }

    // ソート適用
    recipes.sort((a, b) => {
      let comparison = 0;
      switch (currentState.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'level':
          comparison = (a.level || 0) - (b.level || 0);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
      }
      return currentState.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.state.setState({ availableRecipes: recipes });
  }

  /**
   * レシピがクラフト可能かチェック
   */
  private canCraftRecipe(recipe: CraftRecipe): boolean {
    const inventory = this.service.getInventory();
    
    for (const material of recipe.materials) {
      const inventorySlot = inventory.slots.find(s => s.item.id === material.itemId);
      const current = inventorySlot?.quantity || 0;
      if (current < material.quantity) {
        return false;
      }
    }

    return true;
  }
}
