/**
 * CharacterBuilder - Builder pattern for easily creating Character instances
 * 
 * @example
 * ```typescript
 * const hero = new CharacterBuilder('hero1', 'Hero')
 *   .level(10)
 *   .hp(100, 100)
 *   .mp(50, 50)
 *   .attack(50)
 *   .defense(30)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * // Create a mage with custom stats
 * const mage = new CharacterBuilder('mage1', 'Mage')
 *   .level(15)
 *   .hp(80, 80)
 *   .mp(150, 150)
 *   .stats({ magic: 70, magicDefense: 40 })
 *   .job('Mage')
 *   .build();
 * ```
 */

import type { Character } from '../../types/battle/battle';
import type { DefaultStats } from '../../types/character/stats';
import type { LearnedSkill } from '../../types/character/skill';
import type { StatusEffect } from '../../types/status/statusEffect';

export class CharacterBuilder {
  private character: Partial<Character>;

  constructor(id: string, name: string) {
    // Initialize with default values
    this.character = {
      id,
      name,
      level: 1,
      stats: {
        maxHp: 100,
        maxMp: 50,
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
      currentHp: 100,
      currentMp: 50,
      statusEffects: [],
      position: 0,
      learnedSkills: [],
    };
  }

  /**
   * Set character level
   */
  level(level: number): this {
    this.character.level = level;
    return this;
  }

  /**
   * Set HP (current and max)
   * @param current - Current HP
   * @param max - Max HP (optional, defaults to current)
   */
  hp(current: number, max?: number): this {
    this.character.currentHp = current;
    if (this.character.stats) {
      this.character.stats.maxHp = max ?? current;
    }
    return this;
  }

  /**
   * Set MP (current and max)
   * @param current - Current MP
   * @param max - Max MP (optional, defaults to current)
   */
  mp(current: number, max?: number): this {
    this.character.currentMp = current;
    if (this.character.stats) {
      this.character.stats.maxMp = max ?? current;
    }
    return this;
  }

  /**
   * Set attack stat
   */
  attack(value: number): this {
    if (this.character.stats) {
      this.character.stats.attack = value;
    }
    return this;
  }

  /**
   * Set defense stat
   */
  defense(value: number): this {
    if (this.character.stats) {
      this.character.stats.defense = value;
    }
    return this;
  }

  /**
   * Set magic stat
   */
  magic(value: number): this {
    if (this.character.stats) {
      this.character.stats.magic = value;
    }
    return this;
  }

  /**
   * Set magic defense stat
   */
  magicDefense(value: number): this {
    if (this.character.stats) {
      this.character.stats.magicDefense = value;
    }
    return this;
  }

  /**
   * Set speed stat
   */
  speed(value: number): this {
    if (this.character.stats) {
      this.character.stats.speed = value;
    }
    return this;
  }

  /**
   * Set multiple stats at once
   */
  stats(stats: Partial<DefaultStats>): this {
    if (this.character.stats) {
      this.character.stats = { ...this.character.stats, ...stats } as DefaultStats;
    }
    return this;
  }

  /**
   * Set character position (0=front, 1=back)
   */
  position(position: number): this {
    this.character.position = position;
    return this;
  }

  /**
   * Set character job
   */
  job(jobName: string, jobLevel?: number, jobExp?: number): this {
    this.character.job = jobName;
    if (jobLevel !== undefined) {
      this.character.jobLevel = jobLevel;
    }
    if (jobExp !== undefined) {
      this.character.jobExp = jobExp;
    }
    return this;
  }

  /**
   * Add a learned skill
   */
  addSkill(skill: LearnedSkill): this {
    if (!this.character.learnedSkills) {
      this.character.learnedSkills = [];
    }
    this.character.learnedSkills.push(skill);
    return this;
  }

  /**
   * Set learned skills
   */
  skills(skills: LearnedSkill[]): this {
    this.character.learnedSkills = skills;
    return this;
  }

  /**
   * Add a status effect
   */
  addStatusEffect(effect: StatusEffect): this {
    if (!this.character.statusEffects) {
      this.character.statusEffects = [];
    }
    this.character.statusEffects.push(effect);
    return this;
  }

  /**
   * Set status effects
   */
  statusEffects(effects: StatusEffect[]): this {
    this.character.statusEffects = effects;
    return this;
  }

  /**
   * Set current experience
   */
  exp(exp: number): this {
    this.character.currentExp = exp;
    return this;
  }

  /**
   * Build and return the Character
   */
  build(): Character {
    return this.character as Character;
  }
}
