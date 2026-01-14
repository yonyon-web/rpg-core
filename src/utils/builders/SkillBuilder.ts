/**
 * SkillBuilder - Builder pattern for easily creating Skill instances
 * 
 * @example
 * ```typescript
 * const fireball = new SkillBuilder('fireball', 'Fireball')
 *   .description('A powerful fire spell')
 *   .type('magic')
 *   .targetType('single-enemy')
 *   .power(50)
 *   .mpCost(20)
 *   .element('fire')
 *   .accuracy(0.95)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * const heal = new SkillBuilder('heal', 'Heal')
 *   .description('Restore HP to an ally')
 *   .type('heal')
 *   .targetType('single-ally')
 *   .power(80)
 *   .mpCost(15)
 *   .guaranteedHit()
 *   .build();
 * ```
 */

import type { Skill, BaseTargetType, SkillCost, DefaultSkillType, DefaultTargetType } from '../../types/character/skill';
import type { UniqueId, DefaultElement } from '../../types/common';

export class SkillBuilder {
  private skill: Partial<Skill>;

  constructor(id: UniqueId, name: string) {
    // Initialize with default values
    this.skill = {
      id,
      name,
      description: '',
      type: 'physical',
      targetType: 'single-enemy',
      power: 0,
      accuracy: 0.95,
      criticalBonus: 0,
      isGuaranteedHit: false,
      cost: {},
      element: 'none',
    };
  }

  /**
   * Set skill description
   */
  description(desc: string): this {
    this.skill.description = desc;
    return this;
  }

  /**
   * Set skill type
   */
  type(type: DefaultSkillType): this {
    this.skill.type = type;
    return this;
  }

  /**
   * Set target type
   */
  targetType(target: DefaultTargetType): this {
    this.skill.targetType = target;
    return this;
  }

  /**
   * Set skill power
   */
  power(power: number): this {
    this.skill.power = power;
    return this;
  }

  /**
   * Set skill accuracy
   */
  accuracy(accuracy: number): this {
    this.skill.accuracy = accuracy;
    return this;
  }

  /**
   * Set critical bonus
   */
  criticalBonus(bonus: number): this {
    this.skill.criticalBonus = bonus;
    return this;
  }

  /**
   * Mark skill as guaranteed hit
   */
  guaranteedHit(): this {
    this.skill.isGuaranteedHit = true;
    return this;
  }

  /**
   * Set MP cost
   */
  mpCost(mp: number): this {
    if (!this.skill.cost) {
      this.skill.cost = {};
    }
    this.skill.cost.mp = mp;
    return this;
  }

  /**
   * Set HP cost
   */
  hpCost(hp: number): this {
    if (!this.skill.cost) {
      this.skill.cost = {};
    }
    this.skill.cost.hp = hp;
    return this;
  }

  /**
   * Set skill cost (full object)
   */
  cost(cost: SkillCost): this {
    this.skill.cost = cost;
    return this;
  }

  /**
   * Set skill element
   */
  element(element: DefaultElement): this {
    this.skill.element = element;
    return this;
  }

  /**
   * Build and return the Skill
   */
  build(): Skill {
    return this.skill as Skill;
  }
}
