/**
 * Builder Examples - Demonstrating how to easily define game entities
 * 
 * This file shows practical examples of using the builder utilities
 * to define characters, enemies, jobs, items, equipment, and skills.
 */

import {
  CharacterBuilder,
  EnemyBuilder,
  JobBuilder,
  SkillBuilder,
  ItemBuilder,
  EquipmentBuilder
} from '../src/utils/builders';

// ============================================================================
// EXAMPLE 1: Creating Characters
// ============================================================================

console.log('\n=== Example 1: Creating Characters ===\n');

// Simple character
const hero = new CharacterBuilder('hero1', 'Hero')
  .level(10)
  .hp(150)
  .mp(80)
  .attack(50)
  .defense(35)
  .build();

console.log('Hero created:', {
  name: hero.name,
  level: hero.level,
  hp: hero.currentHp,
  attack: hero.stats.attack
});

// Specialized mage character
const mage = new CharacterBuilder('mage1', 'Merlin')
  .level(15)
  .hp(90, 90)
  .mp(200, 200)
  .stats({
    magic: 80,
    magicDefense: 50,
    speed: 45,
    accuracy: 15
  })
  .job('Archmage', 8)
  .position(1) // back row
  .exp(5000)
  .build();

console.log('Mage created:', {
  name: mage.name,
  level: mage.level,
  job: mage.job,
  magic: mage.stats.magic
});

// ============================================================================
// EXAMPLE 2: Creating Enemies/Monsters
// ============================================================================

console.log('\n=== Example 2: Creating Enemies/Monsters ===\n');

// Basic slime enemy
const slime = new EnemyBuilder('slime1', 'Blue Slime', 'slime')
  .level(3)
  .hp(40)
  .attack(15)
  .defense(8)
  .aiStrategy('aggressive')
  .expReward(25)
  .moneyReward(10)
  .build();

console.log('Slime created:', {
  name: slime.name,
  type: slime.enemyType,
  rewards: { exp: slime.expReward, money: slime.moneyReward }
});

// Boss enemy with drops
const dragonBoss = new EnemyBuilder('dragon-boss', 'Ancient Dragon', 'dragon')
  .level(35)
  .hp(2000, 2000)
  .mp(500, 500)
  .stats({
    attack: 120,
    defense: 80,
    magic: 100,
    magicDefense: 70,
    speed: 65
  })
  .aiStrategy('balanced')
  .expReward(5000)
  .moneyReward(2500)
  .jobExpReward(1000)
  .addDropItem('dragon-scale', 0.9, 5)
  .addDropItem('dragon-fang', 0.7, 2)
  .addDropItem('legendary-gem', 0.15, 1)
  .build();

console.log('Dragon boss created:', {
  name: dragonBoss.name,
  level: dragonBoss.level,
  drops: dragonBoss.dropItems?.map(d => d.itemId)
});

// ============================================================================
// EXAMPLE 3: Defining Jobs/Classes
// ============================================================================

console.log('\n=== Example 3: Defining Jobs/Classes ===\n');

// Warrior class
const warriorJob = new JobBuilder('warrior', 'Warrior')
  .description('A mighty fighter skilled in physical combat')
  .statModifiers({
    attack: 20,
    defense: 15,
    maxHp: 50,
    accuracy: 8
  })
  .levelRequirement(5)
  .availableSkills(['power-slash', 'shield-bash', 'battle-cry'])
  .build();

console.log('Warrior job created:', {
  name: warriorJob.name,
  statBonuses: warriorJob.statModifiers,
  skills: warriorJob.availableSkills
});

// Advanced class with prerequisites
const paladinJob = new JobBuilder('paladin', 'Holy Paladin')
  .description('A holy warrior combining strength and divine magic')
  .statModifiers({
    attack: 25,
    defense: 20,
    maxHp: 60,
    magic: 15,
    magicDefense: 15
  })
  .levelRequirement(25)
  .requiredJobs(['warrior', 'priest'])
  .availableSkills(['holy-strike', 'divine-shield', 'sacred-healing'])
  .build();

console.log('Paladin job created:', {
  name: paladinJob.name,
  requirements: { level: paladinJob.levelRequirement, jobs: paladinJob.requiredJobs }
});

// ============================================================================
// EXAMPLE 4: Creating Skills
// ============================================================================

console.log('\n=== Example 4: Creating Skills ===\n');

// Magic attack skill
const fireball = new SkillBuilder('fireball', 'Fireball')
  .description('Unleash a powerful ball of fire')
  .type('magic')
  .targetType('single-enemy')
  .power(90)
  .mpCost(30)
  .element('fire')
  .accuracy(0.95)
  .criticalBonus(0.12)
  .build();

console.log('Fireball skill created:', {
  name: fireball.name,
  power: fireball.power,
  cost: fireball.cost?.mp,
  element: fireball.element
});

// Healing skill
const megaHeal = new SkillBuilder('mega-heal', 'Mega Heal')
  .description('Restore a large amount of HP')
  .type('heal')
  .targetType('single-ally')
  .power(150)
  .mpCost(40)
  .guaranteedHit()
  .build();

console.log('Mega Heal skill created:', {
  name: megaHeal.name,
  power: megaHeal.power,
  guaranteedHit: megaHeal.isGuaranteedHit
});

