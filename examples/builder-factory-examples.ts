/**
 * GEasyKit Builder Factory Examples
 * 
 * This file demonstrates how to use kit.builder.* factory methods
 * which eliminate the need to be aware of BuilderRegistry.
 */

import { GEasyKit } from '../src/core/GEasyKit';

console.log('\n=== GEasyKit Builder Factory Examples ===\n');

const kit = new GEasyKit();

// ============================================================================
// EXAMPLE 1: Simple Entity Creation (No Registry Parameter Needed!)
// ============================================================================

console.log('=== Example 1: Simple Entity Creation ===\n');

// Before: Had to pass kit.registry
// const fireball = new SkillBuilder('fireball', 'Fireball', kit.registry)

// After: Registry is automatically injected!
const fireball = kit.builder.skill('fireball', 'Fireball')
  .description('A powerful fire spell')
  .type('magic')
  .power(80)
  .mpCost(25)
  .element('fire')
  .build(); // Automatically registered!

console.log('Fireball created and registered:', fireball.name);
console.log('Can look up by name:', kit.registry.getSkillId('Fireball')); // 'fireball'

// ============================================================================
// EXAMPLE 2: Multiple Entities - Clean Syntax
// ============================================================================

console.log('\n=== Example 2: Multiple Entities ===\n');

kit.builder.skill('ice-blast', 'Ice Blast')
  .type('magic')
  .power(75)
  .element('water')
  .build();

kit.builder.skill('heal', 'Heal')
  .type('heal')
  .power(100)
  .build();

kit.builder.skill('slash', 'Power Slash')
  .type('physical')
  .power(60)
  .build();

console.log('Registered skills:', kit.registry.getSkillNames());

// ============================================================================
// EXAMPLE 3: Jobs with Name-Based Skill References
// ============================================================================

console.log('\n=== Example 3: Jobs with Name-Based References ===\n');

// Create jobs using factory - much cleaner!
const mage = kit.builder.job('mage', 'Mage')
  .description('Master of elemental magic')
  .statModifiers({ magic: 20, magicDefense: 15, maxMp: 50 })
  .availableSkillsByName(['Fireball', 'Ice Blast', 'Heal'], kit.registry)
  .build();

const warrior = kit.builder.job('warrior', 'Warrior')
  .description('Master of physical combat')
  .statModifiers({ attack: 20, defense: 15, maxHp: 50 })
  .availableSkillsByName(['Power Slash'], kit.registry)
  .build();

console.log('Mage skills:', mage.availableSkills);
console.log('Warrior skills:', warrior.availableSkills);

// ============================================================================
// EXAMPLE 4: Items and Equipment
// ============================================================================

console.log('\n=== Example 4: Items and Equipment ===\n');

kit.builder.item('potion', 'Health Potion')
  .type('consumable')
  .category('consumable')
  .description('Restores 50 HP')
  .value(50)
  .stackable(99)
  .usableInBattle(true)
  .build();

kit.builder.item('hi-potion', 'Hi-Potion')
  .type('consumable')
  .category('consumable')
  .description('Restores 150 HP')
  .value(200)
  .stackable(99)
  .usableInBattle(true)
  .build();

kit.builder.equipment('iron-sword', 'Iron Sword')
  .type('weapon')
  .description('A basic sword')
  .levelRequirement(1)
  .statModifier('attack', 10)
  .build();

kit.builder.equipment('steel-armor', 'Steel Armor')
  .type('armor')
  .description('Durable steel armor')
  .levelRequirement(5)
  .statModifiers({ defense: 15, maxHp: 20 })
  .build();

console.log('Registered items:', kit.registry.getItemNames());
console.log('Registered equipment:', kit.registry.getEquipmentNames());

// ============================================================================
// EXAMPLE 5: Characters and Enemies
// ============================================================================

console.log('\n=== Example 5: Characters and Enemies ===\n');

const hero = kit.builder.character('hero', 'Hero')
  .level(10)
  .hp(150)
  .mp(80)
  .attack(50)
  .defense(30)
  .position(0)
  .build();

const sidekick = kit.builder.character('sidekick', 'Sidekick')
  .level(8)
  .hp(120)
  .mp(60)
  .attack(40)
  .defense(25)
  .position(1)
  .build();

console.log('Party:', kit.registry.getCharacterNames());

const slime = kit.builder.enemy('slime', 'Slime', 'slime')
  .level(5)
  .hp(50)
  .attack(20)
  .expReward(50)
  .moneyReward(20)
  .addDropItemByName('Health Potion', 0.5, 1, kit.registry)
  .build();

