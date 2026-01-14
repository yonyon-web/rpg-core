/**
 * Tests for GEasyKit Builder Factory Methods
 */

import { GEasyKit } from '../../src/core/GEasyKit';

describe('GEasyKit Builder Factory', () => {
  let kit: GEasyKit;

  beforeEach(() => {
    kit = new GEasyKit();
  });

  it('should create and auto-register skill using kit.builder.skill()', () => {
    const fireball = kit.builder.skill('fireball-id', 'Fireball')
      .type('magic')
      .power(80)
      .mpCost(25)
      .build();

    // Should be automatically registered
    expect(kit.registry.getSkillId('Fireball')).toBe('fireball-id');
    expect(kit.registry.getSkill('Fireball')).toEqual(fireball);
  });

  it('should create and auto-register item using kit.builder.item()', () => {
    const potion = kit.builder.item('potion-id', 'Health Potion')
      .type('consumable')
      .stackable(99)
      .build();

    expect(kit.registry.getItemId('Health Potion')).toBe('potion-id');
    expect(kit.registry.getItem('Health Potion')).toEqual(potion);
  });

  it('should create and auto-register job using kit.builder.job()', () => {
    const warrior = kit.builder.job('warrior-id', 'Warrior')
      .description('A mighty warrior')
      .statModifier('attack', 15)
      .build();

    expect(kit.registry.getJobId('Warrior')).toBe('warrior-id');
    expect(kit.registry.getJob('Warrior')).toEqual(warrior);
  });

  it('should create and auto-register equipment using kit.builder.equipment()', () => {
    const sword = kit.builder.equipment('sword-id', 'Iron Sword')
      .type('weapon')
      .statModifier('attack', 20)
      .build();

    expect(kit.registry.getEquipmentId('Iron Sword')).toBe('sword-id');
    expect(kit.registry.getEquipment('Iron Sword')).toEqual(sword);
  });

  it('should create and auto-register character using kit.builder.character()', () => {
    const hero = kit.builder.character('hero-id', 'Hero')
      .level(10)
      .hp(150)
      .attack(50)
      .build();

    expect(kit.registry.getCharacterId('Hero')).toBe('hero-id');
    expect(kit.registry.getCharacter('Hero')).toEqual(hero);
  });

  it('should create and auto-register enemy using kit.builder.enemy()', () => {
    const slime = kit.builder.enemy('slime-id', 'Slime', 'slime')
      .level(5)
      .hp(50)
      .attack(20)
      .build();

    expect(kit.registry.getEnemyId('Slime')).toBe('slime-id');
    expect(kit.registry.getEnemy('Slime')).toEqual(slime);
  });

  it('should allow name-based references without explicitly passing registry', () => {
    // Create skills using factory
    kit.builder.skill('fireball-id', 'Fireball')
      .type('magic')
      .power(80)
      .build();

    kit.builder.skill('heal-id', 'Heal')
      .type('heal')
      .power(100)
      .build();

    // Create job using name-based references (still need to pass registry for lookups)
    const mage = kit.builder.job('mage-id', 'Mage')
      .availableSkillsByName(['Fireball', 'Heal'], kit.registry)
      .build();

    expect(mage.availableSkills).toEqual(['fireball-id', 'heal-id']);
    expect(kit.registry.getJobId('Mage')).toBe('mage-id');
  });

  it('should create complete game setup using factory methods', () => {
    // Create all entities using factory
    kit.builder.skill('slash-id', 'Power Slash')
      .type('physical')
      .power(60)
      .build();

    kit.builder.skill('fireball-id', 'Fireball')
      .type('magic')
      .power(80)
      .build();

    kit.builder.job('warrior-id', 'Warrior')
      .availableSkillsByName(['Power Slash'], kit.registry)
      .build();

    kit.builder.job('mage-id', 'Mage')
      .availableSkillsByName(['Fireball'], kit.registry)
      .build();

    kit.builder.item('potion-id', 'Health Potion')
      .type('consumable')
      .build();

    const dragon = kit.builder.enemy('dragon-id', 'Dragon', 'dragon')
      .level(30)
      .addDropItemByName('Health Potion', 0.8, 2, kit.registry)
      .build();

    // Verify all are registered
    expect(kit.registry.getSkillNames()).toEqual(['Power Slash', 'Fireball']);
    expect(kit.registry.getJobNames()).toEqual(['Warrior', 'Mage']);
    expect(kit.registry.getItemNames()).toEqual(['Health Potion']);
    expect(kit.registry.getEnemyNames()).toEqual(['Dragon']);
    expect(dragon.dropItems?.[0].itemId).toBe('potion-id');
  });

  it('should work seamlessly without needing to reference registry in builder creation', () => {
    // Clean, simple API
    const fireball = kit.builder.skill('fb', 'Fireball')
      .type('magic')
      .power(80)
      .build();

    const iceBlast = kit.builder.skill('ib', 'Ice Blast')
      .type('magic')
      .power(75)
      .build();

    const mage = kit.builder.job('mage', 'Mage')
      .description('Master of elements')
      .availableSkillsByName(['Fireball', 'Ice Blast'], kit.registry)
      .build();

    // Everything is registered automatically
    expect(kit.registry.getSkillId('Fireball')).toBe('fb');
    expect(kit.registry.getSkillId('Ice Blast')).toBe('ib');
    expect(kit.registry.getJobId('Mage')).toBe('mage');
    expect(mage.availableSkills).toEqual(['fb', 'ib']);
  });

  it('should allow chaining multiple entities efficiently', () => {
    // Very clean syntax - no registry parameter needed
    const hero = kit.builder.character('hero', 'Hero')
      .level(20)
      .hp(200)
      .build();

    const slime = kit.builder.enemy('slime', 'Slime', 'slime')
      .level(5)
      .hp(50)
      .build();

    const potion = kit.builder.item('potion', 'Potion')
      .type('consumable')
      .build();

    // All automatically registered
    expect(kit.registry.getCharacterNames()).toEqual(['Hero']);
    expect(kit.registry.getEnemyNames()).toEqual(['Slime']);
    expect(kit.registry.getItemNames()).toEqual(['Potion']);
  });
});
