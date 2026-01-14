/**
 * GEasyKit Auto-Registration Example
 * 
 * This file demonstrates how builders automatically register entities
 * when integrated with GEasyKit's registry.
 */

import { GEasyKit } from '../src/core/GEasyKit';
import {
  SkillBuilder,
  JobBuilder,
  ItemBuilder,
  EnemyBuilder,
  CharacterBuilder
} from '../src/utils/builders';

console.log('\n=== GEasyKit Auto-Registration Example ===\n');

// ============================================================================
// EXAMPLE 1: Basic Auto-Registration
// ============================================================================

console.log('=== Example 1: Basic Auto-Registration ===\n');

// Create a GEasyKit instance (includes a BuilderRegistry)
const kit = new GEasyKit();

// Create entities and they automatically register!
const fireball = new SkillBuilder('fireball', 'Fireball', kit.registry)
  .description('A powerful fire spell')
  .type('magic')
  .power(80)
  .mpCost(25)
  .element('fire')
  .build(); // Automatically registered on build!

console.log('Created Fireball skill');
console.log('Is it registered?', kit.registry.getSkillId('Fireball') === 'fireball');

// ============================================================================
// EXAMPLE 2: Building a Game Database
// ============================================================================

console.log('\n=== Example 2: Building a Game Database ===\n');

// Create all your game skills - they auto-register!
const skills = [
  new SkillBuilder('slash', 'Power Slash', kit.registry)
    .type('physical').power(60).mpCost(10).build(),
  
  new SkillBuilder('heal', 'Heal', kit.registry)
    .type('heal').power(100).mpCost(20).build(),
  
  new SkillBuilder('ice-blast', 'Ice Blast', kit.registry)
    .type('magic').power(75).mpCost(23).element('water').build(),
];

console.log('Created skills:', kit.registry.getSkillNames());

// Create jobs that reference skills by name
const warrior = new JobBuilder('warrior', 'Warrior', kit.registry)
  .description('A mighty fighter')
  .availableSkillsByName(['Power Slash'], kit.registry) // Use names!
  .statModifiers({ attack: 20, defense: 15, maxHp: 50 })
  .build(); // Auto-registered!

const mage = new JobBuilder('mage', 'Mage', kit.registry)
  .description('A master of magic')
  .availableSkillsByName(['Heal', 'Ice Blast'], kit.registry)
  .statModifiers({ magic: 30, magicDefense: 20, maxMp: 80 })
  .build(); // Auto-registered!

console.log('Created jobs:', kit.registry.getJobNames());

// ============================================================================
// EXAMPLE 3: Creating Enemy Drop Tables
// ============================================================================

console.log('\n=== Example 3: Creating Enemy Drop Tables ===\n');

// Create items - auto-registered!
new ItemBuilder('potion-s', 'Small Potion', kit.registry)
  .type('consumable').stackable(99).build();

new ItemBuilder('potion-m', 'Medium Potion', kit.registry)
  .type('consumable').stackable(99).build();

new ItemBuilder('rare-gem', 'Rare Gem', kit.registry)
  .type('material').stackable(50).build();

console.log('Created items:', kit.registry.getItemNames());

// Create enemies with drop items referenced by name
const slime = new EnemyBuilder('slime', 'Slime', 'slime', kit.registry)
  .level(3)
  .hp(40)
  .expReward(20)
  .addDropItemByName('Small Potion', 0.5, 1, kit.registry) // Use name!
  .build(); // Auto-registered!

const dragon = new EnemyBuilder('dragon', 'Ancient Dragon', 'dragon', kit.registry)
  .level(30)
  .hp(1000)
  .expReward(2000)
  .addDropItemByName('Medium Potion', 0.7, 3, kit.registry) // Use names!
  .addDropItemByName('Rare Gem', 0.2, 1, kit.registry)
  .build(); // Auto-registered!

console.log('Created enemies:', kit.registry.getEnemyNames());
console.log('Dragon drops:', dragon.dropItems?.map(d => d.itemId));

// ============================================================================
// EXAMPLE 4: Job Progression System
// ============================================================================

console.log('\n=== Example 4: Job Progression System ===\n');

// Create basic jobs
new JobBuilder('apprentice', 'Apprentice', kit.registry)
  .description('A novice adventurer')
  .availableSkillsByName(['Power Slash'], kit.registry)
  .build();

new JobBuilder('priest', 'Priest', kit.registry)
  .description('A healer')
  .availableSkillsByName(['Heal'], kit.registry)
  .build();

// Create advanced job with prerequisites referenced by name!
const paladin = new JobBuilder('paladin', 'Paladin', kit.registry)
  .description('A holy warrior')
  .requiredJobsByName(['Apprentice', 'Priest'], kit.registry) // Prerequisites by name!
  .availableSkillsByName(['Power Slash', 'Heal'], kit.registry)
  .levelRequirement(20)
  .build();

console.log('Paladin prerequisites:', paladin.requiredJobs);
console.log('Paladin skills:', paladin.availableSkills);

// ============================================================================
// EXAMPLE 5: No More ID Tracking!
// ============================================================================

console.log('\n=== Example 5: No More ID Tracking! ===\n');

console.log('Before: You had to remember IDs like "fireball-id", "potion-s", etc.');
console.log('After: Just use the name - the registry handles the ID mapping!\n');

// Look up any entity by name
console.log('Fireball ID:', kit.registry.getSkillId('Fireball'));
console.log('Warrior ID:', kit.registry.getJobId('Warrior'));
console.log('Small Potion ID:', kit.registry.getItemId('Small Potion'));
console.log('Dragon ID:', kit.registry.getEnemyId('Ancient Dragon'));

// ============================================================================
// EXAMPLE 6: Complete Party Setup
// ============================================================================

console.log('\n=== Example 6: Complete Party Setup ===\n');

// Create party members - auto-registered!
const hero = new CharacterBuilder('hero-001', 'Hero', kit.registry)
  .level(20)
  .hp(250)
  .mp(100)
  .attack(70)
  .defense(60)
  .job('Warrior')
  .build();

const wizard = new CharacterBuilder('wizard-001', 'Gandalf', kit.registry)
  .level(20)
  .hp(150)
  .mp(300)
  .magic(90)
  .job('Mage')
  .build();

console.log('Party members registered:', kit.registry.getCharacterNames());

// ============================================================================
// EXAMPLE 7: Backward Compatibility
// ============================================================================

console.log('\n=== Example 7: Backward Compatibility ===\n');

// You can still create builders without the registry if you want
const standaloneSkill = new SkillBuilder('standalone', 'Standalone Skill')
  .type('physical')
  .power(50)
  .build();

console.log('Standalone skill created:', standaloneSkill.name);
console.log('Is it registered?', kit.registry.getSkillId('Standalone Skill') === undefined);

// ============================================================================
// EXAMPLE 8: Inspecting the Registry
// ============================================================================

console.log('\n=== Example 8: Registry Overview ===\n');

console.log('Total registered entities:');
console.log('  Skills:', kit.registry.getSkillNames().length);
console.log('  Jobs:', kit.registry.getJobNames().length);
console.log('  Items:', kit.registry.getItemNames().length);
console.log('  Enemies:', kit.registry.getEnemyNames().length);
console.log('  Characters:', kit.registry.getCharacterNames().length);

console.log('\n✓ All examples completed successfully!');
console.log('✓ No need to track IDs manually anymore!\n');
