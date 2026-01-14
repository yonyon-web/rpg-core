/**
 * EquipmentBuilder - Builder pattern for easily creating Equipment instances
 * 
 * @example
 * ```typescript
 * const ironSword = new EquipmentBuilder('iron-sword', 'Iron Sword')
 *   .type('weapon')
 *   .description('A sturdy iron sword')
 *   .levelRequirement(5)
 *   .statModifier('attack', 20)
 *   .statModifier('accuracy', 5)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * const dragonArmor = new EquipmentBuilder('dragon-armor', 'Dragon Armor')
 *   .type('armor')
 *   .description('Armor crafted from dragon scales')
 *   .levelRequirement(20)
 *   .statModifiers({
 *     defense: 50,
 *     magicDefense: 30,
 *     maxHp: 100,
 *   })
 *   .build();
 * ```
 */

import type { Equipment, BaseEquipmentType } from '../../types/item/equipment';
import type { DefaultStats } from '../../types/character/stats';
import type { UniqueId } from '../../types/common';
import type { BuilderRegistry } from './BuilderRegistry';

export class EquipmentBuilder<TEquipType extends BaseEquipmentType = string> {
  private equipment: Partial<Equipment<DefaultStats, TEquipType>>;
  private registry?: BuilderRegistry;

  constructor(id: UniqueId, name: string, registry?: BuilderRegistry) {
    // Initialize with default values
    this.equipment = {
      id,
      name,
      description: '',
      levelRequirement: 1,
      statModifiers: {},
    };
    this.registry = registry;
  }

  /**
   * Set equipment type
   */
  type(type: TEquipType): this {
    this.equipment.type = type;
    return this;
  }

  /**
   * Set equipment description
   */
  description(desc: string): this {
    this.equipment.description = desc;
    return this;
  }

  /**
   * Set level requirement
   */
  levelRequirement(level: number): this {
    this.equipment.levelRequirement = level;
    return this;
  }

  /**
   * Add a single stat modifier
   */
  statModifier(stat: keyof DefaultStats, value: number): this {
    if (!this.equipment.statModifiers) {
      this.equipment.statModifiers = {};
    }
    this.equipment.statModifiers[stat] = value;
    return this;
  }

  /**
   * Set multiple stat modifiers at once
   */
  statModifiers(modifiers: Partial<DefaultStats>): this {
    this.equipment.statModifiers = { ...this.equipment.statModifiers, ...modifiers };
    return this;
  }

  /**
   * Build and return the Equipment
   */
  build(): Equipment<DefaultStats, TEquipType> {
    const equipment = this.equipment as Equipment<DefaultStats, TEquipType>;
    // Auto-register if registry is provided
    if (this.registry) {
      this.registry.registerEquipment(equipment);
    }
    return equipment;
  }
}
