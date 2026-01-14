import type { ShopService } from '../../services/ShopService';
import type { InventoryService } from '../../services/InventoryService';
import type { Character } from '../../types/battle';
import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type {
  ShopUIState,
  ShopEvents,
  ShopUIItem,
  ShopUIStage,
  ShopMode,
  ShopFilterType,
  ShopSortBy,
} from '../types/shop';

/**
 * ショップコントローラー
 * アイテムの購入・売却UIを管理します
 */
export class ShopController {
  private state: ObservableState<ShopUIState>;
  private events: EventEmitter<ShopEvents>;
  private service: ShopService;
  private inventoryService: InventoryService;
  private character: Character | null = null;
  private shopItemIndices: Map<string, number> = new Map(); // Maps item ID to shop index

  constructor(service: ShopService, inventoryService: InventoryService) {
    this.service = service;
    this.inventoryService = inventoryService;
    
    this.state = new ObservableState<ShopUIState>({
      stage: 'browsing',
      shopItems: [],
      selectedItem: null,
      mode: 'buy',
      quantity: 1,
      totalPrice: 0,
      canTrade: false,
      tradeReasons: [],
      playerMoney: 0,
      filterType: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      pagination: { page: 1, perPage: 20, totalPages: 1, totalItems: 0 },
      loading: { isLoading: false },
      error: { hasError: false },
    });
    
    this.events = new EventEmitter<ShopEvents>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: ShopUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof ShopEvents>(
    event: K,
    listener: (data: ShopEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * キャラクターを設定
   * ショップの取引に使用されます
   * 
   * @param character - キャラクター。nullの場合はデフォルトキャラクターを使用（制限なしゲーム用）
   */
  setCharacter(character: Character | null): void {
    this.character = character;
  }

  /**
   * 取引実行用のキャラクターを取得
   * キャラクターが設定されていない場合は、制限チェックをパスするダミーキャラクターを返す
   */
  private getCharacterForTrade(): Character {
    if (this.character) {
      return this.character;
    }
    
    // 制限のないゲーム用のデフォルトキャラクター
    // すべての要件チェックをパスする最大レベルのキャラクター
    return {
      id: 'default-character',
      name: 'Player',
      level: 999,
      job: '',
      learnedSkills: [],
      stats: {} as any,
      statusEffects: [],
      currentHp: 1,
      currentMp: 0,
      position: 0,
    };
  }

  /**
   * ショップ開始
   */
  startShopping(items: ShopUIItem[], playerMoney: number): void {
    const totalItems = items.length;
    const perPage = this.state.getState().pagination.perPage;

    // Build index mapping
    this.shopItemIndices.clear();
    items.forEach((item, index) => {
      this.shopItemIndices.set(item.item.id, index);
    });

    this.state.setState({
      stage: 'browsing',
      shopItems: items,
      selectedItem: null,
      mode: 'buy',
      quantity: 1,
      totalPrice: 0,
      playerMoney,
      pagination: {
        page: 1,
        perPage,
        totalPages: Math.ceil(totalItems / perPage),
        totalItems,
      },
    });

    this.events.emit('shop-started', { items, playerMoney });
    this.applyFiltersAndSort();
  }

  /**
   * モードを変更
   */
  setMode(mode: ShopMode): void {
    this.state.setState({
      mode,
      selectedItem: null,
      quantity: 1,
      totalPrice: 0,
      stage: 'browsing',
    });

    this.events.emit('mode-changed', { mode });
    this.applyFiltersAndSort();
  }

  /**
   * アイテムを選択
   */
  selectItem(item: ShopUIItem): void {
    const currentState = this.state.getState();
    const price = currentState.mode === 'buy' ? item.buyPrice : item.sellPrice;

    this.state.setState({
      selectedItem: item,
      stage: currentState.mode === 'buy' ? 'buying' : 'selling',
      quantity: 1,
      totalPrice: price,
    });

    this.checkTradeability();
    this.events.emit('item-selected', { item });
  }

  /**
   * 数量を設定
   */
  setQuantity(quantity: number): void {
    if (quantity < 1) return;

    const currentState = this.state.getState();
    if (!currentState.selectedItem) return;

    const price = currentState.mode === 'buy' 
      ? currentState.selectedItem.buyPrice 
      : currentState.selectedItem.sellPrice;

    this.state.setState({
      quantity,
      totalPrice: price * quantity,
    });

    this.checkTradeability();
    this.events.emit('quantity-changed', { quantity });
  }

  /**
   * 取引を確認
   */
  confirmTrade(): void {
    const currentState = this.state.getState();
    if (!currentState.canTrade || !currentState.selectedItem) return;

    this.state.setState({ stage: 'confirming' });
    this.events.emit('stage-changed', { stage: 'confirming' });
  }

  /**
   * 取引を実行
   */
  async executeTrade(): Promise<boolean> {
    const currentState = this.state.getState();
    if (!currentState.selectedItem) return false;

    this.state.setState({ loading: { isLoading: true } });

    try {
      let result;
      // Use getCharacterForTrade() to support games without character restrictions
      const character = this.getCharacterForTrade();
      
      if (currentState.mode === 'buy') {
        // Get the shop item index for buyItem
        const shopItemIndex = this.shopItemIndices.get(currentState.selectedItem.item.id);
        if (shopItemIndex === undefined) {
          throw new Error('Shop item index not found');
        }
        
        result = this.service.buyItem(
          character,
          shopItemIndex,
          currentState.quantity
        );
      } else {
        result = this.service.sellItem(
          character,
          currentState.selectedItem.item.id,
          currentState.quantity
        );
      }

      if (result.success) {
        // Update player money based on transaction
        const newMoney = currentState.mode === 'buy'
          ? currentState.playerMoney - (result.moneySpent || 0)
          : currentState.playerMoney + (result.moneyGained || 0);

        this.state.setState({
          stage: 'completed',
          playerMoney: newMoney,
          loading: { isLoading: false },
        });

        if (currentState.mode === 'buy') {
          this.events.emit('item-bought', {
            item: currentState.selectedItem,
            quantity: currentState.quantity,
            totalPrice: result.moneySpent || 0,
          });
        } else {
          this.events.emit('item-sold', {
            item: currentState.selectedItem,
            quantity: currentState.quantity,
            totalPrice: result.moneyGained || 0,
          });
        }

        return true;
      } else {
        this.state.setState({
          stage: currentState.mode === 'buy' ? 'buying' : 'selling',
          loading: { isLoading: false },
          error: { hasError: true, errorMessage: result.failureReason },
        });

        this.events.emit('trade-failed', {
          item: currentState.selectedItem,
          reason: result.failureReason || '取引に失敗しました',
        });

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取引エラー';
      this.state.setState({
        stage: currentState.mode === 'buy' ? 'buying' : 'selling',
        loading: { isLoading: false },
        error: { hasError: true, errorMessage: errorMessage },
      });

      this.events.emit('trade-failed', {
        item: currentState.selectedItem,
        reason: errorMessage,
      });

      return false;
    }
  }

  /**
   * フィルタを設定
   */
  setFilter(filterType: ShopFilterType): void {
    this.state.setState({ filterType });
    this.applyFiltersAndSort();
    this.events.emit('filter-changed', { filterType });
  }

  /**
   * ソートを設定
   */
  setSortBy(sortBy: ShopSortBy, order: 'asc' | 'desc' = 'asc'): void {
    this.state.setState({ sortBy, sortOrder: order });
    this.applyFiltersAndSort();
    this.events.emit('sort-changed', { sortBy, order });
  }

  /**
   * ページを設定
   */
  setPage(page: number): void {
    const currentState = this.state.getState();
    if (page < 1 || page > currentState.pagination.totalPages) return;

    this.state.setState({
      pagination: {
        ...currentState.pagination,
        page,
      },
    });

    this.events.emit('page-changed', { page });
  }

  /**
   * キャンセル
   */
  cancel(): void {
    this.state.setState({
      stage: 'browsing',
      selectedItem: null,
      quantity: 1,
      totalPrice: 0,
    });
  }

  /**
   * 取引可能性をチェック
   * 
   * Note: これはUI表示用のプレビューです。
   * 実際の取引処理とバリデーションはShopService内で行われます。
   */
  private checkTradeability(): void {
    const currentState = this.state.getState();
    if (!currentState.selectedItem) {
      this.state.setState({ canTrade: false, tradeReasons: [] });
      return;
    }

    const reasons: string[] = [];
    let canTrade = true;

    if (currentState.mode === 'buy') {
      // 購入時のチェック（UI表示用プレビュー）
      
      // 所持金チェック
      if (currentState.playerMoney < currentState.totalPrice) {
        canTrade = false;
        reasons.push('所持金が不足しています');
      }

      // 在庫チェック
      if (currentState.selectedItem.stock !== null && 
          currentState.selectedItem.stock < currentState.quantity) {
        canTrade = false;
        reasons.push('在庫が不足しています');
      }

      // 購入条件チェック
      if (currentState.selectedItem.requirements?.level) {
        // レベルチェック（簡略化 - 実際にはプレイヤーレベルを参照）
        // const playerLevel = this.service.getPlayerLevel();
        // if (playerLevel < currentState.selectedItem.requirements.level) {
        //   canTrade = false;
        //   reasons.push(`レベル${currentState.selectedItem.requirements.level}以上が必要です`);
        // }
      }
    } else {
      // 売却時のチェック（UI表示用プレビュー）
      
      // インベントリにアイテムがあるかチェック
      // これはユーザーにフィードバックを提供するためのUI固有のロジックです
      const inventory = this.inventoryService.getInventory();
      const itemSlot = inventory.slots.find(slot => 
        slot && slot.item.id === currentState.selectedItem!.item.id
      );
      
      if (!itemSlot || itemSlot.quantity < currentState.quantity) {
        canTrade = false;
        reasons.push('アイテムが不足しています');
      }
    }

    this.state.setState({
      canTrade,
      tradeReasons: reasons,
    });
  }

  /**
   * フィルタとソートを適用
   */
  private applyFiltersAndSort(): void {
    const currentState = this.state.getState();
    let items = [...currentState.shopItems];

    // フィルタ適用
    if (currentState.filterType === 'buyable') {
      items = items.filter(item => {
        const affordable = item.buyPrice <= currentState.playerMoney;
        const inStock = item.stock === null || item.stock > 0;
        return affordable && inStock;
      });
    } else if (currentState.filterType === 'unbuyable') {
      items = items.filter(item => {
        const affordable = item.buyPrice <= currentState.playerMoney;
        const inStock = item.stock === null || item.stock > 0;
        return !affordable || !inStock;
      });
    } else if (currentState.filterType === 'sellable') {
      // 売却可能なアイテム（簡略化）
      items = items.filter(item => item.sellPrice > 0);
    }

    // ソート適用
    items.sort((a, b) => {
      let comparison = 0;
      switch (currentState.sortBy) {
        case 'name':
          comparison = a.item.name.localeCompare(b.item.name);
          break;
        case 'price':
          const priceA = currentState.mode === 'buy' ? a.buyPrice : a.sellPrice;
          const priceB = currentState.mode === 'buy' ? b.buyPrice : b.sellPrice;
          comparison = priceA - priceB;
          break;
        case 'category':
          comparison = (a.item.category || '').localeCompare(b.item.category || '');
          break;
      }
      return currentState.sortOrder === 'asc' ? comparison : -comparison;
    });

    // ページネーション更新
    const totalItems = items.length;
    const perPage = currentState.pagination.perPage;
    const totalPages = Math.ceil(totalItems / perPage);

    this.state.setState({
      shopItems: items,
      pagination: {
        ...currentState.pagination,
        totalItems,
        totalPages,
        page: Math.min(currentState.pagination.page, totalPages || 1),
      },
    });
  }
}
