/**
 * アイテム関連の型定義
 */

import type { UniqueId } from './common';
import type { BaseStats, DefaultStats } from './stats';
import type { Combatant } from './combatant';
import type { 
  BaseStatusEffectType, 
  DefaultStatusEffectType,
  BaseStatusEffectCategory,
  DefaultStatusEffectCategory 
} from './statusEffect';
import type { BaseTargetType, DefaultTargetType } from './skill';

/**
 * アイテムタイプの基底型
 * - ゲームごとに独自のアイテム分類を定義可能
 */
export type BaseItemType = string;

/**
 * デフォルトアイテムタイプ
 * - 標準的なJRPG向けのアイテム分類
 */
export type DefaultItemType =
  | 'consumable'      // 消耗品
  | 'key-item'        // キーアイテム
  | 'material'        // 素材
  | 'equipment';      // 装備品

/**
 * アイテム効果タイプ
 */
export type ItemEffectType =
  | 'heal-hp'           // HP回復
  | 'heal-mp'           // MP回復
  | 'heal-status'       // 状態異常回復
  | 'damage'            // ダメージ
  | 'buff'              // バフ効果
  | 'debuff'            // デバフ効果
  | 'revive';           // 蘇生

/**
 * アイテム効果
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 */
export interface ItemEffect<
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType
> {
  type: ItemEffectType;         // 効果タイプ
  value: number;                // 効果値（回復量、ダメージ量など）
  targetType: BaseTargetType;   // 対象タイプ
  statusEffectType?: TEffectType; // 状態異常タイプ（状態異常関連の場合）
}

/**
 * 消耗品アイテム
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TItemType - アイテムタイプ（デフォルト: DefaultItemType）
 * @template TTargetType - 対象タイプ（デフォルト: DefaultTargetType）
 * 
 * @example
 * const potion: ConsumableItem = {
 *   id: 'potion',
 *   name: 'Potion',
 *   type: 'consumable',
 *   effect: { type: 'heal-hp', value: 50, targetType: 'single-ally' },
 *   usableInBattle: true
 * };
 */
export interface ConsumableItem<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TItemType extends BaseItemType = DefaultItemType,
  TTargetType extends BaseTargetType = DefaultTargetType
> {
  id: UniqueId;                    // アイテムID
  name: string;                    // アイテム名
  type: TItemType;                 // アイテムタイプ
  description: string;             // 説明
  effect: ItemEffect<TEffectType>; // アイテム効果
  usableInBattle: boolean;         // 戦闘中使用可能か
  usableOutOfBattle: boolean;      // 戦闘外使用可能か
  targetType: TTargetType;         // 対象タイプ
  consumable: boolean;             // 消費するか
}

/**
 * アイテム使用条件
 */
export interface ItemUseConditions {
  inBattle?: boolean;              // 戦闘中かどうか
  targetAlive?: boolean;           // 対象が生存している必要があるか
  targetDead?: boolean;            // 対象が死亡している必要があるか
  minHpRate?: number;              // 対象の最小HP率（0.0-1.0）
  maxHpRate?: number;              // 対象の最大HP率（0.0-1.0）
}

/**
 * アイテム使用結果
 */
export interface ItemUseResult {
  success: boolean;
  message: string;
  effects?: {
    target: Combatant;
    hpRestored?: number;
    mpRestored?: number;
    statusRemoved?: string[];
    revived?: boolean;
  }[];
}

/**
 * 一般的なアイテム型
 * @template TItemType - アイテムタイプ（デフォルト: DefaultItemType）
 */
export interface Item<
  TItemType extends BaseItemType = DefaultItemType
> {
  id: UniqueId;                    // アイテムID
  name: string;                    // アイテム名
  type: TItemType;                 // アイテムタイプ
  description?: string;            // 説明
  category: string;                // カテゴリ（weapon, armor, consumable等）
  value?: number;                  // 売却価格
  rarity?: number;                 // レアリティ（0-5など）
  stackable?: boolean;             // スタック可能か
  maxStack?: number;               // 最大スタック数
  weight?: number;                 // 重量
  usableInBattle?: boolean;        // 戦闘中使用可能か
  usableOutOfBattle?: boolean;     // 戦闘外使用可能か
}

/**
 * インベントリスロット
 */
export interface InventorySlot {
  item: Item;                      // アイテム
  quantity: number;                // 数量
  isEquipped?: boolean;            // 装備中フラグ
  slotIndex: number;               // スロットインデックス
  acquiredAt?: number;             // 取得日時（タイムスタンプ）
}

/**
 * インベントリ
 */
export interface Inventory {
  slots: InventorySlot[];          // スロットリスト
  maxSlots: number;                // 最大スロット数
  money: number;                   // 所持金（後方互換性のため維持）
  usedSlots: number;               // 使用中のスロット数
  resources?: Record<string, number>; // 汎用リソース（SP、クラフトポイント等、ゲーム毎に定義可能）
}

/**
 * インベントリ検索条件
 * ライブラリ利用者が拡張可能
 */
export interface InventorySearchCriteria {
  itemId?: UniqueId;               // アイテムID
  category?: string;               // カテゴリ
  name?: string;                   // 名前（部分一致）
  minQuantity?: number;            // 最小数量
  maxQuantity?: number;            // 最大数量
  isEquipped?: boolean;            // 装備中フラグ
  customPredicate?: (slot: InventorySlot) => boolean;  // カスタム条件関数
  [key: string]: any;              // ライブラリ利用者による拡張を許可
}

/**
 * インベントリソート基準
 */
export type InventorySortBy = 
  | 'name'                         // 名前順
  | 'category'                     // カテゴリ順
  | 'quantity'                     // 数量順
  | 'rarity'                       // レアリティ順
  | 'value'                        // 価値順
  | 'acquired'                     // 取得日時順
  | 'type';                        // タイプ順

/**
 * ソート順序
 */
export type SortOrder = 'asc' | 'desc';

/**
 * インベントリ操作オプション
 */
export interface InventoryOperationOptions {
  allowOverflow?: boolean;         // 容量超過を許可
  skipEquipped?: boolean;          // 装備中アイテムをスキップ
  preferStackable?: boolean;       // スタック可能アイテムを優先
}

/**
 * インベントリ操作結果
 */
export interface InventoryResult {
  success: boolean;                // 成功したか
  slotsUsed: number;               // 使用または解放されたスロット数（負の値は解放）
  itemsAdded?: number;             // 追加されたアイテム数
  itemsRemoved?: number;           // 削除されたアイテム数
  failureReason?: string;          // 失敗理由
}

/**
 * インベントリ統計情報
 */
export interface InventoryStats {
  totalSlots: number;              // 総スロット数
  usedSlots: number;               // 使用中のスロット数
  availableSlots: number;          // 空きスロット数
  totalItems: number;              // 総アイテム数（数量合計）
  uniqueItems: number;             // ユニークアイテム数（種類数）
  itemsByCategory: Record<string, number>; // カテゴリ別アイテム数
  totalValue: number;              // 総価値
  equippedCount: number;           // 装備中アイテム数
  money: number;                   // 所持金
  resources?: Record<string, number>; // 汎用リソース
}
