/**
 * BuilderRegistry Usage Examples
 * 
 * This file demonstrates how to use the BuilderRegistry to create relationships
 * between game entities using names instead of IDs.
 */

import {
  BuilderRegistry,
  JobBuilder,
  SkillBuilder,
  ItemBuilder,
  EnemyBuilder
} from '../src/utils/builders';

console.log('\n=== BuilderRegistry Examples ===\n');

// ============================================================================
// EXAMPLE 1: Basic Registry Usage
// ============================================================================

console.log('=== Example 1: Basic Registry Usage ===\n');

const registry = new BuilderRegistry();

// Create and register skills
const fireball = new SkillBuilder('fireball-id', 'Fireball')
  .description('A powerful fire spell')
  .type('magic')
  .power(80)
  .mpCost(25)
  .element('fire')
  .build();

const iceBlast = new SkillBuilder('ice-blast-id', 'Ice Blast')
  .description('A freezing ice spell')
  .type('magic')
  .power(75)
  .mpCost(23)
  .element('water')
  .build();

const heal = new SkillBuilder('heal-id', 'Heal')
  .description('Restore HP to an ally')
  .type('heal')
  .power(100)
  .mpCost(20)
  .build();

// Register skills in the registry
registry.registerSkill(fireball);
registry.registerSkill(iceBlast);
registry.registerSkill(heal);

console.log('Registered skills:', registry.getSkillNames());

// ============================================================================
// EXAMPLE 2: Creating Jobs with Skill References by Name
// ============================================================================

console.log('\n=== Example 2: Jobs with Skill References ===\n');

// Without registry (old way - need to remember IDs)
const mageOldWay = new JobBuilder('mage-old', 'Mage (Old Way)')
  .description('A master of magic')
  .availableSkills(['fireball-id', 'ice-blast-id', 'heal-id']) // Need to remember IDs!
  .build();

console.log('Old way - availableSkills:', mageOldWay.availableSkills);

// With registry (new way - use names!)
const mageNewWay = new JobBuilder('mage-new', 'Mage (New Way)')
  .description('A master of magic')
  .availableSkillsByName(['Fireball', 'Ice Blast', 'Heal'], registry) // Use names!
  .build();

console.log('New way - availableSkills:', mageNewWay.availableSkills);
console.log('Result is the same:', 
  JSON.stringify(mageOldWay.availableSkills) === JSON.stringify(mageNewWay.availableSkills)
);

// ============================================================================
// EXAMPLE 3: Job Prerequisites by Name
// ============================================================================

console.log('\n=== Example 3: Job Prerequisites by Name ===\n');

// Create basic jobs
const apprentice = new JobBuilder('apprentice-id', 'Apprentice')
  .description('A novice mage')
  .availableSkillsByName(['Fireball'], registry)
  .build();

const priest = new JobBuilder('priest-id', 'Priest')
  .description('A healer')
  .availableSkillsByName(['Heal'], registry)
  .build();

// Register them
registry.registerJob(apprentice);
registry.registerJob(priest);

// Create advanced job with prerequisites using names
const archmage = new JobBuilder('archmage-id', 'Archmage')
  .description('A master of all magic')
  .availableSkillsByName(['Fireball', 'Ice Blast', 'Heal'], registry)
  .requiredJobsByName(['Apprentice', 'Priest'], registry) // Reference by name!
  .levelRequirement(25)
  .build();

console.log('Archmage prerequisites (by ID):', archmage.requiredJobs);
console.log('Archmage skills:', archmage.availableSkills);

// ============================================================================
// EXAMPLE 4: Enemy Drop Items by Name
// ============================================================================

console.log('\n=== Example 4: Enemy Drop Items by Name ===\n');

// Create and register items
const dragonScale = new ItemBuilder('dragon-scale-id', 'Dragon Scale')
  .type('material')
  .category('material')
  .description('A scale from a mighty dragon')
  .value(500)
  .rarity(3)
  .build();

const rareGem = new ItemBuilder('rare-gem-id', 'Rare Gem')
  .type('material')
  .category('material')
  .description('A precious gemstone')
  .value(1000)
  .rarity(4)
  .build();

const potion = new ItemBuilder('potion-id', 'Health Potion')
  .type('consumable')
  .category('consumable')
  .stackable(99)
  .build();

registry.registerItem(dragonScale);
registry.registerItem(rareGem);
registry.registerItem(potion);

// Without registry (old way)
const dragonOldWay = new EnemyBuilder('dragon-old', 'Dragon (Old)', 'dragon')
  .level(30)
  .hp(1000)
  .addDropItem('dragon-scale-id', 0.9, 3) // Need to remember ID
  .addDropItem('rare-gem-id', 0.3, 1)     // Need to remember ID
  .build();

