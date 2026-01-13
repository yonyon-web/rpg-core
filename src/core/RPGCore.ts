/**
 * RPGCore - Central configuration and initialization system
 * 
 * rpg-coreの全機能を一箇所で設定・初期化できるエントリーポイント
 * 
 * @example
 * ```typescript
 * // 基本的な使い方
 * const rpg = new RPGCore({
 *   config: customGameConfig
 * });
 * 
 * // サービスを取得
 * const battleService = rpg.services.battle;
 * const itemService = rpg.services.item;
 * 
 * // コントローラーを取得
 * const battleController = rpg.controllers.battle();
 * ```
 */

import { ServiceContainer } from './ServiceContainer';
import { defaultGameConfig } from '../config/defaultConfig';
import { EventBus } from './EventBus';

// Services
import { BattleService } from '../services/BattleService';
import { ItemService } from '../services/ItemService';
import { EquipmentService } from '../services/EquipmentService';
import { PartyService } from '../services/PartyService';
import { StatusEffectService } from '../services/StatusEffectService';
import { RewardService } from '../services/RewardService';
import { SkillLearnService } from '../services/SkillLearnService';
import { JobChangeService } from '../services/JobChangeService';
import { CraftService } from '../services/CraftService';
import { EnhanceService } from '../services/EnhanceService';
import { SaveLoadService } from '../services/SaveLoadService';
import { SimulationService } from '../services/SimulationService';
import { InventoryService } from '../services/InventoryService';
import { ShopService } from '../services/ShopService';
import { CommandService } from '../services/CommandService';
import { EnemyAIService } from '../services/EnemyAIService';
import { EnemyGroupService } from '../services/EnemyGroupService';

// Controllers
import { BattleController } from '../ui/controllers/BattleController';
import { ItemController } from '../ui/controllers/ItemController';
import { EquipmentController } from '../ui/controllers/EquipmentController';
import { PartyController } from '../ui/controllers/PartyController';
import { CraftController } from '../ui/controllers/CraftController';
import { SkillLearnController } from '../ui/controllers/SkillLearnController';
import { RewardController } from '../ui/controllers/RewardController';
import { EnhanceController } from '../ui/controllers/EnhanceController';
import { JobChangeController } from '../ui/controllers/JobChangeController';
import { StatusEffectController } from '../ui/controllers/StatusEffectController';
import { InventoryController } from '../ui/controllers/InventoryController';
import { ShopController } from '../ui/controllers/ShopController';
import { CommandController } from '../ui/controllers/CommandController';

import type { GameConfig } from '../types/config';
import type { Inventory, Shop } from '../types';

/**
 * RPGCore設定オプション
 */
export interface RPGCoreOptions {
  /**
   * ゲーム設定（省略時はdefaultGameConfigを使用）
   */
  config?: GameConfig;
  
  /**
   * イベントバスを使用するか（デフォルト: true）
   */
  useEventBus?: boolean;
  
  /**
   * 初期インベントリ（省略時は空のインベントリを作成）
   */
  initialInventory?: Inventory;
}

/**
 * RPGCore クラス
 * 
 * rpg-coreの全機能にアクセスするための統一インターフェース
 */
export class RPGCore {
  private _container: ServiceContainer;
  private _config: GameConfig;
  private _eventBus?: EventBus;

  /**
   * コンストラクタ
   * 
   * @param options - 設定オプション
   */
  constructor(options: RPGCoreOptions = {}) {
    this._container = new ServiceContainer();
    this._config = options.config || defaultGameConfig;
    
    // EventBusの初期化
    if (options.useEventBus !== false) {
      this._eventBus = new EventBus();
    }

    // 全サービスを登録
    this.registerServices(options);
  }

