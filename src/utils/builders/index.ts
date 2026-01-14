/**
 * Builder utilities for easily creating game entities
 * 
 * These builder classes provide a fluent API for creating characters, enemies,
 * jobs, items, equipment, and skills with sensible defaults and easy customization.
 * 
 * @example
 * ```typescript
 * import { CharacterBuilder, EnemyBuilder } from 'geasy-kit/utils/builders';
 * 
 * // Create a hero with builder pattern
 * const hero = new CharacterBuilder('hero1', 'Hero')
 *   .level(10)
 *   .hp(100)
 *   .attack(50)
 *   .defense(30)
 *   .build();
 * 
 * // Create an enemy
 * const slime = new EnemyBuilder('slime1', 'Slime', 'slime')
 *   .level(5)
 *   .hp(50)
 *   .expReward(50)
 *   .build();
 * ```
 */

export { CharacterBuilder } from './CharacterBuilder';
export { EnemyBuilder } from './EnemyBuilder';
export { JobBuilder } from './JobBuilder';
export { SkillBuilder } from './SkillBuilder';
export { ItemBuilder } from './ItemBuilder';
export { EquipmentBuilder } from './EquipmentBuilder';
