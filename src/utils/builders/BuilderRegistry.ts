/**
 * BuilderRegistry - Registry for storing and looking up game entities by name
 * 
 * This allows builders to reference other entities by name instead of having to remember IDs.
 * 
 * @example
 * ```typescript
 * const registry = new BuilderRegistry();
 * 
 * // Register entities
 * const fireball = new SkillBuilder('fireball-id', 'Fireball').build();
 * registry.registerSkill(fireball);
 * 
 * const potion = new ItemBuilder('potion-id', 'Health Potion').build();
 * registry.registerItem(potion);
 * 
 * // Look up by name
 * const fireballId = registry.getSkillId('Fireball'); // 'fireball-id'
 * const potionId = registry.getItemId('Health Potion'); // 'potion-id'
 * 
 * // Use with builders
 * const mage = new JobBuilder('mage', 'Mage')
 *   .availableSkillsByName(['Fireball', 'Ice Blast'], registry)
 *   .build();
 * ```
 */

import type { UniqueId } from '../../types/common';
import type { Job } from '../../types/character/job';
import type { Skill } from '../../types/character/skill';
import type { Item, BaseItemType } from '../../types/item/item';
import type { Equipment, BaseEquipmentType } from '../../types/item/equipment';
import type { Character } from '../../types/battle/battle';
import type { Enemy } from '../../types/battle/battle';

export class BuilderRegistry {
  private jobs: Map<string, Job> = new Map();
  private skills: Map<string, Skill> = new Map();
  private items: Map<string, Item<any>> = new Map();
  private equipment: Map<string, Equipment<any, any>> = new Map();
  private characters: Map<string, Character> = new Map();
  private enemies: Map<string, Enemy> = new Map();

  /**
   * Register a job
   */
  registerJob(job: Job): this {
    this.jobs.set(job.name, job);
    return this;
  }

  /**
   * Register a skill
   */
  registerSkill(skill: Skill): this {
    this.skills.set(skill.name, skill);
    return this;
  }

  /**
   * Register an item
   */
  registerItem<TItemType extends BaseItemType = string>(item: Item<TItemType>): this {
    this.items.set(item.name, item);
    return this;
  }

  /**
   * Register equipment
   */
  registerEquipment<TEquipType extends BaseEquipmentType = string>(equipment: Equipment<any, TEquipType>): this {
    this.equipment.set(equipment.name, equipment);
    return this;
  }

  /**
   * Register a character
   */
  registerCharacter(character: Character): this {
    this.characters.set(character.name, character);
    return this;
  }

  /**
   * Register an enemy
   */
  registerEnemy(enemy: Enemy): this {
    this.enemies.set(enemy.name, enemy);
    return this;
  }

  /**
   * Get job ID by name
   */
  getJobId(name: string): UniqueId | undefined {
    return this.jobs.get(name)?.id;
  }

  /**
   * Get skill ID by name
   */
  getSkillId(name: string): UniqueId | undefined {
    return this.skills.get(name)?.id;
  }

  /**
   * Get item ID by name
   */
  getItemId(name: string): UniqueId | undefined {
    return this.items.get(name)?.id;
  }

  /**
   * Get equipment ID by name
   */
  getEquipmentId(name: string): UniqueId | undefined {
    return this.equipment.get(name)?.id;
  }

  /**
   * Get character ID by name
   */
  getCharacterId(name: string): UniqueId | undefined {
    return this.characters.get(name)?.id;
  }

  /**
   * Get enemy ID by name
   */
  getEnemyId(name: string): UniqueId | undefined {
    return this.enemies.get(name)?.id;
  }

  /**
   * Get job by name
   */
  getJob(name: string): Job | undefined {
    return this.jobs.get(name);
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get item by name
   */
  getItem<TItemType extends BaseItemType = string>(name: string): Item<TItemType> | undefined {
    return this.items.get(name) as Item<TItemType> | undefined;
  }

  /**
   * Get equipment by name
   */
  getEquipment<TEquipType extends BaseEquipmentType = string>(name: string): Equipment<any, TEquipType> | undefined {
    return this.equipment.get(name) as Equipment<any, TEquipType> | undefined;
  }

  /**
   * Get character by name
   */
  getCharacter(name: string): Character | undefined {
    return this.characters.get(name);
  }

  /**
   * Get enemy by name
   */
  getEnemy(name: string): Enemy | undefined {
    return this.enemies.get(name);
  }

  /**
   * Clear all registered entities
   */
  clear(): void {
    this.jobs.clear();
    this.skills.clear();
    this.items.clear();
    this.equipment.clear();
    this.characters.clear();
    this.enemies.clear();
  }

  /**
   * Get all registered job names
   */
  getJobNames(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * Get all registered skill names
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * Get all registered item names
   */
  getItemNames(): string[] {
    return Array.from(this.items.keys());
  }

  /**
   * Get all registered equipment names
   */
  getEquipmentNames(): string[] {
    return Array.from(this.equipment.keys());
  }

  /**
   * Get all registered character names
   */
  getCharacterNames(): string[] {
    return Array.from(this.characters.keys());
  }

  /**
   * Get all registered enemy names
   */
  getEnemyNames(): string[] {
    return Array.from(this.enemies.keys());
  }
}