const dragon = kit.builder.enemy('dragon', 'Ancient Dragon', 'dragon')
  .level(30)
  .hp(1000)
  .attack(100)
  .defense(80)
  .expReward(5000)
  .moneyReward(2500)
  .addDropItemByName('Hi-Potion', 0.8, 3, kit.registry)
  .build();

console.log('Enemies:', kit.registry.getEnemyNames());
console.log('Dragon drops:', dragon.dropItems);

// ============================================================================
// EXAMPLE 6: Complete Game Data Setup
// ============================================================================

console.log('\n=== Example 6: Complete Game Data Setup ===\n');

// Create a complete game setup with clean syntax
const setup = {
  skills: [
    kit.builder.skill('fire1', 'Fire').type('magic').power(30).build(),
    kit.builder.skill('fire2', 'Fira').type('magic').power(60).build(),
    kit.builder.skill('fire3', 'Firaga').type('magic').power(120).build(),
  ],
  
  jobs: [
    kit.builder.job('novice', 'Novice')
      .description('Starting class')
      .availableSkillsByName(['Fire'], kit.registry)
      .build(),
    
    kit.builder.job('mage-adv', 'Advanced Mage')
      .description('Experienced mage')
      .requiredJobsByName(['Mage'], kit.registry)
      .availableSkillsByName(['Fire', 'Fira', 'Firaga'], kit.registry)
      .levelRequirement(20)
      .build(),
  ],
  
  items: [
    kit.builder.item('ether', 'Ether').type('consumable').build(),
    kit.builder.item('elixir', 'Elixir').type('consumable').build(),
  ],
};

console.log('Game setup complete!');
console.log('Total skills:', kit.registry.getSkillNames().length);
console.log('Total jobs:', kit.registry.getJobNames().length);
console.log('Total items:', kit.registry.getItemNames().length);
console.log('Total equipment:', kit.registry.getEquipmentNames().length);
console.log('Total characters:', kit.registry.getCharacterNames().length);
console.log('Total enemies:', kit.registry.getEnemyNames().length);

// ============================================================================
// EXAMPLE 7: Comparison - Before vs After
// ============================================================================

console.log('\n=== Example 7: Before vs After Comparison ===\n');

// BEFORE: Manual registry passing
console.log('Before (explicit registry):');
console.log('  const skill = new SkillBuilder("id", "Name", kit.registry)');
console.log('  const job = new JobBuilder("id", "Name", kit.registry)');
console.log('  // Need to remember to pass kit.registry every time');

// AFTER: Factory methods with automatic injection
console.log('\nAfter (factory methods):');
console.log('  const skill = kit.builder.skill("id", "Name")');
console.log('  const job = kit.builder.job("id", "Name")');
console.log('  // Registry is automatically injected!');

// ============================================================================
// EXAMPLE 8: Factory Pattern for Enemy Waves
// ============================================================================

console.log('\n=== Example 8: Enemy Wave Factory ===\n');

class EnemyWaveFactory {
  constructor(private kit: GEasyKit) {}

  createWave(waveNumber: number) {
    const baseLevel = waveNumber * 3;
    
    return [
      this.kit.builder.enemy(`goblin-${waveNumber}-1`, `Goblin`, 'goblin')
        .level(baseLevel)
        .hp(30 + baseLevel * 5)
        .attack(10 + baseLevel * 2)
        .build(),
      
      this.kit.builder.enemy(`goblin-${waveNumber}-2`, `Goblin`, 'goblin')
        .level(baseLevel)
        .hp(30 + baseLevel * 5)
        .attack(10 + baseLevel * 2)
        .build(),
      
      this.kit.builder.enemy(`orc-${waveNumber}`, `Orc Leader`, 'orc')
        .level(baseLevel + 2)
        .hp(50 + (baseLevel + 2) * 8)
        .attack(15 + (baseLevel + 2) * 3)
        .build(),
    ];
  }
}

const waveFactory = new EnemyWaveFactory(kit);
const wave1 = waveFactory.createWave(1);
const wave2 = waveFactory.createWave(2);

console.log('Wave 1 created:', wave1.map(e => `${e.name} (Lv${e.level})`));
console.log('Wave 2 created:', wave2.map(e => `${e.name} (Lv${e.level})`));

console.log('\n=== All Examples Completed ===\n');
console.log('Key Benefit: No need to explicitly pass kit.registry to builders!');
console.log('The factory methods (kit.builder.*) handle it automatically.');
