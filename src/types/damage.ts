/**
 * Damage and combat result type definitions
 */

/**
 * Damage modifier information
 */
export interface DamageModifier {
  source: string;   // Modifier source (e.g., "Critical", "Element")
  multiplier: number; // Modifier multiplier
}

/**
 * Damage calculation result
 * - Contains detailed information about damage calculation
 */
export interface DamageResult {
  finalDamage: number;          // Final damage
  baseDamage: number;           // Base damage
  isCritical: boolean;          // Critical hit flag
  isHit: boolean;               // Hit flag
  elementalModifier: number;    // Elemental modifier
  variance: number;             // Damage variance
  appliedModifiers: DamageModifier[]; // Applied modifiers
}

/**
 * Heal result
 */
export interface HealResult {
  healAmount: number;       // Heal amount
  overheal: number;         // Overheal amount
  isCritical: boolean;      // Critical heal flag
}
