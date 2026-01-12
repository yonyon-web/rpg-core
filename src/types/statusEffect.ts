/**
 * Status effect type definitions
 */

import { UniqueId, Timestamp } from './common';

/**
 * Status effect type
 */
export type StatusEffectType = 
  | 'poison'        // Poison
  | 'burn'          // Burn
  | 'paralysis'     // Paralysis
  | 'sleep'         // Sleep
  | 'confusion'     // Confusion
  | 'silence'       // Silence
  | 'blind'         // Blind
  | 'stun'          // Stun
  | 'regeneration'  // Regeneration
  | 'attack-up'     // Attack up
  | 'attack-down'   // Attack down
  | 'defense-up'    // Defense up
  | 'defense-down'  // Defense down
  | 'speed-up'      // Speed up
  | 'speed-down';   // Speed down

/**
 * Status effect category
 */
export type StatusEffectCategory = 
  | 'debuff'        // Debuff
  | 'buff'          // Buff
  | 'dot'           // Damage over time
  | 'hot'           // Heal over time
  | 'disable';      // Action disable

/**
 * Status effect
 */
export interface StatusEffect {
  id: UniqueId;                     // Status effect ID
  type: StatusEffectType;           // Type
  category: StatusEffectCategory;   // Category
  name: string;                     // Name
  description: string;              // Description
  power: number;                    // Effect strength
  duration: number;                 // Remaining turns
  maxDuration: number;              // Maximum duration
  stackCount: number;               // Stack count
  maxStack: number;                 // Maximum stack
  canBeDispelled: boolean;          // Can be dispelled
  appliedAt: Timestamp;             // Applied timestamp
  source?: UniqueId;                // Source ID
}
