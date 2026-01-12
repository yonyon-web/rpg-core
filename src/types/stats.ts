/**
 * Stats-related type definitions
 */

/**
 * Stats structure
 * - Character or enemy stats
 */
export interface Stats {
  maxHp: number;            // Maximum HP
  maxMp: number;            // Maximum MP
  attack: number;           // Attack power
  defense: number;          // Defense power
  magic: number;            // Magic power
  magicDefense: number;     // Magic defense
  speed: number;            // Speed/Agility
  luck: number;             // Luck
  accuracy: number;         // Accuracy modifier
  evasion: number;          // Evasion modifier
  criticalRate: number;     // Critical rate modifier
}
