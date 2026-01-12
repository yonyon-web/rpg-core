/**
 * Skill-related type definitions
 */

import { UniqueId, Element, Probability } from './common';
import { StatusEffectType } from './statusEffect';

/**
 * Skill type
 */
export type SkillType = 
  | 'physical'  // Physical attack
  | 'magic'     // Magic attack
  | 'heal'      // Heal
  | 'buff'      // Buff
  | 'debuff'    // Debuff
  | 'special';  // Special

/**
 * Target type
 */
export type TargetType = 
  | 'single-enemy'    // Single enemy
  | 'all-enemies'     // All enemies
  | 'single-ally'     // Single ally
  | 'all-allies'      // All allies
  | 'self'            // Self
  | 'random-enemies'  // Random enemies
  | 'random-allies';  // Random allies

/**
 * Status effect application info
 */
export interface StatusEffectApplication {
  effectType: StatusEffectType; // Status effect type
  probability: Probability;     // Application probability
  duration: number;             // Duration in turns
  power: number;                // Effect strength
}

/**
 * Skill definition
 */
export interface Skill {
  id: UniqueId;             // Skill ID
  name: string;             // Skill name
  type: SkillType;          // Skill type
  targetType: TargetType;   // Target type
  element: Element;         // Element
  power: number;            // Power (multiplier)
  mpCost: number;           // MP cost
  accuracy: number;         // Accuracy (1.0 = 100%)
  criticalBonus: number;    // Critical rate bonus
  isGuaranteedHit: boolean; // Guaranteed hit flag
  statusEffects?: StatusEffectApplication[]; // Status effects to apply
  description: string;      // Skill description
}
