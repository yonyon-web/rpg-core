/**
 * Tests for Builder utilities
 * These tests demonstrate the usage and verify the functionality of the builders
 */

import { CharacterBuilder, EnemyBuilder, JobBuilder, SkillBuilder, ItemBuilder, EquipmentBuilder } from '../../src/utils/builders';

describe('Builder Utilities', () => {
  describe('CharacterBuilder', () => {
    it('should create a basic character with minimal configuration', () => {
      const character = new CharacterBuilder('hero1', 'Hero').build();
      
      expect(character.id).toBe('hero1');
      expect(character.name).toBe('Hero');
      expect(character.level).toBe(1);
      expect(character.currentHp).toBe(100);
      expect(character.currentMp).toBe(50);
      expect(character.stats.attack).toBe(10);
    });

    it('should create a character with custom stats', () => {
      const mage = new CharacterBuilder('mage1', 'Mage')
        .level(15)
        .hp(80, 80)
        .mp(150, 150)
        .stats({
          magic: 70,
          magicDefense: 40,
          speed: 45,
        })
        .job('Mage', 5)
        .build();
      
      expect(mage.level).toBe(15);
      expect(mage.currentHp).toBe(80);
      expect(mage.stats.maxHp).toBe(80);
      expect(mage.currentMp).toBe(150);
      expect(mage.stats.maxMp).toBe(150);
      expect(mage.stats.magic).toBe(70);
      expect(mage.stats.magicDefense).toBe(40);
      expect(mage.job).toBe('Mage');
      expect(mage.jobLevel).toBe(5);
    });

    it('should allow fluent method chaining', () => {
      const warrior = new CharacterBuilder('warrior1', 'Warrior')
        .level(20)
        .attack(80)
        .defense(60)
        .hp(200)
        .position(0)
        .build();
      
      expect(warrior.level).toBe(20);
      expect(warrior.stats.attack).toBe(80);
      expect(warrior.stats.defense).toBe(60);
      expect(warrior.position).toBe(0);
    });
  });

  describe('EnemyBuilder', () => {
    it('should create a basic enemy', () => {
      const slime = new EnemyBuilder('slime1', 'Slime', 'slime')
        .level(5)
        .hp(50)
        .attack(20)
        .build();
      
      expect(slime.id).toBe('slime1');
      expect(slime.name).toBe('Slime');
      expect(slime.enemyType).toBe('slime');
      expect(slime.level).toBe(5);
      expect(slime.currentHp).toBe(50);
      expect(slime.stats.attack).toBe(20);
    });

    it('should create an enemy with rewards and drops', () => {
      const dragon = new EnemyBuilder('dragon1', 'Dragon', 'dragon')
        .level(30)
        .hp(1000)
        .expReward(2000)
        .moneyReward(1000)
        .addDropItem('dragon-scale', 0.8, 3)
        .addDropItem('rare-gem', 0.3, 1)
        .build();
      
      expect(dragon.expReward).toBe(2000);
      expect(dragon.moneyReward).toBe(1000);
      expect(dragon.dropItems).toHaveLength(2);
      expect(dragon.dropItems?.[0].itemId).toBe('dragon-scale');
      expect(dragon.dropItems?.[0].probability).toBe(0.8);
      expect(dragon.dropItems?.[0].quantity).toBe(3);
    });

    it('should set AI strategy', () => {
      const enemy = new EnemyBuilder('enemy1', 'Enemy', 'test')
        .aiStrategy('aggressive')
        .build();
      
      expect(enemy.aiStrategy).toBe('aggressive');
    });
  });

  describe('JobBuilder', () => {
    it('should create a basic job', () => {
      const warrior = new JobBuilder('warrior', 'Warrior')
        .description('A mighty warrior')
        .statModifier('attack', 15)
        .statModifier('defense', 10)
        .build();
      
      expect(warrior.id).toBe('warrior');
      expect(warrior.name).toBe('Warrior');
      expect(warrior.description).toBe('A mighty warrior');
      expect(warrior.statModifiers.attack).toBe(15);
      expect(warrior.statModifiers.defense).toBe(10);
    });

    it('should create a job with requirements', () => {
      const paladin = new JobBuilder('paladin', 'Paladin')
        .description('A holy knight')
        .statModifiers({ attack: 20, defense: 15 })
        .levelRequirement(20)
        .requiredJobs(['warrior', 'priest'])
        .availableSkills(['holy-strike', 'divine-shield'])
        .build();
      
      expect(paladin.levelRequirement).toBe(20);
      expect(paladin.requiredJobs).toEqual(['warrior', 'priest']);
      expect(paladin.availableSkills).toEqual(['holy-strike', 'divine-shield']);
    });
  });

  describe('SkillBuilder', () => {
    it('should create a basic attack skill', () => {
      const fireball = new SkillBuilder('fireball', 'Fireball')
        .description('A fire spell')
        .type('magic')
        .targetType('single-enemy')
        .power(80)
        .mpCost(25)
        .element('fire')
        .build();
      
      expect(fireball.id).toBe('fireball');
      expect(fireball.name).toBe('Fireball');
      expect(fireball.type).toBe('magic');
      expect(fireball.targetType).toBe('single-enemy');
      expect(fireball.power).toBe(80);
      expect(fireball.cost?.mp).toBe(25);
      expect(fireball.element).toBe('fire');
    });

    it('should create a heal skill', () => {
      const heal = new SkillBuilder('heal', 'Heal')
        .type('heal')
        .targetType('single-ally')
        .power(100)
        .mpCost(20)
        .guaranteedHit()
        .build();
      
      expect(heal.type).toBe('heal');
      expect(heal.isGuaranteedHit).toBe(true);
    });

    it('should create a skill with HP cost', () => {
      const sacrifice = new SkillBuilder('sacrifice', 'Sacrifice')
        .type('special')
        .power(200)
        .hpCost(50)
        .mpCost(30)
        .build();
      
      expect(sacrifice.cost?.hp).toBe(50);
      expect(sacrifice.cost?.mp).toBe(30);
    });
  });

  describe('ItemBuilder', () => {
    it('should create a consumable item', () => {
      const potion = new ItemBuilder('potion', 'Potion')
        .type('consumable')
        .category('consumable')
        .description('Restores HP')
        .value(50)
        .rarity(1)
        .stackable(99)
        .usableInBattle(true)
        .build();
      
      expect(potion.id).toBe('potion');
      expect(potion.type).toBe('consumable');
      expect(potion.stackable).toBe(true);
      expect(potion.maxStack).toBe(99);
      expect(potion.usableInBattle).toBe(true);
    });

    it('should create a key item', () => {
      const key = new ItemBuilder('key', 'Ancient Key')
        .type('key-item')
        .category('key-item')
        .rarity(4)
        .notStackable()
        .build();
      
      expect(key.stackable).toBe(false);
      expect(key.maxStack).toBe(1);
      expect(key.rarity).toBe(4);
    });
  });

  describe('EquipmentBuilder', () => {
    it('should create a weapon', () => {
      const sword = new EquipmentBuilder('sword', 'Iron Sword')
        .type('weapon')
        .description('A sturdy sword')
        .levelRequirement(5)
        .statModifier('attack', 20)
        .build();
      
      expect(sword.id).toBe('sword');
      expect(sword.type).toBe('weapon');
      expect(sword.levelRequirement).toBe(5);
      expect(sword.statModifiers.attack).toBe(20);
    });

    it('should create armor with multiple stat modifiers', () => {
      const armor = new EquipmentBuilder('armor', 'Dragon Armor')
        .type('armor')
        .levelRequirement(20)
        .statModifiers({
          defense: 50,
          magicDefense: 30,
          maxHp: 100,
        })
        .build();
      
      expect(armor.statModifiers.defense).toBe(50);
      expect(armor.statModifiers.magicDefense).toBe(30);
      expect(armor.statModifiers.maxHp).toBe(100);
    });
  });

  describe('Integration: Creating a complete battle scenario', () => {
    it('should create a complete party and enemy group using builders', () => {
      // Create party
      const hero = new CharacterBuilder('hero', 'Hero')
        .level(10)
        .hp(150)
        .attack(50)
        .defense(30)
        .build();
      
      const mage = new CharacterBuilder('mage', 'Mage')
        .level(10)
        .hp(80)
        .mp(150)
        .magic(70)
        .position(1)
        .build();
      
      // Create enemies
      const goblin1 = new EnemyBuilder('goblin1', 'Goblin', 'goblin')
        .level(8)
        .hp(60)
        .attack(25)
        .expReward(40)
        .moneyReward(15)
        .build();
      
      const goblin2 = new EnemyBuilder('goblin2', 'Goblin', 'goblin')
        .level(8)
        .hp(60)
        .attack(25)
        .expReward(40)
        .moneyReward(15)
        .build();
      
      const party = [hero, mage];
      const enemies = [goblin1, goblin2];
      
      expect(party).toHaveLength(2);
      expect(enemies).toHaveLength(2);
      expect(hero.level).toBe(10);
      expect(mage.position).toBe(1); // back row
      expect(goblin1.expReward).toBe(40);
    });
  });
});