  /**
   * 全サービスを登録
   */
  private registerServices(options: RPGCoreOptions): void {
    // 基本サービス
    this._container.register('config', () => this._config);
    this._container.register('eventBus', () => this._eventBus);
    
    // インベントリの初期化
    const initialInventory: Inventory = options.initialInventory || {
      maxSlots: 100,
      slots: [],
      usedSlots: 0,
      resources: {}
    };
    this._container.register('inventory', () => initialInventory);

    // コアサービス群
    this._container.register('itemService', (c) => 
      new ItemService(c.resolve('eventBus'))
    );
    
    this._container.register('equipmentService', (c) => 
      new EquipmentService(undefined, c.resolve('eventBus'))
    );
    
    this._container.register('partyService', (c) => 
      new PartyService(undefined, c.resolve('eventBus'))
    );
    
    this._container.register('statusEffectService', () => 
      new StatusEffectService()
    );
    
    this._container.register('inventoryService', (c) => 
      new InventoryService(c.resolve('inventory'), c.resolve('eventBus'))
    );
    
    this._container.register('rewardService', () => 
      new RewardService()
    );
    
    this._container.register('skillLearnService', () => 
      new SkillLearnService()
    );
    
    this._container.register('jobChangeService', () => 
      new JobChangeService()
    );
    
    this._container.register('craftService', (c) => 
      new CraftService({}, c.resolve('eventBus'))
    );
    
    this._container.register('enhanceService', (c) => 
      new EnhanceService({}, c.resolve('eventBus'))
    );
    
    this._container.register('shopService', (c) => {
      // Create a default shop with empty items
      const defaultShop = {
        id: 'default-shop',
        name: 'Shop',
        items: [],
        buyPriceMultiplier: 1.0,
        sellPriceMultiplier: 0.5
      };
      return new ShopService(defaultShop, c.resolve('inventoryService'), c.resolve('eventBus'));
    });
    
    this._container.register('commandService', (c) => 
      new CommandService(c.resolve('config'))
    );
    
    this._container.register('enemyAIService', (c) => 
      new EnemyAIService(c.resolve('config'))
    );
    
    this._container.register('enemyGroupService', () => 
      new EnemyGroupService()
    );
    
    this._container.register('saveLoadService', () => 
      new SaveLoadService()
    );
    
    this._container.register('simulationService', (c) => 
      new SimulationService(c.resolve('config'))
    );
    
    // BattleServiceは他のサービスに依存
    this._container.register('battleService', (c) => 
      new BattleService(c.resolve('config'))
    );
  }

  /**
   * ゲーム設定を取得
   */
  get config(): GameConfig {
    return this._config;
  }

  /**
   * イベントバスを取得
   */
  get eventBus(): EventBus | undefined {
    return this._eventBus;
  }

  /**
   * サービスに直接アクセス
   */
  get services() {
    return {
      battle: this._container.resolve<BattleService>('battleService'),
      item: this._container.resolve<ItemService>('itemService'),
      equipment: this._container.resolve<EquipmentService>('equipmentService'),
      party: this._container.resolve<PartyService>('partyService'),
      statusEffect: this._container.resolve<StatusEffectService>('statusEffectService'),
      inventory: this._container.resolve<InventoryService>('inventoryService'),
      reward: this._container.resolve<RewardService>('rewardService'),
      skillLearn: this._container.resolve<SkillLearnService>('skillLearnService'),
      jobChange: this._container.resolve<JobChangeService>('jobChangeService'),
      craft: this._container.resolve<CraftService>('craftService'),
      enhance: this._container.resolve<EnhanceService>('enhanceService'),
      shop: this._container.resolve<ShopService>('shopService'),
      command: this._container.resolve<CommandService>('commandService'),
      enemyAI: this._container.resolve<EnemyAIService>('enemyAIService'),
      enemyGroup: this._container.resolve<EnemyGroupService>('enemyGroupService'),
      saveLoad: this._container.resolve<SaveLoadService>('saveLoadService'),
      simulation: this._container.resolve<SimulationService>('simulationService'),
    };
  }

  /**
   * コントローラーファクトリ
   * 
   * 各コントローラーは必要なサービスが自動的に注入される
   */
  get controllers() {
    return {
      battle: () => new BattleController(this.services.battle),
      item: () => new ItemController(this.services.item),
      equipment: () => new EquipmentController(this.services.equipment),
      party: () => new PartyController(this.services.party),
      craft: () => new CraftController(this.services.craft),
      skillLearn: () => new SkillLearnController(this.services.skillLearn),
      reward: () => new RewardController(this.services.reward),
      enhance: () => new EnhanceController(this.services.enhance),
      jobChange: () => new JobChangeController(this.services.jobChange),
      statusEffect: () => new StatusEffectController(this.services.statusEffect),
      inventory: () => new InventoryController(this.services.inventory),
      shop: () => new ShopController(this.services.shop),
      command: () => new CommandController(this.services.command),
    };
  }

  /**
   * DIコンテナに直接アクセス（高度な用途）
   * 
   * @example
   * ```typescript
   * // カスタムサービスを登録
   * rpg.container.register('myService', () => new MyService());
   * 
   * // カスタムサービスを解決
   * const myService = rpg.container.resolve('myService');
   * ```
   */
  get container(): ServiceContainer {
    return this._container;
  }
}