console.log('Old way - drops:', dragonOldWay.dropItems);

// With registry (new way)
const dragonNewWay = new EnemyBuilder('dragon-new', 'Dragon (New)', 'dragon')
  .level(30)
  .hp(1000)
  .addDropItemByName('Dragon Scale', 0.9, 3, registry) // Use name!
  .addDropItemByName('Rare Gem', 0.3, 1, registry)     // Use name!
  .build();

console.log('New way - drops:', dragonNewWay.dropItems);

// ============================================================================
// EXAMPLE 5: Building an incremental skill by adding one at a time
// ============================================================================

console.log('\n=== Example 5: Adding Skills Incrementally ===\n');

const elementalist = new JobBuilder('elementalist-id', 'Elementalist')
  .description('Master of elemental magic')
  .addAvailableSkillByName('Fireball', registry)
  .addAvailableSkillByName('Ice Blast', registry)
  // Could add more skills as the job progresses
  .build();

console.log('Elementalist skills:', elementalist.availableSkills);

// ============================================================================
// EXAMPLE 6: Complete Game Data Setup
// ============================================================================

console.log('\n=== Example 6: Complete Game Setup ===\n');

// Start fresh
const gameRegistry = new BuilderRegistry();

// 1. Define all skills
const skills = [
  new SkillBuilder('attack-1', 'Power Strike').type('physical').power(50).build(),
  new SkillBuilder('magic-1', 'Fire Ball').type('magic').power(70).build(),
  new SkillBuilder('heal-1', 'Minor Heal').type('heal').power(50).build(),
  new SkillBuilder('heal-2', 'Major Heal').type('heal').power(100).build(),
];

skills.forEach(skill => gameRegistry.registerSkill(skill));

// 2. Define job progression
const jobs = [
  new JobBuilder('warrior', 'Warrior')
    .description('A strong fighter')
    .availableSkillsByName(['Power Strike'], gameRegistry)
    .build(),
  
  new JobBuilder('mage', 'Mage')
    .description('A spell caster')
    .availableSkillsByName(['Fire Ball'], gameRegistry)
    .build(),
  
  new JobBuilder('cleric', 'Cleric')
    .description('A healer')
    .availableSkillsByName(['Minor Heal', 'Major Heal'], gameRegistry)
    .build(),
];

jobs.forEach(job => gameRegistry.registerJob(job));

// 3. Create advanced job with prerequisites
const paladin = new JobBuilder('paladin', 'Paladin')
  .description('Holy warrior - combines fighting and healing')
  .requiredJobsByName(['Warrior', 'Cleric'], gameRegistry)
  .availableSkillsByName(['Power Strike', 'Minor Heal'], gameRegistry)
  .levelRequirement(20)
  .build();

console.log('Paladin setup:');
console.log('  - Required jobs:', paladin.requiredJobs);
console.log('  - Available skills:', paladin.availableSkills);

// 4. Define items
const items = [
  new ItemBuilder('potion-s', 'Small Potion').type('consumable').build(),
  new ItemBuilder('potion-m', 'Medium Potion').type('consumable').build(),
  new ItemBuilder('potion-l', 'Large Potion').type('consumable').build(),
  new ItemBuilder('elixir', 'Elixir').type('consumable').build(),
];

items.forEach(item => gameRegistry.registerItem(item));

// 5. Create enemies with drop tables
const slime = new EnemyBuilder('slime', 'Slime', 'slime')
  .level(3)
  .hp(50)
  .addDropItemByName('Small Potion', 0.5, 1, gameRegistry)
  .build();

const dragon = new EnemyBuilder('dragon', 'Dragon', 'dragon')
  .level(30)
  .hp(1000)
  .addDropItemByName('Large Potion', 0.7, 2, gameRegistry)
  .addDropItemByName('Elixir', 0.2, 1, gameRegistry)
  .build();

console.log('\nEnemy drops:');
console.log('  Slime:', slime.dropItems);
console.log('  Dragon:', dragon.dropItems);

// ============================================================================
// EXAMPLE 7: Error Handling - Non-existent entities
// ============================================================================

console.log('\n=== Example 7: Handling Non-existent Entities ===\n');

const testJob = new JobBuilder('test', 'Test Job')
  .availableSkillsByName(['NonExistent Skill', 'Fire Ball'], gameRegistry)
  .build();

console.log('Skills added (non-existent are skipped):', testJob.availableSkills);
console.log('Only valid skills are included');

console.log('\n=== All Examples Completed ===\n');
