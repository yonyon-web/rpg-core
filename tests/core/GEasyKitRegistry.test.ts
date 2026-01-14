/**
 * Tests for GEasyKit BuilderRegistry integration
 */

import { GEasyKit } from '../../src/core/GEasyKit';
import { CharacterBuilder, EnemyBuilder, JobBuilder, SkillBuilder, ItemBuilder, EquipmentBuilder } from '../../src/utils/builders';

describe('GEasyKit BuilderRegistry Integration', () => {
  let kit: GEasyKit;

  beforeEach(() => {
    kit = new GEasyKit();
  });

  it('should auto-register skills when built with registry', () => {
    const fireball = new SkillBuilder('fireball-id', 'Fireball', kit.registry)
      .type('magic')
      .power(80)
      .build();

    // Should be automatically registered
    expect(kit.registry.getSkillId('Fireball')).toBe('fireball-id');
    expect(kit.registry.getSkill('Fireball')).toEqual(fireball);
  });

  it('should auto-register items when built with registry', () => {
    const potion = new ItemBuilder('potion-id', 'Health Potion', kit.registry)
      .type('consumable')
      .stackable(99)
      .build();

    expect(kit.registry.getItemId('Health Potion')).toBe('potion-id');
    expect(kit.registry.getItem('Health Potion')).toEqual(potion);
  });

  it('should auto-register jobs when built with registry', () => {
    const warrior = new JobBuilder('warrior-id', 'Warrior', kit.registry)
      .description('A mighty warrior')
      .statModifier('attack', 15)
      .build();

    expect(kit.registry.getJobId('Warrior')).toBe('warrior-id');
    expect(kit.registry.getJob('Warrior')).toEqual(warrior);
  });

  it('should auto-register equipment when built with registry', () => {
    const sword = new EquipmentBuilder('sword-id', 'Iron Sword', kit.registry)
      .type('weapon')
      .statModifier('attack', 20)
      .build();

    expect(kit.registry.getEquipmentId('Iron Sword')).toBe('sword-id');
    expect(kit.registry.getEquipment('Iron Sword')).toEqual(sword);
  });

  it('should auto-register characters when built with registry', () => {
    const hero = new CharacterBuilder('hero-id', 'Hero', kit.registry)
      .level(10)
      .hp(150)
      .build();

    expect(kit.registry.getCharacterId('Hero')).toBe('hero-id');
    expect(kit.registry.getCharacter('Hero')).toEqual(hero);
  });

  it('should auto-register enemies when built with registry', () => {
    const slime = new EnemyBuilder('slime-id', 'Slime', 'slime', kit.registry)
      .level(5)
      .hp(50)
      .build();

    expect(kit.registry.getEnemyId('Slime')).toBe('slime-id');
    expect(kit.registry.getEnemy('Slime')).toEqual(slime);
  });

  it('should allow using name-based references with auto-registered entities', () => {
    // Auto-register skills
    new SkillBuilder('fireball-id', 'Fireball', kit.registry)
      .type('magic')
      .power(80)
      .build();

    new SkillBuilder('heal-id', 'Heal', kit.registry)
      .type('heal')
      .power(100)
      .build();

    // Create job using name-based references
    const mage = new JobBuilder('mage-id', 'Mage', kit.registry)
      .availableSkillsByName(['Fireball', 'Heal'], kit.registry)
      .build();

    expect(mage.availableSkills).toEqual(['fireball-id', 'heal-id']);
    // Mage itself should also be auto-registered
    expect(kit.registry.getJobId('Mage')).toBe('mage-id');
  });

  it('should work without registry (backward compatibility)', () => {
    // Should work without passing registry
    const skill = new SkillBuilder('skill-id', 'Test Skill')
      .type('physical')
      .build();

    expect(skill.id).toBe('skill-id');
    expect(skill.name).toBe('Test Skill');
    // Should not be registered
    expect(kit.registry.getSkillId('Test Skill')).toBeUndefined();
  });

  it('should create a complete game setup with auto-registration', () => {
    // Create and auto-register all entities
    new SkillBuilder('slash-id', 'Power Slash', kit.registry)
      .type('physical')
      .power(60)
      .build();

    new SkillBuilder('fireball-id', 'Fireball', kit.registry)
      .type('magic')
      .power(80)
      .build();

    new JobBuilder('warrior-id', 'Warrior', kit.registry)
      .availableSkillsByName(['Power Slash'], kit.registry)
      .build();

    new JobBuilder('mage-id', 'Mage', kit.registry)
      .availableSkillsByName(['Fireball'], kit.registry)
      .build();

    new ItemBuilder('potion-id', 'Health Potion', kit.registry)
      .type('consumable')
      .build();

    const dragon = new EnemyBuilder('dragon-id', 'Dragon', 'dragon', kit.registry)
      .level(30)
      .addDropItemByName('Health Potion', 0.8, 2, kit.registry)
      .build();

    // Verify all are registered and name-based references work
    expect(kit.registry.getSkillNames()).toEqual(['Power Slash', 'Fireball']);
    expect(kit.registry.getJobNames()).toEqual(['Warrior', 'Mage']);
    expect(kit.registry.getItemNames()).toEqual(['Health Potion']);
    expect(kit.registry.getEnemyNames()).toEqual(['Dragon']);
    expect(dragon.dropItems?.[0].itemId).toBe('potion-id');
  });
});
