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
      // Note: This is a placeholder implementation.  
      // CraftService.craft() requires recipe object, inventory, and character
      // but this controller doesn't have access to inventory/character state.
      // This should be refactored when inventory management is integrated.
      const recipe = this.service.getRecipe(currentState.selectedRecipe.id);
      if (!recipe) {
        throw new Error('Recipe not found');
      }
      
      // TODO: Pass actual inventory and character when available
      const result = this.service.craft(recipe, [], undefined);

      if (result.success && result.item) {
        this.state.setState({
          stage: 'completed',
          loading: { isLoading: false },
        });

        // Convert CraftedItemInfo to Item for the event
        // Note: This is a simplified conversion; a full implementation would need proper mapping
        const resultItems = result.item ? [{
          id: result.item.id,
          name: result.item.name,
          type: result.item.type,
        } as any] : [];

        this.events.emit('craft-executed', {
          recipe: currentState.selectedRecipe,
          quantity: currentState.quantity,
          result: resultItems,
        });

        return true;
      } else {
        this.state.setState({
          stage: 'selected',
          loading: { isLoading: false },
          error: { hasError: true, errorMessage: result.message },
        });

        this.events.emit('craft-failed', {
          recipe: currentState.selectedRecipe,
          reason: result.message || 'クラフトに失敗しました',
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

    // TODO: This method needs access to inventory to check material availability
    // For now, we'll just set canCraft to false as we don't have inventory access
    this.state.setState({
      canCraft: false,
      missingMaterials: [],
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
          // CraftRecipe doesn't have a level property
          // Sort by recipe ID as fallback
          comparison = a.id.toString().localeCompare(b.id.toString());
          break;
        case 'category':
          // CraftRecipe doesn't have a category property
          // Sort by recipe ID as fallback
          comparison = a.id.toString().localeCompare(b.id.toString());
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
    // TODO: This method needs access to inventory to check material availability
    // For now, return false as we don't have inventory access
    return false;
  }
}
