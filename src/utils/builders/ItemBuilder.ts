/**
 * ItemBuilder - Builder pattern for easily creating Item instances
 * 
 * @example
 * ```typescript
 * const potion = new ItemBuilder('potion', 'Health Potion')
 *   .type('consumable')
 *   .category('consumable')
 *   .description('Restores 50 HP')
 *   .value(50)
 *   .rarity(1)
 *   .stackable(99)
 *   .usableInBattle(true)
 *   .usableOutOfBattle(true)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * const keyItem = new ItemBuilder('ancient-key', 'Ancient Key')
 *   .type('key-item')
 *   .category('key-item')
 *   .description('Opens the ancient temple door')
 *   .rarity(4)
 *   .notStackable()
 *   .build();
 * ```
 */

import type { Item, BaseItemType } from '../../types/item/item';
import type { UniqueId } from '../../types/common';
import type { BuilderRegistry } from './BuilderRegistry';

export class ItemBuilder<TItemType extends BaseItemType = string> {
  private item: Partial<Item<TItemType>>;
  private registry?: BuilderRegistry;

  constructor(id: UniqueId, name: string, registry?: BuilderRegistry) {
    // Initialize with default values
    this.item = {
      id,
      name,
      description: '',
      category: 'consumable',
      value: 0,
      rarity: 1,
      stackable: false,
      maxStack: 1,
      weight: 1,
      usableInBattle: false,
      usableOutOfBattle: false,
    };
    this.registry = registry;
  }

  /**
   * Set item type
   */
  type(type: TItemType): this {
    this.item.type = type;
    return this;
  }

  /**
   * Set item description
   */
  description(desc: string): this {
    this.item.description = desc;
    return this;
  }

  /**
   * Set item category
   */
  category(category: string): this {
    this.item.category = category;
    return this;
  }

  /**
   * Set item value (sell price)
   */
  value(value: number): this {
    this.item.value = value;
    return this;
  }

  /**
   * Set item rarity (0-5, where 5 is legendary)
   */
  rarity(rarity: number): this {
    this.item.rarity = rarity;
    return this;
  }

  /**
   * Set item as stackable with max stack size
   */
  stackable(maxStack: number = 99): this {
    this.item.stackable = true;
    this.item.maxStack = maxStack;
    return this;
  }

  /**
   * Set item as not stackable
   */
  notStackable(): this {
    this.item.stackable = false;
    this.item.maxStack = 1;
    return this;
  }

  /**
   * Set item weight
   */
  weight(weight: number): this {
    this.item.weight = weight;
    return this;
  }

  /**
   * Set if item is usable in battle
   */
  usableInBattle(usable: boolean = true): this {
    this.item.usableInBattle = usable;
    return this;
  }

  /**
   * Set if item is usable out of battle
   */
  usableOutOfBattle(usable: boolean = true): this {
    this.item.usableOutOfBattle = usable;
    return this;
  }

  /**
   * Build and return the Item
   */
  build(): Item<TItemType> {
    const item = this.item as Item<TItemType>;
    // Auto-register if registry is provided
    if (this.registry) {
      this.registry.registerItem(item);
    }
    return item;
  }
}