// Ultimate skill with multiple costs
const ultimateStrike = new SkillBuilder('ultimate', 'Ultimate Strike')
  .description('A devastating attack costing HP and MP')
  .type('special')
  .targetType('all-enemies')
  .power(250)
  .hpCost(30)
  .mpCost(80)
  .element('none')
  .accuracy(0.90)
  .build();

console.log('Ultimate Strike created:', {
  name: ultimateStrike.name,
  costs: ultimateStrike.cost
});

// ============================================================================
// EXAMPLE 5: Creating Items
// ============================================================================

console.log('\n=== Example 5: Creating Items ===\n');

// Consumable items
const hiPotion = new ItemBuilder('hi-potion', 'Hi-Potion')
  .type('consumable')
  .category('consumable')
  .description('Restores 150 HP')
  .value(200)
  .rarity(2)
  .stackable(99)
  .usableInBattle(true)
  .usableOutOfBattle(true)
  .build();

const elixir = new ItemBuilder('elixir', 'Elixir')
  .type('consumable')
  .category('consumable')
  .description('Fully restores HP and MP')
  .value(5000)
  .rarity(4)
  .stackable(10)
  .usableInBattle(true)
  .usableOutOfBattle(true)
  .build();

console.log('Items created:', [hiPotion.name, elixir.name]);

// Key item
const crystalKey = new ItemBuilder('crystal-key', 'Crystal Key')
  .type('key-item')
  .category('key-item')
  .description('A mysterious key that glows with an inner light')
  .rarity(5)
  .notStackable()
  .usableOutOfBattle(true)
  .build();

console.log('Key item created:', crystalKey.name);

// ============================================================================
// EXAMPLE 6: Creating Equipment
// ============================================================================

console.log('\n=== Example 6: Creating Equipment ===\n');

// Weapons
const excalibur = new EquipmentBuilder('excalibur', 'Excalibur')
  .type('weapon')
  .description('The legendary sword of kings')
  .levelRequirement(30)
  .statModifiers({
    attack: 80,
    magic: 20,
    accuracy: 15,
    criticalRate: 0.15
  })
  .build();

// Armor
const dragonArmor = new EquipmentBuilder('dragon-armor', 'Dragon Scale Armor')
  .type('armor')
  .description('Armor forged from dragon scales')
  .levelRequirement(25)
  .statModifiers({
    defense: 70,
    magicDefense: 50,
    maxHp: 150,
    evasion: 10
  })
  .build();

// Accessory
const speedRing = new EquipmentBuilder('speed-ring', 'Ring of Swiftness')
  .type('accessory')
  .description('Increases the wearer\'s speed dramatically')
  .levelRequirement(15)
  .statModifier('speed', 30)
  .statModifier('evasion', 15)
  .build();

console.log('Equipment created:', [
  excalibur.name,
  dragonArmor.name,
  speedRing.name
]);

// ============================================================================
// EXAMPLE 7: Factory Pattern for Game Data
// ============================================================================

console.log('\n=== Example 7: Factory Pattern ===\n');

// Create a factory for common enemies
class EnemyFactory {
  static createGoblin(id: string, level: number) {
    return new EnemyBuilder(id, 'Goblin', 'goblin')
      .level(level)
      .hp(30 + level * 5)
      .attack(10 + level * 2)
      .defense(8 + level)
      .aiStrategy('aggressive')
      .expReward(20 + level * 5)
      .moneyReward(10 + level * 2)
      .build();
  }

  static createOrc(id: string, level: number) {
    return new EnemyBuilder(id, 'Orc', 'orc')
      .level(level)
      .hp(50 + level * 8)
      .attack(15 + level * 3)
      .defense(12 + level * 2)
      .aiStrategy('balanced')
      .expReward(30 + level * 8)
      .moneyReward(15 + level * 3)
      .build();
  }
}

// Use the factory
const goblin1 = EnemyFactory.createGoblin('goblin1', 5);
const goblin2 = EnemyFactory.createGoblin('goblin2', 8);
const orc1 = EnemyFactory.createOrc('orc1', 12);

console.log('Factory-created enemies:', [
  { name: goblin1.name, level: goblin1.level, exp: goblin1.expReward },
  { name: goblin2.name, level: goblin2.level, exp: goblin2.expReward },
  { name: orc1.name, level: orc1.level, exp: orc1.expReward }
]);

// ============================================================================
// EXAMPLE 8: Complete Party Setup
// ============================================================================

console.log('\n=== Example 8: Complete Party Setup ===\n');

const party = [
  new CharacterBuilder('knight', 'Sir Arthur')
    .level(20)
    .hp(250)
    .mp(100)
    .stats({ attack: 70, defense: 60, speed: 50 })
    .job('Knight')
    .position(0)
    .build(),
  
  new CharacterBuilder('wizard', 'Gandalf')
    .level(20)
    .hp(150)
    .mp(300)
    .stats({ magic: 90, magicDefense: 60, speed: 40 })
    .job('Wizard')
    .position(1)
    .build(),
  
  new CharacterBuilder('healer', 'Aria')
    .level(18)
    .hp(180)
    .mp(250)
    .stats({ magic: 75, magicDefense: 55, speed: 60 })
    .job('Cleric')
    .position(1)
    .build(),
];

console.log('Party created with', party.length, 'members:');
party.forEach(member => {
  console.log(`  - ${member.name} (${member.job}, Level ${member.level})`);
});

console.log('\n=== All Examples Completed ===\n');
