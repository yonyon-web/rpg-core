/**
 * Combatant-related type definitions
 */

import { UniqueId } from './common';
import { Stats } from './stats';
import { StatusEffect } from './statusEffect';

/**
 * Combatant base interface
 * - Common attributes for characters and enemies
 */
export interface Combatant {
  id: UniqueId;              // Unique ID
  name: string;              // Name
  level: number;             // Level
  stats: Stats;              // Stats
  currentHp: number;         // Current HP
  currentMp: number;         // Current MP
  statusEffects: StatusEffect[]; // Current status effects
  position: number;          // Formation position (0=front, 1=back)
}
