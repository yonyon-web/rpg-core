/**
 * Common type definitions for rpg-core
 */

/**
 * Unique ID type
 * - Used for identifying all entities
 */
export type UniqueId = string;

/**
 * Timestamp type
 * - UNIX timestamp in milliseconds
 */
export type Timestamp = number;

/**
 * Probability type
 * - Range from 0.0 (0%) to 1.0 (100%)
 */
export type Probability = number;

/**
 * Percentage type
 * - Range from 0 to 100
 */
export type Percentage = number;

/**
 * Element type
 * - Represents various elemental types in the game
 */
export type Element = 
  | 'none'      // No element
  | 'fire'      // Fire
  | 'water'     // Water
  | 'earth'     // Earth
  | 'wind'      // Wind
  | 'lightning' // Lightning
  | 'ice'       // Ice
  | 'light'     // Light
  | 'dark';     // Dark

/**
 * Element resistance map
 * - Resistance value for each element (0.0~2.0)
 * - 1.0 = normal, 0.5 = half damage, 2.0 = double damage, 0 = immune
 */
export interface ElementResistance {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  lightning: number;
  ice: number;
  light: number;
  dark: number;
}
