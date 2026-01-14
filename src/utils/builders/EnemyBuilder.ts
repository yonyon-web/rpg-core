/**
 * EnemyBuilder - Builder pattern for easily creating Enemy instances
 * 
 * @example
 * ```typescript
 * const slime = new EnemyBuilder('slime1', 'Slime', 'slime')
 *   .level(5)
 *   .hp(50)
 *   .attack(20)
 *   .defense(15)
 *   .aiStrategy('aggressive')
 *   .expReward(50)
 *   .moneyReward(20)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * // Create a boss with drop items
 * const boss = new EnemyBuilder('boss1', 'Dragon', 'dragon')
 *   .level(20)
 *   .hp(500)
 *   .stats({ attack: 80, defense: 60, magic: 70 })
 *   .aiStrategy('balanced')
 *   .expReward(1000)
 *   .moneyReward(500)
 *   .addDropItem('rare-sword', 0.1, 1)
 *   .addDropItem('dragon-scale', 0.5, 3)
 *   .build();
 * ```
 */

import type { Enemy, DropItem, AIStrategy } from '../../types/battle/battle';
import type { DefaultStats } from '../../types/character/stats';
import type { Skill } from '../../types/character/skill';
import type { StatusEffect } from '../../types/status/statusEffect';
import type { BuilderRegistry } from './BuilderRegistry';

export class EnemyBuilder {
  private enemy: Partial<Enemy>;
  private registry?: BuilderRegistry;

  constructor(id: string, name: string, enemyType: string, registry?: BuilderRegistry) {
    // Initialize with default values
    this.enemy = {
      id,
      name,
      enemyType,
      level: 1,
      stats: {
        maxHp: 50,
        maxMp: 20,
        attack: 10,
        defense: 10,
        magic: 10,
        magicDefense: 10,
        speed: 10,
        luck: 5,
        accuracy: 5,
        evasion: 5,
        criticalRate: 0.05,
      },
      currentHp: 50,
      currentMp: 20,
      statusEffects: [],
      position: 0,
      skills: [],
      aiStrategy: 'balanced',
      expReward: 10,
      moneyReward: 5,
      dropItems: [],
    };
    this.registry = registry;
  }

  /**
   * Set enemy level
   */
  level(level: number): this {
    this.enemy.level = level;
    return this;
  }

  /**
   * Set HP (current and max)
   * @param current - Current HP
   * @param max - Max HP (optional, defaults to current)
   */
  hp(current: number, max?: number): this {
    this.enemy.currentHp = current;
    if (this.enemy.stats) {
      this.enemy.stats.maxHp = max ?? current;
    }
    return this;
  }

  /**
   * Set MP (current and max)
   * @param current - Current MP
   * @param max - Max MP (optional, defaults to current)
   */
  mp(current: number, max?: number): this {
    this.enemy.currentMp = current;
    if (this.enemy.stats) {
      this.enemy.stats.maxMp = max ?? current;
    }
    return this;
  }

  /**
   * Set attack stat
   */
  attack(value: number): this {
    if (this.enemy.stats) {
      this.enemy.stats.attack = value;
    }
    return this;
  }

  /**
   * Set defense stat
   */
  defense(value: number): this {
    if (this.enemy.stats) {
      this.enemy.stats.defense = value;
    }
    return this;
  }

  /**
   * Set magic stat
   */
  magic(value: number): this {
    if (this.enemy.stats) {
      this.enemy.stats.magic = value;
    }
    return this;
  }

  /**
   * Set magic defense stat
   */
  magicDefense(value: number): this {
    if (this.enemy.stats) {
      this.enemy.stats.magicDefense = value;
    }
    return this;
  }

  /**
   * Set speed stat
   */
  speed(value: number): this {
    if (this.enemy.stats) {
      this.enemy.stats.speed = value;
    }
    return this;
  }

  /**
   * Set multiple stats at once
   */
  stats(stats: Partial<DefaultStats>): this {
    if (this.enemy.stats) {
      this.enemy.stats = { ...this.enemy.stats, ...stats } as DefaultStats;
    }
    return this;
  }

  /**
   * Set enemy position (0=front, 1=back)
   */
  position(position: number): this {
    this.enemy.position = position;
    return this;
  }

  /**
   * Set AI strategy
   */
  aiStrategy(strategy: AIStrategy): this {
    this.enemy.aiStrategy = strategy;
    return this;
  }

  /**
   * Add a skill
   */
  addSkill(skill: Skill): this {
    if (!this.enemy.skills) {
      this.enemy.skills = [];
    }
    this.enemy.skills.push(skill);
    return this;
  }

  /**
   * Set skills
   */
  skills(skills: Skill[]): this {
    this.enemy.skills = skills;
    return this;
  }

  /**
   * Add a status effect
   */
  addStatusEffect(effect: StatusEffect): this {
    if (!this.enemy.statusEffects) {
      this.enemy.statusEffects = [];
    }
    this.enemy.statusEffects.push(effect);
    return this;
  }

  /**
   * Set status effects
   */
  statusEffects(effects: StatusEffect[]): this {
    this.enemy.statusEffects = effects;
    return this;
  }

  /**
   * Set experience reward
   */
  expReward(exp: number): this {
    this.enemy.expReward = exp;
    return this;
  }

  /**
   * Set job experience reward
   */
  jobExpReward(jobExp: number): this {
    this.enemy.jobExpReward = jobExp;
    return this;
  }

  /**
   * Set money reward
   */
  moneyReward(money: number): this {
    this.enemy.moneyReward = money;
    return this;
  }

  /**
   * Add a drop item
   * @param itemId - Item ID
   * @param probability - Drop probability (0.0-1.0)
   * @param quantity - Drop quantity
   */
  addDropItem(itemId: string, probability: number, quantity: number = 1): this {
    if (!this.enemy.dropItems) {
      this.enemy.dropItems = [];
    }
    this.enemy.dropItems.push({ itemId, probability, quantity });
    return this;
  }

  /**
   * Set drop items
   */
  dropItems(items: DropItem[]): this {
    this.enemy.dropItems = items;
    return this;
  }

  /**
   * Add a drop item by name (requires registry)
   * @param itemName - Item name
   * @param probability - Drop probability (0.0-1.0)
   * @param quantity - Drop quantity
   * @param registry - BuilderRegistry to look up item ID
   */
  addDropItemByName(itemName: string, probability: number, quantity: number = 1, registry: BuilderRegistry): this {
    const itemId = registry.getItemId(itemName);
    if (itemId) {
      if (!this.enemy.dropItems) {
        this.enemy.dropItems = [];
      }
      this.enemy.dropItems.push({ itemId, probability, quantity });
    }
    return this;
  }

  /**
   * Build and return the Enemy
   */
  build(): Enemy {
    const enemy = this.enemy as Enemy;
    // Auto-register if registry is provided
    if (this.registry) {
      this.registry.registerEnemy(enemy);
    }
    return enemy;
  }
}
